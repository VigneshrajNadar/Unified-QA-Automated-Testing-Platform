import { useEffect, useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Projects = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
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
            const payload = { name, description, assignee_id: assigneeId || null };
            if (editingProject) {
                await api.put(`/projects/${editingProject.project_id}`, payload);
                alert('Project updated successfully');
            } else {
                await api.post('/projects', payload);
                alert('Project created successfully');
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
            alert('Project deleted successfully');
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
        setShowForm(true);
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setAssigneeId('');
        setEditingProject(null);
        setShowForm(false);
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Projects</h1>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }} style={{ width: 'auto' }}>
                    + New Project
                </button>
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
                }} onClick={resetForm}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '2rem' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1.5rem' }}>{editingProject ? 'Edit Project' : 'Create Project'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Project Name *</label>
                                <input
                                    className="input"
                                    placeholder="Project Name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description</label>
                                <textarea
                                    className="input"
                                    placeholder="Description"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows="3"
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Assign To</label>
                                <select
                                    className="input"
                                    value={assigneeId}
                                    onChange={e => setAssigneeId(e.target.value)}
                                >
                                    <option value="">Unassigned</option>
                                    {users.map(u => (
                                        <option key={u.user_id} value={u.user_id}>
                                            {u.name} ({u.role})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={resetForm} style={{ width: 'auto' }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                                    {editingProject ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gap: '1rem' }}>
                {projects.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <h3 style={{ color: 'var(--text-light)' }}>No Projects Found</h3>
                        <p style={{ color: 'var(--text-dim)' }}>Create your first project to get started.</p>
                    </div>
                ) : (
                    projects.map(p => (
                        <div key={p.project_id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3>
                                        <Link to={`/projects/${p.project_id}`} style={{ textDecoration: 'none', color: 'var(--primary)' }}>
                                            {p.name}
                                        </Link>
                                    </h3>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', display: 'block' }}>
                                        Created by {p.created_by_name || 'Unknown'} on {new Date(p.created_at).toLocaleDateString()}
                                    </span>
                                    {p.assignee_name && (
                                        <span className="badge badge-blue" style={{ marginTop: '0.5rem' }}>
                                            👤 Assigned to: {p.assignee_name}
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-secondary" onClick={() => handleEdit(p)}>
                                        ✏️ Edit
                                    </button>
                                    {(user?.role === 'Admin' || user?.role === 'QA Lead' || user?.user_id === p.created_by) && (
                                        <button className="btn btn-danger" onClick={() => handleDelete(p.project_id)}>
                                            🗑️ Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p style={{ marginTop: '1rem' }}>{p.description}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Projects;
