import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users as UsersIcon, ShieldAlert, UserX, UserCheck, Shield, Mail, Calendar, Search, Trash2 } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Users = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
        try {
            await api.delete(`/users/${userId}`);
            fetchUsers();
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    if (user?.role?.toLowerCase() !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh]">
                <div className="bg-rose-500/10 border border-rose-500/30 p-12 rounded-3xl flex flex-col items-center text-center shadow-[0_0_50px_rgba(225,29,72,0.15)] relative overflow-hidden max-w-md w-full">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 blur-[40px] rounded-full -mr-16 -mt-16 pointer-events-none" />
                    <ShieldAlert className="w-20 h-20 text-rose-500 mb-6" />
                    <h2 className="text-2xl font-black text-white mb-2">Access Denied</h2>
                    <p className="text-slate-400">You must have <span className="text-rose-400 font-bold uppercase tracking-widest text-xs border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 rounded">Admin</span> privileges to view this page.</p>
                </div>
            </div>
        );
    }

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleStyles = (role) => {
        const r = role?.toLowerCase() || '';
        if (r === 'admin') return 'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(225,29,72,0.2)]';
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]';
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[50px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                <div className="z-10 w-full md:w-auto">
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <UsersIcon className="w-8 h-8 text-indigo-400" /> User Management
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Manage system administrators and user roles</p>
                </div>

                <div className="z-10 w-full md:w-auto relative">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors shadow-inner"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                </div>
            </motion.div>

            {/* Users List */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Joined Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <AnimatePresence>
                                    {filteredUsers.length === 0 ? (
                                        <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">No users found matching your search.</td></tr>
                                    ) : (
                                        filteredUsers.map(u => (
                                            <motion.tr 
                                                key={u.user_id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="hover:bg-white/5 transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex flex-col items-center justify-center text-indigo-400 font-bold shrink-0">
                                                            {u.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white text-base">{u.name}</div>
                                                            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                                <Mail className="w-3 h-3" /> {u.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getRoleStyles(u.role)}`}>
                                                        {u.role?.toLowerCase() === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {new Date(u.created_at).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {u.user_id !== user.userId ? (
                                                        <button 
                                                            onClick={() => handleDelete(u.user_id)} 
                                                            className="flex items-center justify-end gap-2 ml-auto px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-lg transition-colors border border-rose-500/20 opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="w-4 h-4" /> Revoke
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">Current User</span>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default Users;
