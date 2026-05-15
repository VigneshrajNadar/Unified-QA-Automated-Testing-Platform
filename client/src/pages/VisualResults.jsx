import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './VisualResults.css';

function VisualResults() {
    const { runId } = useParams();
    const navigate = useNavigate();

    const [run, setRun] = useState(null);
    const [screenshots, setScreenshots] = useState([]);
    const [diffs, setDiffs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        fetchRunData();
    }, [runId]);

    const fetchRunData = async () => {
        try {
            // Get run details using the new endpoint
            const runResponse = await api.get(`/visual/run/${runId}`);
            setRun(runResponse.data);

            // Get diffs if comparison run
            if (runResponse.data && runResponse.data.run_type === 'comparison') {
                const diffsResponse = await api.get(`/visual/diffs/${runId}`);
                setDiffs(diffsResponse.data);
            }
        } catch (error) {
            console.error('Error fetching run data:', error);
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
        const style = styles[status] || styles.pass;
        return (
            <span style={{
                background: style.bg,
                color: style.color,
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontWeight: 'bold'
            }}>
                {style.text}
            </span>
        );
    };

    if (loading) {
        return <div className="loading">Loading results...</div>;
    }

    if (!run) {
        return (
            <div className="visual-results-page">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
                    <h1>Run Not Found</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="visual-results-page">
            <div className="page-header">
                <div>
                    <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
                    <h1>
                        {run.run_type === 'baseline' ? '📸 Baseline Screenshots' : '🔍 Comparison Results'}
                    </h1>
                    <p className="run-info">
                        Run #{runId} • {run.browser} • {run.viewport} • {new Date(run.created_at).toLocaleString()}
                    </p>
                </div>
            </div>

            {run.run_type === 'baseline' ? (
                <div className="baseline-view">
                    <div className="info-box">
                        <h3>✅ Baseline Created Successfully</h3>
                        <p>
                            {run.total_screenshots || 0} screenshot(s) captured and saved as reference images.
                            These will be used for future comparisons.
                        </p>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-number">{run.total_screenshots || 0}</div>
                            <div className="stat-label">Screenshots</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{run.browser}</div>
                            <div className="stat-label">Browser</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{run.viewport}</div>
                            <div className="stat-label">Viewport</div>
                        </div>
                    </div>

                    <div className="screenshots-info">
                        <h3>📁 Screenshots Location</h3>
                        <p className="path-info">
                            screenshots are stored in:<br />
                            <code>server/uploads/visual-tests/baselines/vp_{run.visual_project_id}/</code>
                        </p>
                        <p className="help-text">
                            💡 To view screenshots, check the server/uploads folder or run a comparison test to see them in the UI.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="comparison-view">
                    {diffs.length === 0 ? (
                        <div className="info-box warning">
                            <h3>⚠️ No Comparison Data</h3>
                            <p>
                                The comparison test ran but no diff data was found. This could mean:
                            </p>
                            <ul>
                                <li>No baseline exists for the tested URLs</li>
                                <li>Screenshots are still being processed</li>
                                <li>An error occurred during comparison</li>
                            </ul>
                            <p>
                                <strong>Try:</strong> Make sure you ran a baseline test first with the same URLs, browser, and viewport.
                            </p>
                        </div>
                    ) : (
                        <>
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
                            </div>

                            <div className="diffs-list">
                                {diffs.map(diff => (
                                    <div key={diff.diff_id} className={`diff-card ${diff.status}`}>
                                        <div className="diff-header">
                                            <div>
                                                <h3>{diff.page_name || 'Page'}</h3>
                                                <p className="diff-url">{diff.page_url}</p>
                                            </div>
                                            {getStatusBadge(diff.status)}
                                        </div>

                                        <div className="diff-metrics">
                                            <div className="metric">
                                                <span>Mismatch:</span>
                                                <strong>{diff.mismatch_percentage?.toFixed(2)}%</strong>
                                            </div>
                                            <div className="metric">
                                                <span>Pixels:</span>
                                                <strong>{diff.mismatch_pixels?.toLocaleString()}</strong>
                                            </div>
                                            <div className="metric">
                                                <span>Severity:</span>
                                                <strong>{diff.severity}</strong>
                                            </div>
                                        </div>

                                        <div className="screenshot-grid">
                                            <div className="screenshot-item">
                                                <h4>Baseline</h4>
                                                {diff.baseline_image_path ? (
                                                    <img
                                                        src={`http://localhost:5000/uploads/${diff.baseline_image_path.split('uploads\\')[1]?.replace(/\\/g, '/')}`}
                                                        alt="Baseline"
                                                        onClick={() => setSelectedImage({
                                                            src: `http://localhost:5000/uploads/${diff.baseline_image_path.split('uploads\\')[1]?.replace(/\\/g, '/')}`,
                                                            title: 'Baseline - ' + diff.page_name
                                                        })}
                                                        onError={(e) => {
                                                            console.error('Image load error:', diff.baseline_image_path);
                                                            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="%23999">Image not found</text></svg>';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="no-image">No baseline</div>
                                                )}
                                            </div>

                                            <div className="screenshot-item">
                                                <h4>Current</h4>
                                                {diff.current_image_path ? (
                                                    <img
                                                        src={`http://localhost:5000/uploads/${diff.current_image_path.split('uploads\\')[1]?.replace(/\\/g, '/')}`}
                                                        alt="Current"
                                                        onClick={() => setSelectedImage({
                                                            src: `http://localhost:5000/uploads/${diff.current_image_path.split('uploads\\')[1]?.replace(/\\/g, '/')}`,
                                                            title: 'Current - ' + diff.page_name
                                                        })}
                                                        onError={(e) => {
                                                            console.error('Image load error:', diff.current_image_path);
                                                            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="%23999">Image not found</text></svg>';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="no-image">No current</div>
                                                )}
                                            </div>

                                            <div className="screenshot-item highlight">
                                                <h4>Diff</h4>
                                                {diff.diff_image_path ? (
                                                    <img
                                                        src={`http://localhost:5000/uploads/${diff.diff_image_path.split('uploads\\')[1]?.replace(/\\/g, '/')}`}
                                                        alt="Diff"
                                                        onClick={() => setSelectedImage({
                                                            src: `http://localhost:5000/uploads/${diff.diff_image_path.split('uploads\\')[1]?.replace(/\\/g, '/')}`,
                                                            title: 'Diff - ' + diff.page_name
                                                        })}
                                                        onError={(e) => {
                                                            console.error('Image load error:', diff.diff_image_path);
                                                            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="%23999">Image not found</text></svg>';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="no-image">No diff</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {selectedImage && (
                <div className="fullscreen-modal" onClick={() => setSelectedImage(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedImage(null)}>×</button>
                        <h2>{selectedImage.title}</h2>
                        <img src={selectedImage.src} alt={selectedImage.title} style={{ maxWidth: '100%', maxHeight: '85vh' }} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default VisualResults;
