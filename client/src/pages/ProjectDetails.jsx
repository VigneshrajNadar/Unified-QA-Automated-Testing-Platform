import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
        if (confirm('Are you sure you want to delete this project?')) {
            try {
                await api.delete(`/projects/${id}`);
                navigate('/projects');
            } catch (err) {
                alert('Failed to delete project');
            }
        }
    };

    if (!project) return <div>Loading...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>{project.name}</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => window.open(`http://localhost:5000/api/docs/export/testcases/${id}?token=${localStorage.getItem('token')}`, '_blank')}>
                        Export PDF
                    </button>
                    <button className="btn" style={{ color: 'var(--danger)', border: '1px solid var(--danger)', width: 'auto' }} onClick={handleDelete}>Delete Project</button>
                </div>
            </div>
            <p className="card">{project.description}</p>

            <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Modules</h2>
            <div className="card">
                <form onSubmit={handleAddModule} style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        className="input"
                        style={{ marginBottom: 0, flex: 1 }}
                        placeholder="New Module Name"
                        value={moduleName}
                        onChange={e => setModuleName(e.target.value)}
                        required
                    />
                    <input
                        className="input"
                        style={{ marginBottom: 0, flex: 2 }}
                        placeholder="Description"
                        value={moduleDesc}
                        onChange={e => setModuleDesc(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Add Module</button>
                </form>
            </div>

            <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
                {project.modules && project.modules.map(m => (
                    <div key={m.module_id} className="card" style={{ padding: '1rem' }}>
                        <strong>{m.name}</strong>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-light)' }}>{m.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProjectDetails;
