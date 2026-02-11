
import { OrderItem } from './order';

export type MessageType = 'text' | 'image' | 'voice' | 'file' | 'order_card' | 'order_draft' | 'location';

export interface ChatMessage {
    id: string;
    chatId: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    content: string;
    type: MessageType;
    mediaUrl?: string;
    orderId?: string; // For order_card type
    draftOrder?: {    // For order_draft type
        items: OrderItem[];
        totalEstimate: number;
        rawText: string;
    };
    locationData?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    timestamp: Date;
    isFromAteli: boolean;
    isRead: boolean;
    recipientId?: string;
    isForwarded?: boolean;
    originalSenderName?: string;
}

export interface Chat {
    id: string;
    userId: string;
    projectId: string;
    messages: ChatMessage[];
    lastMessage?: ChatMessage;
    unreadCount: number;
    createdAt: Date;
    updatedAt: Date;
}
