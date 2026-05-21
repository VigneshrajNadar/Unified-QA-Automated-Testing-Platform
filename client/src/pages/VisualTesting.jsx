import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Plus, X, Trash2, Play, BarChart2, FolderKanban, Globe, History, Image as ImageIcon } from 'lucide-react';
import api from '../api';

function VisualTesting() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProject, setNewProject] = useState({
        name: '',
        base_url: '',
        project_id: ''
    });
    const [linkedProjects, setLinkedProjects] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
        fetchLinkedProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/visual/projects');
            setProjects(response.data);
        } catch (error) {
            console.error('Error fetching visual projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLinkedProjects = async () => {
        try {
            const response = await api.get('/projects');
            setLinkedProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();

        if (!newProject.base_url || !isValidUrl(newProject.base_url)) {
            alert('Please enter a valid URL');
            return;
        }

        try {
            await api.post('/visual/create-project', {
                ...newProject,
                project_id: newProject.project_id || null
            });

            setShowCreateModal(false);
            setNewProject({ name: '', base_url: '', project_id: '' });
            fetchProjects();
        } catch (error) {
            alert('Error creating project: ' + error.message);
        }
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm('Are you sure you want to delete this visual test project?')) {
            return;
        }

        try {
            await api.delete(`/visual/project/${id}`);
            fetchProjects();
        } catch (error) {
            alert('Error deleting project: ' + error.message);
        }
    };

    const handleRunTest = (projectId) => {
        navigate(`/visual-run/${projectId}`);
    };

    const handleViewResults = (projectId) => {
        navigate(`/visual-run/${projectId}`);
    };

    const isValidUrl = (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Camera className="w-8 h-8 text-fuchsia-400" /> Visual Regression
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Detect UI changes by comparing screenshots pixel-by-pixel.</p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(192,38,211,0.3)] hover:shadow-[0_0_25px_rgba(192,38,211,0.5)]"
                >
                    <Plus className="w-4 h-4" /> New Visual Project
                </button>
            </motion.div>

            {projects.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-16 border border-dashed border-white/10 rounded-3xl bg-[#0B0F19]/50 text-center">
                    <div className="w-20 h-20 rounded-full bg-fuchsia-500/10 flex items-center justify-center mb-6 border border-fuchsia-500/20">
                        <ImageIcon className="w-10 h-10 text-fuchsia-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">No Visual Projects</h3>
                    <p className="text-slate-400 max-w-md mb-8">Create your first project to start capturing baselines and running pixel-perfect visual regression tests.</p>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm rounded-xl transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Create First Project
                    </button>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {projects.map((project, index) => (
                        <motion.div 
                            key={project.visual_project_id} 
                            initial={{ opacity: 0, scale: 0.95 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            transition={{ delay: index * 0.05 }}
                            className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden group hover:border-white/20 transition-all flex flex-col"
                        >
                            <div className="p-6 border-b border-white/5">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-white truncate pr-4">{project.name || 'Unnamed Project'}</h3>
                                    <span className={`shrink-0 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${project.total_runs ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-500/10 border-slate-500/20 text-slate-400'}`}>
                                        {project.total_runs || 0} Runs
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-cyan-400 truncate bg-cyan-500/5 px-3 py-2 rounded-lg border border-cyan-500/10">
                                    <Globe className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{project.base_url}</span>
                                </div>
                            </div>

                            <div className="p-6 bg-black/10 flex-1 space-y-4">
                                <div className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <FolderKanban className="w-4 h-4 text-slate-500" />
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Linked Project</span>
                                    </div>
                                    <span className="text-sm font-medium text-white truncate max-w-[150px]">{project.project_name || 'None'}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <History className="w-4 h-4 text-slate-500" />
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Run</span>
                                    </div>
                                    <span className="text-sm font-medium text-white">{project.last_run_date ? new Date(project.last_run_date).toLocaleDateString() : 'Never'}</span>
                                </div>
                            </div>

                            <div className="p-4 border-t border-white/5 flex gap-2 shrink-0 bg-white/5">
                                <button onClick={() => handleRunTest(project.visual_project_id)} className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors border border-white/10">
                                    <Play className="w-4 h-4" /> Run
                                </button>
                                {project.total_runs > 0 && (
                                    <button onClick={() => handleViewResults(project.visual_project_id)} className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/20 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors">
                                        <BarChart2 className="w-4 h-4" /> Results
                                    </button>
                                )}
                                <button onClick={() => handleDeleteProject(project.visual_project_id)} className="w-10 flex justify-center items-center bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-colors shrink-0">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* CREATE MODAL */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-[#0D1424] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Camera className="w-5 h-5 text-fuchsia-400" /> New Visual Project
                                </h3>
                                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            
                            <form onSubmit={handleCreateProject} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Project Name (Optional)</label>
                                    <input type="text" placeholder="e.g., Dashboard UI" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-fuchsia-500/50 transition-colors" />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Base URL *</label>
                                    <input required type="url" placeholder="https://example.com" value={newProject.base_url} onChange={e => setNewProject({ ...newProject, base_url: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-fuchsia-500/50 transition-colors" />
                                    <p className="text-[10px] text-slate-500 mt-2">The main website URL to run visual tests against.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Link to Test Project (Optional)</label>
                                    <select value={newProject.project_id} onChange={e => setNewProject({ ...newProject, project_id: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-fuchsia-500/50 transition-colors appearance-none">
                                        <option value="" className="bg-[#0D1424]">-- No Link --</option>
                                        {linkedProjects.map(p => <option key={p.project_id} value={p.project_id} className="bg-[#0D1424]">{p.name}</option>)}
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-white/10">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold hover:bg-white/10 transition-colors">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 px-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-fuchsia-500 hover:to-purple-500 transition-colors shadow-[0_0_15px_rgba(192,38,211,0.3)]">Create Project</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default VisualTesting;
