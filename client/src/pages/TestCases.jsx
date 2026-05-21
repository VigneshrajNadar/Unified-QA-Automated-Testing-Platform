import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, Plus, X, Edit2, Trash2, User, Search, Filter, Box, AlertCircle } from 'lucide-react';
import api from '../api';

const TestCases = () => {
    const [testCases, setTestCases] = useState([]);
    const [projects, setProjects] = useState([]);
    const [modules, setModules] = useState([]);
    const [testTypes, setTestTypes] = useState([]);
    const [users, setUsers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filters, setFilters] = useState({ project_id: '', module_id: '', search: '' });
    const [formData, setFormData] = useState({
        project_id: '', module_id: '', title: '', description: '',
        preconditions: '', steps: '', expected_result: '', priority: 'Medium', test_types: [], assignee_id: ''
    });

    useEffect(() => {
        fetchProjects();
        fetchTestTypes();
        fetchTestCases();
        fetchAssignableUsers();
    }, []);

    useEffect(() => {
        fetchTestCases();
    }, [filters]);

    const fetchAssignableUsers = async () => {
        try {
            const res = await api.get('/users/assignable');
            setUsers(res.data);
        } catch (err) {
            console.error('Error fetching assignable users:', err);
        }
    };

    const fetchProjects = async () => {
        const res = await api.get('/projects');
        setProjects(res.data);
    };

    const fetchTestTypes = async () => {
        const res = await api.get('/testcases/types');
        setTestTypes(res.data);
    };

    const fetchTestCases = async () => {
        const params = {};
        if (filters.project_id) params.project_id = filters.project_id;
        if (filters.module_id) params.module_id = filters.module_id;
        if (filters.search) params.search = filters.search;
        const res = await api.get('/testcases', { params });
        setTestCases(res.data);
    };

    const handleProjectChange = async (projectId, isFilter = false) => {
        if (isFilter) {
            setFilters({ ...filters, project_id: projectId, module_id: '' });
        } else {
            setFormData({ ...formData, project_id: projectId, module_id: '' });
        }

        if (projectId) {
            const res = await api.get(`/projects/${projectId}`);
            setModules(res.data.modules || []);
        } else {
            setModules([]);
        }
    };

    const handleTypeChange = (typeId) => {
        const currentTypes = formData.test_types;
        if (currentTypes.includes(typeId)) {
            setFormData({ ...formData, test_types: currentTypes.filter(id => id !== typeId) });
        } else {
            setFormData({ ...formData, test_types: [...currentTypes, typeId] });
        }
    };

    const handleEdit = (tc) => {
        setFormData({
            project_id: tc.project_id,
            module_id: tc.module_id || '',
            title: tc.title,
            description: tc.description || '',
            preconditions: tc.preconditions || '',
            steps: tc.steps || '',
            expected_result: tc.expected_result || '',
            priority: tc.priority,
            test_types: tc.test_types_ids || [],
            assignee_id: tc.assignee_id || ''
        });
        setEditingId(tc.test_case_id);
        setShowForm(true);
        // Fetch modules for the project when editing
        if (tc.project_id) {
            api.get(`/projects/${tc.project_id}`).then(res => setModules(res.data.modules || []));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/testcases/${editingId}`, formData);
            } else {
                await api.post('/testcases', formData);
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({
                project_id: '', module_id: '', title: '', description: '',
                preconditions: '', steps: '', expected_result: '', priority: 'Medium', test_types: [], assignee_id: ''
            });
            fetchTestCases();
        } catch (err) {
            alert('Failed to save test case');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this test case?')) return;
        try {
            await api.delete(`/testcases/${id}`);
            fetchTestCases();
        } catch (err) {
            alert('Failed to delete test case');
        }
    };

    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 'High': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            case 'Medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'Low': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <FileSpreadsheet className="w-8 h-8 text-cyan-400" /> Test Cases
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Design and manage your automated and manual test scenarios.</p>
                </div>
                <button 
                    onClick={() => {
                        setFormData({
                            project_id: '', module_id: '', title: '', description: '',
                            preconditions: '', steps: '', expected_result: '', priority: 'Medium', test_types: [], assignee_id: ''
                        });
                        setEditingId(null);
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-[#0B0F19] font-bold text-sm rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]"
                >
                    <Plus className="w-4 h-4" /> New Test Case
                </button>
            </motion.div>

            {/* Filter Bar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row gap-4 items-center">
                <div className="flex items-center gap-2 text-slate-400 font-bold text-sm min-w-fit pl-2">
                    <Filter className="w-4 h-4" /> Filters:
                </div>
                <div className="relative w-full md:w-auto md:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search title or description..."
                        value={filters.search || ''}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                </div>
                <select
                    value={filters.project_id}
                    onChange={(e) => handleProjectChange(e.target.value, true)}
                    className="w-full md:w-64 px-4 py-2.5 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none"
                >
                    <option value="" className="bg-[#0D1424]">All Projects</option>
                    {projects.map(p => <option key={p.project_id} value={p.project_id} className="bg-[#0D1424]">{p.name}</option>)}
                </select>
                <select
                    value={filters.module_id}
                    onChange={(e) => setFilters({ ...filters, module_id: e.target.value })}
                    disabled={!filters.project_id}
                    className="w-full md:w-64 px-4 py-2.5 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none disabled:opacity-50"
                >
                    <option value="" className="bg-[#0D1424]">All Modules</option>
                    {modules.map(m => <option key={m.module_id} value={m.module_id} className="bg-[#0D1424]">{m.name}</option>)}
                </select>
            </motion.div>

            {/* Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowForm(false)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-3xl max-h-[90vh] bg-[#0D1424] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    {editingId ? <Edit2 className="w-5 h-5 text-cyan-400" /> : <FileSpreadsheet className="w-5 h-5 text-cyan-400" />}
                                    {editingId ? 'Edit Test Case' : 'Create Test Case'}
                                </h3>
                                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                <form id="tc-form" onSubmit={handleSubmit} className="space-y-6">
                                    {/* Top Metadata row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Project *</label>
                                            <select required value={formData.project_id} onChange={(e) => handleProjectChange(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none">
                                                <option value="" className="bg-[#0D1424]">Select Project</option>
                                                {projects.map(p => <option key={p.project_id} value={p.project_id} className="bg-[#0D1424]">{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Module</label>
                                            <select value={formData.module_id} onChange={(e) => setFormData({ ...formData, module_id: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none">
                                                <option value="" className="bg-[#0D1424]">Select Module</option>
                                                {modules.map(m => <option key={m.module_id} value={m.module_id} className="bg-[#0D1424]">{m.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Assignment & Priority */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Assign To</label>
                                            <select value={formData.assignee_id} onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none">
                                                <option value="" className="bg-[#0D1424]">Unassigned</option>
                                                {users.map(u => <option key={u.user_id} value={u.user_id} className="bg-[#0D1424]">{u.name} ({u.role})</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Priority</label>
                                            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none">
                                                <option value="High" className="bg-[#0D1424]">High</option>
                                                <option value="Medium" className="bg-[#0D1424]">Medium</option>
                                                <option value="Low" className="bg-[#0D1424]">Low</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Title *</label>
                                        <input required type="text" placeholder="e.g. Verify user login with valid credentials" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                                            <textarea rows={3} placeholder="Overall purpose of the test case..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors resize-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Preconditions</label>
                                            <textarea rows={3} placeholder="Required state before test execution..." value={formData.preconditions} onChange={(e) => setFormData({ ...formData, preconditions: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors resize-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Steps to Reproduce</label>
                                        <textarea rows={4} placeholder="1. Go to login page&#10;2. Enter credentials..." value={formData.steps} onChange={(e) => setFormData({ ...formData, steps: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors resize-none font-mono" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Expected Result</label>
                                        <textarea rows={2} placeholder="User should be logged in and redirected to dashboard." value={formData.expected_result} onChange={(e) => setFormData({ ...formData, expected_result: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors resize-none" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Test Types</label>
                                        <div className="flex flex-wrap gap-3">
                                            {testTypes.map(type => (
                                                <label key={type.test_type_id} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium cursor-pointer transition-colors ${formData.test_types.includes(type.test_type_id) ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                                                    <input type="checkbox" checked={formData.test_types.includes(type.test_type_id)} onChange={() => handleTypeChange(type.test_type_id)} className="hidden" />
                                                    {type.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="p-4 border-t border-white/10 bg-white/5 flex gap-3 shrink-0">
                                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold hover:bg-white/10 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" form="tc-form" className="flex-1 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-[#0B0F19] rounded-xl text-sm font-bold hover:from-cyan-400 hover:to-blue-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                    {editingId ? 'Save Changes' : 'Create Test Case'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Test Cases List */}
            {testCases.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-3xl bg-[#0B0F19]/50">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
                        <FileSpreadsheet className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Test Cases Found</h3>
                    <p className="text-slate-400 text-sm text-center max-w-md mb-6">Create test scenarios or adjust your filters to see results.</p>
                </motion.div>
            ) : (
                <div className="space-y-4">
                    {testCases.map((tc, index) => (
                        <motion.div 
                            key={tc.test_case_id}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
                            className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg group hover:bg-white/[0.02] transition-colors relative overflow-hidden"
                        >
                            <div className="flex flex-col md:flex-row gap-4 justify-between md:items-start relative z-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">{tc.project_name || 'Global'}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getPriorityBadge(tc.priority)}`}>
                                            {tc.priority}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">{tc.title}</h3>
                                    
                                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-2 flex-wrap">
                                        <span className="flex items-center gap-1.5"><Box className="w-3.5 h-3.5 text-slate-600" /> {tc.module_name || 'No Module'}</span>
                                        <span className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-slate-600" /> {tc.test_types || 'Uncategorized'}</span>
                                        {tc.assignee_name && (
                                            <span className="flex items-center gap-1.5 text-blue-400"><User className="w-3.5 h-3.5" /> {tc.assignee_name}</span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 mt-4 md:mt-0">
                                    <button onClick={() => handleEdit(tc)} className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1.5">
                                        <Edit2 className="w-3.5 h-3.5" /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(tc.test_case_id)} className="px-3 py-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors flex items-center gap-1.5">
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                </div>
                            </div>
                            
                            {tc.description && (
                                <p className="mt-4 text-sm text-slate-400 line-clamp-2">{tc.description}</p>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TestCases;
