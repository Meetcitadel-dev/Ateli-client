
export interface User {
    id: string;
    name: string;
    phone: string;
    email: string;
    avatar?: string;
    role: 'user' | 'admin' | 'client' | 'vendor' | 'architect';
    walletBalance: number;
    notifications?: any[];
}
