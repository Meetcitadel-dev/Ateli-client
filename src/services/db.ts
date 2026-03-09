
import { supabase } from '@/lib/supabase';
import { Project, Order, ChatMessage, WalletTransaction, User, Notification } from '@/types';

export const db = {
    // ============================================
    // ============================================
    // PROJECTS
    // ============================================
    uploadFile: async (file: Blob | File, folder: string = 'files'): Promise<string> => {
        const fileExt = file instanceof File ? file.name.split('.').pop() : 'webm';
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { error } = await supabase.storage
            .from('ateli-files')
            .upload(filePath, file);

        if (error) {
            console.error('Error uploading file:', error);
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('ateli-files')
            .getPublicUrl(filePath);

        return publicUrl;
    },

    getProjects: async (userId: string): Promise<Project[]> => {
        try {
            console.log('DB: Fetching optimized projects for user:', userId);
            const { data, error } = await supabase.rpc('get_projects_optimized', {
                p_user_id: userId
            });

            if (error) {
                console.error('Error fetching optimized projects:', error);
                throw error;
            }

            // The RPC returns a JSON array of projects with members and unreadCount nested.
            // We just need to map dates.
            return (data || []).map((p: any) => ({
                ...p,
                siteAddress: p.site_address,
                gstConfig: p.gst_config,
                collectionPerson: p.collection_person,
                projectType: p.project_type,
                imageUrl: p.image_url,
                lastActivity: new Date(p.last_activity),
                createdAt: new Date(p.created_at),
                updatedAt: new Date(p.updated_at),
                members: (p.members || []).map((m: any) => ({
                    ...m,
                    joinedAt: new Date(m.joinedAt)
                }))
            }));
        } catch (err) {
            console.error('Critical error in getProjects:', err);
            throw err;
        }
    },

    getAllProjects: async (): Promise<Project[]> => {
        try {
            console.log('DB: Fetching ALL projects optimized');
            const { data, error } = await supabase.rpc('get_all_projects_optimized_admin');

            if (error) {
                console.error('Error fetching optimized projects admin:', error);
                throw error;
            }

            return (data || []).map((p: any) => ({
                ...p,
                siteAddress: p.site_address,
                gstConfig: p.gst_config,
                collectionPerson: p.collection_person,
                projectType: p.project_type,
                imageUrl: p.image_url,
                lastActivity: new Date(p.last_activity),
                createdAt: new Date(p.created_at),
                updatedAt: new Date(p.updated_at),
                members: (p.members || []).map((m: any) => ({
                    ...m,
                    joinedAt: new Date(m.joinedAt)
                }))
            }));
        } catch (err) {
            console.error('Critical error in getAllProjects:', err);
            throw err;
        }
    },

    getProjectMembers: async (projectId: string) => {
        // Try RPC first for better performance and to avoid join issues
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_project_members', {
            p_project_id: projectId
        });

        if (!rpcError && rpcData) {
            return rpcData.map((m: any) => ({
                userId: m.user_id,
                role: m.role as any,
                permissions: m.permissions || {},
                responsibilities: m.responsibilities || [],
                joinedAt: new Date(m.joined_at),
                user: {
                    id: m.user_id,
                    name: m.name || 'User',
                    email: m.email,
                    avatar: m.avatar_url,
                    phone: m.phone,
                    role: m.role as any,
                    walletBalance: 0
                }
            }));
        }

        console.warn('RPC get_project_members failed or not found, falling back to direct select:', rpcError);

        // Fallback to direct select with join
        const { data, error } = await supabase
            .from('project_members')
            .select(`
                *,
                user:profiles(*)
            `)
            .eq('project_id', projectId);

        if (error) {
            console.error('Error fetching project members via select:', error);
            throw error;
        }

        return (data || []).map((m: any) => ({
            userId: m.user_id,
            role: m.role as any,
            permissions: m.permissions || {},
            responsibilities: m.responsibilities || [],
            joinedAt: new Date(m.joined_at),
            user: {
                id: m.user?.id || m.user_id,
                name: m.user?.name || 'User',
                email: m.user?.email,
                avatar: m.user?.avatar_url,
                phone: m.user?.phone,
                role: m.user?.role as any,
                walletBalance: 0
            }
        }));
    },

    saveProject: async (project: Project, userId: string) => {
        // Use RPC to bypass schema cache
        const { error: projectError } = await supabase.rpc('upsert_project', {
            p_id: project.id,
            p_name: project.name,
            p_site_address: project.siteAddress || '',
            p_location: project.location || '',
            p_status: project.status || 'active',
            p_project_type: project.projectType || null,
            p_image_url: project.imageUrl || null,
            p_gst_config: JSON.stringify(project.gstConfig || { enabled: false }),
            p_collection_person: project.collectionPerson ? JSON.stringify(project.collectionPerson) : null,
            p_budget: project.budget || 0,
            p_description: project.description || ''
        });

        if (projectError) {
            console.error('Error saving project:', projectError);
            throw projectError;
        }

        // Add user as admin
        const { error: memberError } = await supabase.rpc('upsert_project_member', {
            p_project_id: project.id,
            p_user_id: userId,
            p_role: 'admin',
            p_responsibilities: []
        });

        if (memberError) {
            console.error('Error saving project member:', memberError);
            throw memberError;
        }
    },

    deleteProject: async (projectId: string) => {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    },

    updateProjectSettings: async (projectId: string, updates: Partial<Project>) => {
        const { error } = await supabase.rpc('upsert_project', {
            p_id: projectId,
            p_name: updates.name || null,
            p_site_address: updates.siteAddress || null,
            p_location: updates.location || null,
            p_status: updates.status || null,
            p_project_type: updates.projectType || null,
            p_image_url: updates.imageUrl || null,
            p_gst_config: updates.gstConfig ? JSON.stringify(updates.gstConfig) : null,
            p_collection_person: updates.collectionPerson ? JSON.stringify(updates.collectionPerson) : null,
            p_budget: updates.budget !== undefined ? updates.budget : null,
            p_description: updates.description || null
        });

        if (error) {
            console.error('Error updating project:', error);
            throw error;
        }
    },

    updateMemberRole: async (projectId: string, userId: string, role: string) => {
        const { error } = await supabase
            .from('project_members')
            .update({ role, updated_at: new Date().toISOString() })
            .match({ project_id: projectId, user_id: userId });

        if (error) {
            console.error('Error updating member role:', error);
            throw error;
        }
    },

    updateMemberPermissions: async (projectId: string, userId: string, permissions: any) => {
        const { error } = await supabase
            .from('project_members')
            .update({ permissions, updated_at: new Date().toISOString() })
            .match({ project_id: projectId, user_id: userId });

        if (error) {
            console.error('Error updating member permissions:', error);
            throw error;
        }
    },

    updateMemberResponsibilities: async (projectId: string, userId: string, responsibilities: string[]) => {
        const { error } = await supabase
            .from('project_members')
            .update({ responsibilities, updated_at: new Date().toISOString() })
            .match({ project_id: projectId, user_id: userId });

        if (error) {
            console.error('Error updating member responsibilities:', error);
            throw error;
        }
    },

    addProjectMember: async (projectId: string, userId: string, role: string) => {
        const { error } = await supabase.rpc('upsert_project_member', {
            p_project_id: projectId,
            p_user_id: userId,
            p_role: role,
            p_responsibilities: []
        });

        if (error) {
            console.error('Error adding project member:', error);
            throw error;
        }
    },

    savePendingRole: async (projectId: string, identifier: string, role: string) => {
        const { error } = await supabase
            .from('pending_roles')
            .upsert({
                project_id: projectId,
                identifier: identifier,
                role: role
            }, { onConflict: 'identifier, project_id' });

        if (error) {
            console.error('Error saving pending role:', error);
            throw error;
        }
    },

    removeProjectMember: async (projectId: string, userId: string) => {
        const { error } = await supabase
            .from('project_members')
            .delete()
            .match({ project_id: projectId, user_id: userId });

        if (error) {
            console.error('Error removing project member:', error);
            throw error;
        }
    },

    findUserByPhone: async (phone: string): Promise<User | null> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('phone', phone)
            .maybeSingle();

        if (error) {
            console.error('Error finding user by phone:', error);
            throw error;
        }

        if (!data) return null;

        return {
            id: data.id,
            name: data.name,
            email: data.email,
            avatar: data.avatar_url,
            phone: data.phone,
            role: data.role,
            walletBalance: data.wallet_balance
        };
    },

    findUserByEmail: async (email: string): Promise<User | null> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }

        if (!data) return null;

        return {
            id: data.id,
            name: data.name,
            email: data.email,
            avatar: data.avatar_url,
            phone: data.phone,
            role: data.role,
            walletBalance: data.wallet_balance
        };
    },

    // ============================================
    // ORDERS
    // ============================================
    getOrders: async (projectId: string): Promise<Order[]> => {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }

        return (data || []).map(row => ({
            id: row.id,
            projectId: row.project_id,
            orderNumber: row.order_number,
            items: row.items || [],
            totalAmount: row.total_amount,
            status: row.status,
            approvals: row.approvals || [],
            createdBy: row.created_by,
            createdByName: row.created_by_name,
            initiatedBy: row.initiated_by,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            confirmedAt: row.confirmed_at ? new Date(row.confirmed_at) : undefined,
            deliveryDate: row.delivery_date ? new Date(row.delivery_date) : undefined,
            estimatedDelivery: row.estimated_delivery ? new Date(row.estimated_delivery) : undefined,
            notes: row.notes,
            driverInfo: row.driver_info,
            payment: row.payment,
            deliveryOutcome: row.delivery_outcome,
            pendingItems: row.pending_items
        }));
    },

    saveOrder: async (order: Order, createdByName?: string) => {
        const { error } = await supabase.rpc('upsert_order', {
            p_id: order.id,
            p_project_id: order.projectId,
            p_order_number: order.orderNumber,
            p_items: JSON.stringify(order.items),
            p_total_amount: order.totalAmount,
            p_status: order.status,
            p_approvals: JSON.stringify(order.approvals || []),
            p_created_by: order.createdBy,
            p_created_by_name: createdByName || order.createdByName || 'Unknown',
            p_initiated_by: order.initiatedBy,
            p_created_at: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
            p_updated_at: new Date().toISOString(),
            p_confirmed_at: order.confirmedAt instanceof Date ? order.confirmedAt.toISOString() : order.confirmedAt || null,
            p_delivery_date: order.deliveryDate instanceof Date ? order.deliveryDate.toISOString() : order.deliveryDate || null,
            p_estimated_delivery: order.estimatedDelivery instanceof Date ? order.estimatedDelivery.toISOString() : order.estimatedDelivery || null,
            p_notes: order.notes || null,
            p_driver_info: order.driverInfo ? JSON.stringify(order.driverInfo) : null,
            p_payment: order.payment ? JSON.stringify(order.payment) : null,
            p_delivery_outcome: order.deliveryOutcome || null,
            p_pending_items: order.pendingItems ? JSON.stringify(order.pendingItems) : null
        });

        if (error) {
            console.error('Error saving order:', error);
            throw error;
        }
    },

    // ============================================
    // CHAT MESSAGES
    // ============================================
    getProjectMessages: async (projectId: string, userId: string): Promise<ChatMessage[]> => {
        console.log('DB: getProjectMessages called for', projectId);
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('project_id', projectId)
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }

        console.log('DB: getProjectMessages raw data count:', data?.length);

        return (data || []).map(row => ({
            id: row.id,
            chatId: row.chat_id || `chat-${projectId}`,
            senderId: row.sender_id,
            senderName: row.sender_name || 'Unknown',
            senderAvatar: row.sender_avatar,
            content: row.content,
            type: row.type || 'text',
            mediaUrl: row.media_url,
            orderId: row.order_id,
            draftOrder: row.draft_order,
            locationData: row.location_data,
            timestamp: new Date(row.timestamp),
            isFromAteli: row.is_from_ateli || false,
            isRead: row.read_by ? row.read_by.includes(userId) : false
        }));
    },

    saveMessage: async (message: ChatMessage, projectId: string) => {
        const { error } = await supabase
            .from('chat_messages')
            .insert({
                id: message.id,
                project_id: projectId,
                chat_id: message.chatId,
                sender_id: message.senderId,
                sender_name: message.senderName,
                sender_avatar: message.senderAvatar,
                content: message.content,
                type: message.type,
                media_url: message.mediaUrl,
                order_id: message.orderId,
                draft_order: message.draftOrder,
                location_data: message.locationData,
                is_from_ateli: message.isFromAteli,
                read_by: message.isRead ? [message.senderId].filter(id => !!id) : [],
                timestamp: message.timestamp instanceof Date ? message.timestamp.toISOString() : message.timestamp
            });

        if (error) {
            console.error('Error saving message:', error);
            throw error;
        }

        // Update last_activity on project
        await supabase
            .from('projects')
            .update({ last_activity: new Date().toISOString() })
            .eq('id', projectId);
    },

    markMessagesAsRead: async (projectId: string, userId: string) => {
        const { error } = await supabase.rpc('mark_messages_read', {
            p_project_id: projectId,
            p_user_id: userId
        });

        if (error) {
            console.error('Error marking messages as read:', error);
            throw error;
        }
    },

    // ============================================
    // WALLET TRANSACTIONS
    // ============================================
    getTransactions: async (userId: string): Promise<WalletTransaction[]> => {
        const { data, error } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching transactions:', error);
            throw error;
        }

        return (data || []).map(row => ({
            id: row.id,
            userId: row.user_id,
            amount: row.amount,
            type: row.type,
            description: row.description,
            orderId: row.order_id,
            createdAt: new Date(row.created_at)
        }));
    },

    saveTransaction: async (transaction: WalletTransaction) => {
        // Now mostly handled by executeWalletTransaction RPC, but keeping for direct inserts if needed
        const { error } = await supabase
            .from('wallet_transactions')
            .insert({
                id: transaction.id,
                user_id: transaction.userId,
                amount: transaction.amount,
                type: transaction.type,
                description: transaction.description,
                order_id: transaction.orderId,
                created_at: transaction.createdAt instanceof Date ? transaction.createdAt.toISOString() : transaction.createdAt
            });

        if (error) {
            console.error('Error saving transaction:', error);
            throw error;
        }
    },

    executeWalletTransaction: async (amount: number, type: 'credit' | 'debit', description: string, orderId?: string): Promise<number> => {
        const { data, error } = await supabase.rpc('handle_wallet_transaction', {
            p_amount: amount,
            p_type: type,
            p_description: description,
            p_order_id: orderId
        });

        if (error) {
            console.error('RPC handle_wallet_transaction failed:', error);
            throw error;
        }

        return data as number;
    },

    // ============================================
    // USER PROFILE
    // ============================================
    updateProfile: async (userId: string, updates: Partial<User>) => {
        const { error } = await supabase
            .from('profiles')
            .update({
                name: updates.name,
                avatar_url: updates.avatar,
                wallet_balance: updates.walletBalance,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    },

    // ============================================
    // NOTIFICATIONS
    // ============================================
    getNotifications: async (userId: string): Promise<Notification[]> => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }

        return (data || []).map(row => ({
            id: row.id,
            userId: row.user_id,
            type: row.type as any,
            title: row.title,
            message: row.message,
            orderId: row.order_id,
            projectId: row.project_id,
            isRead: row.is_read,
            createdAt: new Date(row.created_at)
        }));
    },

    markNotificationRead: async (notificationId: string) => {
        const { error } = await supabase.rpc('mark_notification_read', {
            p_notification_id: notificationId
        });

        if (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },

    markAllNotificationsRead: async () => {
        const { error } = await supabase.rpc('mark_all_notifications_read');

        if (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }
};
