import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Gauge, Zap, AlertTriangle, Play, History, Download, Clock, BarChart2, CheckCircle2, Server, Globe, DownloadCloud, UploadCloud } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PerformanceTesting = () => {
    const [activeTab, setActiveTab] = useState('run');
    const [k6Installed, setK6Installed] = useState(false);

    // Config State
    const [config, setConfig] = useState({
        url: '',
        users: 10,
        duration: 30,
        name: '',
        testType: 'load'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastResult, setLastResult] = useState(null);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        checkK6Status();
        fetchHistory();
    }, []);

    const checkK6Status = async () => {
        try {
            const res = await api.get('/performance/status');
            setK6Installed(res.data.k6_installed);
        } catch (err) {
            console.error("Failed to check k6 status", err);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get('/performance/history');
            setHistory(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRunTest = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setLastResult(null);

        try {
            const res = await api.post('/performance/run', {
                ...config,
                save_config: true
            });
            setLastResult(res.data.metrics);
            fetchHistory();
            setActiveTab('results');
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = {
        success: '#10b981', // emerald
        warning: '#f59e0b', // amber
        danger: '#f43f5e',  // rose
        info: '#3b82f6'     // blue
    };

    const getTestTypeDetails = (type) => {
        switch (type) {
            case 'stress': return { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', desc: 'Gradually increases load to find the breaking point.' };
            case 'spike': return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', desc: 'Simulates extreme traffic spikes (e.g., Black Friday).' };
            case 'soak': return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', desc: 'Runs for a longer period to identify memory leaks.' };
            default: return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', desc: 'Simulates normal traffic to verify system stability.' };
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[50px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                <div className="z-10">
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Gauge className="w-8 h-8 text-amber-400" /> Performance Testing
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Simulate concurrent users and analyze system behavior under heavy load</p>
                </div>
            </motion.div>

            {!k6Installed && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                    <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-amber-400 font-bold text-sm">k6 Engine Missing</h3>
                        <p className="text-slate-300 text-sm mt-1">You need to install k6 on the server to run performance tests. <br/> <code className="bg-black/30 px-2 py-1 rounded text-amber-300 font-mono mt-2 inline-block">choco install k6</code></p>
                    </div>
                </motion.div>
            )}

            {/* TABS */}
            <div className="flex border-b border-white/10">
                {[
                    { id: 'run', label: 'Configure & Run', icon: <Play className="w-4 h-4"/> },
                    { id: 'results', label: 'Test Results', icon: <BarChart2 className="w-4 h-4"/> },
                    { id: 'history', label: 'History', icon: <History className="w-4 h-4"/> }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-amber-400' : 'text-slate-500 hover:text-white'}`}
                    >
                        <div className="flex items-center gap-2">{tab.icon} {tab.label}</div>
                        {activeTab === tab.id && <motion.div layoutId="perfTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />}
                    </button>
                ))}
            </div>

            <div className="pt-4">
                <AnimatePresence mode="wait">
                    {/* RUN TAB */}
                    {activeTab === 'run' && (
                        <motion.div key="run" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto">
                            <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[40px] rounded-full -mr-16 -mt-16 pointer-events-none" />
                                
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-amber-400" /> Test Configuration
                                </h2>

                                <form onSubmit={handleRunTest} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Target URL <span className="text-amber-400">*</span></label>
                                            <div className="relative">
                                                <input required type="url" placeholder="https://api.example.com/users" value={config.url} onChange={e => setConfig({ ...config, url: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
                                                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Test Name (Optional)</label>
                                            <input type="text" placeholder="e.g., Homepage Load Test" value={config.name} onChange={e => setConfig({ ...config, name: e.target.value })} className="w-full px-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Test Scenario</label>
                                            <select value={config.testType} onChange={e => setConfig({ ...config, testType: e.target.value })} className="w-full px-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-amber-500/50 transition-colors appearance-none">
                                                <option value="load" className="bg-[#0D1424]">Load Test (Standard)</option>
                                                <option value="stress" className="bg-[#0D1424]">Stress Test (Break Point)</option>
                                                <option value="spike" className="bg-[#0D1424]">Spike Test (Sudden Burst)</option>
                                                <option value="soak" className="bg-[#0D1424]">Soak Test (Duration)</option>
                                            </select>
                                            <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5"/> {getTestTypeDetails(config.testType).desc}</div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Virtual Users (Max)</label>
                                            <input type="number" min="1" max="5000" value={config.users} onChange={e => setConfig({ ...config, users: parseInt(e.target.value) })} className="w-full px-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Duration (Seconds)</label>
                                            <div className="relative">
                                                <input type="number" min="10" max="14400" value={config.duration} onChange={e => setConfig({ ...config, duration: parseInt(e.target.value) })} className="w-full pl-10 pr-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
                                                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                            <p>{error}</p>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-white/10 flex justify-end">
                                        <button type="submit" disabled={loading || !k6Installed} className="flex justify-center items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] disabled:opacity-50 disabled:cursor-not-allowed">
                                            {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Igniting Engine...</> : <><Gauge className="w-5 h-5" /> Start Performance Test</>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {/* RESULTS TAB */}
                    {activeTab === 'results' && (
                        <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                            {!lastResult ? (
                                <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-white/10 rounded-3xl bg-[#0B0F19]/50 text-center">
                                    <BarChart2 className="w-16 h-16 text-slate-600 mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">No Recent Results</h3>
                                    <p className="text-slate-400 max-w-md mb-6">Configure and run a performance test to visualize the metrics and generate reports.</p>
                                    <button onClick={() => setActiveTab('run')} className="px-6 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-bold text-sm rounded-xl transition-colors">Go to Configuration</button>
                                </div>
                            ) : (
                                <>
                                    {/* Top Summary Metrics */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                        {[
                                            { label: 'Avg Response', value: `${lastResult.avg}ms`, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                                            { label: 'Median (P50)', value: `${lastResult.median || 0}ms`, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                                            { label: 'P95', value: `${lastResult.p95 || 0}ms`, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                                            { label: 'P99', value: `${lastResult.p99 || 0}ms`, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                                            { label: 'Throughput', value: `${lastResult.throughput}/s`, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                                            { label: 'Error Rate', value: `${lastResult.errorRate}%`, color: lastResult.errorRate > 0 ? 'text-rose-400' : 'text-emerald-400', bg: lastResult.errorRate > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10', border: lastResult.errorRate > 0 ? 'border-rose-500/20' : 'border-emerald-500/20' }
                                        ].map((m, idx) => (
                                            <div key={idx} className={`p-4 rounded-2xl border ${m.bg} ${m.border} flex flex-col items-center justify-center text-center group hover:scale-105 transition-transform cursor-default`}>
                                                <div className={`text-xl font-black font-mono mb-1 ${m.color}`}>{m.value}</div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">{m.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Network & Transfer Stats */}
                                    <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
                                        <div className="flex items-center gap-2 mb-6 text-white font-bold"><Server className="w-5 h-5 text-indigo-400"/> Network Transfer Metrics</div>
                                        <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                                            {[
                                                { label: 'Total Req', val: `${lastResult.totalRequests || 0}`, icon: <Globe className="w-4 h-4"/> },
                                                { label: 'Data Recv', val: `${lastResult.dataReceived || 0} MB`, icon: <DownloadCloud className="w-4 h-4"/> },
                                                { label: 'Data Sent', val: `${lastResult.dataSent || 0} MB`, icon: <UploadCloud className="w-4 h-4"/> },
                                                { label: 'Connecting', val: `${lastResult.timings?.connecting || 0}ms`, icon: <Zap className="w-4 h-4"/> },
                                                { label: 'Waiting (TTFB)', val: `${lastResult.timings?.waiting || 0}ms`, icon: <Clock className="w-4 h-4"/> },
                                                { label: 'Downloading', val: `${lastResult.timings?.receiving || 0}ms`, icon: <Download className="w-4 h-4"/> }
                                            ].map((stat, i) => (
                                                <div key={i}>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{stat.icon} {stat.label}</div>
                                                    <div className="text-base font-bold text-white font-mono">{stat.val}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Charts */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Response Time Chart */}
                                        <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
                                            <h3 className="text-sm font-bold text-white mb-6">Response Time Distribution (ms)</h3>
                                            <div className="h-[300px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={[
                                                        { name: 'Avg', value: lastResult.avg },
                                                        { name: 'Median', value: lastResult.median },
                                                        { name: 'P95', value: lastResult.p95 },
                                                        { name: 'P99', value: lastResult.p99 },
                                                        { name: 'Max', value: lastResult.max }
                                                    ]}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                        <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                                                        <YAxis stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }} cursor={{fill: '#1e293b', opacity: 0.4}} />
                                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                            {
                                                                [
                                                                    { name: 'Avg', value: lastResult.avg },
                                                                    { name: 'Median', value: lastResult.median },
                                                                    { name: 'P95', value: lastResult.p95 },
                                                                    { name: 'P99', value: lastResult.p99 },
                                                                    { name: 'Max', value: lastResult.max }
                                                                ].map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#06b6d4', '#eab308', '#f97316', '#ef4444'][index]} />
                                                                ))
                                                            }
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Status Codes Chart */}
                                        <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
                                            <h3 className="text-sm font-bold text-white mb-6">HTTP Status Codes</h3>
                                            <div className="h-[300px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={Object.entries(lastResult.statusCodes || {}).map(([code, count]) => ({ name: `HTTP ${code}`, value: count }))}
                                                            cx="50%" cy="50%"
                                                            innerRadius={80}
                                                            outerRadius={110}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                            stroke="none"
                                                        >
                                                            {Object.keys(lastResult.statusCodes || {}).map((code, index) => (
                                                                <Cell key={`cell-${index}`} fill={code.startsWith('2') ? '#10b981' : code.startsWith('3') ? '#3b82f6' : code.startsWith('4') ? '#f59e0b' : '#f43f5e'} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }} />
                                                        <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Timing Breakdown Chart */}
                                        <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl lg:col-span-2">
                                            <h3 className="text-sm font-bold text-white mb-6">Request Lifecycle Breakdown</h3>
                                            <div className="h-[300px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={[
                                                                { name: 'Blocked', value: lastResult.timings?.blocked || 0 },
                                                                { name: 'Connecting', value: lastResult.timings?.connecting || 0 },
                                                                { name: 'Waiting (TTFB)', value: lastResult.timings?.waiting || 0 },
                                                                { name: 'Downloading', value: lastResult.timings?.receiving || 0 }
                                                            ].filter(d => d.value > 0)}
                                                            cx="50%" cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={100}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                            stroke="none"
                                                            label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                            labelLine={{stroke: '#475569'}}
                                                        >
                                                            <Cell fill="#64748b" />
                                                            <Cell fill="#f59e0b" />
                                                            <Cell fill="#3b82f6" />
                                                            <Cell fill="#10b981" />
                                                        </Pie>
                                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-sm rounded-xl transition-colors border border-white/10">
                                            <Download className="w-4 h-4" /> Download PDF Report
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}

                    {/* HISTORY TAB */}
                    {activeTab === 'history' && (
                        <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-slate-300">
                                        <thead className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 border-b border-white/10">
                                            <tr>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4">Test Profile</th>
                                                <th className="px-6 py-4">Target URL</th>
                                                <th className="px-6 py-4 text-center">Avg Time</th>
                                                <th className="px-6 py-4 text-center">Throughput</th>
                                                <th className="px-6 py-4 text-center">Errors</th>
                                                <th className="px-6 py-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {history.length === 0 ? (
                                                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">No performance testing history found.</td></tr>
                                            ) : (
                                                history.map(run => {
                                                    let metrics = {};
                                                    try { metrics = run.raw_data ? JSON.parse(run.raw_data) : {}; } catch (e) { }
                                                    const typeDetails = getTestTypeDetails(run.test_type);

                                                    return (
                                                        <tr key={run.result_id} className="hover:bg-white/5 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-white font-bold">{new Date(run.executed_at).toLocaleDateString()}</div>
                                                                <div className="text-xs text-slate-500">{new Date(run.executed_at).toLocaleTimeString()}</div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="font-bold text-white mb-1 truncate max-w-[200px]">{run.test_name || 'Unnamed Test'}</div>
                                                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${typeDetails.color} ${typeDetails.bg} ${typeDetails.border}`}>
                                                                    {run.test_type || 'load'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 font-mono text-xs text-slate-400 truncate max-w-[200px]">
                                                                {run.target_url}
                                                            </td>
                                                            <td className="px-6 py-4 text-center font-mono">
                                                                <div className="text-white">{run.avg_response_time}ms</div>
                                                                <div className="text-[10px] text-amber-400">P95: {metrics.p95 || 0}ms</div>
                                                            </td>
                                                            <td className="px-6 py-4 text-center font-mono font-bold text-emerald-400">
                                                                {run.throughput}/s
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${run.error_rate > 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                                                    {run.error_rate}%
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button onClick={() => {
                                                                    let detailedResult = {};
                                                                    try { detailedResult = run.raw_data ? JSON.parse(run.raw_data) : {}; } catch (e) {}
                                                                    setLastResult({
                                                                        avg: run.avg_response_time,
                                                                        max: run.max_response_time,
                                                                        throughput: run.throughput,
                                                                        errorRate: run.error_rate,
                                                                        median: detailedResult.median || 0,
                                                                        p95: detailedResult.p95 || 0,
                                                                        p99: detailedResult.p99 || 0,
                                                                        timings: detailedResult.timings || { connecting: 0, waiting: 0, receiving: 0, blocked: 0 },
                                                                        totalRequests: detailedResult.totalRequests || 0,
                                                                        dataReceived: detailedResult.dataReceived || 0,
                                                                        dataSent: detailedResult.dataSent || 0,
                                                                        statusCodes: detailedResult.statusCodes || {}
                                                                    });
                                                                    setActiveTab('results');
                                                                }} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-colors border border-white/5">
                                                                    View
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PerformanceTesting;
