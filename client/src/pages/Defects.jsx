import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, Plus, X, Edit2, Trash2, User, Activity, AlertTriangle, AlertCircle, FileImage, ShieldAlert, Zap, Terminal } from 'lucide-react';
import api from '../api';

const Defects = () => {
    const [defects, setDefects] = useState([]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingDefect, setEditingDefect] = useState(null);
    const [attachments, setAttachments] = useState({});

    const [formData, setFormData] = useState({
        project_id: '',
        title: '',
        description: '',
        severity: 'Medium',
        priority: 'Medium',
        status: 'Open',
        detection_source: 'Manual Testing',
        steps: '',
        expected_result: '',
        actual_result: '',
        assignee_id: ''
    });

    useEffect(() => {
        fetchDefects();
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

    const fetchDefects = async () => {
        try {
            const res = await api.get('/defects');
            setDefects(res.data);

            const attachmentsMap = {};
            for (const defect of res.data) {
                try {
                    const attachRes = await api.get(`/attachments/defect/${defect.defect_id}`);
                    if (attachRes.data && attachRes.data.length > 0) {
                        attachmentsMap[defect.defect_id] = attachRes.data;
                    }
                } catch (err) {
                    console.error(`Failed to fetch attachments for defect ${defect.defect_id}`, err);
                }
            }
            setAttachments(attachmentsMap);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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
            if (editingDefect) {
                await api.put(`/defects/${editingDefect.defect_id}`, formData);
            } else {
                await api.post('/defects', formData);
            }
            setShowCreateForm(false);
            setEditingDefect(null);
            resetForm();
            fetchDefects();
        } catch (err) {
            alert('Failed to save defect: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (defectId) => {
        if (!confirm('Are you sure you want to delete this defect?')) return;
        try {
            await api.delete(`/defects/${defectId}`);
            fetchDefects();
        } catch (err) {
            alert('Failed to delete defect');
        }
    };

    const handleEdit = (defect) => {
        setEditingDefect(defect);
        setFormData({
            project_id: defect.project_id || '',
            title: defect.title || '',
            description: defect.description || '',
            severity: defect.severity || 'Medium',
            priority: defect.priority || 'Medium',
            status: defect.status || 'Open',
            detection_source: defect.detection_source || 'Manual Testing',
            steps: defect.steps || '',
            expected_result: defect.expected_result || '',
            actual_result: defect.actual_result || '',
            assignee_id: defect.assignee_id || ''
        });
        setShowCreateForm(true);
    };

    const handleStatusChange = async (defectId, newStatus) => {
        try {
            await api.put(`/defects/${defectId}`, { status: newStatus });
            fetchDefects();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const resetForm = () => {
        setFormData({
            project_id: '', title: '', description: '', severity: 'Medium',
            priority: 'Medium', status: 'Open', detection_source: 'Manual Testing',
            steps: '', expected_result: '', actual_result: '', assignee_id: ''
        });
    };

    const getSeverityBadge = (severity) => {
        switch (severity) {
            case 'Critical': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            case 'High': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
            case 'Medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'Low': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Open': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            case 'In Progress': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'Retest': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
            case 'Closed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    const getSourceIcon = (source) => {
        if (source.includes('Security')) return <ShieldAlert className="w-3.5 h-3.5" />;
        if (source.includes('Performance')) return <Zap className="w-3.5 h-3.5" />;
        if (source.includes('Static') || source.includes('Complexity')) return <Terminal className="w-3.5 h-3.5" />;
        if (source.includes('Automated')) return <Activity className="w-3.5 h-3.5" />;
        return <AlertCircle className="w-3.5 h-3.5" />;
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Bug className="w-8 h-8 text-rose-400" /> Defect Tracker
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Manage, assign, and track issues through resolution.</p>
                </div>
                <button 
                    onClick={() => { setShowCreateForm(true); setEditingDefect(null); resetForm(); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:shadow-[0_0_25px_rgba(244,63,94,0.5)]"
                >
                    <Plus className="w-4 h-4" /> Log Defect
                </button>
            </motion.div>

            {/* CREATE/EDIT MODAL */}
            <AnimatePresence>
                {showCreateForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowCreateForm(false); setEditingDefect(null); resetForm(); }} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl bg-[#0D1424] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    {editingDefect ? <Edit2 className="w-5 h-5 text-rose-400" /> : <Bug className="w-5 h-5 text-rose-400" />}
                                    {editingDefect ? 'Edit Defect' : 'Log New Defect'}
                                </h3>
                                <button onClick={() => { setShowCreateForm(false); setEditingDefect(null); resetForm(); }} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            
                            <form id="defect-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    <div className="lg:col-span-2">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Title *</label>
                                        <input required type="text" placeholder="Defect Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Project *</label>
                                        <select required value={formData.project_id} onChange={(e) => setFormData({ ...formData, project_id: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors appearance-none">
                                            <option value="" className="bg-[#0D1424]">Select Project</option>
                                            {projects.map(p => <option key={p.project_id} value={p.project_id} className="bg-[#0D1424]">{p.name}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Severity</label>
                                        <select value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors appearance-none">
                                            <option className="bg-[#0D1424]">Critical</option>
                                            <option className="bg-[#0D1424]">High</option>
                                            <option className="bg-[#0D1424]">Medium</option>
                                            <option className="bg-[#0D1424]">Low</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Priority</label>
                                        <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors appearance-none">
                                            <option className="bg-[#0D1424]">High</option>
                                            <option className="bg-[#0D1424]">Medium</option>
                                            <option className="bg-[#0D1424]">Low</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                                        <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors appearance-none">
                                            <option className="bg-[#0D1424]">Open</option>
                                            <option className="bg-[#0D1424]">In Progress</option>
                                            <option className="bg-[#0D1424]">Retest</option>
                                            <option className="bg-[#0D1424]">Closed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Detection Source</label>
                                        <select value={formData.detection_source} onChange={(e) => setFormData({ ...formData, detection_source: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors appearance-none">
                                            <option className="bg-[#0D1424]">Manual Testing</option>
                                            <option className="bg-[#0D1424]">Automated Testing</option>
                                            <option className="bg-[#0D1424]">Static Analysis</option>
                                            <option className="bg-[#0D1424]">Security Scan</option>
                                            <option className="bg-[#0D1424]">Complexity Analysis</option>
                                            <option className="bg-[#0D1424]">Coverage Analysis</option>
                                            <option className="bg-[#0D1424]">Performance Testing</option>
                                            <option className="bg-[#0D1424]">User Reported</option>
                                        </select>
                                    </div>
                                    <div className="lg:col-span-2">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Assign To</label>
                                        <select value={formData.assignee_id} onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors appearance-none">
                                            <option value="" className="bg-[#0D1424]">Unassigned</option>
                                            {users.map(u => <option key={u.user_id} value={u.user_id} className="bg-[#0D1424]">{u.name} ({u.role})</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description *</label>
                                    <textarea required rows={3} placeholder="Detailed defect description..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors resize-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Steps to Reproduce</label>
                                    <textarea rows={3} placeholder="1. Go to...&#10;2. Click on..." value={formData.steps} onChange={(e) => setFormData({ ...formData, steps: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors resize-none font-mono" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Expected Result</label>
                                        <textarea rows={2} placeholder="What should have happened..." value={formData.expected_result} onChange={(e) => setFormData({ ...formData, expected_result: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors resize-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Actual Result</label>
                                        <textarea rows={2} placeholder="What actually happened..." value={formData.actual_result} onChange={(e) => setFormData({ ...formData, actual_result: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors resize-none" />
                                    </div>
                                </div>
                            </form>
                            
                            <div className="p-4 border-t border-white/10 bg-white/5 flex gap-3 shrink-0">
                                <button type="button" onClick={() => { setShowCreateForm(false); setEditingDefect(null); resetForm(); }} className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold hover:bg-white/10 transition-colors">Cancel</button>
                                <button type="submit" form="defect-form" className="flex-1 py-3 px-4 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:from-rose-400 hover:to-orange-400 transition-colors shadow-[0_0_15px_rgba(244,63,94,0.3)]">{editingDefect ? 'Update Defect' : 'Log Defect'}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* DEFECT LIST */}
            {defects.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-3xl bg-[#0B0F19]/50">
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
                        <Bug className="w-8 h-8 text-rose-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Defects Found</h3>
                    <p className="text-slate-400 text-sm text-center max-w-md">Log defects manually or run automated tests to auto-detect issues.</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {defects.map((d, index) => (
                        <motion.div key={d.defect_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                            
                            {/* Accent line depending on severity */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${d.severity === 'Critical' ? 'bg-rose-500' : d.severity === 'High' ? 'bg-orange-500' : d.severity === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />

                            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pl-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <span className="text-xs font-black text-rose-400 uppercase tracking-widest">{d.project_name || 'Global'}</span>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DEF-{d.defect_id}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{d.title}</h3>
                                    
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${getSeverityBadge(d.severity)}`}>
                                            {d.severity}
                                        </span>
                                        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${getStatusBadge(d.status)}`}>
                                            {d.status}
                                        </span>
                                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border text-cyan-400 bg-cyan-500/10 border-cyan-500/20 flex items-center gap-1">
                                            {getSourceIcon(d.detection_source || '')} {d.detection_source || 'Manual'}
                                        </span>
                                        {d.assignee_name && (
                                            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border text-blue-400 bg-blue-500/10 border-blue-500/20 flex items-center gap-1">
                                                <User className="w-3 h-3" /> {d.assignee_name}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm text-slate-300 leading-relaxed mb-4">{d.description}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {d.steps && (
                                            <div className="bg-[#0D1424] border border-white/5 rounded-xl p-4 md:col-span-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Steps to Reproduce</p>
                                                <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap">{d.steps}</pre>
                                            </div>
                                        )}
                                        {d.expected_result && (
                                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Expected Result</p>
                                                <p className="text-sm text-slate-300">{d.expected_result}</p>
                                            </div>
                                        )}
                                        {d.actual_result && (
                                            <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4">
                                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Actual Result</p>
                                                <p className="text-sm text-slate-300">{d.actual_result}</p>
                                            </div>
                                        )}
                                    </div>

                                    {attachments[d.defect_id] && attachments[d.defect_id].length > 0 && (
                                        <div className="mt-6 pt-6 border-t border-white/5">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <FileImage className="w-3.5 h-3.5" /> Attachments ({attachments[d.defect_id].length})
                                            </p>
                                            <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
                                                {attachments[d.defect_id].map((att) => (
                                                    <a key={att.attachment_id} href={`http://localhost:5000/uploads/${att.file_path}`} target="_blank" rel="noopener noreferrer" className="shrink-0 block rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-colors shadow-lg">
                                                        <img src={`http://localhost:5000/uploads/${att.file_path}`} alt="Defect screenshot" className="w-32 h-32 object-cover hover:scale-105 transition-transform duration-300" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col md:items-end gap-4 min-w-[200px]">
                                    <div className="flex items-center gap-2 w-full">
                                        <button onClick={() => handleEdit(d)} className="flex-1 px-3 py-2 text-xs font-bold text-slate-400 hover:text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5">
                                            <Edit2 className="w-3.5 h-3.5" /> Edit
                                        </button>
                                        <button onClick={() => handleDelete(d.defect_id)} className="flex-1 px-3 py-2 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-1.5">
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </button>
                                    </div>
                                    
                                    <div className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mt-auto">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Update Status</label>
                                        <select value={d.status} onChange={(e) => handleStatusChange(d.defect_id, e.target.value)} className="w-full px-3 py-2 bg-[#0D1424] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-rose-500/50 transition-colors appearance-none">
                                            <option value="Open" className="bg-[#0D1424]">Open</option>
                                            <option value="In Progress" className="bg-[#0D1424]">In Progress</option>
                                            <option value="Retest" className="bg-[#0D1424]">Retest</option>
                                            <option value="Closed" className="bg-[#0D1424]">Closed</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Defects;
