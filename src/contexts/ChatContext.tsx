
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ChatMessage } from '@/types';
import { db } from '@/services/db';
import { useProject } from './ProjectContext';
import { useAuth } from './AuthContext';

export interface ChatUser {
    id: string;
    name: string;
    avatar?: string;
    role: string;
    lastMessage?: ChatMessage;
    unreadCount?: number;
}

interface ChatContextType {
    messages: ChatMessage[];
    allMessages: ChatMessage[]; // All project messages (for admin overview)
    isLoading: boolean;
    activeUserId: string | null;
    setActiveUserId: (id: string | null) => void;
    conversations: ChatUser[];
    sendMessage: (content: string, type?: ChatMessage['type'], extra?: any) => Promise<void>;
    forwardMessage: (message: ChatMessage, targetUserId: string) => Promise<void>;
    addMessage: (message: ChatMessage) => void;
    clearMessages: () => void;
    refreshMessages: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const { currentProject } = useProject();
    const { user } = useAuth();
    const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
    const [activeUserId, setActiveUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Clear messages when user logs out
    useEffect(() => {
        if (!user) {
            setAllMessages([]);
            setActiveUserId(null);
        }
    }, [user]);

    const loadMessages = useCallback(async () => {
        // console.log('ChatContext: loadMessages called', { currentProject: currentProject?.id });
        if (!currentProject) {
            // console.log('ChatContext: No current project, skipping fetch');
            return;
        }

        setIsLoading(true);
        try {
            // console.log('ChatContext: Fetching messages for project', currentProject.id);
            const projectMessages = await db.getProjectMessages(currentProject.id, user.id);
            // console.log('ChatContext: Fetched messages count:', projectMessages.length);
            setAllMessages(projectMessages);
        } catch (err) {
            console.error('Failed to load chat messages:', err);
        } finally {
            setIsLoading(false);
        }
    }, [currentProject, user]);

    // Poll for new messages (Realtime replacement)
    useEffect(() => {
        if (!currentProject) return;
        const interval = setInterval(() => {
            if (!user) return;
            // Silently refresh without setting isLoading
            db.getProjectMessages(currentProject.id, user.id).then(msgs => {
                setAllMessages(prev => {
                    if (prev.length !== msgs.length) return msgs;
                    return prev;
                });
            });
        }, 5000);
        return () => clearInterval(interval);
    }, [currentProject]);

    // Load messages when current project changes
    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    // Derive conversations list (for Admin)
    const conversations = React.useMemo(() => {
        if (!currentProject || !user) return [];

        console.log('ChatContext Debug: Computing conversations', {
            totalMembers: currentProject.members.length,
            adminId: user.id
        });

        return currentProject.members
            .filter(m => {
                // Keep regular users. 
                // If I am admin, I want to see everyone else.
                // If m.userId is ME, exclude.
                // strict 'admin-user' check might be redundant if user.id covers it, but keeping for safety
                const isSystemAdmin = m.userId === 'admin-user';
                // In a real app, we filter out 'Me' (the admin). 
                // But for testing where we toggle Admin View on the same account, we MUST include ourselves to see the chat.
                // return !isMe && !isSystemAdmin; 
                return !isSystemAdmin;
            })
            .map(m => {
                const userChatId = `chat-${currentProject.id}-${m.userId}`;
                // Match rigid chatId structure OR legacy fallback where sender is the user
                const userMsgs = allMessages.filter(msg =>
                    msg.chatId === userChatId ||
                    (msg.senderId === m.userId && msg.chatId === `chat-${currentProject.id}`)
                );
                const lastMsg = userMsgs[userMsgs.length - 1];

                console.log(`ChatContext Debug: User ${m.user?.name} (${m.userId})`, {
                    msgCount: userMsgs.length,
                    lastMsg: lastMsg?.content
                });

                return {
                    id: m.userId,
                    name: m.user?.name || 'Unknown',
                    avatar: m.user?.avatar,
                    role: m.role,
                    lastMessage: lastMsg,
                    unreadCount: 0
                };
            });
    }, [currentProject, user, allMessages]);

    // Filter messages for the current view
    const messages = React.useMemo(() => {
        if (!currentProject || !user) return [];

        const isAdmin = user.id === 'admin-user' || user.role === 'admin' || user.email?.includes('admin'); // Simple check, refine as needed

        if (isAdmin) {
            if (!activeUserId) return []; // No user selected, show nothing or placeholder
            const targetChatId = `chat-${currentProject.id}-${activeUserId}`;

            // Allow legacy messages if they seem relevant? No, just strict filtering for new system.
            // Strict: match chatId OR be a direct message exchanged with this user (legacy might fallback)
            return allMessages.filter(m =>
                m.chatId === targetChatId ||
                (m.chatId === `chat-${currentProject.id}` && (m.senderId === activeUserId)) // Legacy: if user sent to general channel
            );
        } else {
            // Client View: Show my chat
            const myChatId = `chat-${currentProject.id}-${user.id}`;
            return allMessages.filter(m =>
                m.chatId === myChatId ||
                m.chatId === `chat-${currentProject.id}` // Show legacy project broadcast
            );
        }
    }, [allMessages, activeUserId, currentProject, user]);

    const addMessage = useCallback((message: ChatMessage) => {
        setAllMessages(prev => [...prev, message]);
    }, []);

    const sendMessage = useCallback(async (content: string, type: ChatMessage['type'] = 'text', extra?: any) => {
        if (!currentProject || !user) return;

        const isAdmin = user.id === 'admin-user' || user.role === 'admin' || user.email?.includes('admin');

        let targetId = user.id; // Default to self (Client)
        if (isAdmin) {
            if (!activeUserId) {
                console.error("Cannot send message: No active user selected by admin");
                return;
            }
            targetId = activeUserId;
        }

        const chatId = `chat-${currentProject.id}-${targetId}`;

        const newMessage: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            chatId: chatId,
            senderId: user.id,
            senderName: user.name || 'User',
            senderAvatar: user.avatar,
            content,
            type,
            timestamp: new Date(),
            isFromAteli: isAdmin, // or true if admin
            isRead: true,
            recipientId: isAdmin ? targetId : undefined, // Optional, useful for backend
            ...extra
        };

        // Optimistic update
        setAllMessages(prev => [...prev, newMessage]);

        try {
            await db.saveMessage(newMessage, currentProject.id);
        } catch (err) {
            console.error('Failed to send message:', err);
            // Remove optimistic update on failure
            setAllMessages(prev => prev.filter(m => m.id !== newMessage.id));
        }
    }, [currentProject, user, activeUserId]);

    const forwardMessage = useCallback(async (message: ChatMessage, targetUserId: string) => {
        if (!currentProject || !user) return;

        const isAdmin = user.id === 'admin-user' || user.role === 'admin' || user.email?.includes('admin');
        const chatId = `chat-${currentProject.id}-${targetUserId}`;

        const newMessage: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            chatId: chatId,
            senderId: user.id,
            senderName: user.name || 'User',
            senderAvatar: user.avatar,
            content: message.content,
            type: message.type,
            mediaUrl: message.mediaUrl,
            orderId: message.orderId,
            draftOrder: message.draftOrder,
            timestamp: new Date(),
            isFromAteli: isAdmin,
            isRead: false, // New message for the recipient
            recipientId: targetUserId,
            isForwarded: true,
            originalSenderName: message.senderName
        };

        setAllMessages(prev => [...prev, newMessage]);

        try {
            await db.saveMessage(newMessage, currentProject.id);
        } catch (err) {
            console.error('Failed to forward message:', err);
            setAllMessages(prev => prev.filter(m => m.id !== newMessage.id));
        }
    }, [currentProject, user]);

    const clearMessages = useCallback(() => {
        setAllMessages([]);
    }, []);

    const refreshMessages = useCallback(async () => {
        await loadMessages();
    }, [loadMessages]);

    return (
        <ChatContext.Provider value={{
            messages,
            allMessages,
            isLoading,
            activeUserId,
            setActiveUserId,
            conversations,
            sendMessage,
            forwardMessage,
            addMessage,
            clearMessages,
            refreshMessages
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
