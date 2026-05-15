import { useState } from 'react';
import api from '../api';

const SecurityDashboard = ({ data }) => {
    if (!data) return null;

    const { summary, riskRating, findings, targetUrl, scanTime } = data;

    const riskColor =
        riskRating === 'HIGH' ? '#ef4444' :
            riskRating === 'MEDIUM' ? '#f59e0b' : '#10b981';

    return (
        <div style={{ marginTop: '2rem', color: '#fff' }}>
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', borderLeft: `8px solid ${riskColor}` }}>
                <h2 style={{ margin: 0, fontSize: '1.8rem' }}>🛡️ Security Audit Report</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', color: '#94a3b8' }}>
                    <span>Target: {targetUrl}</span>
                    <span>Scan Time: {scanTime}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center', padding: '1.5rem', background: '#0f172a' }}>
                    <h4 style={{ color: '#94a3b8', margin: 0 }}>Overall Risk</h4>
                    <h2 style={{ color: riskColor, fontSize: '2rem', margin: '0.5rem 0' }}>{riskRating}</h2>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '1.5rem', background: '#0f172a' }}>
                    <h4 style={{ color: '#ef4444', margin: 0 }}>High Severity</h4>
                    <h2 style={{ color: '#fff', fontSize: '2rem', margin: '0.5rem 0' }}>{summary.high}</h2>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '1.5rem', background: '#0f172a' }}>
                    <h4 style={{ color: '#f59e0b', margin: 0 }}>Medium Severity</h4>
                    <h2 style={{ color: '#fff', fontSize: '2rem', margin: '0.5rem 0' }}>{summary.medium}</h2>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '1.5rem', background: '#0f172a' }}>
                    <h4 style={{ color: '#10b981', margin: 0 }}>Low Severity</h4>
                    <h2 style={{ color: '#fff', fontSize: '2rem', margin: '0.5rem 0' }}>{summary.low}</h2>
                </div>
            </div>

            <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginBottom: '1rem' }}>🔍 Detailed Findings</h3>

            {findings.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: '#0f172a', borderRadius: '8px' }}>
                    <h3>✅ No Vulnerabilities Found</h3>
                    <p>The security smoke test did not detect any obvious issues.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {findings.map((item, idx) => (
                        <div key={idx} style={{ background: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
                            <div style={{ padding: '1rem', background: item.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : item.severity === 'MEDIUM' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{item.title}</h3>
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '999px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    background: item.severity === 'HIGH' ? '#ef4444' : item.severity === 'MEDIUM' ? '#f59e0b' : '#10b981',
                                    color: '#fff'
                                }}>
                                    {item.severity}
                                </span>
                            </div>
                            <div style={{ padding: '1rem' }}>
                                <p style={{ color: '#e2e8f0', marginBottom: '0.5rem' }}><strong>Description:</strong> {item.description}</p>
                                <p style={{ color: '#94a3b8', margin: 0 }}><strong>Recommendation:</strong> {item.recommendation}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const EcommerceDashboard = ({ data }) => {
    if (!data) return null;
    const { summary, steps, scanTime } = data;
    const isPassed = summary.failed === 0;
    const statusColor = isPassed ? '#10b981' : '#ef4444';

    return (
        <div style={{ marginTop: '2rem', color: '#fff' }}>
            {/* Header */}
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', borderLeft: `8px solid ${statusColor}` }}>
                <h2 style={{ margin: 0, fontSize: '1.8rem' }}>🛍️ E-Commerce Test Report</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', color: '#94a3b8' }}>
                    <span>SauceDemo E2E Suite</span>
                    <span>Executed: {scanTime}</span>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center', padding: '1.5rem', background: '#0f172a' }}>
                    <h4 style={{ color: '#94a3b8', margin: 0 }}>Result</h4>
                    <h2 style={{ color: statusColor, fontSize: '2rem', margin: '0.5rem 0' }}>{isPassed ? 'PASSED' : 'FAILED'}</h2>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '1.5rem', background: '#0f172a' }}>
                    <h4 style={{ color: '#10b981', margin: 0 }}>Steps Passed</h4>
                    <h2 style={{ color: '#fff', fontSize: '2rem', margin: '0.5rem 0' }}>{summary.passed}</h2>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '1.5rem', background: '#0f172a' }}>
                    <h4 style={{ color: '#ef4444', margin: 0 }}>Steps Failed</h4>
                    <h2 style={{ color: '#fff', fontSize: '2rem', margin: '0.5rem 0' }}>{summary.failed}</h2>
                </div>
            </div>

            {/* Steps Timeline */}
            <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginBottom: '1rem' }}>📍 Execution Steps</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {steps.map((step, idx) => (
                    <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        background: '#1e293b',
                        padding: '1rem',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${step.status === 'PASSED' ? '#10b981' : '#ef4444'}`
                    }}>
                        <div style={{
                            width: '32px', height: '32px',
                            borderRadius: '50%',
                            background: step.status === 'PASSED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: step.status === 'PASSED' ? '#10b981' : '#ef4444',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 'bold'
                        }}>
                            {idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, color: '#f8fafc' }}>{step.step}</h4>
                            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>{step.description}</p>
                            {step.error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem' }}>Error: {step.error}</p>}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                            {step.timestamp}
                        </div>
                        <div style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '4px',
                            background: step.status === 'PASSED' ? '#10b981' : '#ef4444',
                            color: '#fff',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                        }}>
                            {step.status}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const EcommerceAutomation = ({ initialMode = 'sauce' }) => {
    const [mode] = useState(initialMode);
    const [targetUrl, setTargetUrl] = useState('https://google-gruyere.appspot.com/part1');
    const [running, setRunning] = useState(false);
    const [securityData, setSecurityData] = useState(null);
    const [ecommerceData, setEcommerceData] = useState(null);
    const [logs, setLogs] = useState('');

    const runTest = async () => {
        setRunning(true);
        setSecurityData(null);
        setEcommerceData(null);

        if (mode === 'security') {
            setLogs(`🚀 Initializing Security Smoke Test for: ${targetUrl}...\n`);
        } else {
            setLogs('🚀 Initializing E2E Automation Suite (SauceDemo)...\n');
        }

        try {
            const payload = { targetUrl, testType: mode };
            const res = await api.post('/ecommerce/run', payload);
            const data = res.data;

            if (data.success) {
                setLogs(prev => prev + '✅ Test Execution Completed!\n');

                if (data.securityData) {
                    setSecurityData(data.securityData);
                    setLogs(prev => prev + '✅ Security Analysis Ready.\n');
                }
                if (data.ecommerceData) {
                    setEcommerceData(data.ecommerceData);
                    setLogs(prev => prev + '✅ E-Commerce Report Ready.\n');
                }
            } else {
                setLogs(prev => prev + '❌ Test Execution Failed (Check Console).\n');
            }
        } catch (err) {
            setLogs(prev => prev + `❌ Error: ${err.response?.data?.error || err.message}\n`);
            if (err.response?.data?.details) {
                setLogs(prev => prev + `Details: ${err.response.data.details}\n`);
            }
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="ecommerce-automation">
            <h1>
                {mode === 'security' ? '🛡️ Security Smoke Testing Tool' : '🛍️ E-Commerce Automation'}
            </h1>
            <p className="text-muted">
                {mode === 'security'
                    ? 'Perform a comprehensive security smoke test on any target website.'
                    : 'Run automated end-to-end purchasing flows on SauceDemo.'}
            </p>

            <div className="card" style={{ marginBottom: '2rem' }}>

                {mode === 'security' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-light)' }}>Target Website URL</label>
                        <input
                            type="text"
                            className="input"
                            value={targetUrl}
                            onChange={(e) => setTargetUrl(e.target.value)}
                            placeholder="https://example.com"
                        />
                    </div>
                )}

                <button
                    className={`btn ${mode === 'security' ? 'btn-danger' : 'btn-primary'}`}
                    onClick={runTest}
                    disabled={running}
                    style={{ width: 'auto', minWidth: '200px' }}
                >
                    {running
                        ? '⏳ Running Analysis...'
                        : (mode === 'security' ? '▶ Start Security Scan' : '▶ Run E-Commerce Test')}
                </button>

                {logs && !securityData && !ecommerceData && (
                    <div className="logs" style={{ marginTop: '1rem', background: '#222', padding: '1rem', borderRadius: '5px', color: '#0f0', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                        {logs}
                    </div>
                )}
            </div>

            {/* Dynamic Dashboard Rendering */}
            {mode === 'security' && securityData && <SecurityDashboard data={securityData} />}
            {mode !== 'security' && ecommerceData && <EcommerceDashboard data={ecommerceData} />}

        </div >
    );
};

export default EcommerceAutomation;
