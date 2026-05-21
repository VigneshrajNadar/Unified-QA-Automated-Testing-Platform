import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, Trash2, Activity, Link as LinkIcon, AlertTriangle, CheckCircle2, Clock, ShieldAlert, ShieldCheck, XCircle, SearchCode } from 'lucide-react';
import api from '../api';

const WebMonitor = () => {
    const [url, setUrl] = useState('');
    const [scanning, setScanning] = useState(false);
    const [history, setHistory] = useState([]);
    const [selectedScan, setSelectedScan] = useState(null);
    const [linkDetails, setLinkDetails] = useState([]);

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 5000); // Polling for updates
        return () => clearInterval(interval);
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/monitor/history');
            setHistory(res.data);

            // If a scan is selected, refresh its details if it's running
            if (selectedScan && selectedScan.status === 'Running') {
                fetchScanDetails(selectedScan.job_id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchScanDetails = async (id) => {
        try {
            const res = await api.get(`/monitor/${id}`);
            setSelectedScan(res.data);
            setLinkDetails(res.data.links);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteScan = async (e, id) => {
        if (e && e.preventDefault) e.preventDefault();
        if (e && e.stopPropagation) e.stopPropagation();

        if (!window.confirm('Delete this scan record?')) return;

        try {
            await api.delete(`/monitor/${id}`);
            if (selectedScan?.job_id === id) {
                setSelectedScan(null);
                setLinkDetails([]);
            }
            fetchHistory();
        } catch (err) {
            console.error(err);
            alert('Failed to delete scan: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleStartScan = async (e) => {
        e.preventDefault();
        if (!url) return alert('Please enter a URL');

        setScanning(true);
        try {
            await api.post('/monitor/start', { url });
            setUrl('');
            fetchHistory();
        } catch (err) {
            alert('Failed to start scan.');
        } finally {
            setScanning(false);
        }
    };

    const getScoreStyles = (score) => {
        if (score >= 90) return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: <ShieldCheck className="w-5 h-5"/> };
        if (score >= 70) return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: <AlertTriangle className="w-5 h-5"/> };
        return { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: <ShieldAlert className="w-5 h-5"/> };
    };

    const getLinkStatusStyles = (status) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('valid') || s.includes('200')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        if (s.includes('broken') || s.includes('404')) return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
        if (s.includes('redirect')) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[50px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                <div className="z-10 w-full">
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <SearchCode className="w-8 h-8 text-teal-400" /> Web Monitor
                    </h1>
                    <p className="text-sm text-slate-400 mt-1 mb-6">Scan websites for broken links, analyze health scores, and monitor accessibility.</p>
                    
                    {/* Input Form */}
                    <form onSubmit={handleStartScan} className="flex gap-4 w-full max-w-3xl">
                        <div className="relative flex-1">
                            <input
                                type="url"
                                required
                                placeholder="https://example.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-[#0D1424] border border-white/10 rounded-2xl text-white font-mono focus:outline-none focus:border-teal-500/50 transition-colors shadow-inner"
                            />
                            <Globe className="w-5 h-5 text-slate-400 absolute left-4 top-4 pointer-events-none" />
                        </div>
                        <button type="submit" disabled={scanning} className="flex justify-center items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                            {scanning ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Scanning...</> : <><Search className="w-5 h-5" /> Start Scan</>}
                        </button>
                    </form>
                </div>
            </motion.div>

            <div className="flex flex-col xl:flex-row gap-6 h-[750px]">
                {/* Left Panel: Recent Scans */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="xl:w-1/3 flex flex-col bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl overflow-hidden shrink-0">
                    <div className="p-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-teal-400" /> Recent Scans
                        </h2>
                        <span className="px-2.5 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-black rounded-lg">{history.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60 text-center p-6">
                                <SearchCode className="w-12 h-12 mb-3" />
                                <p className="text-sm">No scans found.<br/>Enter a URL above to start.</p>
                            </div>
                        ) : (
                            history.map(job => {
                                const scoreStyle = getScoreStyles(job.health_score || 0);
                                const isSelected = selectedScan?.job_id === job.job_id;
                                return (
                                    <div
                                        key={job.job_id}
                                        onClick={() => fetchScanDetails(job.job_id)}
                                        className={`group relative p-4 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'bg-teal-500/10 border-teal-500/30' : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2 pr-8">
                                            <div className="font-mono text-sm font-bold text-white truncate">{job.url}</div>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border shrink-0 absolute right-4 top-4 ${job.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : job.status === 'Running' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20 animate-pulse' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                                                {job.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 mb-3">{new Date(job.created_at).toLocaleString()}</div>
                                        
                                        {job.status === 'Completed' && (
                                            <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                                                <div className={`flex items-center gap-1 text-xs font-bold ${scoreStyle.color}`}>
                                                    <Activity className="w-3.5 h-3.5"/> {job.health_score}% Health
                                                </div>
                                                <div className="flex items-center gap-1 text-xs font-medium text-slate-400">
                                                    <LinkIcon className="w-3 h-3"/> {job.total_links} Links
                                                </div>
                                                {job.broken_links > 0 && (
                                                    <div className="flex items-center gap-1 text-xs font-medium text-rose-400">
                                                        <XCircle className="w-3 h-3"/> {job.broken_links} Broken
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <button onClick={(e) => handleDeleteScan(e, job.job_id)} className={`absolute right-4 bottom-4 p-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 rounded-lg transition-colors ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </motion.div>

                {/* Right Panel: Scan Details */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex-1 flex flex-col bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl overflow-hidden min-w-0">
                    {selectedScan ? (
                        <>
                            {/* Details Header */}
                            <div className="p-6 border-b border-white/10 bg-white/5 shrink-0 flex flex-wrap gap-6 items-center justify-between relative overflow-hidden">
                                {selectedScan.status === 'Running' && (
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500 animate-pulse" />
                                )}
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2 truncate">
                                        <Globe className="w-5 h-5 text-teal-400 shrink-0" />
                                        <span className="truncate">{selectedScan.url}</span>
                                    </h2>
                                    <div className="text-xs text-slate-400 font-mono">Scan ID: {selectedScan.job_id}</div>
                                </div>
                                
                                {selectedScan.status === 'Completed' && (
                                    <div className={`px-4 py-2 rounded-xl border flex items-center gap-3 ${getScoreStyles(selectedScan.health_score).bg} ${getScoreStyles(selectedScan.health_score).border}`}>
                                        <div className={`shrink-0 ${getScoreStyles(selectedScan.health_score).color}`}>
                                            {getScoreStyles(selectedScan.health_score).icon}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Health Score</div>
                                            <div className={`text-xl font-black ${getScoreStyles(selectedScan.health_score).color}`}>{selectedScan.health_score}%</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Link Table */}
                            <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-[#0D1424]">
                                {linkDetails.length > 0 ? (
                                    <div className="border border-white/10 rounded-xl overflow-hidden">
                                        <table className="w-full text-left text-sm text-slate-300">
                                            <thead className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 border-b border-white/10">
                                                <tr>
                                                    <th className="px-4 py-3 w-32">Status</th>
                                                    <th className="px-4 py-3 w-20 text-center">Code</th>
                                                    <th className="px-4 py-3">Link URL</th>
                                                    <th className="px-4 py-3 w-24 text-right">Time</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {linkDetails.map(link => (
                                                    <tr key={link.result_id} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border w-full ${getLinkStatusStyles(link.status)}`}>
                                                                {link.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-400">
                                                            {link.status_code || '-'}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-teal-400 hover:underline transition-colors block truncate max-w-[400px]" title={link.url}>
                                                                {link.url}
                                                            </a>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-400">
                                                            {link.response_time ? `${link.response_time}ms` : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
                                        <Activity className="w-12 h-12 mb-3" />
                                        <p>No link data extracted yet.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-50 border-2 border-dashed border-white/5 rounded-3xl m-6">
                            <SearchCode className="w-16 h-16 mb-4 opacity-30" />
                            <h3 className="text-xl font-bold text-white mb-2">Web Monitor Dashboard</h3>
                            <p className="text-sm">Select a scan from the left panel to view detailed link analysis and health metrics.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default WebMonitor;
