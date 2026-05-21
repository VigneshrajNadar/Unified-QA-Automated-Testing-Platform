import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Play, Server, Monitor, LayoutGrid, Clock, Trash2, CheckCircle2, AlertCircle, RefreshCw, XCircle, ChevronRight, Laptop } from 'lucide-react';
import api from '../api';

const SeleniumDashboard = () => {
    const [stats, setStats] = useState({ total_jobs: 0, recent_jobs: [], recent_executions: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
        const interval = setInterval(fetchDashboard, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await api.get('/selenium/dashboard');
            setStats(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this test run?')) return;
        try {
            await api.delete(`/selenium/job/${id}`);
            fetchDashboard();
        } catch (err) {
            console.error(err);
            alert('Failed to delete job: ' + (err.response?.data?.error || err.message));
        }
    };

    const getStatusStyles = (status) => {
        const s = status.toLowerCase();
        if (s.includes('pass') || s.includes('success')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        if (s.includes('fail') || s.includes('error')) return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
        if (s.includes('run') || s.includes('progress')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30 animate-pulse';
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    };

    const getBrowserIcon = (browser) => {
        const b = browser?.toLowerCase() || '';
        if (b.includes('chrome')) return <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30"><div className="w-4 h-4 rounded-full bg-blue-400" /></div>;
        if (b.includes('firefox')) return <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30"><div className="w-4 h-4 rounded-full bg-orange-400" /></div>;
        if (b.includes('edge')) return <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30"><div className="w-4 h-4 rounded-full bg-cyan-400" /></div>;
        return <div className="w-8 h-8 rounded-full bg-slate-500/20 flex items-center justify-center border border-slate-500/30"><Globe className="w-4 h-4 text-slate-400" /></div>;
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[50px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                <div className="z-10">
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Cloud className="w-8 h-8 text-purple-400" /> Selenium Cloud
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Cross-browser execution dashboard and grid status</p>
                </div>
                <div className="z-10 w-full md:w-auto">
                    <Link to="/selenium/execute" className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]">
                        <Play className="w-4 h-4" /> New Test Run
                    </Link>
                </div>
            </motion.div>

            {/* Grid Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <LayoutGrid className="w-32 h-32 text-purple-500" />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2"><LayoutGrid className="w-3.5 h-3.5"/> Total Jobs Run</div>
                    <div className="text-4xl font-black text-white font-mono">{stats.total_jobs}</div>
                </motion.div>
                
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors md:col-span-3">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Server className="w-32 h-32 text-emerald-500" />
                    </div>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2"><Server className="w-3.5 h-3.5"/> Selenium Grid Status</div>
                            <div className="flex items-center gap-3">
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                                <span className="text-xl font-bold text-white">2 Active Nodes</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-2 text-xs font-bold text-blue-400">
                                Chrome <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                            <div className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center gap-2 text-xs font-bold text-orange-400">
                                Firefox <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Recent Jobs Table */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="xl:col-span-2 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-white/10 bg-white/5 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-400" />
                        <h2 className="text-lg font-bold text-white">Recent Test Runs</h2>
                    </div>
                    
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4">Job ID</th>
                                    <th className="px-6 py-4">Test Script</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Created At</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {stats.recent_jobs.length === 0 ? (
                                    <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">No test jobs found. Click "New Test Run" to start.</td></tr>
                                ) : (
                                    stats.recent_jobs.map(job => (
                                        <tr key={job.job_id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 font-mono text-xs text-purple-400 font-bold">#{job.job_id}</td>
                                            <td className="px-6 py-4 text-white font-medium max-w-[200px] truncate">{job.script_name || 'Unknown Script'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(job.status)}`}>
                                                    {job.status.toLowerCase().includes('pass') ? <CheckCircle2 className="w-3 h-3" /> :
                                                     job.status.toLowerCase().includes('fail') ? <XCircle className="w-3 h-3" /> :
                                                     <RefreshCw className="w-3 h-3" />}
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono text-slate-400">{new Date(job.created_at).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link to={`/selenium/job/${job.job_id}`} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-colors border border-white/10">
                                                        Details
                                                    </Link>
                                                    <button onClick={() => handleDelete(job.job_id)} className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Recent Browser Executions */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-white/10 bg-white/5 flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-lg font-bold text-white">Live Node Activity</h2>
                    </div>

                    <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                        {stats.recent_executions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 opacity-60">
                                <Laptop className="w-12 h-12 mb-3" />
                                <p className="text-sm">No recent browser executions.</p>
                            </div>
                        ) : (
                            stats.recent_executions.map(exec => (
                                <div key={exec.execution_id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors">
                                    <div className="shrink-0">{getBrowserIcon(exec.browser)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="font-bold text-white capitalize text-sm">{exec.browser} Node</div>
                                            <div className="text-[10px] font-mono text-slate-500">{new Date(exec.start_time).toLocaleTimeString()}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(exec.status)}`}>
                                                {exec.status}
                                            </span>
                                            <span className="text-xs text-slate-400 truncate max-w-[100px] hover:max-w-none transition-all">Job #{exec.job_id}</span>
                                        </div>
                                    </div>
                                    <Link to={`/selenium/job/${exec.job_id}`} className="text-slate-400 hover:text-white transition-colors shrink-0">
                                        <ChevronRight className="w-5 h-5" />
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SeleniumDashboard;
