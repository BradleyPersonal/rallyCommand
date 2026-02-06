import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  User,
  Mail,
  Calendar,
  Shield,
  Sun,
  Moon,
  Monitor,
  Check,
  Pencil,
  Save,
  X,
  Trash2,
  AlertTriangle,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

// Helper to redact sensitive info
const redactEmail = (email) => {
  if (!email) return '';
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  
  const redactedLocal = localPart.length > 3 
    ? localPart.slice(0, 2) + '*'.repeat(Math.min(localPart.length - 3, 5)) + localPart.slice(-1)
    : localPart[0] + '*'.repeat(localPart.length - 1);
  
  const domainParts = domain.split('.');
  const redactedDomain = domainParts[0].length > 2
    ? domainParts[0][0] + '*'.repeat(domainParts[0].length - 1)
    : domainParts[0];
  
  return `${redactedLocal}@${redactedDomain}.${domainParts.slice(1).join('.')}`;
};

export default function AccountPage() {
  const { user, getAuthHeader, logout, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [showFullEmail, setShowFullEmail] = useState(false);
  
  // Edit mode states
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [passwordForEmail, setPasswordForEmail] = useState('');
  
  // Delete account dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  // Export data
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user) {
      setNewName(user.name || '');
      setNewEmail(user.email || '');
    }
  }, [user]);

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    
    setLoading(true);
    try {
      await axios.put(`${API}/account`, 
        { name: newName.trim() },
        { headers: getAuthHeader() }
      );
      toast.success('Name updated successfully');
      setEditingName(false);
      if (refreshUser) refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update name');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) {
      toast.error('Email cannot be empty');
      return;
    }
    if (!passwordForEmail) {
      toast.error('Password is required to change email');
      return;
    }
    
    setLoading(true);
    try {
      await axios.put(`${API}/account`, 
        { email: newEmail.trim(), current_password: passwordForEmail },
        { headers: getAuthHeader() }
      );
      toast.success('Email updated successfully');
      setEditingEmail(false);
      setPasswordForEmail('');
      if (refreshUser) refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const response = await axios.get(`${API}/account/export`, {
        headers: getAuthHeader()
      });
      
      // Create and download JSON file
      const dataStr = JSON.stringify(response.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rallycommand-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    if (!deletePassword) {
      toast.error('Password is required');
      return;
    }
    
    setDeleting(true);
    try {
      await axios.delete(`${API}/account`, {
        headers: getAuthHeader(),
        data: { password: deletePassword }
      });
      
      toast.success('Account deleted successfully');
      logout();
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Light background, dark text' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Dark background, light text' },
    { value: 'system', label: 'System', icon: Monitor, description: 'Follow system preference' },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6" data-testid="account-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl tracking-tighter uppercase text-foreground">
            Account Settings
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            Manage your account details and preferences
          </p>
        </div>

        {/* Profile Information */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-xl tracking-tight uppercase flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Your personal information. Sensitive data is redacted for security.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name Field */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground tracking-widest uppercase">Name</Label>
                {editingName ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-secondary border-border max-w-xs"
                      data-testid="edit-name-input"
                    />
                    <Button 
                      size="sm" 
                      onClick={handleUpdateName}
                      disabled={loading}
                      data-testid="save-name-btn"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setEditingName(false);
                        setNewName(user?.name || '');
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-foreground mt-1 font-medium">{user?.name}</p>
                )}
              </div>
              {!editingName && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setEditingName(true)}
                  data-testid="edit-name-btn"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
            </div>

            <Separator />

            {/* Email Field */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground tracking-widest uppercase flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  Email Address
                </Label>
                {editingEmail ? (
                  <div className="space-y-3 mt-2">
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="bg-secondary border-border max-w-xs"
                      placeholder="New email address"
                      data-testid="edit-email-input"
                    />
                    <div>
                      <Label className="text-xs text-muted-foreground">Confirm with password</Label>
                      <Input
                        type="password"
                        value={passwordForEmail}
                        onChange={(e) => setPasswordForEmail(e.target.value)}
                        className="bg-secondary border-border max-w-xs mt-1"
                        placeholder="Enter your password"
                        data-testid="password-confirm-input"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        onClick={handleUpdateEmail}
                        disabled={loading}
                        data-testid="save-email-btn"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save Email
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setEditingEmail(false);
                          setNewEmail(user?.email || '');
                          setPasswordForEmail('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-foreground font-mono">
                      {showFullEmail ? user?.email : redactEmail(user?.email)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setShowFullEmail(!showFullEmail)}
                      data-testid="toggle-email-visibility"
                    >
                      {showFullEmail ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                  </div>
                )}
              </div>
              {!editingEmail && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setEditingEmail(true)}
                  data-testid="edit-email-btn"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
            </div>

            <Separator />

            {/* Account Created Date */}
            <div>
              <Label className="text-xs text-muted-foreground tracking-widest uppercase flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                Member Since
              </Label>
              <p className="text-foreground mt-1">{formatDate(user?.created_at)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-xl tracking-tight uppercase flex items-center gap-2">
              <Sun className="w-5 h-5 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how RallyCommand looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {themeOptions.map((option) => {
                const isActive = theme === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                      isActive 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50 bg-secondary/30'
                    }`}
                    data-testid={`theme-${option.value}`}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <option.icon className={`w-6 h-6 mb-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="font-semibold text-foreground">{option.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                    
                    {/* Theme Preview */}
                    <div className={`mt-3 p-2 rounded border ${
                      option.value === 'light' 
                        ? 'bg-white border-gray-200' 
                        : option.value === 'dark'
                        ? 'bg-zinc-900 border-zinc-700'
                        : 'bg-gradient-to-r from-white to-zinc-900 border-gray-400'
                    }`}>
                      <div className={`h-2 w-full rounded ${
                        option.value === 'light' ? 'bg-red-500' : option.value === 'dark' ? 'bg-red-500' : 'bg-red-500'
                      }`} />
                      <div className={`h-1.5 w-3/4 rounded mt-1 ${
                        option.value === 'light' ? 'bg-gray-300' : option.value === 'dark' ? 'bg-zinc-700' : 'bg-gray-500'
                      }`} />
                      <div className={`h-1.5 w-1/2 rounded mt-1 ${
                        option.value === 'light' ? 'bg-gray-200' : option.value === 'dark' ? 'bg-zinc-800' : 'bg-gray-600'
                      }`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-xl tracking-tight uppercase flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Export Data
            </CardTitle>
            <CardDescription>
              Download all your data including vehicles, inventory, repairs, and setups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={handleExportData}
              disabled={exporting}
              data-testid="export-data-btn"
            >
              {exporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export All Data (JSON)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-card border-destructive/50">
          <CardHeader>
            <CardTitle className="text-xl tracking-tight uppercase flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that will permanently affect your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">Delete Account</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <Button 
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  data-testid="delete-account-btn"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. All your data will be deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm font-medium text-destructive">The following data will be permanently deleted:</p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Your account and profile information</li>
                <li>• All vehicles in your garage</li>
                <li>• All inventory items</li>
                <li>• All repair logs</li>
                <li>• All vehicle setups</li>
                <li>• All stocktake records</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm">Type DELETE to confirm</Label>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="bg-secondary border-border mt-1"
                  data-testid="delete-confirm-input"
                />
              </div>
              <div>
                <Label className="text-sm">Enter your password</Label>
                <Input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Password"
                  className="bg-secondary border-border mt-1"
                  data-testid="delete-password-input"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmText('');
                setDeletePassword('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleting || deleteConfirmText !== 'DELETE' || !deletePassword}
              data-testid="confirm-delete-btn"
            >
              {deleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete My Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
