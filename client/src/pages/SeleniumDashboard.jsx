import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const SeleniumDashboard = () => {
    const [stats, setStats] = useState({ total_jobs: 0, recent_jobs: [], recent_executions: [] });

    useEffect(() => {
        fetchDashboard();
        const interval = setInterval(fetchDashboard, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await api.get('/selenium/dashboard');
            setStats(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this test run?')) return;
        try {
            console.log('Sending delete request for Job ID:', id);
            await api.delete(`/selenium/job/${id}`);
            fetchDashboard();
            setTimeout(fetchDashboard, 500); // safety refresh
        } catch (err) {
            console.error(err);
            alert('Failed to delete job: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="selenium-dashboard">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Selenium Cloud Dashboard</h1>
                <Link to="/selenium/execute" className="btn btn-primary" style={{ width: 'auto' }}>🚀 New Test Run</Link>
            </div>

            <div className="stats-grid">
                <div className="card">
                    <h3>Total Jobs Run</h3>
                    <div className="stat-value">{stats.total_jobs}</div>
                </div>
                <div className="card">
                    <h3>Active Nodes</h3>
                    <div className="stat-value">2 (Chrome, Firefox)</div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <h3>Recent Jobs</h3>
                <table className="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Test Name</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.recent_jobs.map(job => (
                            <tr key={job.job_id}>
                                <td>#{job.job_id}</td>
                                <td>{job.script_name || 'Unknown'}</td>
                                <td>
                                    <span className={`badge ${job.status.toLowerCase()}`}>
                                        {job.status}
                                    </span>
                                </td>
                                <td>{new Date(job.created_at).toLocaleString()}</td>
                                <td>
                                    <Link to={`/selenium/job/${job.job_id}`} className="btn btn-sm">View Details</Link>
                                    <button
                                        onClick={() => handleDelete(job.job_id)}
                                        className="btn btn-sm btn-danger"
                                        style={{ marginLeft: '0.5rem', background: '#dc3545', border: 'none' }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <h3>Recent Browser Executions</h3>
                <div className="execution-grid">
                    {stats.recent_executions.map(exec => (
                        <div key={exec.execution_id} className={`execution-item ${exec.status.toLowerCase()}`}>
                            <div className="browser-icon">{getBrowserIcon(exec.browser)}</div>
                            <div className="exec-details">
                                <div><strong>{exec.browser}</strong></div>
                                <div className="status">{exec.status}</div>
                                <div className="time">{new Date(exec.start_time).toLocaleTimeString()}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const getBrowserIcon = (browser) => {
    switch (browser) {
        case 'chrome': return '🔵';
        case 'firefox': return '🦊';
        case 'edge': return '🌊';
        default: return '🌐';
    }
};

export default SeleniumDashboard;
