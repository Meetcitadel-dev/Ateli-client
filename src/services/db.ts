
import { supabase } from '@/lib/supabase';
import { Project, Order, ChatMessage, WalletTransaction, User } from '@/types';

export const db = {
    // ============================================
    // ============================================
    // PROJECTS
    // ============================================
    getProjects: async (userId: string): Promise<Project[]> => {
        try {
            console.log('DB: Fetching projects for user:', userId);
            // Use RPC to bypass schema cache
            const { data, error } = await supabase.rpc('get_user_projects', {
                p_user_id: userId
            });

            if (error) {
                console.error('Error fetching projects via RPC:', error);
                // Fallback to direct select if RPC fails
                console.log('DB: Falling back to direct select for projects');
                const { data: directData, error: directError } = await supabase
                    .from('project_members')
                    .select('project_id, role, projects(*)')
                    .eq('user_id', userId);

                if (directError) {
                    console.error('Direct project fetch failed:', directError);
                    throw directError;
                }

                // Map direct data to the expected format
                const projects: Project[] = [];
                for (const row of (directData || [])) {
                    if (!row.projects) continue;
                    const p = row.projects as any;
                    const members = await db.getProjectMembers(p.id);
                    projects.push({
                        id: p.id,
                        name: p.name,
                        siteAddress: p.site_address || '',
                        location: p.location || '',
                        status: p.status || 'active',
                        gstConfig: p.gst_config || { enabled: false },
                        collectionPerson: p.collection_person,
                        budget: p.budget,
                        description: p.description,
                        lastActivity: p.last_activity ? new Date(p.last_activity) : new Date(),
                        unreadCount: 0, // Fallback doesn't support unread count yet
                        createdAt: new Date(p.created_at),
                        updatedAt: new Date(p.updated_at),
                        members: members
                    });
                }
                return projects;
            }

            const projects: Project[] = [];
            console.log(`DB: Found ${data?.length || 0} projects`);

            for (const row of (data || [])) {
                // Get all members and unread count for this project
                try {
                    const members = await db.getProjectMembers(row.id);
                    const { count: unreadCount } = await supabase
                        .from('chat_messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('project_id', row.id)
                        .not('read_by', 'cs', `{${userId}}`) // Check if userId is NOT in read_by array
                        .neq('sender_id', userId);

                    projects.push({
                        id: row.id,
                        name: row.name,
                        siteAddress: row.site_address || '',
                        location: row.location || '',
                        status: row.status as any || 'active',
                        gstConfig: row.gst_config || { enabled: false },
                        collectionPerson: row.collection_person,
                        budget: row.budget,
                        description: row.description,
                        lastActivity: row.last_activity ? new Date(row.last_activity) : new Date(),
                        unreadCount: unreadCount || 0,
                        createdAt: new Date(row.created_at),
                        updatedAt: new Date(row.updated_at),
                        members: members
                    });
                } catch (memberError) {
                    console.error(`Error fetching data for project ${row.id}:`, memberError);
                    projects.push({
                        id: row.id,
                        name: row.name,
                        siteAddress: row.site_address || '',
                        location: row.location || '',
                        status: row.status as any || 'active',
                        gstConfig: row.gst_config || { enabled: false },
                        collectionPerson: row.collection_person,
                        budget: row.budget,
                        description: row.description,
                        lastActivity: row.last_activity ? new Date(row.last_activity) : new Date(),
                        unreadCount: 0,
                        createdAt: new Date(row.created_at),
                        updatedAt: new Date(row.updated_at),
                        members: []
                    });
                }
            }

            return projects;
        } catch (err) {
            console.error('Critical error in getProjects:', err);
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
            p_gst_config: JSON.stringify(project.gstConfig || { enabled: false }),
            p_collection_person: project.collectionPerson ? JSON.stringify(project.collectionPerson) : null,
            p_budget: project.budget || 0,
            p_description: project.description || ''
        });

        if (projectError) {
            console.error('Error saving project:', projectError);
            throw projectError;
        }

        // Add user as owner
        const { error: memberError } = await supabase.rpc('upsert_project_member', {
            p_project_id: project.id,
            p_user_id: userId,
            p_role: 'owner'
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

    addProjectMember: async (projectId: string, userId: string, role: string) => {
        const { error } = await supabase.rpc('upsert_project_member', {
            p_project_id: projectId,
            p_user_id: userId,
            p_role: role
        });

        if (error) {
            console.error('Error adding project member:', error);
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
    // STORAGE
    // ============================================
    uploadFile: async (file: Blob | File, bucket: string = 'chat'): Promise<string> => {
        const type = file.type.split(';')[0];
        const extension = type.split('/')[1] || 'webm';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`;

        console.log(`DB: Uploading file to bucket "${bucket}" as "${fileName}"`);

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file);

        if (error) {
            console.error('Error uploading file to Supabase Storage:', {
                message: error.message,
                name: (error as any).name,
                status: (error as any).status,
                bucket
            });
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        console.log('DB: File uploaded successfully, public URL:', publicUrl);
        return publicUrl;
    }
};
