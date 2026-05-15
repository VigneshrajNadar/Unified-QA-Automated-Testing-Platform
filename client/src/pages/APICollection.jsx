import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './APICollection.css';

function APICollection() {
    const { collectionId } = useParams();
    const navigate = useNavigate();

    const [collection, setCollection] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [result, setResult] = useState(null);

    // New request form
    const [newRequest, setNewRequest] = useState({
        name: '',
        method: 'GET',
        url: '',
        headers: '',
        body: '',
        params: '',
        auth_type: 'none',
        auth_value: '',
        expected_status: 200,
        schema: '',
        description: ''
    });

    useEffect(() => {
        fetchCollection();
    }, [collectionId]);

    const fetchCollection = async () => {
        try {
            const response = await api.get(`/api-testing/collections/${collectionId}`);
            setCollection(response.data);
            setRequests(response.data.requests || []);
        } catch (error) {
            console.error('Error fetching collection:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api-testing/requests', {
                ...newRequest,
                collection_id: collectionId
            });
            setShowRequestModal(false);
            resetRequestForm();
            fetchCollection();
        } catch (error) {
            alert('Error creating request: ' + error.message);
        }
    };

    const handleExecuteRequest = async (request) => {
        setExecuting(true);
        setResult(null);
        setSelectedRequest(request);

        try {
            const response = await api.post(`/api-testing/execute/${request.request_id}`);
            setResult(response.data);
        } catch (error) {
            setResult({
                success: false,
                error_message: error.message
            });
        } finally {
            setExecuting(false);
        }
    };

    const handleExecuteAll = async () => {
        if (!window.confirm(`Execute all ${requests.length} requests in this collection?`)) {
            return;
        }

        setExecuting(true);
        try {
            const response = await api.post(`/api-testing/execute-collection/${collectionId}`);
            alert(`✅ Executed ${response.data.total} requests!\nCheck individual results below.`);
            fetchCollection();
        } catch (error) {
            alert('Error executing collection: ' + error.message);
        } finally {
            setExecuting(false);
        }
    };

    const handleDeleteRequest = async (requestId, name) => {
        if (!window.confirm(`Delete request "${name}"?`)) {
            return;
        }

        try {
            await api.delete(`/api-testing/requests/${requestId}`);
            fetchCollection();
        } catch (error) {
            alert('Error deleting request: ' + error.message);
        }
    };

    const resetRequestForm = () => {
        setNewRequest({
            name: '',
            method: 'GET',
            url: '',
            headers: '',
            body: '',
            params: '',
            auth_type: 'none',
            auth_value: '',
            expected_status: 200,
            schema: '',
            description: ''
        });
    };

    const getMethodColor = (method) => {
        const colors = {
            GET: '#28a745',
            POST: '#3498db',
            PUT: '#f39c12',
            DELETE: '#e74c3c',
            PATCH: '#9b59b6'
        };
        return colors[method] || '#95a5a6';
    };

    if (loading) {
        return <div className="loading">Loading collection...</div>;
    }

    if (!collection) {
        return (
            <div className="error-container" style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ color: '#e74c3c' }}>⚠️ Error Loading Collection</h2>
                <p>Could not load collection ID: <strong>{collectionId}</strong></p>
                <button className="btn-primary" onClick={() => navigate('/api-testing')}>
                    ← Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="api-collection-page">
            <div className="page-header">
                <div>
                    <button className="back-btn" onClick={() => navigate('/api-testing')}>
                        ← Back to Collections
                    </button>
                    <h1>{collection.name}</h1>
                    <p className="subtitle">{collection.description || 'No description'}</p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn-secondary"
                        onClick={handleExecuteAll}
                        disabled={executing || requests.length === 0}
                    >
                        ▶ Run All
                    </button>
                    <button className="btn-primary" onClick={() => setShowRequestModal(true)}>
                        + New Request
                    </button>
                </div>
            </div>

            <div className="content-layout">
                {/* Request List */}
                <div className="requests-panel">
                    <h2>Requests ({requests.length})</h2>

                    {requests.length === 0 ? (
                        <div className="empty-panel">
                            <p>No requests yet</p>
                            <button className="btn-primary btn-small" onClick={() => setShowRequestModal(true)}>
                                Add Request
                            </button>
                        </div>
                    ) : (
                        <div className="requests-list">
                            {requests.map(request => (
                                <div
                                    key={request.request_id}
                                    className={`request-item ${selectedRequest?.request_id === request.request_id ? 'active' : ''}`}
                                    onClick={() => setSelectedRequest(request)}
                                >
                                    <div className="request-header">
                                        <span
                                            className="method-badge"
                                            style={{ background: getMethodColor(request.method) }}
                                        >
                                            {request.method}
                                        </span>
                                        <span className="request-name">{request.name}</span>
                                    </div>
                                    <div className="request-url">{request.url}</div>
                                    <div className="request-actions">
                                        <button
                                            className="btn-icon-primary"
                                            onClick={(e) => { e.stopPropagation(); handleExecuteRequest(request); }}
                                            title="Execute request"
                                        >
                                            ▶
                                        </button>
                                        <button
                                            className="btn-icon-danger"
                                            onClick={(e) => { e.stopPropagation(); handleDeleteRequest(request.request_id, request.name); }}
                                            title="Delete request"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Request Details & Response */}
                <div className="details-panel">
                    {selectedRequest ? (
                        <>
                            <div className="request-details">
                                <h2>{selectedRequest.name}</h2>
                                <div className="detail-row">
                                    <span className="method-badge" style={{ background: getMethodColor(selectedRequest.method) }}>
                                        {selectedRequest.method}
                                    </span>
                                    <span className="url-display">{selectedRequest.url}</span>
                                </div>

                                {selectedRequest.description && (
                                    <p className="description">{selectedRequest.description}</p>
                                )}

                                <div className="detail-section">
                                    <h4>Headers</h4>
                                    <pre>{selectedRequest.headers || 'None'}</pre>
                                </div>

                                {selectedRequest.body && (
                                    <div className="detail-section">
                                        <h4>Body</h4>
                                        <pre>{selectedRequest.body}</pre>
                                    </div>
                                )}

                                {selectedRequest.auth_type !== 'none' && (
                                    <div className="detail-section">
                                        <h4>Authentication</h4>
                                        <p>{selectedRequest.auth_type.toUpperCase()}</p>
                                    </div>
                                )}

                                <button
                                    className="btn-primary btn-block"
                                    onClick={() => handleExecuteRequest(selectedRequest)}
                                    disabled={executing}
                                >
                                    {executing ? '⏳ Executing...' : '▶ Send Request'}
                                </button>
                            </div>

                            {result && (
                                <div className="response-panel">
                                    <h3>Response</h3>
                                    <div className="response-summary">
                                        <div className="response-stat">
                                            <span className="stat-label">Status</span>
                                            <span className={`status-code ${result.success ? 'success' : 'error'}`}>
                                                {result.status_code}
                                            </span>
                                        </div>
                                        <div className="response-stat">
                                            <span className="stat-label">Time</span>
                                            <span className="stat-value">{result.response_time_ms}ms</span>
                                        </div>
                                        {result.schema_valid !== null && (
                                            <div className="response-stat">
                                                <span className="stat-label">Schema</span>
                                                <span className={result.schema_valid ? 'success' : 'error'}>
                                                    {result.schema_valid ? '✓ Valid' : '✗ Invalid'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {result.response_body && (
                                        <div className="response-body">
                                            <h4>Body</h4>
                                            <pre>{JSON.stringify(JSON.parse(result.response_body), null, 2)}</pre>
                                        </div>
                                    )}

                                    {result.error_message && (
                                        <div className="error-message">
                                            <strong>Error:</strong> {result.error_message}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="empty-panel">
                            <p>Select a request to view details and execute</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Request Modal */}
            {showRequestModal && (
                <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
                    <div className="modal-content large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>New API Request</h2>
                            <button className="close-btn" onClick={() => setShowRequestModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreateRequest}>
                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label>Request Name *</label>
                                    <input
                                        type="text"
                                        value={newRequest.name}
                                        onChange={e => setNewRequest({ ...newRequest, name: e.target.value })}
                                        placeholder="e.g., Get Users, Create Order"
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ width: '150px' }}>
                                    <label>Method *</label>
                                    <select
                                        value={newRequest.method}
                                        onChange={e => setNewRequest({ ...newRequest, method: e.target.value })}
                                    >
                                        <option>GET</option>
                                        <option>POST</option>
                                        <option>PUT</option>
                                        <option>DELETE</option>
                                        <option>PATCH</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>URL *</label>
                                <input
                                    type="url"
                                    value={newRequest.url}
                                    onChange={e => setNewRequest({ ...newRequest, url: e.target.value })}
                                    placeholder="https://api.example.com/users"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Headers (JSON)</label>
                                <textarea
                                    value={newRequest.headers}
                                    onChange={e => setNewRequest({ ...newRequest, headers: e.target.value })}
                                    placeholder='{"Content-Type": "application/json"}'
                                    rows="3"
                                />
                            </div>

                            {['POST', 'PUT', 'PATCH'].includes(newRequest.method) && (
                                <div className="form-group">
                                    <label>Body (JSON)</label>
                                    <textarea
                                        value={newRequest.body}
                                        onChange={e => setNewRequest({ ...newRequest, body: e.target.value })}
                                        placeholder='{"name": "John Doe", "email": "john@example.com"}'
                                        rows="4"
                                    />
                                </div>
                            )}

                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label>Auth Type</label>
                                    <select
                                        value={newRequest.auth_type}
                                        onChange={e => setNewRequest({ ...newRequest, auth_type: e.target.value })}
                                    >
                                        <option value="none">None</option>
                                        <option value="bearer">Bearer Token</option>
                                        <option value="apikey">API Key</option>
                                        <option value="basic">Basic Auth</option>
                                    </select>
                                </div>
                                {newRequest.auth_type !== 'none' && (
                                    <div className="form-group flex-2">
                                        <label>Auth Value</label>
                                        <input
                                            type="text"
                                            value={newRequest.auth_value}
                                            onChange={e => setNewRequest({ ...newRequest, auth_value: e.target.value })}
                                            placeholder={newRequest.auth_type === 'basic' ? 'username:password' : 'token or key'}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowRequestModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Create Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default APICollection;
