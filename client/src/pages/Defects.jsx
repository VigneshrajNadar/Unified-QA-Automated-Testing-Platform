import { useEffect, useState } from 'react';
import api from '../api';

const Defects = () => {
    const [defects, setDefects] = useState([]);
    const [projects, setProjects] = useState([]);
    const [testCases, setTestCases] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingDefect, setEditingDefect] = useState(null);
    const [attachments, setAttachments] = useState({}); // Store attachments by defect_id

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
        fetchTestCases();
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

            // Fetch attachments for each defect
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

    const fetchTestCases = async () => {
        try {
            const res = await api.get('/testcases');
            setTestCases(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingDefect) {
                await api.put(`/defects/${editingDefect.defect_id}`, formData);
                alert('Defect updated successfully!');
            } else {
                await api.post('/defects', formData);
                alert('Defect created successfully!');
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
            alert('Defect deleted successfully!');
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
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>;

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Defect Management</h1>
                <button className="btn btn-primary" onClick={() => { setShowCreateForm(true); setEditingDefect(null); resetForm(); }} style={{ width: 'auto' }}>
                    + Create Defect
                </button>
            </div>

            {showCreateForm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(5px)'
                }} onClick={() => { setShowCreateForm(false); setEditingDefect(null); resetForm(); }}>
                    <div className="card" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', margin: '2rem' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{editingDefect ? 'Edit Defect' : 'Create New Defect'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Project *</label>
                                    <select
                                        className="input"
                                        value={formData.project_id}
                                        onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Project</option>
                                        {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Title *</label>
                                    <input
                                        className="input"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Severity</label>
                                    <select
                                        className="input"
                                        value={formData.severity}
                                        onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                    >
                                        <option>Critical</option>
                                        <option>High</option>
                                        <option>Medium</option>
                                        <option>Low</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Priority</label>
                                    <select
                                        className="input"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    >
                                        <option>High</option>
                                        <option>Medium</option>
                                        <option>Low</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Status</label>
                                    <select
                                        className="input"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option>Open</option>
                                        <option>In Progress</option>
                                        <option>Retest</option>
                                        <option>Closed</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Detection Source</label>
                                    <select
                                        className="input"
                                        value={formData.detection_source}
                                        onChange={(e) => setFormData({ ...formData, detection_source: e.target.value })}
                                    >
                                        <option>Manual Testing</option>
                                        <option>Automated Testing</option>
                                        <option>Static Analysis</option>
                                        <option>Security Scan</option>
                                        <option>Complexity Analysis</option>
                                        <option>Coverage Analysis</option>
                                        <option>Performance Testing</option>
                                        <option>User Reported</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Assign To</label>
                                    <select
                                        className="input"
                                        value={formData.assignee_id}
                                        onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
                                    >
                                        <option value="">Unassigned</option>
                                        {users.map(u => <option key={u.user_id} value={u.user_id}>{u.name} ({u.role})</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description *</label>
                                <textarea
                                    className="input"
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Steps to Reproduce</label>
                                <textarea
                                    className="input"
                                    rows="3"
                                    value={formData.steps}
                                    onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Expected Result</label>
                                    <textarea
                                        className="input"
                                        rows="2"
                                        value={formData.expected_result}
                                        onChange={(e) => setFormData({ ...formData, expected_result: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Actual Result</label>
                                    <textarea
                                        className="input"
                                        rows="2"
                                        value={formData.actual_result}
                                        onChange={(e) => setFormData({ ...formData, actual_result: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => { setShowCreateForm(false); setEditingDefect(null); resetForm(); }}
                                    style={{ width: 'auto' }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                                    {editingDefect ? 'Update Defect' : 'Create Defect'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {defects.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <h3 style={{ color: 'var(--text-light)' }}>No Defects Found</h3>
                    <p style={{ color: 'var(--text-dim)' }}>
                        Create defects manually or run automated tests to detect issues automatically.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {defects.map(d => (
                        <div key={d.defect_id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--danger)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                        {d.project_name || 'Individual Defect'}
                                    </div>
                                    <h3 style={{ marginTop: 0 }}>{d.title}</h3>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                        <span className={`badge badge-${d.severity === 'Critical' || d.severity === 'High' ? 'danger' : d.severity === 'Medium' ? 'warning' : 'info'}`}>
                                            {d.severity}
                                        </span>
                                        <span className={`badge badge-${d.status === 'Open' ? 'danger' : d.status === 'Closed' ? 'success' : 'warning'}`}>
                                            {d.status}
                                        </span>
                                        <span className="badge badge-info">{d.detection_source || 'Manual'}</span>
                                        {d.assignee_name && (
                                            <span className="badge" style={{ background: 'var(--primary)', color: 'white' }}>
                                                👤 {d.assignee_name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-secondary" onClick={() => handleEdit(d)}>
                                        ✏️ Edit
                                    </button>
                                    <button className="btn btn-danger" onClick={() => handleDelete(d.defect_id)}>
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>

                            <p style={{ marginTop: '1rem', color: 'var(--text-light)' }}>{d.description}</p>

                            {d.steps && (
                                <div style={{ marginTop: '1rem' }}>
                                    <strong>Steps to Reproduce:</strong>
                                    <pre style={{ whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                                        {d.steps}
                                    </pre>
                                </div>
                            )}

                            {(d.expected_result || d.actual_result) && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                    {d.expected_result && (
                                        <div>
                                            <strong>Expected:</strong>
                                            <p style={{ color: 'var(--text-light)', marginTop: '0.25rem' }}>{d.expected_result}</p>
                                        </div>
                                    )}
                                    {d.actual_result && (
                                        <div>
                                            <strong>Actual:</strong>
                                            <p style={{ color: 'var(--text-light)', marginTop: '0.25rem' }}>{d.actual_result}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Display Attachments/Screenshots */}
                            {attachments[d.defect_id] && attachments[d.defect_id].length > 0 && (
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                    <strong>Attachments ({attachments[d.defect_id].length}):</strong>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                        {attachments[d.defect_id].map((att) => (
                                            <div key={att.attachment_id} style={{ position: 'relative' }}>
                                                <a
                                                    href={`http://localhost:5000/uploads/${att.file_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ display: 'block' }}
                                                >
                                                    <img
                                                        src={`http://localhost:5000/uploads/${att.file_path}`}
                                                        alt="Defect screenshot"
                                                        style={{
                                                            width: '150px',
                                                            height: '150px',
                                                            objectFit: 'cover',
                                                            borderRadius: '8px',
                                                            border: '2px solid var(--border)',
                                                            cursor: 'pointer',
                                                            transition: 'transform 0.2s'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                    />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <label style={{ fontWeight: 500 }}>Update Status:</label>
                                <select
                                    className="input"
                                    style={{ width: 'auto' }}
                                    value={d.status}
                                    onChange={(e) => handleStatusChange(d.defect_id, e.target.value)}
                                >
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Retest">Retest</option>
                                    <option value="Closed">Closed</option>
                                </select>
                                <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginLeft: 'auto' }}>
                                    Defect ID: #{d.defect_id}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Defects;
