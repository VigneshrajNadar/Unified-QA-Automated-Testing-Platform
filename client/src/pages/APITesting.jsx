import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plug, Plus, Download, FolderOpen, Activity, Play, Pause, History, Trash2, Clock, CheckCircle2, AlertCircle, X, Server, Layers } from 'lucide-react';
import api from '../api';

function APITesting() {
    const navigate = useNavigate();
    const [activeTabState, setActiveTabState] = useState(localStorage.getItem('apiTestingTab') || 'collections');

    const setActiveTab = (tab) => {
        setActiveTabState(tab);
        localStorage.setItem('apiTestingTab', tab);
    };

    const [collections, setCollections] = useState([]);
    const [monitors, setMonitors] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
    const [showCreateMonitorModal, setShowCreateMonitorModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    const [newCollection, setNewCollection] = useState({ name: '', description: '', project_id: null });
    const [newMonitor, setNewMonitor] = useState({ collection_id: '', name: '', frequency: '5min' });
    const [swaggerUrl, setSwaggerUrl] = useState('');
    const [importing, setImporting] = useState(false);

    const [historyData, setHistoryData] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

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

    const handleViewHistory = async (monitor) => {
        try {
            const res = await api.get(`/api-testing/monitors/${monitor.monitor_id}/history`);
            const runsMap = {};
            res.data.forEach(r => {
                const timestamp = r.executed_at || r.created_at;
                const ts = new Date(timestamp).getTime();
                const windowKey = Math.floor(ts / 5000);
                if (!runsMap[windowKey]) {
                    runsMap[windowKey] = { timestamp, pass: 0, fail: 0, results: [] };
                }
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
            await api.put(`/api-testing/monitors/${monitor.monitor_id}/toggle`, { is_active: newStatus });
            fetchMonitors();
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

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
    );

    const activeMonitors = monitors.filter(m => m.is_active);

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Plug className="w-8 h-8 text-indigo-400" /> API Platform
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Build, test, and schedule API collections</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <button onClick={() => setShowImportModal(true)} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-sm rounded-xl transition-all border border-white/10 flex-1 xl:flex-none">
                        <Download className="w-4 h-4" /> Import Swagger
                    </button>
                    <button onClick={() => setShowCreateCollectionModal(true)} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-bold text-sm rounded-xl transition-all border border-indigo-500/20 flex-1 xl:flex-none">
                        <Plus className="w-4 h-4" /> New Collection
                    </button>
                    <button onClick={() => setShowCreateMonitorModal(true)} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex-1 xl:flex-none">
                        <Clock className="w-4 h-4" /> New Monitor
                    </button>
                </div>
            </motion.div>

            {/* ACTIVE MONITORS BANNER */}
            <AnimatePresence>
                {activeMonitors.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                        <div className="p-4 border-b border-emerald-500/10 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-emerald-400" />
                            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Active Monitors ({activeMonitors.length})</h3>
                        </div>
                        <div className="p-4 flex gap-4 overflow-x-auto custom-scrollbar">
                            {activeMonitors.map(m => (
                                <div key={m.monitor_id} className="min-w-[300px] shrink-0 bg-[#0B0F19]/80 backdrop-blur-xl border border-emerald-500/10 rounded-xl p-4 shadow-lg flex flex-col">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="text-white font-bold truncate pr-4">{m.name}</h4>
                                        <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 animate-pulse">Running</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-4 font-mono">
                                        <Clock className="w-3.5 h-3.5" /> {m.frequency_cron}
                                    </div>
                                    <div className="flex justify-between items-center text-xs mb-4 p-2 bg-black/20 rounded-lg">
                                        <span className="text-slate-500 font-bold uppercase tracking-wider">Last Run</span>
                                        <span className="text-emerald-400 font-medium">{m.last_run ? new Date(m.last_run).toLocaleTimeString() : 'Pending'}</span>
                                    </div>
                                    <div className="flex gap-2 mt-auto">
                                        <button onClick={() => handleViewHistory(m)} className="flex-1 flex justify-center items-center gap-1.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg transition-colors"><History className="w-3.5 h-3.5"/> History</button>
                                        <button onClick={() => { if(confirm('Force run now?')) alert('Triggered!'); }} className="flex-1 flex justify-center items-center gap-1.5 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-colors"><Play className="w-3.5 h-3.5"/> Run</button>
                                        <button onClick={() => handleToggleMonitor(m)} className="flex-1 flex justify-center items-center gap-1.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold rounded-lg transition-colors"><Pause className="w-3.5 h-3.5"/> Pause</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TABS */}
            <div className="flex border-b border-white/10">
                <button 
                    onClick={() => setActiveTab('collections')}
                    className={`px-6 py-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTabState === 'collections' ? 'text-indigo-400' : 'text-slate-500 hover:text-white'}`}
                >
                    <div className="flex items-center gap-2"><FolderOpen className="w-4 h-4"/> Collections</div>
                    {activeTabState === 'collections' && <motion.div layoutId="apiTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
                </button>
                <button 
                    onClick={() => setActiveTab('monitors')}
                    className={`px-6 py-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTabState === 'monitors' ? 'text-indigo-400' : 'text-slate-500 hover:text-white'}`}
                >
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4"/> Monitors</div>
                    {activeTabState === 'monitors' && <motion.div layoutId="apiTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
                </button>
            </div>

            {/* TAB CONTENT: COLLECTIONS */}
            {activeTabState === 'collections' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    {collections.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 border border-dashed border-white/10 rounded-3xl bg-[#0B0F19]/50 text-center">
                            <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
                                <Plug className="w-10 h-10 text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">No API Collections</h3>
                            <p className="text-slate-400 max-w-md mb-8">Group your API requests into collections to organize your testing workflows efficiently.</p>
                            <button onClick={() => setShowCreateCollectionModal(true)} className="flex items-center gap-2 px-6 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 font-bold text-sm rounded-xl transition-colors">
                                <Plus className="w-4 h-4" /> Create Collection
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {collections.map((collection, index) => (
                                <motion.div key={collection.collection_id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl flex flex-col group hover:border-indigo-500/30 transition-all">
                                    <div className="p-6 border-b border-white/5 flex justify-between items-start">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                                                <Layers className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white leading-tight">{collection.name}</h3>
                                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{collection.description || 'No description provided.'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-6 py-4 flex-1">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/20 rounded-lg border border-white/5">
                                            <Server className="w-4 h-4 text-slate-500" />
                                            <span className="text-sm font-bold text-white">{collection.request_count || 0} <span className="text-slate-500 font-normal">Requests</span></span>
                                        </div>
                                    </div>
                                    <div className="p-4 border-t border-white/5 bg-white/5 flex gap-2 shrink-0">
                                        <button onClick={() => navigate(`/api-collection/${collection.collection_id}`)} className="flex-1 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors border border-indigo-500/20">
                                            Open Collection
                                        </button>
                                        <button onClick={() => handleDeleteCollection(collection.collection_id, collection.name)} className="w-11 flex justify-center items-center bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors shrink-0">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* TAB CONTENT: MONITORS */}
            {activeTabState === 'monitors' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    {monitors.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 border border-dashed border-white/10 rounded-3xl bg-[#0B0F19]/50 text-center">
                            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20">
                                <Clock className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">No Monitors Configured</h3>
                            <p className="text-slate-400 max-w-md mb-8">Schedule your API collections to run automatically and monitor endpoint health.</p>
                            <button onClick={() => setShowCreateMonitorModal(true)} className="flex items-center gap-2 px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold text-sm rounded-xl transition-colors">
                                <Clock className="w-4 h-4" /> Create Monitor
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {monitors.map((monitor, index) => (
                                <motion.div key={monitor.monitor_id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} className={`bg-[#0B0F19]/80 backdrop-blur-xl border-2 rounded-3xl shadow-xl flex flex-col relative overflow-hidden transition-all ${monitor.is_active ? 'border-emerald-500/30 hover:border-emerald-500/50' : 'border-white/10 hover:border-white/20'}`}>
                                    {monitor.is_active && <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[30px] rounded-full -mr-10 -mt-10 pointer-events-none" />}
                                    
                                    <div className="p-6 border-b border-white/5 flex justify-between items-start z-10">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${monitor.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-500/10 border-slate-500/20 text-slate-400'}`}>
                                                <Activity className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white leading-tight">{monitor.name}</h3>
                                                <div className="flex items-center gap-1.5 mt-1.5">
                                                    <span className={`w-2 h-2 rounded-full ${monitor.is_active ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'}`} />
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${monitor.is_active ? 'text-emerald-400' : 'text-amber-400'}`}>{monitor.is_active ? 'Active' : 'Paused'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="px-6 py-5 flex-1 bg-black/10 z-10 space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Collection</span>
                                            <span className="text-white font-medium max-w-[150px] truncate">{monitor.collection_name}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Schedule</span>
                                            <span className="text-indigo-400 font-mono bg-indigo-500/10 px-2 py-1 rounded-md">{monitor.frequency_cron}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Last Run</span>
                                            <span className="text-slate-300">{monitor.last_run ? new Date(monitor.last_run).toLocaleTimeString() : 'Pending'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 border-t border-white/5 bg-white/5 flex gap-2 shrink-0 z-10">
                                        <button onClick={() => handleToggleMonitor(monitor)} className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors border flex items-center justify-center gap-2 ${monitor.is_active ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'}`}>
                                            {monitor.is_active ? <><Pause className="w-4 h-4"/> Pause</> : <><Play className="w-4 h-4"/> Resume</>}
                                        </button>
                                        <button onClick={() => handleDeleteMonitor(monitor.monitor_id)} className="w-11 flex justify-center items-center bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors shrink-0">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* MODALS */}
            <AnimatePresence>
                {/* CREATE COLLECTION */}
                {showCreateCollectionModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateCollectionModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-[#0D1424] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <FolderOpen className="w-5 h-5 text-indigo-400" /> New Collection
                                </h3>
                                <button onClick={() => setShowCreateCollectionModal(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleCreateCollection} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Collection Name *</label>
                                    <input required type="text" value={newCollection.name} onChange={e => setNewCollection({ ...newCollection, name: e.target.value })} placeholder="e.g., Auth Endpoints" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                                    <textarea value={newCollection.description} onChange={e => setNewCollection({ ...newCollection, description: e.target.value })} placeholder="Describe the purpose of this collection..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors min-h-[100px] resize-none" />
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-white/10">
                                    <button type="button" onClick={() => setShowCreateCollectionModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/20">Create Collection</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* CREATE MONITOR */}
                {showCreateMonitorModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateMonitorModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-[#0D1424] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-emerald-400" /> Schedule Monitor
                                </h3>
                                <button onClick={() => setShowCreateMonitorModal(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleCreateMonitor} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Monitor Name *</label>
                                    <input required type="text" value={newMonitor.name} onChange={e => setNewMonitor({ ...newMonitor, name: e.target.value })} placeholder="e.g., Daily Health Check" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Collection *</label>
                                    <select required value={newMonitor.collection_id} onChange={e => setNewMonitor({ ...newMonitor, collection_id: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none">
                                        <option value="" className="bg-[#0D1424]">-- Choose Collection --</option>
                                        {collections.map(c => <option key={c.collection_id} value={c.collection_id} className="bg-[#0D1424]">{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Frequency *</label>
                                    <select value={newMonitor.frequency} onChange={e => setNewMonitor({ ...newMonitor, frequency: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none">
                                        <option value="1min" className="bg-[#0D1424]">Every Minute (Demo)</option>
                                        <option value="5min" className="bg-[#0D1424]">Every 5 Minutes</option>
                                        <option value="15min" className="bg-[#0D1424]">Every 15 Minutes</option>
                                        <option value="1hour" className="bg-[#0D1424]">Every Hour</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-white/10">
                                    <button type="button" onClick={() => setShowCreateMonitorModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20">Start Monitor</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* IMPORT SWAGGER */}
                {showImportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowImportModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-[#0D1424] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Download className="w-5 h-5 text-blue-400" /> Import Swagger
                                </h3>
                                <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleImportSwagger} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Swagger JSON URL *</label>
                                    <input required type="url" value={swaggerUrl} onChange={e => setSwaggerUrl(e.target.value)} placeholder="https://petstore.swagger.io/v2/swagger.json" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors" />
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-white/10">
                                    <button type="button" onClick={() => setShowImportModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors">Cancel</button>
                                    <button type="submit" disabled={importing} className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 flex justify-center items-center gap-2">
                                        {importing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Importing...</> : 'Import'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* HISTORY MODAL */}
                {showHistoryModal && historyData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistoryModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-[#0D1424] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[80vh]" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <History className="w-5 h-5 text-indigo-400" /> Run History
                                    </h3>
                                    <p className="text-sm text-slate-400 mt-1">{historyData.monitorName}</p>
                                </div>
                                <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                {historyData.runs.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">No run history found.</div>
                                ) : (
                                    <div className="space-y-3">
                                        {historyData.runs.map((run, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-slate-300 font-mono text-sm">{new Date(run.timestamp).toLocaleString()}</div>
                                                    <div className="w-px h-6 bg-white/10"></div>
                                                    <div className="text-sm text-slate-400"><span className="text-emerald-400 font-bold">{run.pass}</span> passed</div>
                                                </div>
                                                {run.fail === 0 ? (
                                                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/> Success</span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5"/> Failed ({run.fail})</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default APITesting;
