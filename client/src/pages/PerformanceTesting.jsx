import React, { useState, useEffect } from 'react';
import api from '../api';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './PerformanceTesting.css';

const PerformanceTesting = () => {
    const [activeTab, setActiveTab] = useState('run');
    const [k6Installed, setK6Installed] = useState(false);

    // Config State
    const [config, setConfig] = useState({
        url: '',
        users: 10,
        duration: 30,
        name: '',
        testType: 'load'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastResult, setLastResult] = useState(null);

    // History State
    const [history, setHistory] = useState([]);

    useEffect(() => {
        checkK6Status();
        fetchHistory();
    }, []);

    const checkK6Status = async () => {
        try {
            const res = await api.get('/performance/status');
            setK6Installed(res.data.k6_installed);
        } catch (err) {
            console.error("Failed to check k6 status", err);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get('/performance/history');
            setHistory(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRunTest = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setLastResult(null);

        try {
            const res = await api.post('/performance/run', {
                ...config,
                save_config: true
            });
            setLastResult(res.data.metrics);
            fetchHistory(); // Refresh history
            setActiveTab('results'); // Switch to view results
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#4ade80', '#f87171'];

    return (
        <div className="performance-page">
            <div className="performance-header">
                <h1>Load & Performance Testing</h1>
                <p>Simulate concurrent users and analyze system behavior under load.</p>
            </div>

            {!k6Installed && (
                <div className="k6-warning">
                    <span>⚠️ <strong>k6 Missing:</strong> You need to install k6 on the server to run tests. (Command: <code>choco install k6</code>)</span>
                </div>
            )}

            <div className="tabs">
                <div className={`tab ${activeTab === 'run' ? 'active' : ''}`} onClick={() => setActiveTab('run')}>Configure & Run</div>
                <div className={`tab ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>Test Results</div>
                <div className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History</div>
            </div>

            {/* RUN TAB */}
            {activeTab === 'run' && (
                <div className="tab-content">
                    <div className="config-card">
                        <form onSubmit={handleRunTest}>
                            <div className="config-form">
                                <div className="form-group">
                                    <label>Test Name (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Homepage Load Test"
                                        value={config.name}
                                        onChange={e => setConfig({ ...config, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Test Scenario</label>
                                    <select
                                        value={config.testType || 'load'}
                                        onChange={e => setConfig({ ...config, testType: e.target.value })}
                                        className="select-input"
                                    >
                                        <option value="load">Load Test (Standard)</option>
                                        <option value="stress">Stress Test (Ramp up to failure)</option>
                                        <option value="spike">Spike Test (Sudden burst)</option>
                                        <option value="soak">Soak Test (Long duration)</option>
                                    </select>
                                    <small style={{ color: '#94a3b8', display: 'block', marginTop: '5px' }}>
                                        {config.testType === 'load' && 'Simulates normal traffic to verify system stability.'}
                                        {config.testType === 'stress' && 'Gradually increases load to find the breaking point.'}
                                        {config.testType === 'spike' && 'Simulates extreme traffic spikes (e.g., Black Friday).'}
                                        {config.testType === 'soak' && 'Runs for a longer period to identify memory leaks.'}
                                    </small>
                                </div>
                                <div className="form-group">
                                    <label>Target URL *</label>
                                    <input
                                        type="url"
                                        required
                                        placeholder="https://api.example.com/users"
                                        value={config.url}
                                        onChange={e => setConfig({ ...config, url: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Virtual Users (Max)</label>
                                    <input
                                        type="number"
                                        min="1" max="5000"
                                        value={config.users}
                                        onChange={e => setConfig({ ...config, users: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Duration (Seconds)</label>
                                    <input
                                        type="number"
                                        min="10" max="14400"
                                        value={config.duration}
                                        onChange={e => setConfig({ ...config, duration: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            {error && <div style={{ color: '#f87171', marginTop: '1rem' }}>Error: {error}</div>}

                            <div className="config-actions">
                                <button type="submit" className="btn-primary" disabled={loading || !k6Installed}>
                                    {loading ? 'Running Load Test...' : '🚀 Start Load Test'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RESULTS TAB */}
            {activeTab === 'results' && (
                <div className="tab-content">
                    {!lastResult ? (
                        <div className="empty-state">
                            <h3>No Recent Results</h3>
                            <p>Run a test to see metrics here.</p>
                            <button className="btn-secondary" onClick={() => setActiveTab('run')}>Go to Run</button>
                        </div>
                    ) : (
                        <>
                            <div className="metrics-summary">
                                <div className="metric-card info">
                                    <h4>Avg Response</h4>
                                    <div className="value">{lastResult.avg}ms</div>
                                </div>
                                <div className="metric-card info">
                                    <h4>Median (P50)</h4>
                                    <div className="value">{lastResult.median || 0}ms</div>
                                </div>
                                <div className="metric-card warning">
                                    <h4>P95</h4>
                                    <div className="value">{lastResult.p95 || 0}ms</div>
                                </div>
                                <div className="metric-card warning">
                                    <h4>P99</h4>
                                    <div className="value">{lastResult.p99 || 0}ms</div>
                                </div>
                                <div className="metric-card success">
                                    <h4>Throughput</h4>
                                    <div className="value">{lastResult.throughput}/s</div>
                                </div>
                                <div className={`metric-card ${lastResult.errorRate > 0 ? 'danger' : 'success'}`}>
                                    <h4>Error Rate</h4>
                                    <div className="value">{lastResult.errorRate}%</div>
                                </div>
                            </div>

                            <div className="metrics-summary" style={{ marginTop: '10px' }}>
                                <div className="metric-card" style={{ background: '#1e293b' }}>
                                    <h4>Total Configs</h4>
                                    <div>{lastResult.totalRequests || 0} Req</div>
                                </div>
                                <div className="metric-card" style={{ background: '#1e293b' }}>
                                    <h4>Data Recv</h4>
                                    <div>{lastResult.dataReceived || 0} MB</div>
                                </div>
                                <div className="metric-card" style={{ background: '#1e293b' }}>
                                    <h4>Data Sent</h4>
                                    <div>{lastResult.dataSent || 0} MB</div>
                                </div>
                                <div className="metric-card" style={{ background: '#1e293b' }}>
                                    <h4>Connecting</h4>
                                    <div>{lastResult.timings?.connecting || 0}ms</div>
                                </div>
                                <div className="metric-card" style={{ background: '#1e293b' }}>
                                    <h4>TTFB (Waiting)</h4>
                                    <div>{lastResult.timings?.waiting || 0}ms</div>
                                </div>
                                <div className="metric-card" style={{ background: '#1e293b' }}>
                                    <h4>Downloading</h4>
                                    <div>{lastResult.timings?.receiving || 0}ms</div>
                                </div>
                            </div>

                            <div className="dashboard-grid">
                                <div className="chart-card">
                                    <h3>Response Time Distribution</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={[
                                            { name: 'Avg', value: lastResult.avg },
                                            { name: 'Median', value: lastResult.median },
                                            { name: 'P95', value: lastResult.p95 },
                                            { name: 'P99', value: lastResult.p99 },
                                            { name: 'Max', value: lastResult.max }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis dataKey="name" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" />
                                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                                            <Bar dataKey="value" fill="#8884d8" name="Time (ms)">
                                                {
                                                    [
                                                        { name: 'Avg', value: lastResult.avg },
                                                        { name: 'Median', value: lastResult.median },
                                                        { name: 'P95', value: lastResult.p95 },
                                                        { name: 'P99', value: lastResult.p99 },
                                                        { name: 'Max', value: lastResult.max }
                                                    ].map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#06b6d4', '#eab308', '#f97316', '#ef4444'][index]} />
                                                    ))
                                                }
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="chart-card">
                                    <h3>HTTP Status Codes</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={Object.entries(lastResult.statusCodes || {}).map(([code, count]) => ({ name: code, value: count }))}
                                                cx="50%" cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {Object.keys(lastResult.statusCodes || {}).map((code, index) => (
                                                    <Cell key={`cell-${index}`} fill={code.startsWith('2') ? '#4ade80' : code.startsWith('3') ? '#60a5fa' : code.startsWith('4') ? '#fbbf24' : '#f87171'} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="chart-card">
                                    <h3>Request Timing Breakdown</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Blocked', value: lastResult.timings?.blocked || 0 },
                                                    { name: 'Connecting', value: lastResult.timings?.connecting || 0 },
                                                    { name: 'Waiting (TTFB)', value: lastResult.timings?.waiting || 0 },
                                                    { name: 'Downloading', value: lastResult.timings?.receiving || 0 }
                                                ]}
                                                cx="50%" cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                <Cell fill="#64748b" />
                                                <Cell fill="#f59e0b" />
                                                <Cell fill="#3b82f6" />
                                                <Cell fill="#10b981" />
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <button className="btn-report" onClick={() => window.print()}>📄 Download PDF Report</button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
                <div className="tab-content">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Test Name</th>
                                <th>Type</th>
                                <th>Target</th>
                                <th>Avg Time</th>
                                <th>P95</th>
                                <th>Median</th>
                                <th>Throughput</th>
                                <th>Error Rate</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length === 0 ? (
                                <tr><td colSpan="10" style={{ textAlign: 'center' }}>No history found.</td></tr>
                            ) : (
                                history.map(run => {
                                    let metrics = {};
                                    try { metrics = run.raw_data ? JSON.parse(run.raw_data) : {}; } catch (e) { }

                                    return (
                                        <tr key={run.result_id}>
                                            <td>{new Date(run.executed_at).toLocaleString()}</td>
                                            <td>{run.test_name}</td>
                                            <td style={{ textTransform: 'capitalize' }}>
                                                <span className={`status-badge ${run.test_type === 'stress' ? 'fail' : run.test_type === 'spike' ? 'warning' : 'pass'}`} style={{ color: 'white' }}>
                                                    {run.test_type || 'load'}
                                                </span>
                                            </td>
                                            <td>{run.target_url}</td>
                                            <td>{run.avg_response_time}ms</td>
                                            <td>{metrics.p95 || 0}ms</td>
                                            <td>{metrics.median || 0}ms</td>
                                            <td>{run.throughput}/s</td>
                                            <td>
                                                <span className={`status-badge ${run.error_rate > 0 ? 'fail' : 'pass'}`}>
                                                    {run.error_rate}%
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn-report" onClick={() => {
                                                    let detailedResult = {};
                                                    try {
                                                        detailedResult = run.raw_data ? JSON.parse(run.raw_data) : {};
                                                    } catch (e) { console.error('Error parsing raw data', e); }

                                                    setLastResult({
                                                        avg: run.avg_response_time,
                                                        max: run.max_response_time,
                                                        throughput: run.throughput,
                                                        errorRate: run.error_rate,
                                                        median: detailedResult.median || 0,
                                                        p95: detailedResult.p95 || 0,
                                                        p99: detailedResult.p99 || 0,
                                                        timings: detailedResult.timings || { connecting: 0, waiting: 0, receiving: 0, blocked: 0 },
                                                        totalRequests: detailedResult.totalRequests || 0,
                                                        dataReceived: detailedResult.dataReceived || 0,
                                                        dataSent: detailedResult.dataSent || 0,
                                                        statusCodes: detailedResult.statusCodes || {}
                                                    });
                                                    setActiveTab('results');
                                                }}>View</button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PerformanceTesting;
