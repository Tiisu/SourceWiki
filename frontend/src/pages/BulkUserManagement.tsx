import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth-context';
import { User as MockUser, mockUsers } from '../lib/mock-data';

type User = MockUser;

export const BulkUserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser === undefined) return;
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    if (currentUser.role !== 'admin') {
      toast.error('Access denied');
      navigate('/');
    }
  }, [currentUser, navigate]);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(Array.isArray(data) ? data : data.users ?? data.data ?? []);
        } else {
          setUsers(mockUsers);
        }
      } catch {
        setUsers(mockUsers);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.role && u.role.toLowerCase().includes(q)) ||
        (u.country && u.country.toLowerCase().includes(q)),
    );
  }, [users, search]);

  const handleAddUser = async () => {
    const newUser: User = {
      id: Date.now().toString(),
      username: `newuser${users.length + 1}`,
      email: `user${users.length + 1}@example.com`,
      country: 'US',
      role: 'contributor',
      points: 0,
      badges: [],
      joinDate: new Date().toISOString().split('T')[0],
    };

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        const created: User = await res.json();
        setUsers((s) => [...s, created]);
        toast.success('User added');
        return;
      }
    } catch {
      // fallback to local only
    }

    setUsers((s) => [...s, newUser]);
    toast.success('User added (local)');
  };

  const openEditDialog = (u: User) => {
    setEditingUser(u);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser),
      });
      if (res.ok) {
        const saved: User = await res.json();
        setUsers((s) => s.map((x) => (x.id === saved.id ? saved : x)));
        toast.success('User updated');
        setEditDialogOpen(false);
        setEditingUser(null);
        return;
      }
    } catch {
      // fallback to local update
    }

    setUsers((s) => s.map((x) => (x.id === editingUser.id ? editingUser : x)));
    toast.success('User updated (local)');
    setEditDialogOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete user?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers((s) => s.filter((u) => u.id !== id));
        toast.success('User deleted');
        return;
      }
    } catch {
      // fallback to local removal
    }

    setUsers((s) => s.filter((u) => u.id !== id));
    toast.success('User deleted (local)');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bulk User Management</h1>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="mr-2"
          />
          <Button onClick={handleAddUser}>Add User</Button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div>Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-600">No users found.</div>
        ) : (
          filtered.map((u) => (
            <Card key={u.id}>
              <CardHeader>
                <CardTitle>{u.username}</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div>
                  <p>Email: {u.email}</p>
                  <p>Role: {u.role}</p>
                  <p>Points: {u.points}</p>
                  <p>Country: {u.country}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={() => openEditDialog(u)}>
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={() => handleDeleteUser(u.id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information</DialogDescription>
            </DialogHeader>

            {editingUser && (
              <div className="space-y-3">
                <Input
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  placeholder="Username"
                />
                <Input
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="Email"
                />
                <Input
                  value={editingUser.country}
                  onChange={(e) => setEditingUser({ ...editingUser, country: e.target.value })}
                  placeholder="Country"
                />
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as User['role'] })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="admin">admin</option>
                  <option value="verifier">verifier</option>
                  <option value="contributor">contributor</option>
                </select>
              </div>
            )}

            <DialogFooter className="flex justify-end mt-4">
              <Button variant="default" onClick={handleSaveEdit}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
