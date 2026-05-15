import React, { useState, useEffect } from 'react';
import api from '../api';
import { FaShieldAlt, FaCode, FaGlobe, FaBug, FaCheckCircle, FaExclamationTriangle, FaTimes, FaSync, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import './SecurityTesting.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const SecurityTesting = () => {
    const [activeTab, setActiveTab] = useState('dast');
    const [targetUrl, setTargetUrl] = useState('');
    const [sastFile, setSastFile] = useState(null);
    const [sastText, setSastText] = useState('');
    const [loading, setLoading] = useState(false);
    const [scans, setScans] = useState([]);
    const [selectedScan, setSelectedScan] = useState(null);
    const [expandedFinding, setExpandedFinding] = useState(null);

    useEffect(() => {
        loadScans();
        const interval = setInterval(loadScans, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedScan?.status === 'Running') {
            const interval = setInterval(async () => {
                try {
                    const res = await api.get(`/security/scans/${selectedScan.scan_id}`);
                    if (res.data.status !== 'Running' || (res.data.findings?.length || 0) !== (selectedScan.findings?.length || 0)) {
                        setSelectedScan(res.data);
                        loadScans();
                    }
                } catch (err) { }
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [selectedScan]);

    const loadScans = async () => {
        try {
            const res = await api.get('/security/scans');
            setScans(res.data);
        } catch (err) { console.error(err); }
    };

    const deleteScan = async (e, scanId) => {
        e.stopPropagation();
        if (!window.confirm("Delete this scan record?")) return;
        try {
            await api.delete(`/security/scans/${scanId}`);
            loadScans();
            if (selectedScan?.scan_id === scanId) setSelectedScan(null);
        } catch (err) { alert("Error deleting scan"); }
    };

    const handleDastScan = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/security/scan/dast', { url: targetUrl });
            setTargetUrl('');
            loadScans();
            alert("DAST Scan Started!");
        } catch (err) { alert("Error: " + err.message); }
        finally { setLoading(false); }
    };

    const handleSastScan = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData();
        if (sastFile) formData.append('codeFile', sastFile);
        else formData.append('code', sastText);

        try {
            await api.post('/security/scan/sast', formData);
            setSastFile(null);
            setSastText('');
            loadScans();
            alert("SAST Scan Started!");
        } catch (err) { alert("Error: " + err.message); }
        finally { setLoading(false); }
    };

    const viewDetails = async (scanId) => {
        try {
            const res = await api.get(`/security/scans/${scanId}`);
            setSelectedScan(res.data);
            setExpandedFinding(null); // Reset
        } catch (err) { }
    };

    const getChartData = (scan) => {
        return {
            labels: ['Critical', 'High', 'Medium', 'Low'],
            datasets: [{
                data: [scan.critical_count || 0, scan.high_count || 0, scan.medium_count || 0, scan.low_count || 0],
                backgroundColor: ['#ef4444', '#f97316', '#eab308', '#3b82f6'],
                borderWidth: 0
            }]
        };
    };

    return (
        <div className="page-content security-page">
            <div className="security-header">
                <h1><FaShieldAlt className="text-primary" /> Security Vulnerability Suite</h1>
                <p className="text-light">Advanced SAST & DAST scanning with OWASP Top 10 coverage.</p>
            </div>

            <div className="security-grid">

                {/* LEFT COLUMN */}
                <div className="security-sidebar">
                    {/* INPUT CARD */}
                    <div className="card mb-6">
                        <div className="scan-controls">
                            <button className={`scan-tab ${activeTab === 'dast' ? 'active' : ''}`} onClick={() => setActiveTab('dast')}>
                                <FaGlobe /> DAST (URL)
                            </button>
                            <button className={`scan-tab ${activeTab === 'sast' ? 'active' : ''}`} onClick={() => setActiveTab('sast')}>
                                <FaCode /> SAST (Code)
                            </button>
                        </div>

                        {activeTab === 'dast' ? (
                            <form onSubmit={handleDastScan} className="scan-form">
                                <div className="form-group">
                                    <label>Target URL</label>
                                    <input
                                        type="url"
                                        required
                                        placeholder="http://example.com"
                                        className="input"
                                        value={targetUrl}
                                        onChange={e => setTargetUrl(e.target.value)}
                                    />
                                    <small className="text-dim mt-2 block">SQLi, XSS, Traversal, Admin, Privacy...</small>
                                </div>
                                <button type="submit" disabled={loading} className="btn btn-primary w-full">
                                    {loading ? 'Scanning...' : '🚀 Start DAST Scan'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleSastScan} className="scan-form">
                                <div className="form-group">
                                    <label>Upload File (JS/PY/TXT)</label>
                                    <input type="file" className="input" onChange={e => setSastFile(e.target.files[0])} />
                                </div>
                                <div className="text-center text-dim">- OR -</div>
                                <div className="form-group">
                                    <label>Paste Code Snippet</label>
                                    <textarea
                                        className="input"
                                        style={{ height: '120px', resize: 'vertical' }}
                                        placeholder="const password = '...'"
                                        value={sastText}
                                        onChange={e => setSastText(e.target.value)}
                                    ></textarea>
                                    <small className="text-dim mt-2 block">Secrets, DOM XSS, SSRF, NoSQLi...</small>
                                </div>
                                <button type="submit" disabled={loading} className="btn btn-primary w-full">
                                    {loading ? 'Analyzing...' : '🔍 Start SAST Analysis'}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* HISTORY CARD */}
                    <div className="card">
                        <div className="history-header">
                            <h3>History</h3>
                            <button onClick={loadScans} className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                                <FaSync />
                            </button>
                        </div>
                        <div className="history-list">
                            {scans.length === 0 && <p className="text-dim text-center py-4">No scans recorded.</p>}
                            {scans.map(scan => (
                                <div
                                    key={scan.scan_id}
                                    onClick={() => viewDetails(scan.scan_id)}
                                    className={`scan-item ${selectedScan?.scan_id === scan.scan_id ? 'active' : ''}`}
                                >
                                    <div className="scan-meta">
                                        <div className="scan-target" title={scan.target}>
                                            {scan.scan_type === 'SAST' ? <FaCode className="text-success mr-2" /> : <FaGlobe className="text-primary mr-2" />}
                                            {scan.target}
                                        </div>
                                        <span className={`badge ${scan.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                                            {scan.status}
                                        </span>
                                    </div>
                                    <div className="scan-info">
                                        <span>{new Date(scan.scanned_at || Date.now()).toLocaleTimeString()}</span>
                                        {scan.status === 'Completed' && (
                                            <span style={{ color: scan.risk_score > 70 ? 'var(--danger)' : 'var(--success)' }}>
                                                Risk: {scan.risk_score}
                                            </span>
                                        )}
                                    </div>
                                    <button onClick={(e) => deleteScan(e, scan.scan_id)} className="delete-btn" title="Delete">
                                        <FaTimes />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="security-main">
                    {selectedScan ? (
                        <div className="card animate-fade-in">
                            <div className="results-header">
                                <div className="chart-container">
                                    <Pie data={getChartData(selectedScan)} options={{ plugins: { legend: { display: false } } }} />
                                </div>
                                <div className="results-info flex-1">
                                    <h2>Scan Result #{selectedScan.scan_id}</h2>
                                    <p className="text-dim mb-4">Target: <span className="text-primary font-mono">{selectedScan.target}</span></p>

                                    <div className="risk-score">
                                        <div className="score-val" style={{ color: selectedScan.risk_score > 75 ? 'var(--danger)' : 'var(--success)' }}>
                                            {selectedScan.risk_score || 0}
                                        </div>
                                        <div className="score-label">Risk Score</div>
                                        <div className="text-dim text-xs mt-1">Findings: {selectedScan.critical_count + selectedScan.high_count + selectedScan.medium_count + selectedScan.low_count}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="stats-grid mb-6">
                                <div className="stat-card" style={{ borderLeftColor: '#ef4444' }}>
                                    <div className="stat-label">Critical</div>
                                    <div className="stat-value text-danger">{selectedScan.critical_count || 0}</div>
                                </div>
                                <div className="stat-card" style={{ borderLeftColor: '#f97316' }}>
                                    <div className="stat-label">High</div>
                                    <div className="stat-value" style={{ color: '#f97316' }}>{selectedScan.high_count || 0}</div>
                                </div>
                                <div className="stat-card" style={{ borderLeftColor: '#eab308' }}>
                                    <div className="stat-label">Medium</div>
                                    <div className="stat-value" style={{ color: '#eab308' }}>{selectedScan.medium_count || 0}</div>
                                </div>
                                <div className="stat-card" style={{ borderLeftColor: '#3b82f6' }}>
                                    <div className="stat-label">Low</div>
                                    <div className="stat-value" style={{ color: '#3b82f6' }}>{selectedScan.low_count || 0}</div>
                                </div>
                            </div>

                            <h3 className="mb-4">Detailed Findings</h3>
                            <div className="findings-list">
                                {(!selectedScan.findings || selectedScan.findings.length === 0) && (
                                    <p className="text-dim italic">No vulnerabilities found.</p>
                                )}
                                {selectedScan.findings?.map(finding => (
                                    <div key={finding.finding_id} className="finding-item">
                                        <div
                                            className="finding-header"
                                            onClick={() => setExpandedFinding(expandedFinding === finding.finding_id ? null : finding.finding_id)}
                                        >
                                            <span className={`severity-pill sev-${finding.severity}`}>{finding.severity}</span>
                                            <span className="finding-title">{finding.vulnerability_type}</span>
                                            {expandedFinding === finding.finding_id ? <FaChevronUp className="text-dim" /> : <FaChevronDown className="text-dim" />}
                                        </div>
                                        {expandedFinding === finding.finding_id && (
                                            <div className="finding-body animate-slide-up">
                                                <p className="mb-2"><strong>Description:</strong> {finding.description}</p>
                                                <div className="finding-loc">{finding.location}</div>
                                                <div className="remediation-box">
                                                    <FaCheckCircle className="flex-shrink-0 mt-1" />
                                                    <span><strong>Remediation:</strong> {finding.remediation}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="card text-center py-12 flex flex-col items-center justify-center h-full">
                            <FaShieldAlt size={64} className="text-dim mb-4" />
                            <h2>Select a Scan</h2>
                            <p className="text-dim">Choose a scan from history or start a new one.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecurityTesting;
