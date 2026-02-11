import React, { useState, useEffect } from 'react';
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
  const { currentProject, updateProjectSettings } = useProject();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    siteAddress: '',
    description: '',
    budget: 0,
    gstEnabled: false
  });

  useEffect(() => {
    if (currentProject) {
      setFormData({
        name: currentProject.name || '',
        siteAddress: currentProject.siteAddress || '',
        description: currentProject.description || '',
        budget: currentProject.budget || 0,
        gstEnabled: currentProject.gstConfig?.enabled || false
      });
    }
  }, [currentProject]);

  const handleSave = async () => {
    if (!currentProject) return;
    setIsSaving(true);
    try {
      await updateProjectSettings({
        name: formData.name,
        siteAddress: formData.siteAddress,
        description: formData.description,
        budget: formData.budget,
        gstConfig: {
          ...currentProject.gstConfig,
          enabled: formData.gstEnabled
        }
      });
      // success toast is in the context
    } catch (error) {
      console.error('Settings save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background/50 backdrop-blur-sm">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Settings className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground font-medium">Select a project to view settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background scrollbar-thin">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Project Settings</h1>
          <p className="text-muted-foreground">
            Administrative controls and team management for {currentProject.name}
          </p>
        </div>

        <div className="space-y-6">
          {/* Project Details */}
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Project Details</CardTitle>
                  <CardDescription>Core information and location</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="projectName" className="text-sm font-medium">Project Name</Label>
                  <Input
                    id="projectName"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-background/50 border-border focus:ring-primary/20 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="createdAt" className="text-sm font-medium">Creation Date</Label>
                  <Input
                    id="createdAt"
                    value={format(new Date(currentProject.createdAt), 'MMMM d, yyyy')}
                    disabled
                    className="bg-muted/50 border-border/50 h-11 opacity-70"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteAddress" className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="w-4 h-4 text-primary" />
                  Site Address
                </Label>
                <Input
                  id="siteAddress"
                  value={formData.siteAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, siteAddress: e.target.value }))}
                  className="bg-background/50 border-border focus:ring-primary/20 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">About the Project</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the scope, goals or special instructions..."
                  className="bg-background/50 border-border focus:ring-primary/20 h-11"
                />
              </div>
            </CardContent>
          </Card>

          {/* Budget & Billing */}
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Budget & Billing</CardTitle>
                  <CardDescription>Financial controls and GST configuration</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="budget" className="text-sm font-medium">Estimated Budget (₹)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: Number(e.target.value) }))}
                    className="bg-background/50 border-border focus:ring-primary/20 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Taxation</Label>
                  <div className="flex items-center gap-4 h-11 px-4 rounded-xl border border-border bg-background/50">
                    <span className="text-sm">GST Billing</span>
                    <Button
                      variant={formData.gstEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, gstEnabled: !prev.gstEnabled }))}
                      className={formData.gstEnabled ? "bg-primary text-primary-foreground" : ""}
                    >
                      {formData.gstEnabled ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-12 h-12 shadow-lg shadow-primary/20 rounded-xl transition-all active:scale-95"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Settings className="w-5 h-5 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save All Settings'
              )}
            </Button>
          </div>

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
                        <AvatarImage src={member.user?.avatar} alt={member.user?.name || 'User'} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {(member.user?.name || 'User').split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{member.user?.name || 'Loading...'}</p>
                          {member.role === 'owner' && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Crown className="w-3 h-3" />
                              Owner
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {member.user?.email || member.userId}
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
