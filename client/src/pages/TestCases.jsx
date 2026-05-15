import { useEffect, useState } from 'react';
import api from '../api';

const TestCases = () => {
    const [testCases, setTestCases] = useState([]);
    const [projects, setProjects] = useState([]);
    const [modules, setModules] = useState([]);
    const [testTypes, setTestTypes] = useState([]);
    const [users, setUsers] = useState([]);
    const [showForm, setShowForm] = useState(false);
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

    const fetchAssignableUsers = async () => {
        try {
            const res = await api.get('/users/assignable');
            setUsers(res.data);
        } catch (err) {
            console.error('Error fetching assignable users:', err);
        }
    };

    useEffect(() => {
        fetchTestCases();
    }, [filters]);

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

    const [editingId, setEditingId] = useState(null);

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
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/testcases/${editingId}`, formData);
                alert('Test Case Updated Successfully');
            } else {
                await api.post('/testcases', formData);
                alert('Test Case Created Successfully');
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({
                project_id: '', module_id: '', title: '', description: '',
                preconditions: '', steps: '', expected_result: '', priority: 'Medium', test_types: [], assignee_id: ''
            });
            fetchTestCases();
        } catch (err) {
            console.error(err);
            alert('Failed to save test case');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await api.delete(`/testcases/${id}`);
            fetchTestCases();
        } catch (err) {
            alert('Failed to delete test case');
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'var(--danger)';
            case 'Medium': return 'var(--warning)';
            case 'Low': return 'var(--success)';
            default: return 'var(--border)';
        }
    };

    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 'High': return 'badge-danger';
            case 'Medium': return 'badge-warning';
            case 'Low': return 'badge-success';
            default: return 'badge-blue';
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Test Cases</h1>
                <button className="btn btn-primary" onClick={() => {
                    setFormData({
                        project_id: '', module_id: '', title: '', description: '',
                        preconditions: '', steps: '', expected_result: '', priority: 'Medium', test_types: [], assignee_id: ''
                    });
                    setEditingId(null);
                    setShowForm(true);
                }} style={{ width: 'auto' }}>
                    + New Test Case
                </button>
            </div>

            <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <strong>Filter:</strong>
                <input
                    className="input"
                    style={{ marginBottom: 0, width: '200px' }}
                    placeholder="Search title/desc..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
                <select
                    className="input"
                    style={{ marginBottom: 0, width: '200px' }}
                    value={filters.project_id}
                    onChange={(e) => handleProjectChange(e.target.value, true)}
                >
                    <option value="">All Projects</option>
                    {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.name}</option>)}
                </select>
                <select
                    className="input"
                    style={{ marginBottom: 0, width: '200px' }}
                    value={filters.module_id}
                    onChange={(e) => setFilters({ ...filters, module_id: e.target.value })}
                    disabled={!filters.project_id}
                >
                    <option value="">All Modules</option>
                    {modules.map(m => <option key={m.module_id} value={m.module_id}>{m.name}</option>)}
                </select>
            </div>

            {showForm && (
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
                }} onClick={() => setShowForm(false)}>
                    <div className="card" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', margin: '2rem' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Test Case' : 'Create Test Case'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Project *</label>
                                    <select
                                        className="input"
                                        value={formData.project_id}
                                        onChange={(e) => handleProjectChange(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Project</option>
                                        {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Module</label>
                                    <select
                                        className="input"
                                        value={formData.module_id}
                                        onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
                                    >
                                        <option value="">Select Module</option>
                                        {modules.map(m => <option key={m.module_id} value={m.module_id}>{m.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
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
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Priority</label>
                                    <select
                                        className="input"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    >
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Title *</label>
                                <input
                                    className="input"
                                    placeholder="Title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description</label>
                                    <textarea
                                        className="input"
                                        placeholder="Description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Preconditions</label>
                                    <textarea
                                        className="input"
                                        placeholder="Preconditions"
                                        value={formData.preconditions}
                                        onChange={(e) => setFormData({ ...formData, preconditions: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Steps</label>
                                <textarea
                                    className="input"
                                    placeholder="Steps (one per line)"
                                    value={formData.steps}
                                    onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                                    rows={4}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Expected Result</label>
                                <textarea
                                    className="input"
                                    placeholder="Expected Result"
                                    value={formData.expected_result}
                                    onChange={(e) => setFormData({ ...formData, expected_result: e.target.value })}
                                    rows={2}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Test Types</label>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    {testTypes.map(type => (
                                        <label key={type.test_type_id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.test_types.includes(type.test_type_id)}
                                                onChange={() => handleTypeChange(type.test_type_id)}
                                            />
                                            {type.name}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} style={{ width: 'auto' }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                                    Save Test Case
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gap: '1rem' }}>
                {testCases.map((tc, index) => (
                    <div key={tc.test_case_id} className="card list-item-enter" style={{ animationDelay: `${index * 100}ms`, borderLeft: `4px solid ${getPriorityColor(tc.priority)}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                    {tc.project_name || 'Individual Case'}
                                </div>
                                <h3 style={{ marginTop: 0 }}>{tc.title}</h3>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                    {tc.module_name || 'No Module'} • {tc.test_types || 'No Type'}
                                </p>
                                {tc.assignee_name && (
                                    <div style={{ fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                        👤 Assigned to: {tc.assignee_name}
                                    </div>
                                )}
                            </div>
                            <span className={`badge ${getPriorityBadge(tc.priority)}`}>{tc.priority}</span>
                        </div>
                        <p style={{ marginBottom: '1rem' }}>{tc.description}</p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => handleEdit(tc)}>✏️ Edit</button>
                            <button className="btn btn-danger" onClick={() => handleDelete(tc.test_case_id)}>🗑️ Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TestCases;
