import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './VisualTesting.css';

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

    const getStatusColor = (project) => {
        if (!project.total_runs) return '#6c757d';
        // This is simplified - would need to check last run status
        return '#28a745';
    };

    if (loading) {
        return <div className="loading">Loading visual test projects...</div>;
    }

    return (
        <div className="visual-testing-page">
            <div className="page-header">
                <div>
                    <h1>📸 Visual Regression Testing</h1>
                    <p>Detect UI changes by comparing screenshots pixel-by-pixel</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setShowCreateModal(true)}
                    style={{ width: 'auto' }}
                >
                    + Create Visual Test Project
                </button>
            </div>

            {projects.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📸</div>
                    <h2>No Visual Test Projects Yet</h2>
                    <p>Create your first project to start visual regression testing</p>
                    <button
                        className="btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        Create Your First Project
                    </button>
                </div>
            ) : (
                <div className="projects-grid">
                    {projects.map(project => (
                        <div key={project.visual_project_id} className="project-card">
                            <div className="project-header">
                                <div>
                                    <h3>{project.name || 'Unnamed Project'}</h3>
                                    <p className="project-url">{project.base_url}</p>
                                </div>
                                <div
                                    className="status-badge"
                                    style={{ backgroundColor: getStatusColor(project) }}
                                >
                                    {project.total_runs || 0} runs
                                </div>
                            </div>

                            <div className="project-stats">
                                <div className="stat">
                                    <span className="stat-label">Project:</span>
                                    <span className="stat-value">
                                        {project.project_name || 'Not linked'}
                                    </span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Last Run:</span>
                                    <span className="stat-value">
                                        {project.last_run_date
                                            ? new Date(project.last_run_date).toLocaleDateString()
                                            : 'Never'}
                                    </span>
                                </div>
                            </div>

                            <div className="project-actions">
                                <button
                                    className="btn-secondary"
                                    onClick={() => handleRunTest(project.visual_project_id)}
                                >
                                    ▶ Run Test
                                </button>
                                {project.total_runs > 0 && (
                                    <button
                                        className="btn-secondary"
                                        onClick={() => handleViewResults(project.visual_project_id)}
                                    >
                                        📊 View Results
                                    </button>
                                )}
                                <button
                                    className="btn-danger-outline"
                                    onClick={() => handleDeleteProject(project.visual_project_id)}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Project Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create Visual Test Project</h2>
                            <button
                                className="close-btn"
                                onClick={() => setShowCreateModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleCreateProject}>
                            <div className="form-group">
                                <label>Project Name (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g., E-commerce Homepage Tests"
                                    value={newProject.name}
                                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Base URL *</label>
                                <input
                                    type="url"
                                    placeholder="https://example.com"
                                    value={newProject.base_url}
                                    onChange={e => setNewProject({ ...newProject, base_url: e.target.value })}
                                    required
                                />
                                <small>The main website URL to test</small>
                            </div>

                            <div className="form-group">
                                <label>Link to Existing Project (Optional)</label>
                                <select
                                    value={newProject.project_id}
                                    onChange={e => setNewProject({ ...newProject, project_id: e.target.value })}
                                >
                                    <option value="">-- No Link --</option>
                                    {linkedProjects.map(p => (
                                        <option key={p.project_id} value={p.project_id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VisualTesting;
