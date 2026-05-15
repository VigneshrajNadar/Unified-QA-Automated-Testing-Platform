import { useEffect, useState } from 'react';
import api from '../api';
import './Requirements.css';
import { Target, List, GitBranch, MessageSquare, Plus, Folder, FileText, ChevronRight, ChevronDown, CheckCircle, AlertTriangle, Shield, Trash2, Save, X } from 'lucide-react';

const Requirements = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [requirements, setRequirements] = useState([]);
    const [testCases, setTestCases] = useState([]);
    const [selectedReq, setSelectedReq] = useState(null); // Full Object
    const [activeTab, setActiveTab] = useState('details'); // details, rtm, history, comments
    const [history, setHistory] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({});

    // --- INITIALIZATION ---
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

    // --- FETCHERS ---
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

    // --- ACTIONS ---
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

            alert(isCreating ? 'Requirement Created' : 'Requirement Updated & Versioned');
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

    // --- HELPERS ---
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

    // --- UI COMPONENTS ---
    const StatusBadge = ({ status }) => (
        <span className={`badge badge-${(status || 'draft').toLowerCase()}`}>{status}</span>
    );

    const TreeItem = ({ node, level = 0 }) => {
        const [expanded, setExpanded] = useState(true);
        const icon = node.category === 'Epic' ? <Target size={14} color="#a855f7" /> : node.category === 'Feature' ? <Folder size={14} color="#3b82f6" /> : <FileText size={14} color="#22c55e" />;

        return (
            <div className="select-none">
                <div
                    className={`tree-item ${selectedReq?.requirement_id === node.requirement_id ? 'active' : ''}`}
                    style={{ paddingLeft: `${level * 16 + 8}px` }}
                    onClick={() => {
                        setSelectedReq(node);
                        fetchDetails(node.requirement_id);
                        setIsEditing(false);
                        setIsCreating(false);
                        setActiveTab('details');
                    }}
                >
                    <div onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="tree-expander">
                        {node.children.length > 0 ? (expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : <span style={{ width: 12 }} />}
                    </div>
                    {icon}
                    <span className="truncate">{node.req_identifier}</span>
                </div>
                {expanded && node.children.map(child => <TreeItem key={child.requirement_id} node={child} level={level + 1} />)}
            </div>
        );
    };

    return (
        <div className="req-studio-container animate-fade-in">
            {/* Header */}
            <div className="req-header">
                <h1 className="req-title">Requirement Studio</h1>
                <select className="req-project-select" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                    <option value="">-- Select Project --</option>
                    {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.name}</option>)}
                </select>
            </div>

            {selectedProject ? (
                <div className="req-body">
                    {/* Sidebar */}
                    <div className="req-sidebar">
                        <div className="sidebar-header">
                            <span className="sidebar-title">Explorer</span>
                            <button onClick={() => { setIsCreating(true); setSelectedReq(null); setFormData({ type: 'Functional', category: 'Story', priority: 'Medium', urgency: 'Medium' }); }} className="btn-icon-add" title="Create New">
                                <Plus size={18} />
                            </button>
                        </div>
                        <div className="sidebar-content">
                            {buildTree(requirements).map(r => <TreeItem key={r.requirement_id} node={r} />)}
                            {requirements.length === 0 && <div className="empty-state" style={{ background: 'none' }}><span className="text-xs text-slate-500">No items. Click + to add.</span></div>}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="req-main">
                        {(selectedReq || isCreating) ? (
                            <>
                                {/* Functional Header */}
                                <div className="detail-header">
                                    <div className="detail-title">
                                        {isCreating ?
                                            <h2 style={{ color: '#4ade80' }}><Plus size={20} /> New Requirement</h2> :
                                            <h2><span className="req-id">{selectedReq.req_identifier}:</span> {selectedReq.title}</h2>
                                        }
                                        {!isCreating && (
                                            <div className="meta-row">
                                                <StatusBadge status={selectedReq.status} />
                                                <div className="meta-tag"><GitBranch size={10} /> v{selectedReq.version}</div>
                                                <div className="meta-tag">• {selectedReq.category}</div>
                                                <div className="meta-tag" style={{ color: selectedReq.priority === 'Critical' ? '#f87171' : '#60a5fa' }}>• {selectedReq.priority}</div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="actions">
                                        {!isEditing && !isCreating && <button onClick={() => { setIsEditing(true); setFormData(selectedReq); }} className="btn-secondary text-xs"><FileText size={14} /> Edit / Version</button>}
                                    </div>
                                </div>

                                {/* Tabs */}
                                {!isCreating && (
                                    <div className="tabs-nav">
                                        {[
                                            { id: 'details', label: 'Details', icon: FileText },
                                            { id: 'rtm', label: 'Traceability', icon: Shield },
                                            { id: 'history', label: 'History', icon: GitBranch },
                                            { id: 'comments', label: 'Comments', icon: MessageSquare }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                            >
                                                <tab.icon size={14} /> {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                /* Content Area */
                                <div className="detail-content">
                                    {(isEditing || isCreating) ? (
                                        <form onSubmit={handleSave} className="req-form">
                                            <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginBottom: '1rem' }}>{isCreating ? 'Create Requirement' : 'Edit & Version'}</h3>

                                            <div className="form-grid">
                                                <div className="form-group">
                                                    <label className="form-label">Category</label>
                                                    <select className="form-select" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}><option>Epic</option><option>Feature</option><option>Story</option><option>Task</option></select>
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Identifier</label>
                                                    <input className="form-input" value={formData.req_identifier} onChange={e => setFormData({ ...formData, req_identifier: e.target.value })} placeholder="REQ-001" disabled={!isCreating} />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Title</label>
                                                <input className="form-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Description</label>
                                                <textarea className="form-textarea" style={{ height: '150px' }} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                            </div>

                                            <div className="form-grid-3">
                                                <div className="form-group"><label className="form-label">Urgency</label><select className="form-select" value={formData.urgency} onChange={e => setFormData({ ...formData, urgency: e.target.value })}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></div>
                                                <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}><option>Functional</option><option>Non-Functional</option><option>Security</option><option>Performance</option></select></div>
                                                <div className="form-group"><label className="form-label">Parent ID</label><input className="form-input" placeholder="Optional" value={formData.parent_id || ''} onChange={e => setFormData({ ...formData, parent_id: e.target.value })} /></div>
                                            </div>

                                            <div className="form-grid-3">
                                                <div className="form-group"><label className="form-label">Business Value</label><input className="form-input" type="number" value={formData.business_value || 0} onChange={e => setFormData({ ...formData, business_value: e.target.value })} /></div>
                                                <div className="form-group"><label className="form-label">Priority</label><select className="form-select" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></div>
                                                {!isCreating && <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}><option>Draft</option><option>Review</option><option>Approved</option><option>Development</option><option>QA</option><option>Done</option></select></div>}
                                            </div>

                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                                                <button type="submit" className="btn-primary"><Save size={16} /> Save</button>
                                                <button type="button" onClick={() => { setIsEditing(false); setIsCreating(false); }} className="btn-secondary"><X size={16} /> Cancel</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            {activeTab === 'details' && (
                                                <div className="animate-fade-in">
                                                    <div className="spec-box">
                                                        <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#60a5fa', marginBottom: '0.5rem' }}>Requirement Specification</h3>
                                                        <div className="spec-description">{selectedReq.description}</div>
                                                    </div>
                                                    <div className="kpi-grid">
                                                        <div className="kpi-card">
                                                            <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>Business Value</span>
                                                            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#4ade80', fontFamily: 'monospace' }}>{selectedReq.business_value || 0}</span>
                                                        </div>
                                                        <div className="kpi-card">
                                                            <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>Urgency</span>
                                                            <span style={{ color: selectedReq.urgency === 'Critical' ? '#f87171' : '#60a5fa', fontWeight: '600' }}>{selectedReq.urgency}</span>
                                                        </div>
                                                        <div className="kpi-card">
                                                            <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>Author</span>
                                                            <span style={{ color: '#cbd5e1' }}>User #{selectedReq.author_id || 1}</span>
                                                        </div>
                                                        <div className="kpi-card">
                                                            <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>Created</span>
                                                            <span style={{ color: '#cbd5e1' }}>{new Date(selectedReq.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeTab === 'rtm' && (
                                                <div className="animate-fade-in">
                                                    <div className="spec-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <h3 style={{ margin: 0, color: 'white' }}>Traceability Matrix</h3>
                                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Linked Test Cases</span>
                                                        </div>
                                                        <select className="form-select" style={{ width: '200px' }} onChange={(e) => handleLinkTC(e.target.value)} value="">
                                                            <option value="">+ Link Test Case</option>
                                                            {testCases.map(tc => <option key={tc.test_case_id} value={tc.test_case_id}>{tc.title}</option>)}
                                                        </select>
                                                    </div>

                                                    <div className="rtm-list">
                                                        {selectedReq.test_cases?.length > 0 ? selectedReq.test_cases.map(tc => (
                                                            <div key={tc.test_case_id} className="rtm-item">
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    {tc.last_run_status === 'Pass' ? <CheckCircle size={16} color="#4ade80" /> : tc.last_run_status === 'Fail' ? <X size={16} color="#f87171" /> : <Shield size={16} color="#94a3b8" />}
                                                                    <span style={{ color: '#e2e8f0' }}>{tc.title}</span>
                                                                </div>
                                                                <span className={`status-badge ${tc.last_run_status === 'Pass' ? 'pass' : tc.last_run_status === 'Fail' ? 'fail' : 'not-run'}`}>
                                                                    {tc.last_run_status || 'Not Run'}
                                                                </span>
                                                            </div>
                                                        )) : (
                                                            <div className="empty-state" style={{ flexDirection: 'column', padding: '3rem' }}>
                                                                <AlertTriangle size={32} color="#64748b" style={{ marginBottom: '1rem' }} />
                                                                <span>No test cases linked.</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {activeTab === 'history' && (
                                                <div className="animate-fade-in history-timeline">
                                                    {history.map(v => (
                                                        <div key={v.version_id} className="history-item">
                                                            <div className="timeline-dot"></div>
                                                            <div className="history-card">
                                                                <div className="history-meta">
                                                                    <span className="version-tag">v{v.version_number}</span>
                                                                    <span>{new Date(v.changed_at).toLocaleString()}</span>
                                                                </div>
                                                                <div style={{ fontWeight: '600', color: '#e2e8f0', marginBottom: '0.25rem' }}>{v.title}</div>
                                                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>"{v.change_reason}"</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {history.length === 0 && <p style={{ color: '#64748b', paddingLeft: '2rem' }}>No history recorded (v1.0)</p>}
                                                </div>
                                            )}

                                            {activeTab === 'comments' && (
                                                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                                    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '1rem' }}>
                                                        {comments.map(c => (
                                                            <div key={c.comment_id} style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(30,41,59,0.3)', borderRadius: '0.5rem' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                                                                    <strong>{c.user_name || 'User'}</strong>
                                                                    <span>{new Date(c.created_at).toLocaleString()}</span>
                                                                </div>
                                                                <p style={{ color: '#e2e8f0', margin: 0, fontSize: '0.9rem' }}>{c.comment_text}</p>
                                                            </div>
                                                        ))}
                                                        {comments.length === 0 && <p style={{ textAlign: 'center', color: '#64748b', marginTop: '2rem' }}>No comments yet.</p>}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #334155' }}>
                                                        <input className="form-input" placeholder="Type a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleComment()} />
                                                        <button onClick={handleComment} className="btn-primary" style={{ width: 'auto' }}><MessageSquare size={16} /></button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-content">
                                    <div className="empty-icon-box"><List size={32} color="#60a5fa" /></div>
                                    <h3>Select an Item</h3>
                                    <p style={{ fontSize: '0.9rem' }}>Choose a requirement from the explorer to view its full specification and traceability.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-content">
                        <Folder size={48} color="#64748b" style={{ marginBottom: '1rem' }} />
                        <h3>No Project Selected</h3>
                        <p>Please select a project from the top right.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Requirements;
