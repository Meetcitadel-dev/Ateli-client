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
    | 'cart'
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
    method: 'pay_on_delivery' | 'pay_now' | 'wallet' | 'payment_link' | 'zoho_online';
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
    createdByName?: string; // Name of user who created the order
    initiatedBy: string; // For attribution
    createdAt: Date;
    updatedAt: Date;
    confirmedAt?: Date;
    deliveryDate?: Date;
    estimatedDelivery?: Date;
    notes?: string;
    driverInfo?: DriverInfo;
    payment?: PaymentInfo;
    // Cart flag – when admin creates a 'cart' for user review
    isCart?: boolean;
    // Delivery outcome
    deliveryOutcome?: 'completed' | 'partially_completed' | 'cancelled' | 'rescheduled';
    pendingItems?: string[]; // Item IDs pending
}

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
