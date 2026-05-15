import { useEffect, useState } from 'react';
import api from '../api';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalProjects: 0, totalTestCases: 0, totalRuns: 0, totalDefects: 0, openDefects: 0,
        defectsBySeverity: [], testCasesByPriority: [], recentRuns: []
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/stats');
                setStats(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, []);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Dashboard Overview</h1>
            <div className="stats-grid">
                <div className="stat-card" style={{ borderLeftColor: 'var(--primary)' }}>
                    <span className="stat-label">Total Projects</span>
                    <span className="stat-value">{stats.totalProjects}</span>
                </div>
                <div className="stat-card" style={{ borderLeftColor: 'var(--secondary)' }}>
                    <span className="stat-label">Test Cases</span>
                    <span className="stat-value">{stats.totalTestCases}</span>
                </div>
                <div className="stat-card" style={{ borderLeftColor: 'var(--accent)' }}>
                    <span className="stat-label">Test Runs</span>
                    <span className="stat-value">{stats.totalRuns}</span>
                </div>
                <div className="stat-card" style={{ borderLeftColor: 'var(--danger)' }}>
                    <span className="stat-label">Open Defects</span>
                    <span className="stat-value">{stats.openDefects}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Defects by Severity</h3>
                    {stats.defectsBySeverity?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats.defectsBySeverity}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {stats.defectsBySeverity?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
                                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '3rem' }}>No defects data</p>
                    )}
                </div>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Test Cases by Priority</h3>
                    {stats.testCasesByPriority?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.testCasesByPriority}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
                                <Bar dataKey="value" fill="#6366f1" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '3rem' }}>No test cases data</p>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="card">
                    <h3>Recent Test Runs</h3>
                    {stats.recentRuns?.length > 0 ? (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {stats.recentRuns.map((run, i) => (
                                <li key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                    <strong>{run.name}</strong> <span style={{ color: 'var(--text-light)' }}>in {run.project_name}</span>
                                    <br />
                                    <small>{new Date(run.created_at).toLocaleDateString()}</small>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={{ color: 'var(--text-light)' }}>No recent runs.</p>
                    )}
                </div>
                <div className="card">
                    <h3>Quick Actions</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" onClick={() => window.location.href = '/projects'}>+ New Project</button>
                        <button className="btn" style={{ border: '1px solid var(--border)' }} onClick={() => window.location.href = '/testcases'}>+ New Test Case</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
