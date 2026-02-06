import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Trash2, Shield, User as UserIcon, Edit } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface AppUser {
  id: string;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export const UserManagement = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'cashier'>('cashier');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['app-users'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AppUser[];
    },
  });

  const createUser = useMutation({
    mutationFn: async (userData: { username: string; password: string; full_name: string; role: string }) => {
      const { data, error } = await (supabase as any)
        .from('app_users')
        .insert({
          username: userData.username,
          password_hash: userData.password,
          full_name: userData.full_name,
          role: userData.role,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      toast({ title: 'Success', description: 'User created successfully' });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create user',
        variant: 'destructive' 
      });
    },
  });

  const updateUser = useMutation({
    mutationFn: async (userData: { id: string; username: string; password?: string; full_name: string; role: string }) => {
      const updateData: any = {
        username: userData.username,
        full_name: userData.full_name,
        role: userData.role,
      };
      
      if (userData.password) {
        updateData.password_hash = userData.password;
        console.log('Updating password for user:', userData.username, 'New password:', userData.password);
      }
      
      console.log('Update data being sent:', updateData);
      
      const { data, error } = await (supabase as any)
        .from('app_users')
        .update(updateData)
        .eq('id', userData.id)
        .select();
      
      console.log('Update result:', { data, error });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      toast({ title: 'Success', description: 'User updated successfully' });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update user',
        variant: 'destructive' 
      });
    },
  });

  const toggleUserStatus = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await (supabase as any)
        .from('app_users')
        .update({ is_active: isActive })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      toast({ title: 'Success', description: 'User status updated' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update user status', variant: 'destructive' });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await (supabase as any)
        .from('app_users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      toast({ title: 'Success', description: 'User deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    },
  });

  const openEditDialog = (user: AppUser) => {
    setEditingUser(user);
    setUsername(user.username);
    setFullName(user.full_name);
    setRole(user.role as 'admin' | 'cashier');
    setPassword('');
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setFullName('');
    setRole('cashier');
  };

  const handleSaveUser = () => {
    if (!username || !fullName) {
      toast({ title: 'Error', description: 'Username and full name are required', variant: 'destructive' });
      return;
    }

    if (editingUser) {
      const updateData: any = {
        id: editingUser.id,
        username,
        full_name: fullName,
        role,
      };
      if (password) {
        updateData.password = password;
      }
      updateUser.mutate(updateData);
    } else {
      if (!password) {
        toast({ title: 'Error', description: 'Password is required for new users', variant: 'destructive' });
        return;
      }
      createUser.mutate({ username, password, full_name: fullName, role });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground">Manage cashiers and admin users</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-primary w-full sm:w-auto">
          <UserPlus className="w-4 h-4 mr-2" />
          <span>Add User</span>
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[100px]">Username</TableHead>
              <TableHead className="min-w-[120px]">Full Name</TableHead>
              <TableHead className="min-w-[80px]">Role</TableHead>
              <TableHead className="min-w-[120px]">Status</TableHead>
              <TableHead className="min-w-[100px] hidden sm:table-cell">Created</TableHead>
              <TableHead className="text-right min-w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-mono text-sm">{user.username}</TableCell>
                <TableCell className="text-sm">{user.full_name}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                    {user.role === 'admin' ? (
                      <Shield className="w-3 h-3 mr-1" />
                    ) : (
                      <UserIcon className="w-3 h-3 mr-1" />
                    )}
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={user.is_active}
                      onCheckedChange={(checked) => 
                        toggleUserStatus.mutate({ userId: user.id, isActive: checked })
                      }
                      disabled={user.username === 'admin'}
                    />
                    <Badge variant={user.is_active ? 'default' : 'secondary'} className="text-xs">
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      onClick={() => openEditDialog(user)}
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => deleteUser.mutate(user.id)}
                      variant="ghost"
                      size="sm"
                      disabled={user.username === 'admin'}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit User Dialog */}
      <Dialog open={showDialog} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label htmlFor="edit-password">
                Password {editingUser && '(leave empty to keep current)'}
              </Label>
              <Input
                id="edit-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editingUser ? 'Enter new password (optional)' : 'Enter password'}
              />
            </div>
            <div>
              <Label htmlFor="edit-fullname">Full Name</Label>
              <Input
                id="edit-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select value={role} onValueChange={(value: 'admin' | 'cashier') => setRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveUser} className="w-full">
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
