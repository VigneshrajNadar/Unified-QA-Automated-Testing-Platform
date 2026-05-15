import { useState, useEffect } from 'react';
import api from '../api';

const WebMonitor = () => {
    const [url, setUrl] = useState('');
    const [scanning, setScanning] = useState(false);
    const [history, setHistory] = useState([]);
    const [selectedScan, setSelectedScan] = useState(null);
    const [linkDetails, setLinkDetails] = useState([]);

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 5000); // Polling for updates
        return () => clearInterval(interval);
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/monitor/history');
            setHistory(res.data);

            // If a scan is selected, refresh its details if it's running
            if (selectedScan && selectedScan.status === 'Running') {
                fetchScanDetails(selectedScan.job_id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchScanDetails = async (id) => {
        try {
            const res = await api.get(`/monitor/${id}`);
            setSelectedScan(res.data);
            setLinkDetails(res.data.links);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteScan = async (e, id) => {
        if (e && e.preventDefault) e.preventDefault();
        if (e && e.stopPropagation) e.stopPropagation();

        if (!window.confirm('Delete this scan record?')) return;

        try {
            console.log('Sending delete request for ID:', id);
            await api.delete(`/monitor/${id}`);
            if (selectedScan?.job_id === id) setSelectedScan(null);

            // Force refresh history immediately and after small delay
            fetchHistory();
            setTimeout(fetchHistory, 500);
        } catch (err) {
            console.error(err);
            alert('Failed to delete scan: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleStartScan = async (e) => {
        e.preventDefault();
        if (!url) return alert('Please enter a URL');

        setScanning(true);
        try {
            await api.post('/monitor/start', { url });
            setUrl('');
            fetchHistory();
            alert('Scan Started! It may take a few minutes.');
        } catch (err) {
            alert('Failed to start scan.');
        } finally {
            setScanning(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 90) return 'text-success';
        if (score >= 70) return 'text-warning';
        return 'text-danger';
    };

    return (
        <div className="web-monitor">
            <h1>🕸️ Selenium Web Monitor & Link Checker</h1>

            {/* Input Section */}
            <div className="card">
                <form onSubmit={handleStartScan} style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="url"
                        className="form-control"
                        placeholder="Enter Website URL (e.g., https://example.com)"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        required
                    />
                    <button type="submit" className="btn btn-primary" disabled={scanning} style={{ width: 'auto' }}>
                        {scanning ? 'Starting...' : '🔎 Start Scan'}
                    </button>
                </form>
            </div>

            <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>

                {/* Recent Scans List */}
                <div style={{ flex: 1 }}>
                    <h3>Recent Scans</h3>
                    <div className="scan-list">
                        {history.map(job => (
                            <div
                                key={job.job_id}
                                className={`card scan-item ${selectedScan?.job_id === job.job_id ? 'active' : ''}`}
                                onClick={() => fetchScanDetails(job.job_id)}
                                style={{ cursor: 'pointer', marginBottom: '1rem' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <strong>{job.url}</strong>
                                    <div>
                                        <span className={`badge ${job.status.toLowerCase()}`}>{job.status}</span>
                                        <button
                                            onClick={(e) => handleDeleteScan(e, job.job_id)}
                                            style={{
                                                marginLeft: '0.5rem',
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#ff4444',
                                                cursor: 'pointer',
                                                fontSize: '1.1rem'
                                            }}
                                            title="Delete Scan"
                                        >
                                            ❌
                                        </button>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '0.5rem' }}>
                                    {new Date(job.created_at).toLocaleString()}
                                </div>
                                {job.status === 'Completed' && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <b className={getScoreColor(job.health_score)}>Health: {job.health_score}%</b>
                                        <span style={{ marginLeft: '1rem' }}>🔗 {job.total_links} Links</span>
                                        <span style={{ marginLeft: '1rem', color: '#ff4444' }}>❌ {job.broken_links} Broken</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scan Details & Link Table */}
                <div style={{ flex: 2 }}>
                    {selectedScan ? (
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3>Results for {selectedScan.url}</h3>
                                {selectedScan.status === 'Completed' && (
                                    <h2 className={getScoreColor(selectedScan.health_score)}>
                                        Score: {selectedScan.health_score}%
                                    </h2>
                                )}
                            </div>

                            {linkDetails.length > 0 ? (
                                <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Status</th>
                                                <th>Code</th>
                                                <th>URL</th>
                                                <th>Time (ms)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {linkDetails.map(link => (
                                                <tr key={link.result_id}>
                                                    <td>
                                                        <span className={`badge ${link.status.toLowerCase()}`}>
                                                            {link.status}
                                                        </span>
                                                    </td>
                                                    <td>{link.status_code}</td>
                                                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a>
                                                    </td>
                                                    <td>{link.response_time}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p>No link data available yet...</p>
                            )}
                        </div>
                    ) : (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <p>Select a scan from the left to view details.</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .badge.valid { background: #28a745; color: white; }
                .badge.broken { background: #dc3545; color: white; }
                .badge.redirect { background: #ffc107; color: black; }
                .scan-item:hover { transform: translateY(-2px); transition: 0.2s; }
                .scan-item.active { border: 2px solid var(--primary); }
                .text-success { color: #28a745; }
                .text-warning { color: #ffc107; }
                .text-danger { color: #dc3545; }
            `}</style>
        </div>
    );
};

export default WebMonitor;
