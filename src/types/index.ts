export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
}

export interface Project {
  id: string;
  name: string;
  siteAddress: string;
  description?: string;
  members: ProjectMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMember {
  userId: string;
  user: User;
  role: 'owner' | 'member';
  joinedAt: Date;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'voice' | 'file';
  mediaUrl?: string;
  timestamp: Date;
  isFromAteli: boolean;
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

export interface OrderItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface OrderApproval {
  userId: string;
  userName: string;
  action: 'approved' | 'rejected' | 'pending';
  timestamp?: Date;
  comment?: string;
}

export type OrderStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'shipped' | 'delivered';

export interface Order {
  id: string;
  projectId: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  approvals: OrderApproval[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deliveryDate?: Date;
  notes?: string;
}
