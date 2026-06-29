import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, Plus, Play, Pause, Trash2, Edit2, CheckCircle2, Globe } from 'lucide-react';
import api, { SERVER_URL } from '../api';

function MockServer() {
    const [endpoints, setEndpoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '', method: 'GET', endpoint: '/', status_code: 200, response_body: '{\n  "message": "success"\n}', headers: '{"Content-Type":"application/json"}', delay_ms: 0
    });

    useEffect(() => {
        fetchEndpoints();
    }, []);

    const fetchEndpoints = async () => {
        try {
            const res = await api.get('/mockServer/endpoints');
            setEndpoints(res.data);
        } catch (error) {
            console.error('Failed to fetch mock endpoints:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/mockServer/endpoints', formData);
            setShowModal(false);
            fetchEndpoints();
            setFormData({ name: '', method: 'GET', endpoint: '/', status_code: 200, response_body: '{\n  "message": "success"\n}', headers: '{"Content-Type":"application/json"}', delay_ms: 0 });
        } catch (error) {
            alert(error.message);
        }
    };

    const handleToggle = async (id) => {
        try {
            await api.put(`/mockServer/endpoints/${id}/toggle`);
            fetchEndpoints();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this mock endpoint?')) return;
        try {
            await api.delete(`/mockServer/endpoints/${id}`);
            fetchEndpoints();
        } catch (error) {
            alert(error.message);
        }
    };

    const getMethodColor = (method) => {
        const colors = { GET: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', POST: 'text-blue-400 bg-blue-500/10 border-blue-500/20', PUT: 'text-amber-400 bg-amber-500/10 border-amber-500/20', DELETE: 'text-rose-400 bg-rose-500/10 border-rose-500/20', PATCH: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
        return colors[method] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Server className="w-8 h-8 text-indigo-400" /> Mock Server Hub
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Simulate backend APIs for frontend development and contract testing.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)]">
                    <Plus className="w-4 h-4" /> New Mock Endpoint
                </button>
            </motion.div>

            {loading ? (
                <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>
            ) : endpoints.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 border border-dashed border-white/10 rounded-3xl bg-[#0B0F19]/50 text-center">
                    <Globe className="w-12 h-12 text-indigo-400 mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-white mb-2">No Mock Endpoints Active</h3>
                    <p className="text-slate-400 max-w-md">Create dynamic endpoints that return custom JSON responses. Perfect for testing without a real backend.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {endpoints.map(ep => (
                        <motion.div key={ep._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`bg-[#0B0F19]/80 backdrop-blur-xl border rounded-3xl p-6 transition-all ${ep.is_active ? 'border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.1)]' : 'border-white/5 opacity-75'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">{ep.name}</h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`px-2 py-0.5 text-[10px] font-black tracking-widest rounded border uppercase ${getMethodColor(ep.method)}`}>{ep.method}</span>
                                        <span className="text-xs font-mono text-slate-300 bg-black/30 px-2 py-1 rounded">{SERVER_URL}/mock{ep.endpoint}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleToggle(ep._id)} className={`p-2 rounded-lg transition-colors ${ep.is_active ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
                                        {ep.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => handleDelete(ep._id)} className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Status Code</span>
                                    <span className="text-sm font-bold text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {ep.status_code}</span>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Delay (ms)</span>
                                    <span className="text-sm font-bold text-amber-400">{ep.delay_ms}ms</span>
                                </div>
                            </div>
                            
                            <div className="bg-black/40 rounded-xl p-4 border border-white/5 relative group overflow-hidden">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Response Body</span>
                                <pre className="text-xs text-indigo-300 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">{ep.response_body}</pre>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h2 className="text-xl font-black text-white">Create Mock Endpoint</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><Plus className="w-6 h-6 rotate-45" /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Endpoint Name</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" placeholder="e.g., Get Users" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">HTTP Method</label>
                                    <select value={formData.method} onChange={e => setFormData({...formData, method: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50">
                                        {['GET','POST','PUT','DELETE','PATCH'].map(m => <option key={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Endpoint Path (starts with /)</label>
                                <div className="flex">
                                    <span className="bg-white/5 border border-white/10 border-r-0 rounded-l-xl px-4 py-3 text-slate-500 font-mono text-sm">{SERVER_URL}/mock</span>
                                    <input type="text" required value={formData.endpoint} onChange={e => setFormData({...formData, endpoint: e.target.value})} className="flex-1 bg-black/20 border border-white/10 rounded-r-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 font-mono" placeholder="/users" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Status Code</label>
                                    <input type="number" required value={formData.status_code} onChange={e => setFormData({...formData, status_code: parseInt(e.target.value)})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Artificial Delay (ms)</label>
                                    <input type="number" value={formData.delay_ms} onChange={e => setFormData({...formData, delay_ms: parseInt(e.target.value)})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Response Body (JSON)</label>
                                <textarea required rows={5} value={formData.response_body} onChange={e => setFormData({...formData, response_body: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-indigo-500/50" placeholder='{"status": "ok"}' />
                            </div>

                            <button type="submit" className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-black uppercase tracking-widest text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] mt-4">
                                Deploy Mock Endpoint
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

export default MockServer;
