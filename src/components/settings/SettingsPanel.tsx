import { useProject } from '@/contexts/ProjectContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  MapPin, 
  Users, 
  Mail, 
  Crown,
  UserPlus,
  Settings,
  Bell,
  Shield,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

export function SettingsPanel() {
  const { currentProject } = useProject();

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">Select a project to view settings</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Project Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your project details and team members
          </p>
        </div>

        <div className="space-y-6">
          {/* Project Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle>Project Details</CardTitle>
                  <CardDescription>Basic information about your project</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input id="projectName" defaultValue={currentProject.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="createdAt">Created</Label>
                  <Input 
                    id="createdAt" 
                    value={format(new Date(currentProject.createdAt), 'MMMM d, yyyy')} 
                    disabled 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteAddress">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Site Address
                  </span>
                </Label>
                <Input id="siteAddress" defaultValue={currentProject.siteAddress} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" defaultValue={currentProject.description || ''} placeholder="Add a description..." />
              </div>
              <div className="flex justify-end">
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>People with access to this project</CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Invite
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentProject.members.map((member) => (
                  <div 
                    key={member.userId}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={member.user.avatar} alt={member.user.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {member.user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{member.user.name}</p>
                          {member.role === 'owner' && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Crown className="w-3 h-3" />
                              Owner
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Configure how you receive updates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'New order notifications', description: 'Get notified when new orders are created' },
                  { label: 'Order status updates', description: 'Receive updates on order progress' },
                  { label: 'Team activity', description: 'Get notified about team member actions' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Button variant="outline" size="sm">Enable</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                <div>
                  <p className="font-medium text-foreground">Delete this project</p>
                  <p className="text-sm text-muted-foreground">
                    Once deleted, all data will be permanently removed
                  </p>
                </div>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
