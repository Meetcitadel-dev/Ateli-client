import { User, Project, Chat, ChatMessage, Order, OrderItem } from '@/types';

export const currentUser: User = {
  id: 'user-1',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  role: 'user',
};

export const ateliAdmin: User = {
  id: 'ateli-admin',
  name: 'Ateli Team',
  email: 'support@ateli.com',
  avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=Ateli',
  role: 'admin',
};

export const mockUsers: User[] = [
  currentUser,
  {
    id: 'user-2',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    role: 'user',
  },
  {
    id: 'user-3',
    name: 'Marcus Brown',
    email: 'marcus@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    role: 'user',
  },
  {
    id: 'user-4',
    name: 'Emily Davis',
    email: 'emily@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    role: 'user',
  },
];

export const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'Downtown Office Renovation',
    siteAddress: '123 Main Street, Suite 400, New York, NY 10001',
    description: 'Complete renovation of the 4th floor office space',
    members: [
      { userId: 'user-1', user: mockUsers[0], role: 'owner', joinedAt: new Date('2024-01-15') },
      { userId: 'user-2', user: mockUsers[1], role: 'member', joinedAt: new Date('2024-01-20') },
      { userId: 'user-3', user: mockUsers[2], role: 'member', joinedAt: new Date('2024-02-01') },
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-03-10'),
  },
  {
    id: 'project-2',
    name: 'Beach House Interior',
    siteAddress: '456 Ocean Drive, Malibu, CA 90265',
    description: 'Modern coastal interior design project',
    members: [
      { userId: 'user-1', user: mockUsers[0], role: 'member', joinedAt: new Date('2024-02-10') },
      { userId: 'user-4', user: mockUsers[3], role: 'owner', joinedAt: new Date('2024-02-05') },
    ],
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-03-15'),
  },
  {
    id: 'project-3',
    name: 'Restaurant Kitchen Upgrade',
    siteAddress: '789 Culinary Ave, Chicago, IL 60601',
    description: 'Commercial kitchen equipment and design',
    members: [
      { userId: 'user-1', user: mockUsers[0], role: 'owner', joinedAt: new Date('2024-03-01') },
    ],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-18'),
  },
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    chatId: 'chat-1',
    senderId: 'ateli-admin',
    senderName: 'Ateli Team',
    content: 'Welcome to your project! How can we help you today?',
    type: 'text',
    timestamp: new Date('2024-03-10T09:00:00'),
    isFromAteli: true,
  },
  {
    id: 'msg-2',
    chatId: 'chat-1',
    senderId: 'user-1',
    senderName: 'Alex Johnson',
    content: "Hi! I'm looking for modern office furniture for our new space. We need about 20 workstations.",
    type: 'text',
    timestamp: new Date('2024-03-10T09:05:00'),
    isFromAteli: false,
  },
  {
    id: 'msg-3',
    chatId: 'chat-1',
    senderId: 'ateli-admin',
    senderName: 'Ateli Team',
    content: 'Great! We have several options for modern workstations. Would you prefer standing desks or traditional setups?',
    type: 'text',
    timestamp: new Date('2024-03-10T09:10:00'),
    isFromAteli: true,
  },
  {
    id: 'msg-4',
    chatId: 'chat-1',
    senderId: 'user-1',
    senderName: 'Alex Johnson',
    content: "We'd like a mix - maybe 12 standing desks and 8 traditional ones. Also need ergonomic chairs for everyone.",
    type: 'text',
    timestamp: new Date('2024-03-10T09:15:00'),
    isFromAteli: false,
  },
  {
    id: 'msg-5',
    chatId: 'chat-1',
    senderId: 'ateli-admin',
    senderName: 'Ateli Team',
    content: "Perfect! I'll put together a proposal with our best options. I've created an order for you to review with your team. You'll find it in your project's Orders section.",
    type: 'text',
    timestamp: new Date('2024-03-10T09:25:00'),
    isFromAteli: true,
  },
  {
    id: 'msg-6',
    chatId: 'chat-1',
    senderId: 'user-1',
    senderName: 'Alex Johnson',
    content: 'That sounds great, thank you! When can we expect delivery?',
    type: 'text',
    timestamp: new Date('2024-03-10T09:30:00'),
    isFromAteli: false,
  },
];

export const mockChats: Chat[] = [
  {
    id: 'chat-1',
    userId: 'user-1',
    projectId: 'project-1',
    messages: mockChatMessages,
    lastMessage: mockChatMessages[mockChatMessages.length - 1],
    unreadCount: 0,
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-10'),
  },
];

const orderItems1: OrderItem[] = [
  {
    id: 'item-1',
    name: 'Ergonomic Standing Desk - Oak',
    description: 'Height adjustable 60" x 30" standing desk with oak finish',
    quantity: 12,
    unitPrice: 899.00,
    totalPrice: 10788.00,
    imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=200',
  },
  {
    id: 'item-2',
    name: 'Executive Desk - Walnut',
    description: 'Premium 72" x 36" executive desk with walnut finish',
    quantity: 8,
    unitPrice: 1299.00,
    totalPrice: 10392.00,
    imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=200',
  },
  {
    id: 'item-3',
    name: 'Ergonomic Mesh Chair - Pro',
    description: 'Full mesh ergonomic chair with lumbar support',
    quantity: 20,
    unitPrice: 549.00,
    totalPrice: 10980.00,
    imageUrl: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=200',
  },
];

const orderItems2: OrderItem[] = [
  {
    id: 'item-4',
    name: 'Modern Coastal Sofa',
    description: 'L-shaped sectional in weathered linen',
    quantity: 2,
    unitPrice: 3499.00,
    totalPrice: 6998.00,
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200',
  },
  {
    id: 'item-5',
    name: 'Rattan Accent Chair',
    description: 'Natural rattan armchair with cushion',
    quantity: 4,
    unitPrice: 799.00,
    totalPrice: 3196.00,
    imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=200',
  },
];

export const mockOrders: Order[] = [
  {
    id: 'order-1',
    projectId: 'project-1',
    orderNumber: 'ATL-2024-001',
    items: orderItems1,
    totalAmount: 32160.00,
    status: 'pending',
  approvals: [
      { userId: 'user-1', userName: 'Alex Johnson', action: 'pending' },
      { userId: 'user-2', userName: 'Sarah Chen', action: 'approved', timestamp: new Date('2024-03-11') },
      { userId: 'user-3', userName: 'Marcus Brown', action: 'pending' },
    ],
    createdBy: 'ateli-admin',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-11'),
    notes: 'Delivery estimate: 2-3 weeks after approval',
  },
  {
    id: 'order-2',
    projectId: 'project-2',
    orderNumber: 'ATL-2024-002',
    items: orderItems2,
    totalAmount: 10194.00,
    status: 'approved',
    approvals: [
      { userId: 'user-1', userName: 'Alex Johnson', action: 'approved', timestamp: new Date('2024-03-14') },
      { userId: 'user-4', userName: 'Emily Davis', action: 'approved', timestamp: new Date('2024-03-15') },
    ],
    createdBy: 'ateli-admin',
    createdAt: new Date('2024-03-12'),
    updatedAt: new Date('2024-03-15'),
    deliveryDate: new Date('2024-04-01'),
    notes: 'Scheduled for delivery on April 1st',
  },
];
