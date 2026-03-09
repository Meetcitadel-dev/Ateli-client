import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/services/db';
import { Project, ChatMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Send, Users, CheckCircle2, Megaphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

export default function BroadcastPage() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [title, setTitle] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [stats, setStats] = useState({ totalUsers: 0, totalProjects: 0 });
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

    const roles = [
        { value: 'owner', label: 'Owner' },
        { value: 'project_team', label: 'Project team' },
        { value: 'purchase', label: 'Purchase' },
        { value: 'design_architect', label: 'Design architect' },
        { value: 'management', label: 'Management' },
    ];

    useEffect(() => {
        loadData();
    }, [user, selectedRoles]);

    const toggleRole = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role)
                ? prev.filter(r => r !== role)
                : [...prev, role]
        );
    };

    const loadData = async () => {
        try {
            setIsLoading(true);
            // @ts-ignore - getAllProjects is recently added
            const allProjects = await db.getAllProjects();
            setProjects(allProjects);

            // Calculate stats
            const userIds = new Set<string>();
            allProjects.forEach(p => {
                p.members.forEach(m => {
                    const isNotAdmin = m.role !== 'admin' && m.userId !== 'admin-user' && m.userId !== user?.id;
                    const matchesRole = selectedRoles.length === 0 || selectedRoles.includes(m.role);

                    if (isNotAdmin && matchesRole) {
                        userIds.add(m.userId);
                    }
                });
            });

            setStats({
                totalProjects: allProjects.length,
                totalUsers: userIds.size
            });
        } catch (err: any) {
            console.error('Failed to load projects:', err);
            toast.error(`Failed to load recipient list: ${err.message || 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendBroadcast = async () => {
        if (!message.trim()) {
            toast.error('Please enter a message');
            return;
        }

        if (!confirm(`Are you sure you want to send this broadcast to ${stats.totalUsers} users?`)) {
            return;
        }

        setIsSending(true);
        const toastId = toast.loading('Sending broadcast...');
        let sentCount = 0;

        try {
            const startTime = Date.now();

            // Get unique users to avoid duplicate messages if possible, 
            // BUT current chat system is project-based. So we must send to each project chat.
            // If a user is in multiple projects, they might get multiple messages?
            // Usually a user has one active project.
            // Let's iterate projects and send to each valid member's chat.

            const promises: Promise<void>[] = [];

            for (const project of projects) {
                const validMembers = project.members.filter(m =>
                    m.role !== 'admin' &&
                    m.userId !== 'admin-user' &&
                    m.userId !== user?.id &&
                    (selectedRoles.length === 0 || selectedRoles.includes(m.role))
                );

                for (const member of validMembers) {
                    const chatId = `chat-${project.id}-${member.userId}`;

                    const fullContent = title ? `**${title}**\n\n${message}` : message;

                    const newMessage: ChatMessage = {
                        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        chatId: chatId,
                        senderId: user?.id || 'admin-user',
                        senderName: 'Ateli Support', // Use a generic name for broadcast
                        senderAvatar: user?.avatar,
                        content: fullContent,
                        type: 'text',
                        timestamp: new Date(),
                        isFromAteli: true,
                        isRead: false,
                        recipientId: member.userId,
                        // Add a flag or metadata if we want to track broadcasts later
                    };

                    promises.push(db.saveMessage(newMessage, project.id));
                    sentCount++;
                }
            }

            await Promise.all(promises);

            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            toast.success(`Broadcast sent to ${sentCount} chats in ${duration}s`, { id: toastId });
            setMessage('');
            setTitle('');
        } catch (err) {
            console.error('Failed to send broadcast:', err);
            toast.error('Failed to send broadcast', { id: toastId });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <Megaphone className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Marketing Broadcast</h1>
                    <p className="text-muted-foreground">Send notifications to all user chats</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Recipient Stats */}
                <Card className="md:col-span-1 bg-muted/30 border-dashed">
                    <CardHeader>
                        <CardTitle className="text-lg">Recipients</CardTitle>
                        <CardDescription>Target audience overview</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">Total Users</span>
                            </div>
                            <Badge variant="secondary">{stats.totalUsers}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">Active Projects</span>
                            </div>
                            <Badge variant="secondary">{stats.totalProjects}</Badge>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filter by Role</Label>
                            <div className="flex flex-wrap gap-2">
                                {roles.map(role => (
                                    <Badge
                                        key={role.value}
                                        variant={selectedRoles.includes(role.value) ? "default" : "outline"}
                                        className="cursor-pointer py-1.5 px-3 transition-all hover:opacity-80"
                                        onClick={() => toggleRole(role.value)}
                                    >
                                        {role.label}
                                    </Badge>
                                ))}
                            </div>
                            {selectedRoles.length > 0 ? (
                                <p className="text-[10px] text-primary font-medium">Filtering for: {selectedRoles.length} specific role(s)</p>
                            ) : (
                                <p className="text-[10px] text-muted-foreground">Sending to all roles</p>
                            )}
                        </div>

                        <div className="text-xs text-muted-foreground mt-4 pt-4 border-t border-dashed">
                            The message will be sent as a direct chat message from "Ateli Support" to every matched user.
                        </div>
                    </CardContent>
                </Card>

                {/* Message Composer */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Compose Message</CardTitle>
                        <CardDescription>Write your announcement or marketing update</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title (Optional)</label>
                            <Input
                                placeholder="e.g. Special Offer: 50% Off"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Message Body</label>
                            <Textarea
                                placeholder="Type your message here..."
                                className="min-h-[150px] resize-none"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>
                        <div className="pt-4 flex justify-end">
                            <Button
                                onClick={handleSendBroadcast}
                                disabled={isSending || isLoading || !message.trim()}
                                className="gap-2"
                            >
                                <Send className="w-4 h-4" />
                                {isSending ? 'Sending...' : 'Send Broadcast'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
