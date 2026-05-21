import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Shield, Key, Save, CheckCircle2, AlertTriangle, Camera } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/users/profile');
            setName(res.data.name);
            setEmail(res.data.email);
            setRole(res.data.role);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/users/profile', { name, password });
            setMessage('Profile updated successfully');
            setPassword('');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Error: Failed to update profile');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {/* Header & Avatar Card */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[50px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/30 flex items-center justify-center text-4xl font-black text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.15)] shrink-0 transition-transform group-hover:scale-105">
                        {name ? name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <button className="absolute bottom-0 right-0 p-2.5 bg-[#0D1424] hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full transition-colors group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                        <Camera className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 text-center md:text-left z-10 pt-2">
                    <h1 className="text-3xl font-black text-white mb-2">{name}</h1>
                    <div className="flex flex-col md:flex-row items-center gap-3 text-sm text-slate-400">
                        <div className="flex items-center gap-1.5"><Mail className="w-4 h-4"/> {email}</div>
                        <span className="hidden md:block text-white/20">•</span>
                        <div className="flex items-center gap-1.5"><User className="w-4 h-4"/> ID: #{user?.userId || 'N/A'}</div>
                    </div>
                    
                    <div className="mt-6 inline-block">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border ${role?.toLowerCase() === 'admin' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(225,29,72,0.2)]' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]'}`}>
                            <Shield className="w-4 h-4" /> {role} Privilege
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Edit Form */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                    <User className="w-5 h-5 text-cyan-400" /> Account Details
                </h3>

                <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address (Read-Only)</label>
                            <div className="relative">
                                <input type="email" value={email} disabled className="w-full pl-10 pr-4 py-3 bg-[#0D1424]/50 border border-white/5 rounded-xl text-slate-500 font-mono text-sm cursor-not-allowed select-none" />
                                <Mail className="w-4 h-4 text-slate-600 absolute left-3.5 top-3.5 pointer-events-none" />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                            <div className="relative">
                                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" className="w-full pl-10 pr-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors shadow-inner" />
                                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                                <span>New Password</span>
                                <span className="text-slate-500 normal-case tracking-normal font-normal">Leave blank to keep current</span>
                            </label>
                            <div className="relative">
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50 transition-colors shadow-inner" />
                                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-white/10">
                        <AnimatePresence mode="wait">
                            {message ? (
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${message.includes('Error') ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                    {message.includes('Error') ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                    {message}
                                </motion.div>
                            ) : (
                                <div />
                            )}
                        </AnimatePresence>

                        <button type="submit" disabled={saving} className="flex justify-center items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] disabled:opacity-50 w-full sm:w-auto">
                            {saving ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><Save className="w-5 h-5" /> Update Profile</>}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Profile;
