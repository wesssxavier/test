import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Users, Settings, Layers, Plus, Pencil, Trash2, X, Save,
  Shield, ShieldCheck, GripVertical, Eye, EyeOff,
} from 'lucide-react';
import { authApi, customFieldsApi } from '../lib/api';
import { useEventStore } from '../stores/eventStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  sortOrder: number;
}

type Tab = 'users' | 'custom-fields' | 'settings';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    username: '', displayName: '', email: '', password: '', role: 'viewer',
  });
  const [savingUser, setSavingUser] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [fieldForm, setFieldForm] = useState({
    name: '', label: '', type: 'text', required: false, options: '',
  });
  const [savingField, setSavingField] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    appName: 'GuestFlow Private',
    defaultEventCapacity: '200',
    enableAuditLog: true,
    sessionTimeout: '480',
  });

  const currentEventId = useEventStore((s) => s.currentEventId);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await authApi.getUsers();
      setUsers(res.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomFields = useCallback(async () => {
    if (!currentEventId) return;
    try {
      const res = await customFieldsApi.list(currentEventId);
      setCustomFields(res.data);
    } catch {
      // OK - may not have event selected
    }
  }, [currentEventId]);

  useEffect(() => {
    fetchUsers();
    fetchCustomFields();
  }, [fetchUsers, fetchCustomFields]);

  // Users
  const openCreateUser = () => {
    setEditingUser(null);
    setUserForm({ username: '', displayName: '', email: '', password: '', role: 'viewer' });
    setShowUserModal(true);
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      password: '',
      role: user.role,
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUser(true);
    try {
      const data: any = { ...userForm };
      if (!data.password) delete data.password;
      if (editingUser) {
        await authApi.updateUser(editingUser.id, data);
        toast.success('User updated');
      } else {
        await authApi.createUser(data);
        toast.success('User created');
      }
      setShowUserModal(false);
      fetchUsers();
    } catch {
      toast.error(editingUser ? 'Failed to update user' : 'Failed to create user');
    } finally {
      setSavingUser(false);
    }
  };

  // Custom Fields
  const openCreateField = () => {
    setEditingField(null);
    setFieldForm({ name: '', label: '', type: 'text', required: false, options: '' });
    setShowFieldModal(true);
  };

  const openEditField = (field: CustomField) => {
    setEditingField(field);
    setFieldForm({
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      options: field.options?.join(', ') || '',
    });
    setShowFieldModal(true);
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEventId) {
      toast.error('Please select an event first');
      return;
    }
    setSavingField(true);
    try {
      const data: any = {
        ...fieldForm,
        options: fieldForm.type === 'select'
          ? fieldForm.options.split(',').map((o) => o.trim()).filter(Boolean)
          : undefined,
      };
      if (editingField) {
        await customFieldsApi.update(currentEventId, editingField.id, data);
        toast.success('Field updated');
      } else {
        await customFieldsApi.create(currentEventId, data);
        toast.success('Field created');
      }
      setShowFieldModal(false);
      fetchCustomFields();
    } catch {
      toast.error(editingField ? 'Failed to update field' : 'Failed to create field');
    } finally {
      setSavingField(false);
    }
  };

  const handleDeleteField = async (id: string) => {
    if (!currentEventId || !confirm('Delete this custom field?')) return;
    try {
      await customFieldsApi.delete(currentEventId, id);
      toast.success('Field deleted');
      fetchCustomFields();
    } catch {
      toast.error('Failed to delete field');
    }
  };

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      admin: 'badge-red',
      manager: 'badge-blue',
      operator: 'badge-yellow',
      viewer: 'badge-gray',
    };
    return map[role] || 'badge-gray';
  };

  const tabs = [
    { key: 'users' as Tab, label: 'Users', icon: Users },
    { key: 'custom-fields' as Tab, label: 'Custom Fields', icon: Layers },
    { key: 'settings' as Tab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Admin / Settings</h1>
        <p className="mt-1 text-sm text-surface-500">Manage users, custom fields, and application settings</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-surface-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300',
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-surface-900">Users</h3>
            <button className="btn-primary btn-sm" onClick={openCreateUser}>
              <Plus className="h-3.5 w-3.5" />
              Add User
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-surface-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="card p-8 text-center">
              <Users className="h-10 w-10 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-600">No users found</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 border-b border-surface-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase">Created</th>
                    <th className="px-4 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-surface-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                            {user.displayName?.charAt(0)?.toUpperCase() || user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-surface-900">{user.displayName}</p>
                            <p className="text-xs text-surface-500">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-surface-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('badge capitalize', roleBadge(user.role))}>
                          {user.role === 'admin' && <ShieldCheck className="h-3 w-3 mr-1" />}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('badge', user.active !== false ? 'badge-green' : 'badge-gray')}>
                          {user.active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-surface-500 text-xs">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '--'}
                      </td>
                      <td className="px-4 py-3">
                        <button className="btn-icon p-1" onClick={() => openEditUser(user)} title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Custom Fields Tab */}
      {activeTab === 'custom-fields' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-surface-900">Custom Fields</h3>
              {!currentEventId && (
                <p className="text-sm text-yellow-600 mt-1">Select an event to manage custom fields</p>
              )}
            </div>
            <button className="btn-primary btn-sm" onClick={openCreateField} disabled={!currentEventId}>
              <Plus className="h-3.5 w-3.5" />
              Add Field
            </button>
          </div>

          {customFields.length === 0 ? (
            <div className="card p-8 text-center">
              <Layers className="h-10 w-10 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-600">
                {currentEventId ? 'No custom fields yet' : 'Select an event from the sidebar first'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {customFields
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                .map((field) => (
                  <div key={field.id} className="card p-4 flex items-center gap-4 group">
                    <GripVertical className="h-4 w-4 text-surface-300 cursor-grab flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-surface-900">{field.label}</p>
                        <span className="text-xs text-surface-400 font-mono">{field.name}</span>
                        {field.required && <span className="text-xs text-red-500">Required</span>}
                      </div>
                      <p className="text-xs text-surface-500 mt-0.5">
                        Type: {field.type}
                        {field.options && field.options.length > 0 && (
                          <span> | Options: {field.options.join(', ')}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="btn-icon p-1" onClick={() => openEditField(field)} title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="btn-icon p-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteField(field.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="max-w-xl">
          <h3 className="text-lg font-semibold text-surface-900 mb-4">Application Settings</h3>
          <div className="card p-6 space-y-5">
            <div>
              <label className="label">Application Name</label>
              <input
                className="input"
                value={settingsForm.appName}
                onChange={(e) => setSettingsForm({ ...settingsForm, appName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Default Event Capacity</label>
              <input
                type="number"
                className="input"
                value={settingsForm.defaultEventCapacity}
                onChange={(e) => setSettingsForm({ ...settingsForm, defaultEventCapacity: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Session Timeout (minutes)</label>
              <input
                type="number"
                className="input"
                value={settingsForm.sessionTimeout}
                onChange={(e) => setSettingsForm({ ...settingsForm, sessionTimeout: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-surface-700">Enable Audit Log</p>
                <p className="text-xs text-surface-500">Track all user actions for compliance</p>
              </div>
              <button
                className={clsx(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  settingsForm.enableAuditLog ? 'bg-primary-600' : 'bg-surface-300',
                )}
                onClick={() => setSettingsForm({ ...settingsForm, enableAuditLog: !settingsForm.enableAuditLog })}
              >
                <span
                  className={clsx(
                    'inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
                    settingsForm.enableAuditLog ? 'translate-x-6' : 'translate-x-1',
                  )}
                />
              </button>
            </div>
            <div className="pt-3 border-t border-surface-200">
              <button
                className="btn-primary"
                onClick={() => toast.success('Settings saved')}
              >
                <Save className="h-4 w-4" />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editingUser ? 'Edit User' : 'Create User'}</h2>
              <button onClick={() => setShowUserModal(false)} className="btn-icon">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="label">Username</label>
                <input
                  className="input"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  required
                  disabled={!!editingUser}
                />
              </div>
              <div>
                <label className="label">Display Name</label>
                <input
                  className="input"
                  value={userForm.displayName}
                  onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">
                  Password {editingUser && <span className="text-surface-400 font-normal">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  className="input"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  required={!editingUser}
                  placeholder={editingUser ? 'Leave blank to keep current' : ''}
                />
              </div>
              <div>
                <label className="label">Role</label>
                <select
                  className="input"
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="operator">Operator</option>
                  <option value="viewer">Viewer</option>
                </select>
                <p className="text-xs text-surface-500 mt-1">
                  {userForm.role === 'admin' && 'Full access to all features and settings'}
                  {userForm.role === 'manager' && 'Can manage events, guests, and seating'}
                  {userForm.role === 'operator' && 'Can manage guests and perform check-in'}
                  {userForm.role === 'viewer' && 'Read-only access to all data'}
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowUserModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={savingUser}>
                  {savingUser ? 'Saving...' : editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Field Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editingField ? 'Edit Field' : 'Create Field'}</h2>
              <button onClick={() => setShowFieldModal(false)} className="btn-icon">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveField} className="space-y-4">
              <div>
                <label className="label">Field Name (key)</label>
                <input
                  className="input"
                  value={fieldForm.name}
                  onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                  placeholder="e.g., dietary_preference"
                  required
                />
              </div>
              <div>
                <label className="label">Display Label</label>
                <input
                  className="input"
                  value={fieldForm.label}
                  onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                  placeholder="e.g., Dietary Preference"
                  required
                />
              </div>
              <div>
                <label className="label">Type</label>
                <select
                  className="input"
                  value={fieldForm.type}
                  onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value })}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="select">Dropdown</option>
                  <option value="boolean">Yes/No</option>
                  <option value="date">Date</option>
                  <option value="textarea">Long Text</option>
                </select>
              </div>
              {fieldForm.type === 'select' && (
                <div>
                  <label className="label">Options (comma separated)</label>
                  <input
                    className="input"
                    value={fieldForm.options}
                    onChange={(e) => setFieldForm({ ...fieldForm, options: e.target.value })}
                    placeholder="e.g., Vegetarian, Vegan, Gluten-Free"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="field-required"
                  className="rounded"
                  checked={fieldForm.required}
                  onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })}
                />
                <label htmlFor="field-required" className="text-sm text-surface-700">Required field</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowFieldModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={savingField}>
                  {savingField ? 'Saving...' : editingField ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
