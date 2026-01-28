// User & Authentication
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin';
  walletBalance: number;
}

// Project Configuration
export interface GSTConfig {
  enabled: boolean;
  gstin?: string;
  companyName?: string;
  companyAddress?: string;
}

export interface CollectionPerson {
  name: string;
  phone: string;
}

export interface Project {
  id: string;
  name: string;
  siteAddress: string;
  location?: string;
  description?: string;
  members: ProjectMember[];
  gstConfig: GSTConfig;
  collectionPerson?: CollectionPerson;
  status: 'active' | 'archived';
  lastActivity?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMember {
  userId: string;
  user: User;
  role: 'owner' | 'member' | 'project_manager' | 'site_supervisor' | 'purchase_manager' | 'architect';
  joinedAt: Date;
}

// Chat & Messaging
export type MessageType = 'text' | 'image' | 'voice' | 'file' | 'order_card';

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
  timestamp: Date;
  isFromAteli: boolean;
  isRead: boolean;
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

// Order & Cart
export interface OrderItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
  isConfirmed: boolean; // Item-level confirmation
  confirmedBy?: string;
  confirmedAt?: Date;
}

export interface OrderApproval {
  userId: string;
  userName: string;
  action: 'approved' | 'rejected' | 'pending';
  timestamp?: Date;
  comment?: string;
}

export type OrderStatus = 
  | 'clarification_requested'
  | 'order_received'
  | 'pending_confirmation'
  | 'confirmed'
  | 'material_loading'
  | 'dispatched'
  | 'delivered'
  | 'partially_completed'
  | 'completed'
  | 'cancelled'
  | 'on_hold';

export interface DriverInfo {
  name: string;
  phone: string;
  vehicleNumber?: string;
}

export interface PaymentInfo {
  method: 'pay_on_delivery' | 'pay_now' | 'wallet' | 'payment_link';
  status: 'pending' | 'partial' | 'completed';
  amountPaid: number;
  transactionId?: string;
  paidBy?: string;
  paidAt?: Date;
}

export interface Order {
  id: string;
  projectId: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  approvals: OrderApproval[];
  createdBy: string;
  initiatedBy: string; // For attribution
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  deliveryDate?: Date;
  estimatedDelivery?: Date;
  notes?: string;
  driverInfo?: DriverInfo;
  payment?: PaymentInfo;
  // Delivery outcome
  deliveryOutcome?: 'completed' | 'partially_completed' | 'cancelled' | 'rescheduled';
  pendingItems?: string[]; // Item IDs pending
}

// Notifications
export type NotificationType = 
  | 'order_created'
  | 'order_confirmed'
  | 'order_dispatched'
  | 'order_delivered'
  | 'payment_received'
  | 'approval_needed'
  | 'reminder'
  | 'message';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
  projectId?: string;
  isRead: boolean;
  createdAt: Date;
}

// Analytics
export interface UserOrderStats {
  userId: string;
  userName: string;
  totalOrders: number;
  totalValue: number;
  pendingOrders: number;
  completedOrders: number;
}

export interface ProjectAnalytics {
  projectId: string;
  totalOrders: number;
  totalValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByMember: UserOrderStats[];
  deliveryStats: {
    onTime: number;
    delayed: number;
    cancelled: number;
  };
}

// Wallet
export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  orderId?: string;
  createdAt: Date;
}

// Invoices & Reports
export interface Invoice {
  id: string;
  orderId: string;
  projectId: string;
  invoiceNumber: string;
  amount: number;
  gstAmount?: number;
  totalAmount: number;
  status: 'pending' | 'paid';
  downloadUrl?: string;
  createdAt: Date;
}
