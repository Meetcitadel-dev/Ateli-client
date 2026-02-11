import { useState, useEffect } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useView } from '@/contexts/ViewContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  MapPin,
  User,
  Phone,
  Receipt,
  Users,
  Shield,
  Crown,
  UserPlus,
  Trash2,
  Archive,
  Bell,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

export function ProjectConfigPanel() {
  const { currentProject, updateProjectSettings, updateMemberRole, updateMemberPermissions, removeMember, inviteMember, deleteProject } = useProject();
  const { isAdmin } = useView();
  const [isSaving, setIsSaving] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Invite form state
  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    siteAddress: '',
    description: '',
    budget: 0,
    collectionPerson: {
      name: '',
      phone: ''
    },
    gstConfig: {
      enabled: false,
      gstin: '',
      companyName: '',
      companyAddress: ''
    }
  });

  useEffect(() => {
    if (currentProject) {
      setFormData({
        name: currentProject.name || '',
        siteAddress: currentProject.siteAddress || '',
        description: currentProject.description || '',
        budget: currentProject.budget || 0,
        collectionPerson: {
          name: currentProject.collectionPerson?.name || '',
          phone: currentProject.collectionPerson?.phone || ''
        },
        gstConfig: {
          enabled: currentProject.gstConfig?.enabled ?? false,
          gstin: currentProject.gstConfig?.gstin || '',
          companyName: currentProject.gstConfig?.companyName || '',
          companyAddress: currentProject.gstConfig?.companyAddress || ''
        }
      });
    }
  }, [currentProject]);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Select a project to view settings</p>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProjectSettings({
        name: formData.name,
        siteAddress: formData.siteAddress,
        description: formData.description,
        budget: formData.budget,
        collectionPerson: formData.collectionPerson,
        gstConfig: formData.gstConfig
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteIdentifier) {
      toast.error('Please enter a phone number or email');
      return;
    }
    setIsInviting(true);
    try {
      await inviteMember(inviteIdentifier, inviteRole);
      setShowInviteDialog(false);
      setInviteIdentifier('');
      setInviteRole('member');
    } catch (error) {
      console.error('Failed to invite member:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateMemberRole(userId, newRole);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handlePermissionToggle = async (userId: string, permission: string, value: boolean) => {
    const member = currentProject.members.find(m => m.userId === userId);
    if (!member) return;

    const newPermissions = {
      ...(member.permissions || {}),
      [permission]: value
    };

    try {
      await updateMemberPermissions(userId, newPermissions);
    } catch (error) {
      console.error('Failed to update permissions:', error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      try {
        await removeMember(userId);
      } catch (error) {
        console.error('Failed to remove member:', error);
      }
    }
  };

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      await deleteProject();
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleArchive = () => {
    toast.success('Project archived');
  };

  const roles = [
    { value: 'member', label: 'Member' },
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'site_supervisor', label: 'Site Supervisor' },
    { value: 'purchase_manager', label: 'Purchase Manager' },
    { value: 'architect', label: 'Architect' },
  ];

  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    member: 'Member',
    project_manager: 'Project Manager',
    site_supervisor: 'Site Supervisor',
    purchase_manager: 'Purchase Manager',
    architect: 'Architect',
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto pb-20">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Project Settings</h1>
          <p className="text-muted-foreground">{currentProject.name}</p>
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Site Address
              </Label>
              <Input
                id="address"
                value={formData.siteAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, siteAddress: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Project Budget (₹)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter total budget"
              />
            </div>
          </CardContent>
        </Card>

        {/* Collection Person */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Collection Person
            </CardTitle>
            <CardDescription>
              Person responsible for receiving deliveries at site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="collectionName">Name</Label>
                <Input
                  id="collectionName"
                  value={formData.collectionPerson.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    collectionPerson: { ...prev.collectionPerson, name: e.target.value }
                  }))}
                  placeholder="Enter name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collectionPhone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="collectionPhone"
                  value={formData.collectionPerson.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    collectionPerson: { ...prev.collectionPerson, phone: e.target.value }
                  }))}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GST Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              GST Configuration
            </CardTitle>
            <CardDescription>
              Configure GST billing for this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable GST Billing</p>
                <p className="text-sm text-muted-foreground">
                  Generate GST compliant invoices for this project
                </p>
              </div>
              <Switch
                checked={formData.gstConfig.enabled}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  gstConfig: { ...prev.gstConfig, enabled: checked }
                }))}
              />
            </div>

            {formData.gstConfig.enabled && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gstin">GSTIN</Label>
                    <Input
                      id="gstin"
                      value={formData.gstConfig.gstin}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        gstConfig: { ...prev.gstConfig, gstin: e.target.value }
                      }))}
                      placeholder="27AABCU9603R1ZM"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={formData.gstConfig.companyName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        gstConfig: { ...prev.gstConfig, companyName: e.target.value }
                      }))}
                      placeholder="Company Pvt Ltd"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Company Address</Label>
                    <Input
                      id="companyAddress"
                      value={formData.gstConfig.companyAddress}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        gstConfig: { ...prev.gstConfig, companyAddress: e.target.value }
                      }))}
                      placeholder="Full billing address"
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members
              </div>
              {isAdmin && (
                <Button size="sm" variant="outline" onClick={() => setShowInviteDialog(true)} className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Invite Member
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              Manage project team and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentProject.members.map((member) => (
                <div
                  key={member.userId}
                  className="space-y-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.user?.avatar} alt={member.user?.name} />
                      <AvatarFallback>
                        {member.user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{member.user?.name}</p>
                        {member.role === 'owner' && (
                          <Crown className="w-4 h-4 text-warning" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{member.user?.email || member.user?.phone}</p>
                    </div>

                    {isAdmin ? (
                      <div className="flex items-center gap-2">
                        {member.role !== 'owner' && (
                          <Select
                            value={member.role}
                            onValueChange={(value) => handleRoleChange(member.userId, value)}
                          >
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {member.role === 'owner' && <Badge variant="secondary">Owner</Badge>}

                        {member.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveMember(member.userId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Badge variant="secondary">{roleLabels[member.role]}</Badge>
                    )}
                  </div>

                  {/* Permissions Subsection (Admin Only) */}
                  {isAdmin && member.role !== 'owner' && (
                    <div className="pl-13 flex flex-wrap gap-4 pt-2 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`perm-view-${member.userId}`}
                          checked={member.permissions?.viewAllOrders ?? false}
                          onCheckedChange={(checked) => handlePermissionToggle(member.userId, 'viewAllOrders', checked)}
                        />
                        <Label htmlFor={`perm-view-${member.userId}`} className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                          {member.permissions?.viewAllOrders ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          View All Orders
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`perm-create-${member.userId}`}
                          checked={member.permissions?.canCreateOrders ?? true}
                          onCheckedChange={(checked) => handlePermissionToggle(member.userId, 'canCreateOrders', checked)}
                        />
                        <Label htmlFor={`perm-create-${member.userId}`} className="text-[10px] uppercase font-bold text-muted-foreground">
                          Can Create Orders
                        </Label>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/20">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-muted-foreground mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> Permissions define what this user can see and do within the project.
                </p>
              </div>
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
                { id: 'orders', label: 'New order notifications', description: 'Get notified when new orders are created' },
                { id: 'status', label: 'Order status updates', description: 'Receive updates on order progress' },
                { id: 'team', label: 'Team activity', description: 'Get notified about team member actions' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={handleArchive}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Archive className="w-4 h-4" />
            Archive Project
          </Button>
          <Button
            onClick={handleSave}
            className="bg-accent hover:bg-accent/90"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>

        {/* Danger Zone Notice */}
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-destructive">Danger Zone</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Once you delete a project, there is no going back. Please be certain.
                </p>
                {isAdmin ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-4"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Delete Project
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Projects can only be deleted by an Ateli Admin.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invite Member Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Add a member to your project. They must already have an Ateli account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Phone Number or Email</Label>
              <Input
                id="identifier"
                placeholder="+91 XXXXX XXXXX or email@example.com"
                value={inviteIdentifier}
                onChange={(e) => setInviteIdentifier(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteRole">Project Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={isInviting || !inviteIdentifier}
              className="bg-accent hover:bg-accent/90"
            >
              {isInviting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Inviting...
                </>
              ) : (
                'Invite Member'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="border-destructive">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Delete Project
            </DialogTitle>
            <DialogDescription>
              Are you absolutely sure you want to delete <strong>{currentProject.name}</strong>?
              This action cannot be undone and all orders, messages, and project data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Yes, delete project'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
