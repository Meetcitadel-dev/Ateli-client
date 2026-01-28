import { useState } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Archive
} from 'lucide-react';
import { toast } from 'sonner';

export function ProjectConfigPanel() {
  const { currentProject } = useProject();
  const [gstEnabled, setGstEnabled] = useState(currentProject?.gstConfig?.enabled ?? false);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Select a project to view settings</p>
      </div>
    );
  }

  const handleSave = () => {
    toast.success('Project settings saved');
  };

  const handleInvite = () => {
    toast.success('Invitation sent');
  };

  const handleArchive = () => {
    toast.success('Project archived');
  };

  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    member: 'Member',
    project_manager: 'Project Manager',
    site_supervisor: 'Site Supervisor',
    purchase_manager: 'Purchase Manager',
    architect: 'Architect',
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto scrollbar-thin max-w-4xl mx-auto">
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
            <Input id="name" defaultValue={currentProject.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Site Address
            </Label>
            <Input id="address" defaultValue={currentProject.siteAddress} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" defaultValue={currentProject.description || ''} />
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
                defaultValue={currentProject.collectionPerson?.name || ''} 
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
                defaultValue={currentProject.collectionPerson?.phone || ''} 
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
              checked={gstEnabled}
              onCheckedChange={setGstEnabled}
            />
          </div>

          {gstEnabled && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input 
                    id="gstin" 
                    defaultValue={currentProject.gstConfig?.gstin || ''} 
                    placeholder="27AABCU9603R1ZM"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input 
                    id="companyName" 
                    defaultValue={currentProject.gstConfig?.companyName || ''} 
                    placeholder="Company Pvt Ltd"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Company Address</Label>
                  <Input 
                    id="companyAddress" 
                    defaultValue={currentProject.gstConfig?.companyAddress || ''} 
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
            <Button size="sm" variant="outline" onClick={handleInvite} className="gap-2">
              <UserPlus className="w-4 h-4" />
              Invite Member
            </Button>
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
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={member.user.avatar} alt={member.user.name} />
                  <AvatarFallback>
                    {member.user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{member.user.name}</p>
                    {member.role === 'owner' && (
                      <Crown className="w-4 h-4 text-warning" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                </div>
                <Badge variant="secondary">
                  {roleLabels[member.role] || member.role}
                </Badge>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/20">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Removing members requires approval from Ateli Admin. 
                Contact support if you need to remove someone from this project.
              </p>
            </div>
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
        <Button onClick={handleSave} className="bg-accent hover:bg-accent/90">
          Save Changes
        </Button>
      </div>

      {/* Danger Zone Notice */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Project Deletion</p>
              <p className="text-sm text-muted-foreground mt-1">
                Projects cannot be deleted by clients. If you need to permanently remove 
                this project, please contact Ateli Admin for assistance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
