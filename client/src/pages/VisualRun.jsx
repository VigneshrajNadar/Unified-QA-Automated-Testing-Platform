import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './VisualRun.css';

function VisualRun() {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [runs, setRuns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [runningTest, setRunningTest] = useState(false);

    // Run configuration
    const [runConfig, setRunConfig] = useState({
        urls: [''],
        runType: 'baseline',
        browser: 'chrome',
        viewport: 'desktop'
    });

    useEffect(() => {
        fetchProject();
        fetchRuns();
    }, [projectId]);

    const fetchProject = async () => {
        try {
            const response = await api.get(`/visual/project/${projectId}`);
            setProject(response.data);
            // Set base URL as first URL
            if (response.data.base_url) {
                setRunConfig(prev => ({ ...prev, urls: [response.data.base_url] }));
            }
        } catch (error) {
            console.error('Error fetching project:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRuns = async () => {
        try {
            const response = await api.get(`/visual/runs/${projectId}`);
            setRuns(response.data);
        } catch (error) {
            console.error('Error fetching runs:', error);
        }
    };

    const handleAddUrl = () => {
        setRunConfig(prev => ({ ...prev, urls: [...prev.urls, ''] }));
    };

    const handleRemoveUrl = (index) => {
        setRunConfig(prev => ({
            ...prev,
            urls: prev.urls.filter((_, i) => i !== index)
        }));
    };

    const handleUrlChange = (index, value) => {
        const newUrls = [...runConfig.urls];
        newUrls[index] = value;
        setRunConfig(prev => ({ ...prev, urls: newUrls }));
    };

    const handleRunTest = async (e) => {
        e.preventDefault();
        setRunningTest(true);

        const validUrls = runConfig.urls.filter(url => url.trim() !== '');
        if (validUrls.length === 0) {
            alert('Please add at least one URL');
            setRunningTest(false);
            return;
        }

        try {
            const endpoint = runConfig.runType === 'baseline'
                ? '/visual/run-baseline'
                : '/visual/run-comparison';

            const response = await api.post(endpoint, {
                visual_project_id: projectId,
                urls: validUrls,
                browser: runConfig.browser,
                viewport: runConfig.viewport
            });

            alert(`Test completed! ${response.data.successful || response.data.summary?.total || 0} screenshots captured`);
            fetchRuns();
        } catch (error) {
            alert('Error running test: ' + error.message);
        } finally {
            setRunningTest(false);
        }
    };

    const handleViewDiffs = (runId) => {
        navigate(`/visual-results/${runId}`);
    };

    const getRunStatusBadge = (run) => {
        if (run.status === 'running') {
            return <span className="badge badge-warning">Running</span>;
        } else if (run.failed > 0) {
            return <span className="badge badge-danger">{run.failed} Failed</span>;
        } else if (run.passed > 0) {
            return <span className="badge badge-success">{run.passed} Passed</span>;
        } else {
            return <span className="badge badge-secondary">Completed</span>;
        }
    };

    if (loading) {
        return <div className="loading">Loading project...</div>;
    }

    if (!project) {
        return <div className="error">Project not found</div>;
    }

    return (
        <div className="visual-run-page">
            <div className="page-header">
                <div>
                    <button className="back-btn" onClick={() => navigate('/visual-testing')}>
                        ← Back
                    </button>
                    <h1>{project.name || 'Visual Test Project'}</h1>
                    <p className="project-url">{project.base_url}</p>
                </div>
            </div>

            <div className="content-grid">
                {/* Run Configuration */}
                <div className="run-config-section">
                    <h2>Run Configuration</h2>

                    <form onSubmit={handleRunTest}>
                        <div className="form-group">
                            <label>Run Type</label>
                            <div className="radio-group">
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        value="baseline"
                                        checked={runConfig.runType === 'baseline'}
                                        onChange={e => setRunConfig({ ...runConfig, runType: e.target.value })}
                                    />
                                    <span>Baseline (Create reference)</span>
                                </label>
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        value="comparison"
                                        checked={runConfig.runType === 'comparison'}
                                        onChange={e => setRunConfig({ ...runConfig, runType: e.target.value })}
                                    />
                                    <span>Comparison (Detect changes)</span>
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>URLs to Test</label>
                            {runConfig.urls.map((url, index) => (
                                <div key={index} className="url-input-group">
                                    <input
                                        type="url"
                                        placeholder="https://example.com/page"
                                        value={url}
                                        onChange={e => handleUrlChange(index, e.target.value)}
                                    />
                                    {runConfig.urls.length > 1 && (
                                        <button
                                            type="button"
                                            className="btn-icon-danger"
                                            onClick={() => handleRemoveUrl(index)}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                className="btn-secondary btn-small"
                                onClick={handleAddUrl}
                            >
                                + Add URL
                            </button>
                        </div>

                        <div className="form-group">
                            <label>Browser</label>
                            <select
                                value={runConfig.browser}
                                onChange={e => setRunConfig({ ...runConfig, browser: e.target.value })}
                            >
                                <option value="chrome">Chrome</option>
                                <option value="firefox">Firefox</option>
                                <option value="safari">Safari (WebKit)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Viewport</label>
                            <select
                                value={runConfig.viewport}
                                onChange={e => setRunConfig({ ...runConfig, viewport: e.target.value })}
                            >
                                <option value="desktop">Desktop (1920x1080)</option>
                                <option value="tablet">Tablet (768x1024)</option>
                                <option value="mobile">Mobile (375x667)</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary btn-large"
                            disabled={runningTest}
                        >
                            {runningTest ? '⏳ Running Test...' : '▶ Run Test'}
                        </button>
                    </form>
                </div>

                {/* Run History */}
                <div className="run-history-section">
                    <h2>Run History</h2>

                    {runs.length === 0 ? (
                        <div className="empty-state-small">
                            <p>No test runs yet</p>
                            <small>Run your first test to see results here</small>
                        </div>
                    ) : (
                        <div className="runs-list">
                            {runs.map(run => (
                                <div key={run.run_id} className="run-card">
                                    <div className="run-header">
                                        <div>
                                            <span className="run-type-badge">
                                                {run.run_type === 'baseline' ? '📸 Baseline' : '🔍 Comparison'}
                                            </span>
                                            {getRunStatusBadge(run)}
                                        </div>
                                        <span className="run-date">
                                            {new Date(run.created_at).toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="run-details">
                                        <div className="detail-item">
                                            <span>Browser:</span>
                                            <strong>{run.browser}</strong>
                                        </div>
                                        <div className="detail-item">
                                            <span>Viewport:</span>
                                            <strong>{run.viewport}</strong>
                                        </div>
                                        <div className="detail-item">
                                            <span>Screenshots:</span>
                                            <strong>{run.total_screenshots || 0}</strong>
                                        </div>
                                        {run.run_type === 'comparison' && run.total_diffs > 0 && (
                                            <div className="detail-item">
                                                <span>Results:</span>
                                                <strong>
                                                    <span className="text-success">{run.passed || 0} ✓</span>
                                                    {' / '}
                                                    <span className="text-danger">{run.failed || 0} ✗</span>
                                                </strong>
                                            </div>
                                        )}
                                    </div>

                                    {/* Always show view results button */}
                                    <button
                                        className="btn-secondary btn-small"
                                        onClick={() => handleViewDiffs(run.run_id)}
                                    >
                                        📊 View Results →
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VisualRun;
