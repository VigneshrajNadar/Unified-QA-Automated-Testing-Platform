import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './APITesting.css';

function APITesting() {
    const navigate = useNavigate();
    const [activeTab, setActiveTabState] = useState(localStorage.getItem('apiTestingTab') || 'collections');

    const setActiveTab = (tab) => {
        setActiveTabState(tab);
        localStorage.setItem('apiTestingTab', tab);
    };

    // Data States
    const [collections, setCollections] = useState([]);
    const [monitors, setMonitors] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
    const [showCreateMonitorModal, setShowCreateMonitorModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    // Form States
    const [newCollection, setNewCollection] = useState({ name: '', description: '', project_id: null });
    const [newMonitor, setNewMonitor] = useState({ collection_id: '', name: '', frequency: '5min' });
    const [swaggerUrl, setSwaggerUrl] = useState('');
    const [importing, setImporting] = useState(false);

    // History Modal State
    const [historyData, setHistoryData] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const handleViewHistory = async (monitor) => {
        try {
            const res = await api.get(`/api-testing/monitors/${monitor.monitor_id}/history`);

            // Group raw results into "Runs" (by timestamp minute)
            const runsMap = {};
            res.data.forEach(r => {
                // Use executed_at (created_at not in results table)
                const timestamp = r.executed_at || r.created_at; // fallback
                const ts = new Date(timestamp).getTime();
                const windowKey = Math.floor(ts / 5000); // 5 sec window

                if (!runsMap[windowKey]) {
                    runsMap[windowKey] = {
                        timestamp: timestamp,
                        pass: 0,
                        fail: 0,
                        results: []
                    };
                }
                // Check passed (sqlite 1/0) or success (if alias exists)
                if (r.passed || r.success) runsMap[windowKey].pass++;
                else runsMap[windowKey].fail++;
                runsMap[windowKey].results.push(r);
            });

            const runList = Object.values(runsMap).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setHistoryData({ monitorName: monitor.name, runs: runList });
            setShowHistoryModal(true);
        } catch (error) {
            console.error(error);
            alert('Error fetching history: ' + error.message);
        }
    };

    useEffect(() => {
        fetchCollections();
        fetchMonitors();
    }, []);

    const fetchCollections = async () => {
        try {
            const response = await api.get('/api-testing/collections');
            setCollections(response.data);
        } catch (error) {
            console.error('Error fetching collections:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMonitors = async () => {
        try {
            const response = await api.get('/api-testing/monitors');
            setMonitors(response.data);
        } catch (error) {
            console.error('Error fetching monitors:', error);
        }
    };

    // --- Actions ---

    const handleCreateCollection = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api-testing/collections', newCollection);
            setShowCreateCollectionModal(false);
            setNewCollection({ name: '', description: '', project_id: null });
            fetchCollections();
        } catch (error) {
            alert('Error creating collection: ' + error.message);
        }
    };

    const handleCreateMonitor = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api-testing/monitors', newMonitor);
            setShowCreateMonitorModal(false);
            setNewMonitor({ collection_id: '', name: '', frequency: '5min' });
            fetchMonitors();
            setActiveTab('monitors');
        } catch (error) {
            alert('Error creating monitor: ' + error.message);
        }
    };

    const handleDeleteCollection = async (id, name) => {
        if (!window.confirm(`Delete collection "${name}"? This will delete all requests in the collection.`)) return;
        try {
            await api.delete(`/api-testing/collections/${id}`);
            fetchCollections();
        } catch (error) {
            alert('Error deleting collection: ' + error.message);
        }
    };

    const handleDeleteMonitor = async (id) => {
        if (!window.confirm('Delete this monitor?')) return;
        try {
            await api.delete(`/api-testing/monitors/${id}`);
            fetchMonitors();
        } catch (error) {
            alert('Error deleting monitor: ' + error.message);
        }
    };

    const handleToggleMonitor = async (monitor) => {
        const newStatus = !monitor.is_active;
        try {
            await api.put(`/api-testing/monitors/${monitor.monitor_id}/toggle`, {
                is_active: newStatus
            });
            fetchMonitors(); // Refresh list
        } catch (error) {
            alert('Error toggling monitor: ' + error.message);
        }
    };

    const handleImportSwagger = async (e) => {
        e.preventDefault();
        setImporting(true);
        try {
            const response = await api.post('/api-testing/import-swagger', { swagger_url: swaggerUrl });
            alert(`✅ Imported ${response.data.requests_imported} requests from Swagger!`);
            setShowImportModal(false);
            setSwaggerUrl('');
            fetchCollections();
        } catch (error) {
            alert('Error importing Swagger: ' + (error.response?.data?.error || error.message));
        } finally {
            setImporting(false);
        }
    };

    if (loading) return <div className="loading">Loading API Platform...</div>;

    return (
        <div className="api-testing-page">
            <div className="page-header">
                <div>
                    <h1>🔌 API Testing Platform</h1>
                    <p className="subtitle">Build, test, and validate REST APIs</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={() => setShowImportModal(true)} style={{ width: 'auto' }}>
                        📥 Import Swagger
                    </button>
                    <button className="btn-primary" onClick={() => setShowCreateCollectionModal(true)} style={{ width: 'auto' }}>
                        + New Collection
                    </button>
                    <button className="btn-success" onClick={() => setShowCreateMonitorModal(true)} style={{ marginLeft: '10px', width: 'auto' }}>
                        ⏱ New Monitor
                    </button>
                </div>
            </div>

            {/* Active Monitors Summary (Always Visible) */}
            {monitors.filter(m => m.is_active).length > 0 && (
                <div style={{ marginBottom: '20px', padding: '15px', background: 'var(--bg-secondary, #1e293b)', borderRadius: '8px', borderLeft: '4px solid #28a745' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ margin: 0, color: '#28a745' }}>⚡ Active Monitors ({monitors.filter(m => m.is_active).length})</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '5px' }}>
                        {monitors.filter(m => m.is_active).map(m => (
                            <div key={m.monitor_id} style={{ minWidth: '280px', padding: '15px', background: 'var(--bg-primary, #0f172a)', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid var(--border, #334155)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <strong style={{ color: 'var(--text-primary, #fff)', fontSize: '1.1em' }}>{m.name}</strong>
                                    <span style={{ fontSize: '10px', fontWeight: 'bold', background: 'rgba(40, 167, 69, 0.2)', color: '#4ade80', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(40, 167, 69, 0.3)' }}>ON</span>
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary, #94a3b8)', marginBottom: '12px', fontFamily: 'monospace' }}>
                                    Cron: {m.frequency_cron}
                                </div>
                                <div style={{ borderTop: '1px solid var(--border, #334155)', paddingTop: '10px', marginTop: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#cbd5e1', marginBottom: '10px' }}>
                                        <span>Last Run:</span>
                                        <span style={{ fontWeight: '500' }}>{m.last_run ? new Date(m.last_run).toLocaleTimeString() : 'Pending'}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="btn-primary"
                                            style={{ flex: 1, fontSize: '12px', padding: '6px 0', background: '#3b82f6', border: 'none' }}
                                            onClick={() => handleViewHistory(m)}
                                        >
                                            📜 History
                                        </button>
                                        <button
                                            className="btn-secondary"
                                            style={{ flex: 1, fontSize: '12px', padding: '6px 0', background: '#334155', border: '1px solid #475569', color: '#fff' }}
                                            onClick={async () => {
                                                if (!confirm('Force run now?')) return;
                                                alert('Triggered!');
                                            }}
                                        >
                                            ▶ Run
                                        </button>
                                        <button
                                            className="btn-warning"
                                            style={{ flex: 1, fontSize: '12px', padding: '6px 0', background: '#eab308', border: 'none', color: '#000' }}
                                            onClick={() => handleToggleMonitor(m)}
                                        >
                                            ⏸ Pause
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="tabs-container" style={{ margin: '20px 0', borderBottom: '1px solid #ddd' }}>
                <button
                    className={`tab-btn ${activeTab === 'collections' ? 'active' : ''}`}
                    onClick={() => setActiveTab('collections')}
                    style={{ padding: '10px 20px', border: 'none', background: 'none', borderBottom: activeTab === 'collections' ? '2px solid #007bff' : 'none', fontWeight: activeTab === 'collections' ? 'bold' : 'normal', cursor: 'pointer' }}
                >
                    Collections
                </button>
                <button
                    className={`tab-btn ${activeTab === 'monitors' ? 'active' : ''}`}
                    onClick={() => setActiveTab('monitors')}
                    style={{ padding: '10px 20px', border: 'none', background: 'none', borderBottom: activeTab === 'monitors' ? '2px solid #007bff' : 'none', fontWeight: activeTab === 'monitors' ? 'bold' : 'normal', cursor: 'pointer' }}
                >
                    Monitors ⏱
                </button>
            </div>

            {/* CONTENT: COLLECTIONS */}
            {activeTab === 'collections' && (
                collections.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🔌</div>
                        <h3>No API Collections Yet</h3>
                        <p>Create a collection to organize your API requests</p>
                    </div>
                ) : (
                    <div className="collections-grid">
                        {collections.map(collection => (
                            <div key={collection.collection_id} className="collection-card">
                                <div className="collection-header">
                                    <h3>{collection.name}</h3>
                                    <button className="btn-icon-danger" onClick={() => handleDeleteCollection(collection.collection_id, collection.name)} title="Delete">×</button>
                                </div>
                                <p className="collection-description">{collection.description || 'No description'}</p>
                                <div className="collection-stats">
                                    <div className="stat">
                                        <span className="stat-number">{collection.request_count || 0}</span>
                                        <span className="stat-label">Requests</span>
                                    </div>
                                </div>
                                <button className="btn-primary" style={{ width: 'auto', marginTop: '1rem' }} onClick={() => navigate(`/api-collection/${collection.collection_id}`)}>
                                    Open Collection →
                                </button>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* CONTENT: MONITORS */}
            {activeTab === 'monitors' && (
                monitors.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">⏱</div>
                        <h3>No Active Monitors</h3>
                        <p>Schedule collections to run automatically.</p>
                        <button className="btn-success" onClick={() => setShowCreateMonitorModal(true)}>Create Monitor</button>
                    </div>
                ) : (
                    <div className="collections-grid">
                        {monitors.map(monitor => (
                            <div key={monitor.monitor_id} className="collection-card" style={{ borderLeft: '4px solid #28a745' }}>
                                <div className="collection-header">
                                    <h3>{monitor.name}</h3>
                                    <button className="btn-icon-danger" onClick={() => handleDeleteMonitor(monitor.monitor_id)} title="Stop & Delete">×</button>
                                </div>
                                <p className="collection-description">
                                    Runs: <strong>{monitor.frequency_cron}</strong> <br />
                                    Collection: {monitor.collection_name}
                                </p>
                                <div className="collection-stats">
                                    <div className="stat">
                                        <span className="stat-value" style={{ color: monitor.is_active ? '#28a745' : '#eab308' }}>
                                            {monitor.is_active ? 'Active' : 'Paused'}
                                        </span>
                                        <span className="stat-label">Status</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">{monitor.last_run ? new Date(monitor.last_run).toLocaleTimeString() : 'Pending'}</span>
                                        <span className="stat-label">Last Run</span>
                                    </div>
                                </div>
                                <button
                                    className={`${monitor.is_active ? 'btn-warning' : 'btn-success'}`}
                                    style={{ marginTop: '10px', padding: '5px 10px', background: monitor.is_active ? '#eab308' : '#28a745', border: 'none', color: monitor.is_active ? '#000' : '#fff', borderRadius: '4px', cursor: 'pointer', width: 'auto' }}
                                    onClick={() => handleToggleMonitor(monitor)}
                                >
                                    {monitor.is_active ? '⏸ Pause Monitor' : '▶ Resume Monitor'}
                                </button>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* MODALS */}

            {/* Create Collection */}
            {showCreateCollectionModal && (
                <div className="modal-overlay" onClick={() => setShowCreateCollectionModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New Collection</h2>
                            <button className="close-btn" onClick={() => setShowCreateCollectionModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreateCollection}>
                            <div className="form-group">
                                <label>Collection Name *</label>
                                <input type="text" value={newCollection.name} onChange={e => setNewCollection({ ...newCollection, name: e.target.value })} placeholder="e.g. User Management API" required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea value={newCollection.description} onChange={e => setNewCollection({ ...newCollection, description: e.target.value })} placeholder="e.g. Collection of endpoints for managing user profiles" />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowCreateCollectionModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Monitor */}
            {showCreateMonitorModal && (
                <div className="modal-overlay" onClick={() => setShowCreateMonitorModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Schedule API Monitor</h2>
                            <button className="close-btn" onClick={() => setShowCreateMonitorModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreateMonitor}>
                            <div className="form-group">
                                <label>Monitor Name *</label>
                                <input type="text" value={newMonitor.name} onChange={e => setNewMonitor({ ...newMonitor, name: e.target.value })} placeholder="e.g. Daily Health Check" required />
                            </div>
                            <div className="form-group">
                                <label>Select Collection *</label>
                                <select value={newMonitor.collection_id} onChange={e => setNewMonitor({ ...newMonitor, collection_id: e.target.value })} required>
                                    <option value="">-- Choose Collection --</option>
                                    {collections.map(c => <option key={c.collection_id} value={c.collection_id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Frequency *</label>
                                <select value={newMonitor.frequency} onChange={e => setNewMonitor({ ...newMonitor, frequency: e.target.value })}>
                                    <option value="1min">Every Minute (Demo)</option>
                                    <option value="5min">Every 5 Minutes</option>
                                    <option value="15min">Every 15 Minutes</option>
                                    <option value="1hour">Every Hour</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowCreateMonitorModal(false)}>Cancel</button>
                                <button type="submit" className="btn-success">Start Monitor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && historyData && (
                <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
                    <div className="modal-content history-modal-dark" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ borderBottom: '1px solid #334155' }}>
                            <h2>Run History: {historyData.monitorName}</h2>
                            <button className="close-btn" style={{ color: 'white' }} onClick={() => setShowHistoryModal(false)}>×</button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {historyData.runs.length === 0 ? (
                                <p style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No run history found.</p>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary, #fff)' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: '#0f172a' }}>
                                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #334155' }}>
                                            <th style={{ padding: '10px' }}>Time</th>
                                            <th style={{ padding: '10px' }}>Result</th>
                                            <th style={{ padding: '10px' }}>Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historyData.runs.map((run, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                                                <td style={{ padding: '10px', color: 'var(--text-primary, #fff)' }}>{new Date(run.timestamp).toLocaleString()}</td>
                                                <td style={{ padding: '10px' }}>
                                                    {run.fail === 0 ?
                                                        <span style={{ color: '#4ade80', fontWeight: 'bold' }}>✅ Passed</span> :
                                                        <span style={{ color: '#f87171', fontWeight: 'bold' }}>❌ Failed ({run.fail})</span>
                                                    }
                                                </td>
                                                <td style={{ padding: '10px', fontSize: '0.9em' }}>
                                                    <span style={{ color: '#4ade80' }}>{run.pass} calls passed</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="modal-actions" style={{ borderTop: '1px solid #334155' }}>
                            <button type="button" className="btn-secondary" onClick={() => setShowHistoryModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Swagger */}
            {showImportModal && (
                <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Import Swagger</h2>
                            <button className="close-btn" onClick={() => setShowImportModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleImportSwagger}>
                            <div className="form-group">
                                <label>Swagger URL *</label>
                                <input type="url" value={swaggerUrl} onChange={e => setSwaggerUrl(e.target.value)} placeholder="e.g. https://petstore.swagger.io/v2/swagger.json" required />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowImportModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={importing}>{importing ? 'Importing...' : 'Import'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default APITesting;
