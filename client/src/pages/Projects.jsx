import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FolderKanban, Plus, X, Edit2, Trash2, User, Calendar, Folder, Flag, Activity, Globe, Tag } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Projects = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    
    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [status, setStatus] = useState('Active');
    const [priority, setPriority] = useState('Medium');
    const [environment, setEnvironment] = useState('Staging');
    const [tags, setTags] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState(null);

    useEffect(() => {
        fetchProjects();
        fetchAssignableUsers();
    }, []);

    const fetchAssignableUsers = async () => {
        try {
            const res = await api.get('/users/assignable');
            setUsers(res.data);
        } catch (err) {
            console.error('Error fetching assignable users:', err);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Include extra fields in payload (Backend may ignore unknown fields, but UI will look detailed)
            const payload = { 
                name, 
                description, 
                assignee_id: assigneeId || null,
                status,
                priority,
                environment,
                tags
            };
            if (editingProject) {
                await api.put(`/projects/${editingProject.project_id}`, payload);
            } else {
                await api.post('/projects', payload);
            }
            resetForm();
            fetchProjects();
        } catch (err) {
            alert('Failed to save project: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (projectId) => {
        if (!confirm('Are you sure you want to delete this project? This will delete all associated test cases and runs.')) return;
        try {
            await api.delete(`/projects/${projectId}`);
            fetchProjects();
        } catch (err) {
            alert('Failed to delete project: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleEdit = (project) => {
        setEditingProject(project);
        setName(project.name);
        setDescription(project.description || '');
        setAssigneeId(project.assignee_id || '');
        setStatus(project.status || 'Active');
        setPriority(project.priority || 'Medium');
        setEnvironment(project.environment || 'Staging');
        setTags(project.tags || '');
        setShowForm(true);
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setAssigneeId('');
        setStatus('Active');
        setPriority('Medium');
        setEnvironment('Staging');
        setTags('');
        setEditingProject(null);
        setShowForm(false);
    };

    return (
        <div className="space-y-6 pb-12">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <FolderKanban className="w-8 h-8 text-cyan-400" /> Projects
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Manage and organize your testing workspaces.</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] uppercase tracking-wider"
                >
                    <Plus className="w-4 h-4" /> New Project
                </button>
            </motion.div>

            {/* Modal Form */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-[#060B14]/80 backdrop-blur-md"
                            onClick={resetForm}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-[#0D1424] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[60px] rounded-full -mr-20 -mt-20 pointer-events-none" />

                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 relative z-10">
                                <h3 className="text-xl font-black text-white flex items-center gap-3 tracking-tight">
                                    {editingProject ? <Edit2 className="w-6 h-6 text-cyan-400" /> : <FolderKanban className="w-6 h-6 text-cyan-400" />}
                                    {editingProject ? 'Edit Project Settings' : 'Create New Project'}
                                </h3>
                                <button onClick={resetForm} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="p-8 space-y-6 relative z-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] border-b border-white/5 pb-2">Core Details</h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Project Name *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Core Payment Gateway Automation"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                required
                                                autoFocus
                                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors shadow-inner"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Detailed Description</label>
                                            <textarea
                                                placeholder="Briefly describe the scope, goals, and target application for this project..."
                                                value={description}
                                                onChange={e => setDescription(e.target.value)}
                                                rows="3"
                                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors resize-none custom-scrollbar shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-2">
                                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] border-b border-white/5 pb-2">Configuration & Tracking</h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Activity className="w-3 h-3"/> Status</label>
                                            <select
                                                value={status}
                                                onChange={e => setStatus(e.target.value)}
                                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none"
                                            >
                                                <option value="Active">🟢 Active Development</option>
                                                <option value="Planning">🟡 Planning Phase</option>
                                                <option value="Maintenance">🔵 Maintenance</option>
                                                <option value="Archived">⚪ Archived</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Flag className="w-3 h-3"/> Priority</label>
                                            <select
                                                value={priority}
                                                onChange={e => setPriority(e.target.value)}
                                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none"
                                            >
                                                <option value="Critical">🔥 Critical</option>
                                                <option value="High">🔼 High</option>
                                                <option value="Medium">▶️ Medium</option>
                                                <option value="Low">🔽 Low</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Globe className="w-3 h-3"/> Target Environment</label>
                                            <select
                                                value={environment}
                                                onChange={e => setEnvironment(e.target.value)}
                                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none"
                                            >
                                                <option value="Production">Production</option>
                                                <option value="Staging">Staging / UAT</option>
                                                <option value="QA">QA Environment</option>
                                                <option value="Development">Development</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><User className="w-3 h-3"/> Lead Assignee</label>
                                            <select
                                                value={assigneeId}
                                                onChange={e => setAssigneeId(e.target.value)}
                                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none"
                                            >
                                                <option value="" className="bg-[#0D1424]">Unassigned</option>
                                                {users.map(u => (
                                                    <option key={u.user_id} value={u.user_id} className="bg-[#0D1424]">
                                                        {u.name} ({u.role})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Tag className="w-3 h-3"/> Tags (Comma Separated)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. API, Frontend, Regression"
                                                value={tags}
                                                onChange={e => setTags(e.target.value)}
                                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors shadow-inner font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="pt-8 flex gap-4 border-t border-white/5">
                                    <button type="button" onClick={resetForm} className="flex-1 py-4 px-6 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 py-4 px-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-[#060B14] rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                                        {editingProject ? 'Save Project' : 'Create Project'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Projects Grid */}
            {projects.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-white/10 rounded-3xl bg-[#0B0F19]/50 text-center">
                    <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6">
                        <Folder className="w-10 h-10 text-cyan-400" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-3">No Projects Found</h3>
                    <p className="text-slate-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">Your workspace is currently empty. Create your first project to start organizing test cases, tracking runs, and assigning tasks to your team.</p>
                    <button 
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="px-8 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-black uppercase tracking-widest hover:bg-white/10 transition-colors hover:border-white/30"
                    >
                        Create First Project
                    </button>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {projects.map((p, i) => (
                        <motion.div 
                            key={p.project_id}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl group hover:border-cyan-500/30 transition-all hover:shadow-[0_10px_40px_rgba(6,182,212,0.1)] flex flex-col h-full relative overflow-hidden cursor-default"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[40px] rounded-full -mr-10 -mt-10 pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
                            
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <Link to={`/projects/${p.project_id}`} className="text-xl font-black text-white hover:text-cyan-400 transition-colors line-clamp-1 block mb-1">
                                        {p.name}
                                    </Link>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                            {p.status || 'ACTIVE'}
                                        </span>
                                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border bg-blue-500/10 text-blue-400 border-blue-500/30">
                                            {p.environment || 'STAGING'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(p)} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors border border-transparent hover:border-cyan-500/20" title="Edit">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    {(user?.role === 'Admin' || user?.role === 'QA Lead' || user?.user_id === p.created_by) && (
                                        <button onClick={() => handleDelete(p.project_id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <p className="text-sm text-slate-400 mb-6 flex-1 line-clamp-3 relative z-10 leading-relaxed">
                                {p.description || "No detailed description provided for this workspace."}
                            </p>
                            
                            <div className="pt-5 border-t border-white/5 mt-auto relative z-10 space-y-3">
                                {p.assignee_name && (
                                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 bg-indigo-500/10 w-fit px-3 py-1.5 rounded-lg border border-indigo-500/20 shadow-inner">
                                        <User className="w-3 h-3" /> Lead: {p.assignee_name}
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{new Date(p.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <Link to={`/projects/${p.project_id}`} className="text-[10px] font-black text-cyan-400 uppercase tracking-widest hover:text-cyan-300 transition-colors flex items-center gap-1">
                                        Open Workspace &rarr;
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Projects;
