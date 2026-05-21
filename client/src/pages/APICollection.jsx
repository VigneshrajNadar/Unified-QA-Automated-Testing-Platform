import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Plus, X, Trash2, FolderOpen, Globe, Activity, CheckCircle2, AlertCircle, Clock, ShieldCheck, Lock, Code2, PlaySquare } from 'lucide-react';
import api from '../api';

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

    const [newRequest, setNewRequest] = useState({
        name: '', method: 'GET', url: '', headers: '', body: '', params: '', auth_type: 'none', auth_value: '', expected_status: 200, schema: '', description: ''
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
            await api.post('/api-testing/requests', { ...newRequest, collection_id: collectionId });
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
            setResult({ success: false, error_message: error.message });
        } finally {
            setExecuting(false);
        }
    };

    const handleExecuteAll = async () => {
        if (!window.confirm(`Execute all ${requests.length} requests in this collection?`)) return;
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
        if (!window.confirm(`Delete request "${name}"?`)) return;
        try {
            await api.delete(`/api-testing/requests/${requestId}`);
            if (selectedRequest?.request_id === requestId) {
                setSelectedRequest(null);
                setResult(null);
            }
            fetchCollection();
        } catch (error) {
            alert('Error deleting request: ' + error.message);
        }
    };

    const resetRequestForm = () => {
        setNewRequest({ name: '', method: 'GET', url: '', headers: '', body: '', params: '', auth_type: 'none', auth_value: '', expected_status: 200, schema: '', description: '' });
    };

    const getMethodStyles = (method) => {
        const styles = {
            GET: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            POST: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            PUT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            DELETE: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
            PATCH: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        };
        return styles[method] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
    );

    if (!collection) return (
        <div className="flex flex-col items-center justify-center h-64 bg-[#0B0F19]/50 border border-white/10 rounded-3xl">
            <AlertCircle className="w-10 h-10 text-rose-400 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Error Loading Collection</h2>
            <p className="text-slate-400 mb-4">Could not load collection ID: {collectionId}</p>
            <button onClick={() => navigate('/api-testing')} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/10">Go Back</button>
        </div>
    );

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/api-testing')} className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/5"><ArrowLeft className="w-5 h-5" /></button>
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-3">
                            <FolderOpen className="w-6 h-6 text-indigo-400" /> {collection.name}
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">{collection.description || 'No description provided.'}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleExecuteAll} disabled={executing || requests.length === 0} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 font-bold text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <PlaySquare className="w-4 h-4" /> Run All
                    </button>
                    <button onClick={() => setShowRequestModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]">
                        <Plus className="w-4 h-4" /> New Request
                    </button>
                </div>
            </motion.div>

            <div className="flex gap-6 flex-1 min-h-0">
                {/* Left Panel: Request List */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="w-1/3 flex flex-col bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl overflow-hidden">
                    <div className="p-5 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Globe className="w-5 h-5 text-indigo-400" /> Requests
                        </h2>
                        <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black rounded-lg">{requests.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        {requests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center opacity-60">
                                <Plus className="w-10 h-10 mb-2" />
                                <p className="text-sm">No requests yet.<br/>Click "New Request" to add one.</p>
                            </div>
                        ) : (
                            requests.map(request => (
                                <div key={request.request_id} onClick={() => setSelectedRequest(request)} className={`group relative p-3 rounded-2xl border cursor-pointer transition-all ${selectedRequest?.request_id === request.request_id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 overflow-hidden pr-8">
                                            <span className={`px-2 py-0.5 text-[10px] font-black tracking-widest rounded-md border shrink-0 ${getMethodStyles(request.method)}`}>{request.method}</span>
                                            <span className="text-white font-bold text-sm truncate">{request.name}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs font-mono text-slate-400 truncate pl-1 border-l border-white/10">{request.url}</div>

                                    {/* Quick Actions (Hover) */}
                                    <div className={`absolute right-3 top-3 flex gap-1 ${selectedRequest?.request_id === request.request_id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                        <button onClick={(e) => { e.stopPropagation(); handleExecuteRequest(request); }} className="p-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 rounded-lg transition-colors"><Play className="w-3.5 h-3.5" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRequest(request.request_id, request.name); }} className="p-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Right Panel: Request Details & Response */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-2/3 flex flex-col gap-6">
                    {selectedRequest ? (
                        <>
                            {/* Request Details */}
                            <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl flex flex-col shrink-0 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[40px] rounded-full -mr-16 -mt-16 pointer-events-none" />
                                
                                <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center z-10">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2.5 py-1 text-xs font-black tracking-widest rounded-lg border ${getMethodStyles(selectedRequest.method)}`}>{selectedRequest.method}</span>
                                        <h2 className="text-xl font-bold text-white">{selectedRequest.name}</h2>
                                    </div>
                                    <button onClick={() => handleExecuteRequest(selectedRequest)} disabled={executing} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] disabled:opacity-50">
                                        {executing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</> : <><Play className="w-4 h-4" /> Send Request</>}
                                    </button>
                                </div>

                                <div className="p-6 space-y-4 z-10 bg-black/20">
                                    <div className="flex items-center px-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl overflow-hidden">
                                        <span className="text-slate-500 font-mono text-sm mr-2 select-none">URL</span>
                                        <span className="text-white font-mono text-sm truncate">{selectedRequest.url}</span>
                                    </div>

                                    {selectedRequest.description && <p className="text-sm text-slate-400">{selectedRequest.description}</p>}

                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedRequest.auth_type !== 'none' && (
                                            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2"><Lock className="w-3.5 h-3.5"/> Authentication</h4>
                                                <p className="text-sm font-medium text-amber-400 capitalize">{selectedRequest.auth_type}</p>
                                            </div>
                                        )}
                                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2"><Code2 className="w-3.5 h-3.5"/> Expected Status</h4>
                                            <p className="text-sm font-medium text-emerald-400">{selectedRequest.expected_status || 200}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Response Section */}
                            <AnimatePresence mode="wait">
                                {result ? (
                                    <motion.div key="response" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl flex flex-col flex-1 min-h-0 overflow-hidden">
                                        <div className="p-4 border-b border-white/10 bg-white/5 flex flex-wrap gap-4 items-center shrink-0">
                                            <h3 className="text-sm font-bold text-white mr-auto flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> Response</h3>
                                            
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/30 rounded-lg border border-white/5">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</span>
                                                <span className={`text-sm font-bold ${result.success ? 'text-emerald-400' : 'text-rose-400'}`}>{result.status_code || 'Error'}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/30 rounded-lg border border-white/5">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Time</span>
                                                <span className="text-sm font-bold text-blue-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {result.response_time_ms}ms</span>
                                            </div>

                                            {result.schema_valid !== null && (
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/30 rounded-lg border border-white/5">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Schema</span>
                                                    {result.schema_valid ? 
                                                        <span className="text-sm font-bold text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> Valid</span> :
                                                        <span className="text-sm font-bold text-rose-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/> Invalid</span>
                                                    }
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 overflow-auto bg-[#0D1424] p-6 custom-scrollbar font-mono text-sm text-slate-300">
                                            {result.error_message ? (
                                                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                                                    <strong>Error:</strong> {result.error_message}
                                                </div>
                                            ) : result.response_body ? (
                                                <pre className="whitespace-pre-wrap word-break">{JSON.stringify(JSON.parse(result.response_body), null, 2)}</pre>
                                            ) : (
                                                <div className="text-slate-500 italic">No response body.</div>
                                            )}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 border-2 border-dashed border-white/10 rounded-3xl bg-[#0B0F19]/30 flex flex-col items-center justify-center text-slate-500">
                                        <PlaySquare className="w-12 h-12 mb-4 opacity-50" />
                                        <p>Click "Send Request" to execute and view results here.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    ) : (
                        <div className="flex-1 border-2 border-dashed border-white/10 rounded-3xl bg-[#0B0F19]/30 flex flex-col items-center justify-center text-slate-500">
                            <Globe className="w-12 h-12 mb-4 opacity-50" />
                            <p>Select a request from the list to view and execute.</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* CREATE REQUEST MODAL */}
            <AnimatePresence>
                {showRequestModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRequestModal(false)} />
                        
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-[#0D1424] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-indigo-400" /> New API Request
                                </h3>
                                <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <form onSubmit={handleCreateRequest} className="p-6 space-y-6" id="createRequestForm">
                                    
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="col-span-3">
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Request Name *</label>
                                            <input required type="text" value={newRequest.name} onChange={e => setNewRequest({ ...newRequest, name: e.target.value })} placeholder="e.g., Get User Profile" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors" />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Method *</label>
                                            <select value={newRequest.method} onChange={e => setNewRequest({ ...newRequest, method: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none">
                                                <option className="bg-[#0D1424] text-emerald-400">GET</option>
                                                <option className="bg-[#0D1424] text-blue-400">POST</option>
                                                <option className="bg-[#0D1424] text-amber-400">PUT</option>
                                                <option className="bg-[#0D1424] text-rose-400">DELETE</option>
                                                <option className="bg-[#0D1424] text-purple-400">PATCH</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">URL *</label>
                                        <input required type="url" value={newRequest.url} onChange={e => setNewRequest({ ...newRequest, url: e.target.value })} placeholder="https://api.example.com/v1/resource" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500/50 transition-colors" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Headers (JSON)</label>
                                        <textarea value={newRequest.headers} onChange={e => setNewRequest({ ...newRequest, headers: e.target.value })} placeholder='{"Content-Type": "application/json"}' className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 font-mono text-sm focus:outline-none focus:border-indigo-500/50 transition-colors min-h-[80px]" />
                                    </div>

                                    {['POST', 'PUT', 'PATCH'].includes(newRequest.method) && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Body (JSON)</label>
                                            <textarea value={newRequest.body} onChange={e => setNewRequest({ ...newRequest, body: e.target.value })} placeholder='{"key": "value"}' className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-slate-300 font-mono text-sm focus:outline-none focus:border-indigo-500/50 transition-colors min-h-[120px]" />
                                        </motion.div>
                                    )}

                                    <div className="grid grid-cols-2 gap-6 bg-white/5 p-4 border border-white/5 rounded-2xl">
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Auth Type</label>
                                            <select value={newRequest.auth_type} onChange={e => setNewRequest({ ...newRequest, auth_type: e.target.value })} className="w-full px-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none">
                                                <option value="none" className="bg-[#0D1424]">None</option>
                                                <option value="bearer" className="bg-[#0D1424]">Bearer Token</option>
                                                <option value="apikey" className="bg-[#0D1424]">API Key</option>
                                                <option value="basic" className="bg-[#0D1424]">Basic Auth</option>
                                            </select>
                                        </div>
                                        {newRequest.auth_type !== 'none' && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Auth Value</label>
                                                <input type="text" value={newRequest.auth_value} onChange={e => setNewRequest({ ...newRequest, auth_value: e.target.value })} placeholder={newRequest.auth_type === 'basic' ? 'username:password' : 'token/key value'} className="w-full px-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors" />
                                            </motion.div>
                                        )}
                                    </div>
                                </form>
                            </div>

                            <div className="p-4 border-t border-white/10 flex gap-3 bg-white/5 shrink-0">
                                <button type="button" onClick={() => setShowRequestModal(false)} className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-bold transition-colors">Cancel</button>
                                <button type="submit" form="createRequestForm" className="flex-1 py-3 px-4 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/20">Save Request</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default APICollection;
