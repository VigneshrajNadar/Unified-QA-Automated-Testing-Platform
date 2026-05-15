import { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const AutoTest = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [file, setFile] = useState(null);
    const [gitUrl, setGitUrl] = useState('');
    const [mode, setMode] = useState('upload'); // 'upload' or 'git'
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [activeTab, setActiveTab] = useState('terminal');
    const [selectedTests, setSelectedTests] = useState({
        unit: true,
        static: true,
        security: true,
        complexity: true,
        coverage: true,
        performance: false,
        integration: false,
        regression: false
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleTestSelection = (type) => {
        setSelectedTests(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    const handleExecute = async () => {
        if (!selectedProject) {
            alert('Please select a project first. Tests must be linked to a project.');
            return;
        }

        if (mode === 'upload' && !file) {
            alert('Please upload a .zip file');
            return;
        }
        if (mode === 'git' && !gitUrl) {
            alert('Please enter a GitHub URL');
            return;
        }

        const formData = new FormData();
        formData.append('projectId', selectedProject);

        if (mode === 'upload' && file) {
            formData.append('projectFile', file);
        } else if (mode === 'git') {
            formData.append('gitUrl', gitUrl);
        }

        // Send selected tests as JSON string
        const testsToRun = Object.keys(selectedTests).filter(key => selectedTests[key]);
        formData.append('selectedTests', JSON.stringify(testsToRun));

        setLoading(true);
        setResults(null);

        try {
            const res = await api.post('/autotest/execute', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResults(res.data);
        } catch (err) {
            console.error(err);
            alert('Execution failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <h1>Automated Code Testing Platform</h1>
            <p className="text-light">Select testing types and upload your project or provide a GitHub URL.</p>

            <div className="card" style={{ marginTop: '2rem' }}>
                <div className="form-group">
                    <label>Select Project <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <select
                        className="input"
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        style={{ borderColor: !selectedProject ? 'var(--danger)' : 'var(--glass-border)' }}
                    >
                        <option value="">-- Select a Project (Required) --</option>
                        {projects.map(p => (
                            <option key={p.project_id} value={p.project_id}>{p.name}</option>
                        ))}
                    </select>
                    {!selectedProject && (
                        <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                            ⚠️ A project must be selected to save test results
                        </p>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', justifyContent: 'flex-start' }}>
                    <button
                        className={`btn ${mode === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setMode('upload')}
                        style={{ width: 'auto', flex: '0 0 auto' }}
                    >
                        📁 File Upload (.zip)
                    </button>
                    <button
                        className={`btn ${mode === 'git' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setMode('git')}
                        style={{ width: 'auto', flex: '0 0 auto' }}
                    >
                        🐙 GitHub URL
                    </button>
                </div>

                {mode === 'upload' ? (
                    <div className="form-group">
                        <label>Upload Project (.zip)</label>
                        <input
                            type="file"
                            className="input"
                            accept=".zip"
                            onChange={handleFileChange}
                        />
                    </div>
                ) : (
                    <div className="form-group">
                        <label>GitHub Repository URL</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="https://github.com/username/repo.git"
                            value={gitUrl}
                            onChange={(e) => setGitUrl(e.target.value)}
                        />
                    </div>
                )}

                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                    <label style={{ marginBottom: '1rem', display: 'block' }}>Select Testing Types</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div className="checkbox-card">
                            <input type="checkbox" checked={selectedTests.unit} onChange={() => handleTestSelection('unit')} />
                            <span>Unit Testing</span>
                        </div>
                        <div className="checkbox-card">
                            <input type="checkbox" checked={selectedTests.static} onChange={() => handleTestSelection('static')} />
                            <span>Static Analysis</span>
                        </div>
                        <div className="checkbox-card">
                            <input type="checkbox" checked={selectedTests.security} onChange={() => handleTestSelection('security')} />
                            <span>Security Scan</span>
                        </div>
                        <div className="checkbox-card">
                            <input type="checkbox" checked={selectedTests.complexity} onChange={() => handleTestSelection('complexity')} />
                            <span>Complexity Analysis</span>
                        </div>
                        <div className="checkbox-card">
                            <input type="checkbox" checked={selectedTests.coverage} onChange={() => handleTestSelection('coverage')} />
                            <span>Code Coverage</span>
                        </div>
                        <div className="checkbox-card">
                            <input type="checkbox" checked={selectedTests.performance} onChange={() => handleTestSelection('performance')} />
                            <span>Performance (API)</span>
                        </div>
                        <div className="checkbox-card">
                            <input type="checkbox" checked={selectedTests.integration} onChange={() => handleTestSelection('integration')} />
                            <span>Integration Testing</span>
                        </div>
                        <div className="checkbox-card">
                            <input type="checkbox" checked={selectedTests.regression} onChange={() => handleTestSelection('regression')} />
                            <span>Regression Testing</span>
                        </div>
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleExecute}
                    disabled={loading}
                    style={{ marginTop: '1.5rem', width: 'auto', minWidth: '200px' }}
                >
                    {loading ? 'Running Selected Tests...' : '🚀 Start Automation Pipeline'}
                </button>
            </div>

            {loading && (
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <div className="spinner"></div>
                    <p style={{ marginTop: '1rem' }}>Executing Selected Tests...</p>
                </div>
            )}

            {results && (
                <div className="card" style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ margin: 0 }}>Execution Results</h2>
                        {results.runId && (
                            <button className="btn btn-secondary" onClick={() => navigate(`/runs/${results.runId}`)}>
                                View Full Report
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', overflowX: 'auto' }}>
                        <button className={`btn ${activeTab === 'terminal' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('terminal')}>Terminal</button>
                        {selectedTests.unit && <button className={`btn ${activeTab === 'unit' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('unit')}>Unit Tests</button>}
                        {selectedTests.static && <button className={`btn ${activeTab === 'static' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('static')}>Static</button>}
                        {selectedTests.security && <button className={`btn ${activeTab === 'security' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('security')}>Security</button>}
                        {selectedTests.complexity && <button className={`btn ${activeTab === 'complexity' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('complexity')}>Complexity</button>}
                        {selectedTests.coverage && <button className={`btn ${activeTab === 'coverage' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('coverage')}>Coverage</button>}
                        {selectedTests.performance && <button className={`btn ${activeTab === 'performance' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('performance')}>Performance</button>}
                        {selectedTests.integration && <button className={`btn ${activeTab === 'integration' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('integration')}>Integration</button>}
                        {selectedTests.regression && <button className={`btn ${activeTab === 'regression' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('regression')}>Regression</button>}
                    </div>

                    <div style={{ marginTop: '1rem', maxHeight: '500px', overflow: 'auto' }}>
                        {activeTab === 'terminal' && (
                            <pre style={{ background: '#1e1e1e', color: '#0f0', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace' }}>
                                {results.logs.join('\n')}
                            </pre>
                        )}

                        {activeTab === 'static' && (
                            <div>
                                {results.results.staticAnalysis?.length > 0 ? (
                                    <table className="table">
                                        <thead><tr><th>Severity</th><th>File</th><th>Rule</th><th>Message</th></tr></thead>
                                        <tbody>
                                            {results.results.staticAnalysis.map((issue, i) => (
                                                <tr key={i}>
                                                    <td><span className={`badge badge-${issue.severity === 'Error' ? 'danger' : 'warning'}`}>{issue.severity}</span></td>
                                                    <td>{issue.file}:{issue.line}</td>
                                                    <td>{issue.rule}</td>
                                                    <td>{issue.message}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--success)' }}>
                                        <h3 style={{ color: 'var(--success)' }}>✅ No Static Analysis Issues</h3>
                                        <p style={{ color: 'var(--text-light)' }}>Your code passed static analysis checks!</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div>
                                {results.results.security?.length > 0 ? (
                                    <table className="table">
                                        <thead><tr><th>Severity</th><th>Package</th><th>Description</th></tr></thead>
                                        <tbody>
                                            {results.results.security.map((issue, i) => (
                                                <tr key={i}>
                                                    <td><span className={`badge badge-${issue.severity === 'high' || issue.severity === 'critical' ? 'danger' : 'warning'}`}>{issue.severity}</span></td>
                                                    <td>{issue.rule}</td>
                                                    <td>{issue.description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                                        <h3 style={{ color: 'var(--success)' }}>🔒 No Security Vulnerabilities</h3>
                                        <p style={{ color: 'var(--text-light)' }}>All dependencies are secure!</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'complexity' && (
                            <div>
                                {results.results.complexity?.length > 0 ? (
                                    <table className="table">
                                        <thead><tr><th>File</th><th>Complexity</th><th>Maintainability</th></tr></thead>
                                        <tbody>
                                            {results.results.complexity.map((metric, i) => (
                                                <tr key={i}>
                                                    <td>{metric.file}</td>
                                                    <td><span className={`badge badge-${metric.complexity > 10 ? 'danger' : 'success'}`}>{metric.complexity}</span></td>
                                                    <td>{metric.maintainability}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                                        <h3 style={{ color: 'var(--success)' }}>📊 Excellent Code Complexity</h3>
                                        <p style={{ color: 'var(--text-light)' }}>All functions are within acceptable complexity thresholds!</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'coverage' && (
                            <div>
                                {results.results.coverage && results.results.coverage.lines.total > 0 ? (
                                    <div className="stats-grid">
                                        <div className="stat-card">
                                            <span className="stat-label">Line Coverage</span>
                                            <span className={`stat-value ${results.results.coverage.lines.pct < 60 ? 'text-danger' : 'text-success'}`}>
                                                {results.results.coverage.lines.pct.toFixed(1)}%
                                            </span>
                                            <span className="text-light" style={{ fontSize: '0.85rem' }}>
                                                {results.results.coverage.lines.covered}/{results.results.coverage.lines.total} lines
                                            </span>
                                        </div>
                                        <div className="stat-card">
                                            <span className="stat-label">Branch Coverage</span>
                                            <span className="stat-value">
                                                {results.results.coverage.branches.pct.toFixed(1)}%
                                            </span>
                                            <span className="text-light" style={{ fontSize: '0.85rem' }}>
                                                {results.results.coverage.branches.covered}/{results.results.coverage.branches.total} branches
                                            </span>
                                        </div>
                                        <div className="stat-card">
                                            <span className="stat-label">Function Coverage</span>
                                            <span className="stat-value">
                                                {results.results.coverage.functions.pct.toFixed(1)}%
                                            </span>
                                            <span className="text-light" style={{ fontSize: '0.85rem' }}>
                                                {results.results.coverage.functions.covered}/{results.results.coverage.functions.total} functions
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                                        <h3 style={{ color: 'var(--text-light)' }}>📊 Coverage Data Not Available</h3>
                                        <p style={{ color: 'var(--text-dim)' }}>
                                            This project either has no tests or coverage tools are not configured.
                                            <br />
                                            To generate coverage, add tests and run with: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>nyc npm test</code>
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'performance' && (
                            <div>
                                {results.results.performance && results.results.performance.tested ? (
                                    <div>
                                        <div className="stats-grid">
                                            <div className="stat-card">
                                                <span className="stat-label">Avg Response Time</span>
                                                <span className="stat-value">{results.results.performance.summary.avgResponseTime}ms</span>
                                            </div>
                                            <div className="stat-card">
                                                <span className="stat-label">Passed Endpoints</span>
                                                <span className="stat-value text-success">{results.results.performance.summary.passed}</span>
                                            </div>
                                            <div className="stat-card">
                                                <span className="stat-label">Failed Endpoints</span>
                                                <span className="stat-value text-danger">{results.results.performance.summary.failed}</span>
                                            </div>
                                        </div>
                                        <table className="table" style={{ marginTop: '1rem' }}>
                                            <thead><tr><th>Method</th><th>Path</th><th>Response Time</th><th>Status</th></tr></thead>
                                            <tbody>
                                                {results.results.performance.endpoints.map((ep, i) => (
                                                    <tr key={i}>
                                                        <td>{ep.method}</td>
                                                        <td>{ep.path}</td>
                                                        <td>{ep.responseTime}ms</td>
                                                        <td><span className={`badge badge-${ep.passed ? 'success' : 'danger'}`}>{ep.status}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                                        <h3 style={{ color: 'var(--text-light)' }}>⚡ Performance Testing Not Available</h3>
                                        <p style={{ color: 'var(--text-dim)' }}>
                                            {results.results.performance?.message || 'No server file found or endpoints could not be detected.'}
                                            <br />
                                            Ensure your project has a running server (server.js, app.js, index.js) with Express routes.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'integration' && (
                            <div>
                                {results.results.integration && results.results.integration.tested ? (
                                    <div>
                                        <p>Total Tests: {results.results.integration.summary.total} | Passed: {results.results.integration.summary.passed} | Failed: {results.results.integration.summary.failed}</p>
                                        <table className="table">
                                            <thead><tr><th>Test File</th><th>Status</th></tr></thead>
                                            <tbody>
                                                {results.results.integration.tests.map((test, i) => (
                                                    <tr key={i}>
                                                        <td>{test.file}</td>
                                                        <td><span className={`badge badge-${test.passed ? 'success' : 'danger'}`}>{test.status}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                                        <h3 style={{ color: 'var(--text-light)' }}>🔗 Integration Tests Not Found</h3>
                                        <p style={{ color: 'var(--text-dim)' }}>
                                            {results.results.integration?.message || 'No integration test files found.'}
                                            <br />
                                            Add integration tests with naming pattern: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>*.integration.js</code> or <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>*.int.test.js</code>
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'unit' && (
                            <div>
                                {results.results.unitTests && results.results.unitTests.total > 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                                        <div className="stats-grid">
                                            <div className="stat-card">
                                                <span className="stat-label">Total Tests</span>
                                                <span className="stat-value">{results.results.unitTests.total}</span>
                                            </div>
                                            <div className="stat-card">
                                                <span className="stat-label">Passed</span>
                                                <span className="stat-value" style={{ color: 'var(--success)' }}>{results.results.unitTests.passed}</span>
                                            </div>
                                            <div className="stat-card">
                                                <span className="stat-label">Failed</span>
                                                <span className="stat-value" style={{ color: results.results.unitTests.failed > 0 ? 'var(--danger)' : 'var(--text-light)' }}>{results.results.unitTests.failed}</span>
                                            </div>
                                        </div>
                                        <p style={{ marginTop: '2rem', color: 'var(--text-light)' }}>
                                            {results.results.unitTests.passed === results.results.unitTests.total ?
                                                '✅ All unit tests passed!' :
                                                `⚠️ ${results.results.unitTests.failed} test(s) failed. Check terminal logs for details.`}
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                                        <h3 style={{ color: 'var(--text-light)' }}>🧪 No Unit Tests Found</h3>
                                        <p style={{ color: 'var(--text-dim)' }}>
                                            This project has no unit test files.
                                            <br />
                                            Add tests in a <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>tests/</code> or <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>__tests__/</code> directory
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'regression' && (
                            <div>
                                {results.results.regression && results.results.regression.tested ? (
                                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                                        <div className="stats-grid">
                                            <div className="stat-card">
                                                <span className="stat-label">New Regressions</span>
                                                <span className="stat-value" style={{ color: results.results.regression.summary.totalRegressions > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                                    {results.results.regression.summary.totalRegressions}
                                                </span>
                                            </div>
                                            <div className="stat-card">
                                                <span className="stat-label">Fixed Issues</span>
                                                <span className="stat-value" style={{ color: 'var(--success)' }}>
                                                    {results.results.regression.summary.totalImprovements}
                                                </span>
                                            </div>
                                        </div>
                                        <p style={{ marginTop: '2rem', color: 'var(--text-light)' }}>
                                            {results.results.regression.summary.totalRegressions === 0 ?
                                                '✅ No new regressions detected!' :
                                                `⚠️ ${results.results.regression.summary.totalRegressions} new issue(s) introduced since last run.`}
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                                        <h3 style={{ color: 'var(--text-light)' }}>📈 Regression Analysis Not Available</h3>
                                        <p style={{ color: 'var(--text-dim)' }}>
                                            {results.results.regression?.message || 'No previous test runs to compare against.'}
                                            <br />
                                            Run tests multiple times on the same project to track regressions.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AutoTest;
