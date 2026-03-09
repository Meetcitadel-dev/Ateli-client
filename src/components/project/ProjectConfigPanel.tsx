import { useState, useEffect } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useView } from '@/contexts/ViewContext';
import { useAuth } from '@/contexts/AuthContext';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from 'react-router-dom';
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
  EyeOff,
  Copy,
  Share2,
  Camera,
  Image as ImageIcon,
  Plus,
  X,
  CreditCard,
  CheckCircle,
  Truck,
  Briefcase,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';

export function ProjectConfigPanel() {
  const navigate = useNavigate();
  const { currentProject, updateProjectSettings, updateMemberRole, updateMemberPermissions, updateMemberResponsibilities, removeMember, inviteMember, deleteProject, archiveProject, unarchiveProject } = useProject();
  const { isAdmin } = useView();
  const { user, logout, updateUserProfile } = useAuth();
  const [tempName, setTempName] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentUserMember = currentProject?.members.find(m => m.userId === user?.id);
  const isProjectAdmin = isAdmin || currentUserMember?.role === 'admin' || currentUserMember?.role === 'owner' || currentUserMember?.responsibilities?.includes('owner');

  // Invite form state
  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [inviteRole, setInviteRole] = useState('project_team');

  // Auto-select admin role for emails
  useEffect(() => {
    if (inviteIdentifier.includes('@')) {
      setInviteRole('admin');
    } else if (inviteIdentifier && !inviteIdentifier.includes('@') && inviteRole === 'admin') {
      setInviteRole('project_team');
    }
  }, [inviteIdentifier]);

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
    },
    projectType: 'Company' as 'Company' | 'Individual' | 'Sub contracting',
    imageUrl: ''
  });

  useEffect(() => {
    if (user) {
      setTempName(user.name);
    }
  }, [user]);

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
        },
        projectType: currentProject.projectType || 'Company',
        imageUrl: currentProject.imageUrl || ''
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
        gstConfig: formData.gstConfig,
        projectType: formData.projectType,
        imageUrl: formData.imageUrl
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
      setInviteRole('project_team');
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

  const handleToggleResponsibility = async (userId: string, responsibility: string) => {
    const member = currentProject?.members.find(m => m.userId === userId);
    if (!member) return;

    const currentResps = member.responsibilities || [];
    const newResps = currentResps.includes(responsibility as any)
      ? currentResps.filter(r => r !== responsibility)
      : [...currentResps, responsibility as any];

    try {
      await updateMemberResponsibilities(userId, newResps);
    } catch (error) {
      console.error('Failed to update responsibilities:', error);
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

  const handleArchiveToggle = async () => {
    try {
      if (currentProject.status === 'archived') {
        await unarchiveProject();
      } else {
        await archiveProject();
      }
    } catch (error) {
      console.error('Failed to toggle archive status:', error);
    }
  };

  const getProjectShareText = () => {
    return `*Project Details*
Name: ${currentProject.name}
Address: ${currentProject.siteAddress || 'N/A'}

*Collection Person*
Name: ${currentProject.collectionPerson?.name || 'N/A'}
Phone: ${currentProject.collectionPerson?.phone || 'N/A'}
`;
  };

  const handleCopyProjectDetails = async () => {
    try {
      await navigator.clipboard.writeText(getProjectShareText());
      toast.success('Project details copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleShareProjectDetails = async () => {
    const text = getProjectShareText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'project_team', label: 'Project team' },
    { value: 'purchase', label: 'Purchase' },
    { value: 'design_architect', label: 'Design architect' },
    { value: 'management', label: 'Management' },
    { value: 'receiver', label: 'Receiver' },
  ];

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    project_team: 'Project team',
    purchase: 'Purchase',
    design_architect: 'Design architect',
    management: 'Management',
    receiver: 'Receiver',
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Settings</h1>
            <p className="text-muted-foreground text-sm font-medium">{currentProject.name}</p>
          </div>
          {!isProjectAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-primary/20 text-primary hover:bg-primary/10 font-bold uppercase tracking-widest text-[10px]"
              onClick={() => navigate('/projects')}
            >
              Change Project
            </Button>
          )}
        </div>

        {/* My Profile Card – shown for everyone, but crucial for non-admins */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <User className="w-4 h-4" />
              My Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-primary/20 p-1 bg-background">
                <AvatarImage src={user?.avatar} alt={user?.name} className="rounded-full" />
                <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">
                  {user?.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                {isEditingProfile ? (
                  <div className="flex gap-2">
                    <Input
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="h-9 px-3 text-sm font-medium focus:ring-primary/20"
                      autoFocus
                    />
                  </div>
                ) : (
                  <p className="text-xl font-black text-foreground truncate tracking-tight">{user?.name}</p>
                )}
                <p className="text-white/40 text-xs font-black uppercase tracking-widest mt-1">
                  {user?.phone || user?.email || 'No contact info'}
                </p>
              </div>
            </div>

            {!isProjectAdmin && (
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {isEditingProfile ? (
                  <>
                    <Button
                      className="w-full sm:flex-1 bg-primary text-black font-black h-16 sm:h-12 rounded-[2rem] shadow-xl shadow-primary/10 active:scale-95 transition-all text-sm uppercase tracking-widest"
                      onClick={async () => {
                        try {
                          await updateUserProfile({ name: tempName });
                          setIsEditingProfile(false);
                          toast.success("Profile updated");
                        } catch (err) {
                          toast.error("Update failed");
                        }
                      }}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full sm:flex-1 h-16 sm:h-12 rounded-[2rem] border-white/5 bg-white/[0.03] hover:bg-white/[0.08] text-white/60 font-black active:scale-95 transition-all text-sm uppercase tracking-widest"
                      onClick={() => {
                        setTempName(user?.name || '');
                        setIsEditingProfile(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full sm:flex-1 h-16 sm:h-12 rounded-[2rem] border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-white font-black uppercase tracking-[0.2em] text-[11px] gap-2 active:scale-95 transition-all shadow-xl"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      Edit Profile
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full sm:flex-1 h-16 sm:h-12 rounded-[2rem] border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive font-black uppercase tracking-[0.2em] text-[11px] gap-2 active:scale-95 transition-all shadow-xl"
                      onClick={() => {
                        logout();
                        navigate('/login');
                      }}
                    >
                      Logout
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wallet Card – only for non-project-admin users */}
        {!isProjectAdmin && (
          <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20 shadow-lg shadow-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Your Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black text-foreground">
                    ₹{user?.walletBalance?.toLocaleString() || '0'}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Available Balance</p>
                </div>
                <Button
                  size="sm"
                  className="rounded-xl h-10 px-4 font-bold uppercase tracking-wider text-[10px]"
                  onClick={() => navigate('/dashboard/wallet')}
                >
                  View Wallet →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Non-admin users: stop here */}
        {!isProjectAdmin && (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-sm">Welcome to {currentProject.name} settings.</p>
          </div>
        )}

        {isProjectAdmin && (
          <>

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Project Details
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={handleCopyProjectDetails} title="Copy Details">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleShareProjectDetails} title="Share on WhatsApp">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
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

                <div className="space-y-4">
                  <Label>Project Photos (Max 4)</Label>
                  <div className="flex flex-wrap gap-4">
                    {formData.imageUrl && formData.imageUrl.split(',').map((url, index) => (
                      <div key={index} className="relative w-40 h-40 rounded-xl overflow-hidden group">
                        <img src={url} alt={`Project ${index + 1}`} className="w-full h-full object-cover" />
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              const urls = formData.imageUrl.split(',');
                              urls.splice(index, 1);
                              setFormData(prev => ({ ...prev, imageUrl: urls.join(',') }));
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        )}
                      </div>
                    ))}

                    {isAdmin && (!formData.imageUrl || formData.imageUrl.split(',').length < 4) && (
                      <label className="w-40 h-40 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const existingUrls = formData.imageUrl ? formData.imageUrl.split(',') : [];
                            const remainingSlots = 4 - existingUrls.length;
                            if (remainingSlots <= 0) return;

                            const files = Array.from(e.target.files || []).slice(0, remainingSlots);
                            if (files.length === 0) return;

                            setIsSaving(true);
                            try {
                              const { db } = await import('@/services/db');
                              const newUrls = [...existingUrls];

                              for (const file of files) {
                                const url = await db.uploadFile(file, 'projects');
                                newUrls.push(url);
                              }

                              setFormData(prev => ({ ...prev, imageUrl: newUrls.join(',') }));
                            } catch (error: any) {
                              console.error('Photo upload failed', error);
                              toast.error(`Photo upload failed: ${error.message || 'Unknown error'}`);
                            } finally {
                              setIsSaving(false);
                              // Clear input so same file can be selected again if needed
                              e.target.value = '';
                            }
                          }}
                        />
                        <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors text-center px-2">
                          <Camera className="w-8 h-8 opacity-40 group-hover:opacity-100" />
                          <span className="text-xs font-medium">Upload Photos<br />(Max 4 total)</span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectType">Project Type</Label>
                  <Select
                    value={formData.projectType}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, projectType: value }))}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger id="projectType">
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Company">Company</SelectItem>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Sub contracting">Sub contracting</SelectItem>
                    </SelectContent>
                  </Select>
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
                  {isProjectAdmin && (
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
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{member.user?.email || member.user?.phone}</p>

                          {/* Responsibilities Subsection */}
                          <div className="mt-3 space-y-2">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-tight">Project Responsibilities</p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {member.responsibilities?.map(resp => {
                                const Icon = resp === 'payer' ? CreditCard :
                                  resp === 'approver' ? CheckCircle :
                                    resp === 'receiver' ? Truck : Briefcase;
                                return (
                                  <Badge
                                    key={resp}
                                    variant="secondary"
                                    className="gap-1.5 py-1 px-2.5 text-[10px] bg-primary/5 border-primary/10 text-primary font-bold transition-all hover:bg-primary/10"
                                  >
                                    <Icon className="w-3 h-3" />
                                    <span className="capitalize">{resp}</span>
                                    {isProjectAdmin && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleResponsibility(member.userId, resp);
                                        }}
                                        className="ml-1 hover:text-destructive transition-colors"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </Badge>
                                );
                              })}

                              {isProjectAdmin && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider gap-1 border-dashed hover:border-primary hover:text-primary transition-all"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Add
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="w-48">
                                    {[
                                      { val: 'payer', label: 'Payer', icon: CreditCard, desc: 'Can handle payments' },
                                      { val: 'approver', label: 'Approver', icon: CheckCircle, desc: 'Can approve carts' },
                                      { val: 'receiver', label: 'Receiver', icon: Truck, desc: 'Confirms material delivery' },
                                      { val: 'owner', label: 'Owner', icon: Briefcase, desc: 'Master responsibility' },
                                    ].map(r => (
                                      <DropdownMenuItem
                                        key={r.val}
                                        onClick={() => handleToggleResponsibility(member.userId, r.val)}
                                        className="flex flex-col items-start gap-1 py-2 cursor-pointer"
                                        disabled={member.responsibilities?.includes(r.val as any)}
                                      >
                                        <div className="flex items-center gap-2 font-bold">
                                          <r.icon className="w-4 h-4 text-primary" />
                                          {r.label}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">{r.desc}</span>
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        </div>

                        {isProjectAdmin ? (
                          <div className="flex items-center gap-2">
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

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveMember(member.userId)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          member.role !== 'owner' && <Badge variant="secondary">{roleLabels[member.role]}</Badge>
                        )}
                      </div>

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



            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              {isProjectAdmin && (
                <Button
                  variant="outline"
                  onClick={handleArchiveToggle}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Archive className="w-4 h-4" />
                  {currentProject.status === 'archived' ? 'Unarchive Project' : 'Archive Project'}
                </Button>
              )}
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
          </>
        )}
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
