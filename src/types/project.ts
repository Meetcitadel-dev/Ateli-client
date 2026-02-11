import { User } from './user';

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

export type MemberRole = 'owner' | 'admin' | 'member' | 'project_manager' | 'site_supervisor' | 'purchase_manager' | 'architect' | 'viewer';

export interface ProjectMemberPermissions {
    viewAllOrders?: boolean;
    canCreateOrders?: boolean;
}

export interface ProjectMember {
    userId: string;
    user?: Partial<User>; // Made optional and partial since we may not have full user data
    role: MemberRole;
    permissions?: ProjectMemberPermissions;
    joinedAt: Date;
}

export interface Project {
    id: string;
    name: string;
    siteAddress: string;
    location?: string;
    description?: string;
    budget?: number;
    members: ProjectMember[];
    gstConfig: GSTConfig;
    collectionPerson?: CollectionPerson;
    status: 'active' | 'archived';
    lastActivity?: Date;
    unreadCount?: number;
    createdAt: Date;
    updatedAt: Date;
}
