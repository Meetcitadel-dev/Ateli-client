import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';

type ViewMode = 'user' | 'admin';

interface ViewContextType {
    viewMode: ViewMode;
    toggleViewMode: () => void;
    setViewMode: (mode: ViewMode) => void;
    isAdmin: boolean;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const isAdminUser = user?.role === 'admin';
    const [viewMode, setViewModeState] = useState<ViewMode>('user');

    // Sync viewMode with user role on initial load/change
    useEffect(() => {
        if (isAdminUser) {
            setViewModeState('admin');
        } else {
            setViewModeState('user');
        }
    }, [isAdminUser]);

    const toggleViewMode = () => {
        // Only allow toggling if the user is actually an admin
        if (isAdminUser) {
            setViewModeState(prev => prev === 'user' ? 'admin' : 'user');
        }
    };

    const setViewMode = (mode: ViewMode) => {
        if (isAdminUser || mode === 'user') {
            setViewModeState(mode);
        }
    };

    return (
        <ViewContext.Provider value={{
            viewMode,
            toggleViewMode,
            setViewMode,
            isAdmin: viewMode === 'admin'
        }}>
            {children}
        </ViewContext.Provider>
    );
}

export function useView() {
    const context = useContext(ViewContext);
    if (context === undefined) {
        throw new Error('useView must be used within a ViewProvider');
    }
    return context;
}
