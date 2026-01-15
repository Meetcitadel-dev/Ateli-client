import { useState, useRef, useEffect } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { mockChatMessages, ateliAdmin, currentUser } from '@/data/mockData';
import { ChatMessage as ChatMessageType } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, Video, MoreVertical, Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function ChatPanel() {
  const { currentProject } = useProject();
  const [messages, setMessages] = useState<ChatMessageType[]>(mockChatMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (content: string, type: 'text' | 'image' | 'voice') => {
    const newMessage: ChatMessageType = {
      id: `msg-${Date.now()}`,
      chatId: 'chat-1',
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content,
      type,
      timestamp: new Date(),
      isFromAteli: false,
    };
    
    setMessages(prev => [...prev, newMessage]);

    // Simulate Ateli response after a short delay
    setTimeout(() => {
      const ateliResponse: ChatMessageType = {
        id: `msg-${Date.now() + 1}`,
        chatId: 'chat-1',
        senderId: ateliAdmin.id,
        senderName: ateliAdmin.name,
        senderAvatar: ateliAdmin.avatar,
        content: "Thanks for your message! I'll look into this and get back to you shortly.",
        type: 'text',
        timestamp: new Date(),
        isFromAteli: true,
      };
      setMessages(prev => [...prev, ateliResponse]);
    }, 1500);
  };

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">Select a project to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <Avatar className="w-10 h-10 ring-2 ring-accent/20">
            <AvatarImage src={ateliAdmin.avatar} alt={ateliAdmin.name} />
            <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
              AT
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-foreground">Ateli Team</h2>
              <Badge variant="secondary" className="text-xs gap-1">
                <Shield className="w-3 h-3" />
                Verified
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse-subtle"></span>
              <span>Online</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Privacy Notice */}
      <div className="px-6 py-2 bg-accent/5 border-b border-accent/20">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3.5 h-3.5 text-accent" />
          <span>This is a private conversation. Only you and Ateli can see these messages.</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4 scrollbar-thin">
        {/* Date separator */}
        <div className="flex items-center justify-center">
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
            Today
          </span>
        </div>

        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];
          const showAvatar = !prevMessage || prevMessage.isFromAteli !== message.isFromAteli;
          
          return (
            <ChatMessage 
              key={message.id} 
              message={message} 
              showAvatar={showAvatar}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
}
