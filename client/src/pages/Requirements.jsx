import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, List, GitBranch, MessageSquare, Plus, Folder, FileText, ChevronRight, ChevronDown, CheckCircle, AlertTriangle, Shield, X, Save, FolderKanban } from 'lucide-react';
import api from '../api';

const Requirements = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [requirements, setRequirements] = useState([]);
    const [testCases, setTestCases] = useState([]);
    const [selectedReq, setSelectedReq] = useState(null);
    const [activeTab, setActiveTab] = useState('details');
    const [history, setHistory] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => { fetchProjects(); }, []);
    useEffect(() => {
        if (selectedProject) {
            fetchRequirements();
            fetchTestCases();
            setSelectedReq(null);
            setIsCreating(false);
            setIsEditing(false);
        }
    }, [selectedProject]);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchRequirements = async () => {
        try {
            const res = await api.get(`/requirements?project_id=${selectedProject}`);
            setRequirements(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchTestCases = async () => {
        try {
            const res = await api.get(`/testcases?project_id=${selectedProject}`);
            setTestCases(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchDetails = async (reqId) => {
        try {
            const histRes = await api.get(`/requirements/${reqId}/versions`);
            setHistory(histRes.data);
            const commRes = await api.get(`/requirements/${reqId}/comments`);
            setComments(commRes.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, project_id: selectedProject };

            if (isCreating) {
                if (!payload.category) payload.category = 'Story';
                if (!payload.urgency) payload.urgency = 'Medium';
                await api.post('/requirements', payload);
            } else {
                await api.put(`/requirements/${selectedReq.requirement_id}`, {
                    ...payload,
                    user_id: 1,
                    change_reason: 'User Edit via Studio'
                });
            }

            setIsEditing(false);
            setIsCreating(false);
            fetchRequirements();

            if (!isCreating && selectedReq) {
                fetchDetails(selectedReq.requirement_id);
                const updatedReqs = await api.get(`/requirements?project_id=${selectedProject}`);
                const updated = updatedReqs.data.find(r => r.requirement_id === selectedReq.requirement_id);
                if (updated) setSelectedReq(updated);
            }
        } catch (err) {
            alert('Failed to save: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleComment = async () => {
        if (!newComment.trim()) return;
        try {
            await api.post(`/requirements/${selectedReq.requirement_id}/comments`, { user_id: 1, comment_text: newComment });
            setNewComment('');
            fetchDetails(selectedReq.requirement_id);
        } catch (e) {
            alert('Failed to post comment');
        }
    };

    const handleLinkTC = async (tcId) => {
        if (!tcId) return;
        try {
            await api.post('/requirements/link', { requirement_id: selectedReq.requirement_id, test_case_id: tcId });
            fetchRequirements();
            const tc = testCases.find(t => t.test_case_id == tcId);
            setSelectedReq(prev => ({
                ...prev,
                test_cases: [...(prev.test_cases || []), { test_case_id: tcId, title: tc.title, last_run_status: 'Not Run' }]
            }));
        } catch (e) {
            alert('Failed to link');
        }
    };

    const buildTree = (reqs) => {
        const map = {};
        const roots = [];
        reqs.forEach(r => { map[r.requirement_id] = { ...r, children: [] }; });
        reqs.forEach(r => {
            if (r.parent_id && map[r.parent_id]) {
                map[r.parent_id].children.push(map[r.requirement_id]);
            } else {
                roots.push(map[r.requirement_id]);
            }
        });
        return roots;
    };

    const TreeItem = ({ node, level = 0 }) => {
        const [expanded, setExpanded] = useState(true);
        const icon = node.category === 'Epic' ? <Target className="w-4 h-4 text-purple-400" /> : node.category === 'Feature' ? <Folder className="w-4 h-4 text-blue-400" /> : <FileText className="w-4 h-4 text-emerald-400" />;

        return (
            <div className="select-none">
                <div
                    className={`flex items-center gap-2 py-2 px-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group ${selectedReq?.requirement_id === node.requirement_id ? 'bg-cyan-500/10 border border-cyan-500/20' : 'border border-transparent'}`}
                    style={{ paddingLeft: `${level * 16 + 8}px` }}
                    onClick={() => {
                        setSelectedReq(node);
                        fetchDetails(node.requirement_id);
                        setIsEditing(false);
                        setIsCreating(false);
                        setActiveTab('details');
                    }}
                >
                    <div onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                        {node.children.length > 0 ? (expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />) : null}
                    </div>
                    {icon}
                    <span className={`text-sm truncate font-medium ${selectedReq?.requirement_id === node.requirement_id ? 'text-cyan-400' : 'text-slate-300 group-hover:text-white'}`}>
                        {node.req_identifier}
                    </span>
                </div>
                {expanded && node.children.map(child => <TreeItem key={child.requirement_id} node={child} level={level + 1} />)}
            </div>
        );
    };

    return (
        <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Target className="w-8 h-8 text-cyan-400" /> Requirement Studio
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Manage specifications, epics, features, and user stories.</p>
                </div>
                <div className="flex items-center gap-3 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2 shadow-lg">
                    <FolderKanban className="w-5 h-5 text-blue-400" />
                    <select
                        value={selectedProject}
                        onChange={e => setSelectedProject(e.target.value)}
                        className="w-64 bg-transparent border-none text-white text-sm font-bold focus:outline-none appearance-none"
                    >
                        <option value="" className="bg-[#0D1424]">-- Select a Project --</option>
                        {projects.map(p => <option key={p.project_id} value={p.project_id} className="bg-[#0D1424]">{p.name}</option>)}
                    </select>
                </div>
            </motion.div>

            {selectedProject ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1 flex overflow-hidden bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl">
                    
                    {/* SIDEBAR EXPLORER */}
                    <div className="w-80 border-r border-white/10 flex flex-col shrink-0 bg-white/5">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20 shrink-0">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Explorer</span>
                            <button onClick={() => { setIsCreating(true); setSelectedReq(null); setFormData({ type: 'Functional', category: 'Story', priority: 'Medium', urgency: 'Medium' }); }} className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-lg transition-colors">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                            {buildTree(requirements).map(r => <TreeItem key={r.requirement_id} node={r} />)}
                            {requirements.length === 0 && (
                                <div className="py-8 text-center">
                                    <p className="text-sm text-slate-500">No items found.</p>
                                    <p className="text-xs text-slate-600 mt-1">Click + to create the first one.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* MAIN CONTENT AREA */}
                    <div className="flex-1 flex flex-col bg-[#0D1424] overflow-hidden">
                        {(selectedReq || isCreating) ? (
                            <>
                                {/* HEADER */}
                                <div className="p-6 border-b border-white/10 bg-white/5 shrink-0 flex justify-between items-start gap-4">
                                    <div>
                                        {isCreating ? (
                                            <h2 className="text-2xl font-black text-emerald-400 flex items-center gap-2">
                                                <Plus className="w-6 h-6" /> New Requirement
                                            </h2>
                                        ) : (
                                            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                                <span className="text-cyan-400 font-mono text-xl bg-cyan-500/10 px-2 py-1 rounded-lg border border-cyan-500/20">{selectedReq.req_identifier}</span> 
                                                {selectedReq.title}
                                            </h2>
                                        )}
                                        
                                        {!isCreating && (
                                            <div className="flex items-center gap-3 mt-4 text-xs font-bold uppercase tracking-wider">
                                                <span className={`px-2 py-1 rounded border ${selectedReq.status === 'Approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                                                    {selectedReq.status}
                                                </span>
                                                <span className="px-2 py-1 rounded border bg-blue-500/10 border-blue-500/20 text-blue-400 flex items-center gap-1">
                                                    <GitBranch className="w-3.5 h-3.5" /> v{selectedReq.version}
                                                </span>
                                                <span className="px-2 py-1 rounded border bg-purple-500/10 border-purple-500/20 text-purple-400">
                                                    {selectedReq.category}
                                                </span>
                                                <span className={`px-2 py-1 rounded border ${selectedReq.priority === 'Critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-slate-500/10 border-slate-500/20 text-slate-400'}`}>
                                                    {selectedReq.priority}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {!isEditing && !isCreating && (
                                        <button onClick={() => { setIsEditing(true); setFormData(selectedReq); }} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 rounded-xl transition-colors shrink-0">
                                            <FileText className="w-4 h-4" /> Edit / Version
                                        </button>
                                    )}
                                </div>

                                {/* TABS NAV */}
                                {!isCreating && !isEditing && (
                                    <div className="px-6 pt-4 shrink-0 bg-black/10 border-b border-white/5">
                                        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
                                            {[
                                                { id: 'details', label: 'Details', icon: FileText },
                                                { id: 'rtm', label: 'Traceability', icon: Shield },
                                                { id: 'history', label: 'History', icon: GitBranch },
                                                { id: 'comments', label: 'Comments', icon: MessageSquare }
                                            ].map(tab => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveTab(tab.id)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'text-slate-400 hover:text-white border border-transparent'}`}
                                                >
                                                    <tab.icon className="w-4 h-4" /> {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* TAB CONTENT */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                    {(isEditing || isCreating) ? (
                                        <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                                                    <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 appearance-none">
                                                        <option className="bg-[#0D1424]">Epic</option><option className="bg-[#0D1424]">Feature</option><option className="bg-[#0D1424]">Story</option><option className="bg-[#0D1424]">Task</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Identifier</label>
                                                    <input value={formData.req_identifier} onChange={e => setFormData({ ...formData, req_identifier: e.target.value })} placeholder="REQ-001" disabled={!isCreating} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 disabled:opacity-50" />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Title *</label>
                                                    <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50" />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description *</label>
                                                    <textarea required rows={5} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 resize-none" />
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Urgency</label>
                                                    <select value={formData.urgency} onChange={e => setFormData({ ...formData, urgency: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 appearance-none">
                                                        <option className="bg-[#0D1424]">Low</option><option className="bg-[#0D1424]">Medium</option><option className="bg-[#0D1424]">High</option><option className="bg-[#0D1424]">Critical</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Type</label>
                                                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 appearance-none">
                                                        <option className="bg-[#0D1424]">Functional</option><option className="bg-[#0D1424]">Non-Functional</option><option className="bg-[#0D1424]">Security</option><option className="bg-[#0D1424]">Performance</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Business Value (Points)</label>
                                                    <input type="number" value={formData.business_value || 0} onChange={e => setFormData({ ...formData, business_value: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Priority</label>
                                                    <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 appearance-none">
                                                        <option className="bg-[#0D1424]">Low</option><option className="bg-[#0D1424]">Medium</option><option className="bg-[#0D1424]">High</option><option className="bg-[#0D1424]">Critical</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Parent ID (Optional)</label>
                                                    <input value={formData.parent_id || ''} onChange={e => setFormData({ ...formData, parent_id: e.target.value })} placeholder="e.g. 5" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50" />
                                                </div>

                                                {!isCreating && (
                                                    <div>
                                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                                                        <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 appearance-none">
                                                            <option className="bg-[#0D1424]">Draft</option><option className="bg-[#0D1424]">Review</option><option className="bg-[#0D1424]">Approved</option><option className="bg-[#0D1424]">Development</option><option className="bg-[#0D1424]">QA</option><option className="bg-[#0D1424]">Done</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-3 pt-6 border-t border-white/10">
                                                <button type="button" onClick={() => { setIsEditing(false); setIsCreating(false); }} className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl transition-colors">
                                                    Cancel
                                                </button>
                                                <button type="submit" className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-[#060B14] font-black rounded-xl transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]">
                                                    {isCreating ? 'Create Requirement' : 'Save New Version'}
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            {/* DETAILS TAB */}
                                            {activeTab === 'details' && (
                                                <div className="space-y-6">
                                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                                        <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-4">Requirement Specification</h3>
                                                        <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedReq.description}</div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Business Value</span>
                                                            <span className="text-3xl font-black text-emerald-400">{selectedReq.business_value || 0}</span>
                                                        </div>
                                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Urgency</span>
                                                            <span className={`text-xl font-bold ${selectedReq.urgency === 'Critical' ? 'text-rose-400' : 'text-blue-400'}`}>{selectedReq.urgency}</span>
                                                        </div>
                                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Author</span>
                                                            <span className="text-slate-300 font-medium">User #{selectedReq.author_id || 1}</span>
                                                        </div>
                                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Created At</span>
                                                            <span className="text-slate-300 font-medium">{new Date(selectedReq.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* TRACEABILITY TAB */}
                                            {activeTab === 'rtm' && (
                                                <div className="space-y-6">
                                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex justify-between items-center">
                                                        <div>
                                                            <h3 className="text-lg font-bold text-white mb-1">Traceability Matrix</h3>
                                                            <span className="text-sm text-slate-400">Linked Test Cases ensuring requirement coverage.</span>
                                                        </div>
                                                        <select className="px-4 py-2 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 appearance-none min-w-[250px]" onChange={(e) => handleLinkTC(e.target.value)} value="">
                                                            <option value="" className="bg-[#0D1424]">+ Link a Test Case</option>
                                                            {testCases.map(tc => <option key={tc.test_case_id} value={tc.test_case_id} className="bg-[#0D1424]">{tc.title}</option>)}
                                                        </select>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {selectedReq.test_cases?.length > 0 ? selectedReq.test_cases.map(tc => (
                                                            <div key={tc.test_case_id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    {tc.last_run_status === 'Pass' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : tc.last_run_status === 'Fail' ? <X className="w-5 h-5 text-rose-400" /> : <Shield className="w-5 h-5 text-slate-500" />}
                                                                    <span className="text-sm font-medium text-white">{tc.title}</span>
                                                                </div>
                                                                <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${tc.last_run_status === 'Pass' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : tc.last_run_status === 'Fail' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-slate-500/10 border-slate-500/20 text-slate-400'}`}>
                                                                    {tc.last_run_status || 'Not Run'}
                                                                </span>
                                                            </div>
                                                        )) : (
                                                            <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/5">
                                                                <AlertTriangle className="w-8 h-8 text-amber-500/50 mb-3" />
                                                                <p className="text-sm text-slate-400">No test cases linked to this requirement.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* HISTORY TAB */}
                                            {activeTab === 'history' && (
                                                <div className="relative pl-6 border-l-2 border-white/10 space-y-8 py-4">
                                                    {history.map(v => (
                                                        <div key={v.version_id} className="relative">
                                                            <div className="absolute w-3 h-3 bg-cyan-400 rounded-full -left-[1.95rem] top-1.5 shadow-[0_0_10px_rgba(6,182,212,0.8)] border-2 border-[#0D1424]"></div>
                                                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <span className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest">v{v.version_number}</span>
                                                                    <span className="text-xs text-slate-500 font-medium">{new Date(v.changed_at).toLocaleString()}</span>
                                                                </div>
                                                                <div className="text-white font-bold mb-1">{v.title}</div>
                                                                <div className="text-sm text-slate-400 italic">"{v.change_reason}"</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {history.length === 0 && <p className="text-slate-500 text-sm italic">No version history recorded (currently v1.0)</p>}
                                                </div>
                                            )}

                                            {/* COMMENTS TAB */}
                                            {activeTab === 'comments' && (
                                                <div className="flex flex-col h-full max-h-[500px]">
                                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-6">
                                                        {comments.map(c => (
                                                            <div key={c.comment_id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                                                <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                                                                    <strong className="text-cyan-400">{c.user_name || 'User'}</strong>
                                                                    <span>{new Date(c.created_at).toLocaleString()}</span>
                                                                </div>
                                                                <p className="text-sm text-slate-300">{c.comment_text}</p>
                                                            </div>
                                                        ))}
                                                        {comments.length === 0 && <div className="text-center text-slate-500 py-12">No comments yet. Be the first to discuss!</div>}
                                                    </div>
                                                    <div className="flex gap-3 pt-4 border-t border-white/10 bg-[#0D1424]">
                                                        <input 
                                                            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors" 
                                                            placeholder="Type a comment..." 
                                                            value={newComment} 
                                                            onChange={e => setNewComment(e.target.value)} 
                                                            onKeyDown={e => e.key === 'Enter' && handleComment()} 
                                                        />
                                                        <button onClick={handleComment} className="px-5 py-3 bg-cyan-500 text-[#060B14] rounded-xl hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                                            <MessageSquare className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
                                    <List className="w-10 h-10 text-blue-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Select a Requirement</h3>
                                <p className="text-slate-400 max-w-sm">Choose a requirement from the explorer sidebar to view its full specification and traceability matrix.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-3xl bg-[#0B0F19]/50">
                    <div className="w-20 h-20 rounded-full bg-slate-500/10 flex items-center justify-center mb-6">
                        <Folder className="w-10 h-10 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Project Selected</h3>
                    <p className="text-slate-400 text-sm">Please select a project from the dropdown in the header to load the Requirement Studio.</p>
                </motion.div>
            )}
        </div>
    );
};

export default Requirements;
