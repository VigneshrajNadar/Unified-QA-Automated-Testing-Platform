import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './VisualDiffs.css';

function VisualDiffs() {
    const { runId } = useParams();
    const navigate = useNavigate();

    const [diffs, setDiffs] = useState([]);
    const [run, setRun] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDiff, setSelectedDiff] = useState(null);

    useEffect(() => {
        fetchDiffs();
    }, [runId]);

    const fetchDiffs = async () => {
        try {
            const response = await api.get(`/visual/diffs/${runId}`);
            setDiffs(response.data);

            // Get run details
            const runsResponse = await api.get(`/visual/runs/0`);
            const currentRun = runsResponse.data.find(r => r.run_id === parseInt(runId));
            setRun(currentRun);
        } catch (error) {
            console.error('Error fetching diffs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pass: { bg: '#d4edda', color: '#155724', text: '✓ PASS' },
            warning: { bg: '#fff3cd', color: '#856404', text: '⚠ WARNING' },
            fail: { bg: '#f8d7da', color: '#721c24', text: '✗ FAIL' }
        };

        const style = styles[status] || styles.fail;

        return (
            <span style={{
                background: style.bg,
                color: style.color,
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.875rem'
            }}>
                {style.text}
            </span>
        );
    };

    const getSeverityColor = (severity) => {
        const colors = {
            'Low': '#28a745',
            'Medium': '#ffc107',
            'High': '#fd7e14',
            'Critical': '#dc3545'
        };
        return colors[severity] || '#6c757d';
    };

    const handleApprove = async (diffId) => {
        if (!window.confirm('Approve this as the new baseline?')) return;

        try {
            await api.post(`/visual/approve/${diffId}`);
            alert('Baseline updated successfully!');
            fetchDiffs();
        } catch (error) {
            alert('Error approving baseline: ' + error.message);
        }
    };

    if (loading) {
        return <div className="loading">Loading comparison results...</div>;
    }

    if (diffs.length === 0) {
        return (
            <div className="visual-diffs-page">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <h1>No Comparison Results</h1>
                </div>
                <div className="empty-state">
                    <p>No visual differences found for this run.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="visual-diffs-page">
            <div className="page-header">
                <div>
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <h1>Visual Comparison Results</h1>
                    {run && (
                        <p className="run-info">
                            Run #{runId} • {run.browser} • {run.viewport} • {new Date(run.created_at).toLocaleString()}
                        </p>
                    )}
                </div>
            </div>

            <div className="summary-cards">
                <div className="summary-card pass">
                    <div className="summary-number">{diffs.filter(d => d.status === 'pass').length}</div>
                    <div className="summary-label">Passed</div>
                </div>
                <div className="summary-card warning">
                    <div className="summary-number">{diffs.filter(d => d.status === 'warning').length}</div>
                    <div className="summary-label">Warnings</div>
                </div>
                <div className="summary-card fail">
                    <div className="summary-number">{diffs.filter(d => d.status === 'fail').length}</div>
                    <div className="summary-label">Failed</div>
                </div>
                <div className="summary-card total">
                    <div className="summary-number">{diffs.length}</div>
                    <div className="summary-label">Total</div>
                </div>
            </div>

            <div className="diffs-list">
                {diffs.map(diff => (
                    <div key={diff.diff_id} className={`diff-card ${diff.status}`}>
                        <div className="diff-header">
                            <div>
                                <h3>{diff.page_name || 'Page'}</h3>
                                <p className="diff-url">{diff.page_url}</p>
                            </div>
                            <div className="diff-stats">
                                {getStatusBadge(diff.status)}
                                <span
                                    className="severity-badge"
                                    style={{
                                        background: getSeverityColor(diff.severity),
                                        color: 'white',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '6px',
                                        fontWeight: 'bold',
                                        fontSize: '0.875rem',
                                        marginLeft: '0.5rem'
                                    }}
                                >
                                    {diff.severity}
                                </span>
                            </div>
                        </div>

                        <div className="diff-metrics">
                            <div className="metric">
                                <span className="metric-label">Mismatch Percentage:</span>
                                <span className="metric-value">{diff.mismatch_percentage?.toFixed(2)}%</span>
                            </div>
                            <div className="metric">
                                <span className="metric-label">Different Pixels:</span>
                                <span className="metric-value">{diff.mismatch_pixels?.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="screenshot-grid">
                            <div className="screenshot-item">
                                <h4>Baseline (Reference)</h4>
                                {diff.baseline_image_path ? (
                                    <img
                                        src={`http://localhost:5000/${diff.baseline_image_path.replace(/\\/g, '/')}`}
                                        alt="Baseline"
                                        onClick={() => setSelectedDiff({ ...diff, view: 'baseline' })}
                                        style={{ cursor: 'pointer' }}
                                    />
                                ) : (
                                    <div className="no-image">No baseline image</div>
                                )}
                            </div>

                            <div className="screenshot-item">
                                <h4>Current (New)</h4>
                                {diff.current_image_path ? (
                                    <img
                                        src={`http://localhost:5000/${diff.current_image_path.replace(/\\/g, '/')}`}
                                        alt="Current"
                                        onClick={() => setSelectedDiff({ ...diff, view: 'current' })}
                                        style={{ cursor: 'pointer' }}
                                    />
                                ) : (
                                    <div className="no-image">No current image</div>
                                )}
                            </div>

                            <div className="screenshot-item highlight">
                                <h4>Diff (Highlighted Changes)</h4>
                                {diff.diff_image_path ? (
                                    <img
                                        src={`http://localhost:5000/${diff.diff_image_path.replace(/\\/g, '/')}`}
                                        alt="Diff"
                                        onClick={() => setSelectedDiff({ ...diff, view: 'diff' })}
                                        style={{ cursor: 'pointer' }}
                                    />
                                ) : (
                                    <div className="no-image">No diff image</div>
                                )}
                            </div>
                        </div>

                        {diff.status === 'fail' && (
                            <div className="diff-actions">
                                <button
                                    className="btn-approve"
                                    onClick={() => handleApprove(diff.diff_id)}
                                >
                                    ✓ Approve as New Baseline
                                </button>
                                <span className="help-text">
                                    If this change is intentional, approve it to update the baseline
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Fullscreen Image Modal */}
            {selectedDiff && (
                <div className="fullscreen-modal" onClick={() => setSelectedDiff(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedDiff(null)}>×</button>
                        <h2>{selectedDiff.page_name} - {selectedDiff.view === 'baseline' ? 'Baseline' : selectedDiff.view === 'current' ? 'Current' : 'Diff'}</h2>
                        <img
                            src={`http://localhost:5000/${selectedDiff.view === 'baseline' ? selectedDiff.baseline_image_path :
                                    selectedDiff.view === 'current' ? selectedDiff.current_image_path :
                                        selectedDiff.diff_image_path
                                }`.replace(/\\/g, '/')}
                            alt={selectedDiff.view}
                            style={{ maxWidth: '100%', maxHeight: '85vh' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default VisualDiffs;
