
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    needsOnboarding: boolean;
    login: (phone: string) => Promise<void>;
    loginWithEmail: (email: string) => Promise<void>;
    verifyOtp: (phone: string, token: string) => Promise<void>;
    verifyEmailOtp: (email: string, token: string) => Promise<void>;
    signup: (name: string, phone: string) => Promise<void>;
    completeOnboarding: (name: string) => Promise<void>;
    logout: () => void;
    updateUserProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    const fetchAndSetProfile = async (userId: string, metadata: { phone?: string; email?: string } = {}) => {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (profile) {
                const userData: User = {
                    id: profile.id,
                    name: profile.name || '',
                    phone: profile.phone || metadata.phone || '',
                    email: profile.email || metadata.email || '',
                    avatar: profile.avatar_url,
                    walletBalance: profile.wallet_balance || 0,
                    role: profile.role || 'client'
                };
                setUser(userData);

                setNeedsOnboarding(false);
            } else {
                setNeedsOnboarding(false);
                const basicUser: User = {
                    id: userId,
                    name: 'New User',
                    phone: metadata.phone || '',
                    email: metadata.email || '',
                    avatar: '',
                    walletBalance: 0,
                    role: (metadata.email?.endsWith('@ateli.co.in')) ? 'admin' : 'client'
                };
                setUser(basicUser);
            }
            setIsLoading(false); // Move this inside try, after setting needsOnboarding
        } catch (err) {
            console.error('Profile fetch error:', err);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                fetchAndSetProfile(session.user.id, {
                    phone: session.user.phone,
                    email: session.user.email
                });
            } else {
                setIsLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                fetchAndSetProfile(session.user.id, {
                    phone: session.user.phone,
                    email: session.user.email
                });
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setNeedsOnboarding(false);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const formatPhone = (phone: string) => {
        const cleanDigits = phone.replace(/\D/g, '');
        // If it's already a full number starting with 91 (India) and is 12 digits
        if (cleanDigits.length === 12 && cleanDigits.startsWith('91')) {
            return `+${cleanDigits}`;
        }
        // If it's a 10 digit number, assume it's Indian
        if (cleanDigits.length === 11 && cleanDigits.startsWith('0')) {
            return `+91${cleanDigits.slice(1)}`;
        }
        if (cleanDigits.length === 10) {
            return `+91${cleanDigits}`;
        }
        // Fallback: just add + if missing
        return phone.startsWith('+') ? phone : `+${cleanDigits}`;
    };

    const login = useCallback(async (phone: string) => {
        const cleanPhone = formatPhone(phone);
        const { error } = await supabase.auth.signInWithOtp({ phone: cleanPhone });
        if (error) {
            toast.error(error.message);
            throw error;
        } else {
            toast.success("OTP sent successfully");
        }
    }, []);

    const loginWithEmail = useCallback(async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) {
            toast.error(error.message);
            throw error;
        } else {
            toast.success("OTP sent to your email");
        }
    }, []);

    const signup = useCallback(async (name: string, phone: string) => {
        const cleanPhone = formatPhone(phone);
        const { error } = await supabase.auth.signInWithOtp({
            phone: cleanPhone,
            options: { data: { name } }
        });
        if (error) {
            toast.error(error.message);
            throw error;
        }
    }, []);

    const verifyOtp = useCallback(async (phone: string, token: string) => {
        const cleanPhone = formatPhone(phone);
        const { error } = await supabase.auth.verifyOtp({
            phone: cleanPhone,
            token,
            type: 'sms'
        });

        if (error) {
            toast.error(error.message);
            throw error;
        }
    }, []);

    const verifyEmailOtp = useCallback(async (email: string, token: string) => {
        const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email'
        });

        if (error) {
            toast.error(error.message);
            throw error;
        }
    }, []);

    const completeOnboarding = useCallback(async (name: string) => {
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .update({ name })
            .eq('id', user.id);

        if (error) {
            toast.error(error.message);
            throw error;
        }

        setUser(prev => prev ? { ...prev, name } : null);
        setNeedsOnboarding(false);
        toast.success("Welcome to Ateli!");
    }, [user]);

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
    }, []);

    const updateUserProfile = useCallback(async (updates: Partial<User>) => {
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .update({
                name: updates.name,
                avatar_url: updates.avatar,
                wallet_balance: updates.walletBalance
            })
            .eq('id', user.id);

        if (error) {
            toast.error(error.message);
        } else {
            setUser(prev => prev ? { ...prev, ...updates } : null);
        }
    }, [user]);

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            needsOnboarding,
            login,
            loginWithEmail,
            verifyOtp,
            verifyEmailOtp,
            signup,
            completeOnboarding,
            logout,
            updateUserProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
