
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, WalletTransaction } from '@/types';
import { db } from '@/services/db';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface UserContextType {
    transactions: WalletTransaction[];
    addTransaction: (amount: number, type: 'credit' | 'debit', description: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const { user, updateUserProfile } = useAuth();
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

    // Load transactions for the current user from Supabase
    useEffect(() => {
        const loadTransactions = async () => {
            if (user) {
                try {
                    const userTransactions = await db.getTransactions(user.id);
                    setTransactions(userTransactions);
                } catch (err) {
                    console.error("Failed to load transactions", err);
                }
            } else {
                setTransactions([]);
            }
        };
        loadTransactions();
    }, [user]);

    const addTransaction = useCallback(async (amount: number, type: 'credit' | 'debit', description: string) => {
        if (!user) return;

        const newTransaction: WalletTransaction = {
            id: `txn-${Date.now()}`,
            userId: user.id,
            amount,
            type,
            description,
            createdAt: new Date()
        };

        try {
            await db.saveTransaction(newTransaction);
            setTransactions(prev => [newTransaction, ...prev]);

            // Update balance in AuthContext/Profile
            const balanceChange = type === 'credit' ? amount : -amount;
            updateUserProfile({
                walletBalance: user.walletBalance + balanceChange
            });

            if (type === 'credit') {
                toast.success(`₹${amount.toLocaleString()} added to wallet`);
            } else {
                toast.success(`₹${amount.toLocaleString()} deducted for ${description}`);
            }
        } catch (err: any) {
            toast.error(`Transaction failed: ${err.message}`);
        }
    }, [user, updateUserProfile]);

    return (
        <UserContext.Provider value={{
            transactions,
            addTransaction
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
