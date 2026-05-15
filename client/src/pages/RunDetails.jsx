import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

const RunDetails = () => {
    const { runId } = useParams();
    const [activeTab, setActiveTab] = useState('overview');
    const [runData, setRunData] = useState(null);
    const [staticIssues, setStaticIssues] = useState([]);
    const [securityIssues, setSecurityIssues] = useState([]);
    const [defects, setDefects] = useState([]);
    const [complexityMetrics, setComplexityMetrics] = useState([]);
    const [coverageSummary, setCoverageSummary] = useState(null);
    const [testTypeResults, setTestTypeResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRunDetails();
    }, [runId]);

    const fetchRunDetails = async () => {
        try {
            // Fetch run data
            const runRes = await api.get(`/runs/${runId}`);
            setRunData(runRes.data);

            // Fetch static issues
            const staticRes = await api.get(`/runs/${runId}/static-issues`);
            setStaticIssues(staticRes.data || []);

            // Fetch security issues
            const securityRes = await api.get(`/runs/${runId}/security-issues`);
            setSecurityIssues(securityRes.data || []);

            // Fetch defects
            const defectsRes = await api.get(`/defects?run_id=${runId}`);
            setDefects(defectsRes.data || []);

            // Fetch complexity metrics
            const complexityRes = await api.get(`/runs/${runId}/complexity-metrics`);
            setComplexityMetrics(complexityRes.data || []);

            // Fetch coverage summary
            const coverageRes = await api.get(`/runs/${runId}/coverage-summary`);
            setCoverageSummary(coverageRes.data);

            // Fetch test type results
            const typeRes = await api.get(`/runs/${runId}/test-type-results`);
            setTestTypeResults(typeRes.data || []);

            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const downloadReport = async (type, format) => {
        try {
            const response = await api.get(`/reports/${type}/${runId}/${format}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_report_${runId}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert('Failed to download report');
        }
    };

    if (loading) return <div>Loading...</div>;

    // Helper to get result for a specific type
    const getResult = (type) => testTypeResults.find(r => r.test_type === type);

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Test Run #{runId}</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={() => downloadReport('defects', 'pdf')}>
                        📄 Defect PDF
                    </button>
                    <button className="btn btn-primary" onClick={() => downloadReport('defects', 'excel')}>
                        📊 Defect Excel
                    </button>
                    <button className="btn btn-primary" onClick={() => downloadReport('execution', 'pdf')}>
                        📋 Execution PDF
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', overflowX: 'auto' }}>
                    <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                    <button className={`btn ${activeTab === 'static' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('static')}>Static ({staticIssues.length})</button>
                    <button className={`btn ${activeTab === 'security' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('security')}>Security ({securityIssues.length})</button>
                    <button className={`btn ${activeTab === 'complexity' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('complexity')}>Complexity</button>
                    <button className={`btn ${activeTab === 'coverage' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('coverage')}>Coverage</button>
                    {getResult('Performance Testing') && <button className={`btn ${activeTab === 'performance' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('performance')}>Performance</button>}
                    {getResult('Integration Testing') && <button className={`btn ${activeTab === 'integration' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('integration')}>Integration</button>}
                    {getResult('Regression Testing') && <button className={`btn ${activeTab === 'regression' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('regression')}>Regression</button>}
                    <button className={`btn ${activeTab === 'defects' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('defects')}>Defects ({defects.length})</button>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div style={{ marginTop: '1rem' }}>
                        <h3>Run Summary</h3>
                        <div className="stats-grid" style={{ marginTop: '1rem' }}>
                            <div className="stat-card">
                                <span className="stat-label">Status</span>
                                <span className={`stat-value badge badge-${runData?.status === 'Passed' ? 'success' : 'danger'}`}>
                                    {runData?.status || 'Unknown'}
                                </span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Static Issues</span>
                                <span className="stat-value">{staticIssues.length}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Security Issues</span>
                                <span className="stat-value" style={{ color: 'var(--danger)' }}>{securityIssues.length}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Defects Created</span>
                                <span className="stat-value">{defects.length}</span>
                            </div>
                        </div>
                        <div style={{ marginTop: '2rem' }}>
                            <p><strong>Started:</strong> {runData?.started_at ? new Date(runData.started_at).toLocaleString() : 'N/A'}</p>
                            <p><strong>Project ID:</strong> {runData?.project_id || 'N/A'}</p>
                        </div>
                    </div>
                )}

                {/* Static Analysis Tab */}
                {activeTab === 'static' && (
                    <div style={{ marginTop: '1rem' }}>
                        <h3>Static Analysis Issues</h3>
                        {staticIssues.length === 0 ? <p className="text-light">No static analysis issues found.</p> : (
                            <table className="table" style={{ marginTop: '1rem' }}>
                                <thead><tr><th>Severity</th><th>File</th><th>Line</th><th>Rule</th><th>Message</th></tr></thead>
                                <tbody>
                                    {staticIssues.map((issue, i) => (
                                        <tr key={i}>
                                            <td><span className={`badge badge-${issue.severity === 'Error' ? 'danger' : 'warning'}`}>{issue.severity}</span></td>
                                            <td>{issue.file}</td>
                                            <td>{issue.line}</td>
                                            <td><code>{issue.rule}</code></td>
                                            <td>{issue.message}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div style={{ marginTop: '1rem' }}>
                        <h3>Security Vulnerabilities</h3>
                        {securityIssues.length === 0 ? <p className="text-light">No security vulnerabilities found.</p> : (
                            <table className="table" style={{ marginTop: '1rem' }}>
                                <thead><tr><th>Severity</th><th>Package/File</th><th>Rule</th><th>Description</th></tr></thead>
                                <tbody>
                                    {securityIssues.map((issue, i) => (
                                        <tr key={i}>
                                            <td><span className={`badge badge-${issue.severity === 'critical' || issue.severity === 'high' ? 'danger' : 'warning'}`}>{issue.severity}</span></td>
                                            <td>{issue.file}</td>
                                            <td><code>{issue.rule}</code></td>
                                            <td>{issue.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Complexity Tab */}
                {activeTab === 'complexity' && (
                    <div style={{ marginTop: '1rem' }}>
                        <h3>Complexity Metrics</h3>
                        {complexityMetrics.length === 0 ? <p className="text-light">No complexity metrics available.</p> : (
                            <table className="table" style={{ marginTop: '1rem' }}>
                                <thead><tr><th>File</th><th>Complexity</th><th>Maintainability</th></tr></thead>
                                <tbody>
                                    {complexityMetrics.map((metric, i) => (
                                        <tr key={i}>
                                            <td>{metric.file}</td>
                                            <td><span className={`badge badge-${metric.complexity_score > 10 ? 'danger' : 'success'}`}>{metric.complexity_score}</span></td>
                                            <td>{metric.maintainability_index}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Coverage Tab */}
                {activeTab === 'coverage' && (
                    <div style={{ marginTop: '1rem' }}>
                        <h3>Code Coverage</h3>
                        {coverageSummary ? (
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <span className="stat-label">Line Coverage</span>
                                    <span className={`stat-value ${coverageSummary.lines_covered / coverageSummary.lines_total < 0.6 ? 'text-danger' : 'text-success'}`}>
                                        {Math.round((coverageSummary.lines_covered / coverageSummary.lines_total) * 100)}%
                                    </span>
                                    <span className="text-light text-sm">{coverageSummary.lines_covered}/{coverageSummary.lines_total} lines</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-label">Branch Coverage</span>
                                    <span className="stat-value">{Math.round((coverageSummary.branches_covered / coverageSummary.branches_total) * 100)}%</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-label">Function Coverage</span>
                                    <span className="stat-value">{Math.round((coverageSummary.functions_covered / coverageSummary.functions_total) * 100)}%</span>
                                </div>
                            </div>
                        ) : <p className="text-light">No coverage data available.</p>}
                    </div>
                )}

                {/* Performance Tab */}
                {activeTab === 'performance' && getResult('Performance Testing') && (
                    <div style={{ marginTop: '1rem' }}>
                        <h3>Performance Results</h3>
                        {(() => {
                            const result = getResult('Performance Testing');
                            const details = JSON.parse(result.details);
                            return (
                                <div>
                                    <div className="stats-grid">
                                        <div className="stat-card">
                                            <span className="stat-label">Avg Response Time</span>
                                            <span className="stat-value">{details.avgResponseTime}ms</span>
                                        </div>
                                        <div className="stat-card">
                                            <span className="stat-label">Passed</span>
                                            <span className="stat-value text-success">{details.passed}</span>
                                        </div>
                                        <div className="stat-card">
                                            <span className="stat-label">Failed</span>
                                            <span className="stat-value text-danger">{details.failed}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Integration Tab */}
                {activeTab === 'integration' && getResult('Integration Testing') && (
                    <div style={{ marginTop: '1rem' }}>
                        <h3>Integration Results</h3>
                        {(() => {
                            const result = getResult('Integration Testing');
                            const details = JSON.parse(result.details);
                            return (
                                <div>
                                    <p>Total Tests: {details.total} | Passed: {details.passed} | Failed: {details.failed}</p>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Regression Tab */}
                {activeTab === 'regression' && getResult('Regression Testing') && (
                    <div style={{ marginTop: '1rem' }}>
                        <h3>Regression Results</h3>
                        {(() => {
                            const result = getResult('Regression Testing');
                            const details = JSON.parse(result.details);
                            return (
                                <div>
                                    <div className="stats-grid">
                                        <div className="stat-card">
                                            <span className="stat-label">New Regressions</span>
                                            <span className={`stat-value ${details.totalRegressions > 0 ? 'text-danger' : 'text-success'}`}>{details.totalRegressions}</span>
                                        </div>
                                        <div className="stat-card">
                                            <span className="stat-label">Improvements</span>
                                            <span className="stat-value text-success">{details.totalImprovements}</span>
                                        </div>
                                    </div>
                                    {details.comparedWithRun && <p className="text-light" style={{ marginTop: '1rem' }}>Compared with Run #{details.comparedWithRun}</p>}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Defects Tab */}
                {activeTab === 'defects' && (
                    <div style={{ marginTop: '1rem' }}>
                        <h3>Auto-Created Defects</h3>
                        {defects.length === 0 ? <p className="text-light">No defects created for this run.</p> : (
                            <table className="table" style={{ marginTop: '1rem' }}>
                                <thead><tr><th>ID</th><th>Title</th><th>Severity</th><th>Priority</th><th>Status</th><th>Created</th></tr></thead>
                                <tbody>
                                    {defects.map((defect) => (
                                        <tr key={defect.defect_id}>
                                            <td>{defect.defect_id}</td>
                                            <td>{defect.title}</td>
                                            <td><span className={`badge badge-${defect.severity === 'High' || defect.severity === 'Critical' ? 'danger' : 'warning'}`}>{defect.severity}</span></td>
                                            <td>{defect.priority}</td>
                                            <td>{defect.status}</td>
                                            <td>{new Date(defect.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RunDetails;
