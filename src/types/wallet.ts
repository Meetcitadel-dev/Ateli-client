export interface WalletTransaction {
    id: string;
    userId: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    orderId?: string;
    createdAt: Date;
}
