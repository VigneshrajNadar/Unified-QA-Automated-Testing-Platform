import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Trash2, Plus, Box, FolderKanban } from 'lucide-react';
import api from '../api';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [moduleName, setModuleName] = useState('');
    const [moduleDesc, setModuleDesc] = useState('');

    useEffect(() => {
        fetchProject();
    }, [id]);

    const fetchProject = async () => {
        try {
            const res = await api.get(`/projects/${id}`);
            setProject(res.data);
        } catch (err) {
            navigate('/projects');
        }
    };

    const handleAddModule = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/projects/${id}/modules`, { name: moduleName, description: moduleDesc });
            setModuleName('');
            setModuleDesc('');
            fetchProject();
        } catch (err) {
            alert('Failed to add module');
        }
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            try {
                await api.delete(`/projects/${id}`);
                navigate('/projects');
            } catch (err) {
                alert('Failed to delete project');
            }
        }
    };

    if (!project) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start flex-col sm:flex-row gap-4 sm:gap-0">
                <div>
                    <Link to="/projects" className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest mb-3 w-fit px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                        <ArrowLeft className="w-3 h-3" /> Back to Projects
                    </Link>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <FolderKanban className="w-8 h-8 text-cyan-400" /> {project.name}
                    </h1>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button 
                        onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/docs/export/testcases/${id}?token=${localStorage.getItem('token')}`, '_blank')}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-white font-bold text-sm rounded-xl hover:bg-white/10 transition-colors"
                    >
                        <Download className="w-4 h-4 text-cyan-400" /> Export PDF
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-sm rounded-xl hover:bg-rose-500/20 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" /> Delete
                    </button>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[40px] rounded-full -mr-10 -mt-10 pointer-events-none" />
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Project Description</h3>
                <p className="text-slate-300 leading-relaxed relative z-10">{project.description || 'No description provided.'}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Box className="w-5 h-5 text-blue-400" /> Project Modules
                </h2>
                
                <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl mb-6">
                    <form onSubmit={handleAddModule} className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="New Module Name"
                            value={moduleName}
                            onChange={e => setModuleName(e.target.value)}
                            required
                            className="flex-1 px-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                        />
                        <input
                            type="text"
                            placeholder="Module Description"
                            value={moduleDesc}
                            onChange={e => setModuleDesc(e.target.value)}
                            className="flex-[2] px-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                        />
                        <button 
                            type="submit" 
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-[#0B0F19] font-bold text-sm rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> Add Module
                        </button>
                    </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.modules && project.modules.map((m, i) => (
                        <motion.div 
                            key={m.module_id} 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + (i * 0.05) }}
                            className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/5 rounded-xl p-5 hover:bg-white/5 transition-colors group"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors shrink-0">
                                    <Box className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">{m.name}</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{m.description || 'No description.'}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    
                    {(!project.modules || project.modules.length === 0) && (
                        <div className="col-span-full py-12 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/5">
                            <Box className="w-8 h-8 text-slate-500 mb-3" />
                            <p className="text-sm font-medium text-slate-400">No modules added to this project yet.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ProjectDetails;
