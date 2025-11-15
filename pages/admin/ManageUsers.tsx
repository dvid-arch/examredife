import React, { useState, useEffect } from 'react';
import Card from '../../components/Card.tsx';
import apiService from '../../services/apiService.ts';
import { UserProfile } from '../../contexts/AuthContext.tsx';


// --- Modal Component for Add/Edit User ---
interface UserModalProps {
    user: UserProfile | null;
    onSave: (user: UserProfile) => void;
    onClose: () => void;
}
const UserModal: React.FC<UserModalProps> = ({ user, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<UserProfile>>({
        name: '', email: '', subscription: 'free', role: 'user', ...user
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as UserProfile);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{user ? 'Edit User' : 'Add New User'}</h2>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-slate-600 rounded-md bg-slate-100 dark:bg-slate-700" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-slate-600 rounded-md bg-slate-100 dark:bg-slate-700" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Subscription</label>
                        <select name="subscription" value={formData.subscription} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-slate-600 rounded-md bg-slate-100 dark:bg-slate-700">
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
                        <select name="role" value={formData.role} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-slate-600 rounded-md bg-slate-100 dark:bg-slate-700">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-4 pt-2">
                        <button type="button" onClick={onClose} className="font-semibold px-4 py-2 text-slate-700 dark:text-slate-300">Cancel</button>
                        <button type="submit" className="bg-primary text-white font-bold py-2 px-5 rounded-lg">Save</button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


const ManageUsers: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await apiService<UserProfile[]>('/admin/users');
            setUsers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch users');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);
    
    const handleSubscriptionChange = async (userId: string, newSubscription: 'free' | 'pro') => {
        try {
            const updatedUser = await apiService<UserProfile>(`/admin/users/${userId}/subscription`, {
                method: 'PUT',
                body: { subscription: newSubscription }
            });
            setUsers(users.map(user => user.id === userId ? updatedUser : user));
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update subscription');
        }
    };

    const openModal = (user: UserProfile | null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingUser(null);
        setIsModalOpen(false);
    };

    const handleSaveUser = async (userToSave: UserProfile) => {
        try {
            let savedUser: UserProfile;
                if (userToSave.id) {
                // Edit existing user
                savedUser = await apiService<UserProfile>(`/admin/users/${userToSave.id}`, {
                    method: 'PUT',
                    body: userToSave
                });
                setUsers(users.map(u => u.id === userToSave.id ? savedUser : u));
            } else {
                // Add new user (require password)
                const password = prompt('Set a password for the new user:');
                if (!password) throw new Error('Password is required');
                savedUser = await apiService<UserProfile>('/admin/users', {
                    method: 'POST',
                    body: { ...userToSave, password }
                });
                setUsers([savedUser, ...users]);
            }
            closeModal();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to save user');
        }
    };
    
    const handleDeleteUser = async (userId: string) => {
        if(window.confirm("Are you sure you want to delete this user?")) {
            try {
                await apiService(`/admin/users/${userId}`, { method: 'DELETE' });
                setUsers(users.filter(u => u.id !== userId));
            } catch (err) {
                alert(err instanceof Error ? err.message : 'Failed to delete user');
            }
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Manage Users</h1>
                 <button onClick={() => openModal(null)} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-accent w-full md:w-auto">
                    Add User
                </button>
            </div>
            <Card>
                 <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-lg">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                                <th className="px-2 py-4 sm:px-4 font-semibold text-slate-600 dark:text-slate-300">Name</th>
                                <th className="px-2 py-4 sm:px-4 font-semibold text-slate-600 dark:text-slate-300">Email</th>
                                <th className="px-2 py-4 sm:px-4 font-semibold text-slate-600 dark:text-slate-300">Role</th>
                                <th className="px-2 py-4 sm:px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Pro<span className="hidden sm:inline"> Access</span></th>
                                <th className="px-2 py-4 sm:px-4 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={5} className="text-center p-8 text-slate-500 dark:text-slate-400">Loading users...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={5} className="p-8 text-center text-red-500">{error}</td></tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="border-b dark:border-slate-700 last:border-b-0">
                                        <td className="px-2 py-4 sm:px-4 font-medium text-slate-800 dark:text-slate-100 break-words">{user.name}</td>
                                        <td className="px-2 py-4 sm:px-4 text-slate-600 dark:text-slate-300 break-all">{user.email}</td>
                                        <td className="px-2 py-4 sm:px-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-2 py-4 sm:px-4 text-center">
                                            {user.role !== 'admin' ? (
                                                <label htmlFor={`pro-toggle-${user.id}`} className="relative inline-flex items-center cursor-pointer">
                                                  <input 
                                                    type="checkbox" 
                                                    id={`pro-toggle-${user.id}`}
                                                    className="sr-only peer" 
                                                    checked={user.subscription === 'pro'}
                                                    onChange={(e) => handleSubscriptionChange(user.id, e.target.checked ? 'pro' : 'free')}
                                                  />
                                                  <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-slate-600 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                                </label>
                                            ) : (
                                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">-</span>
                                            )}
                                        </td>
                                         <td className="px-2 py-4 sm:px-4 flex flex-col items-start gap-1 sm:flex-row sm:gap-2">
                                            <button onClick={() => openModal(user)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
                                            {user.role !== 'admin' && (
                                                <button onClick={() => handleDeleteUser(user.id)} className="font-semibold text-red-600 dark:text-red-400 hover:underline">Delete</button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
            {isModalOpen && <UserModal user={editingUser} onSave={handleSaveUser} onClose={closeModal} />}
        </div>
    );
};

export default ManageUsers;