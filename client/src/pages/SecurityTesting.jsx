import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Globe, Code2, UploadCloud, RefreshCw, Trash2, ChevronDown, ChevronUp, ShieldCheck, FileCode, AlertTriangle, Bug, Target, Activity } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import api from '../api';

ChartJS.register(ArcElement, Tooltip, Legend);

const SecurityTesting = () => {
    const [activeTab, setActiveTab] = useState('dast');
    const [targetUrl, setTargetUrl] = useState('');
    const [sastFile, setSastFile] = useState(null);
    const [sastText, setSastText] = useState('');
    const [loading, setLoading] = useState(false);
    const [scans, setScans] = useState([]);
    const [selectedScan, setSelectedScan] = useState(null);
    const [expandedFinding, setExpandedFinding] = useState(null);

    useEffect(() => {
        loadScans();
        const interval = setInterval(loadScans, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedScan?.status === 'Running') {
            const interval = setInterval(async () => {
                try {
                    const res = await api.get(`/security/scans/${selectedScan.scan_id}`);
                    if (res.data.status !== 'Running' || (res.data.findings?.length || 0) !== (selectedScan.findings?.length || 0)) {
                        setSelectedScan(res.data);
                        loadScans();
                    }
                } catch (err) { }
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [selectedScan]);

    const loadScans = async () => {
        try {
            const res = await api.get('/security/scans');
            setScans(res.data);
        } catch (err) { console.error(err); }
    };

    const deleteScan = async (e, scanId) => {
        e.stopPropagation();
        if (!window.confirm("Delete this scan record?")) return;
        try {
            await api.delete(`/security/scans/${scanId}`);
            loadScans();
            if (selectedScan?.scan_id === scanId) setSelectedScan(null);
        } catch (err) { alert("Error deleting scan"); }
    };

    const handleDastScan = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/security/scan/dast', { url: targetUrl });
            setTargetUrl('');
            loadScans();
        } catch (err) { alert("Error: " + err.message); }
        finally { setLoading(false); }
    };

    const handleSastScan = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData();
        if (sastFile) formData.append('codeFile', sastFile);
        else formData.append('code', sastText);

        try {
            await api.post('/security/scan/sast', formData);
            setSastFile(null);
            setSastText('');
            loadScans();
        } catch (err) { alert("Error: " + err.message); }
        finally { setLoading(false); }
    };

    const viewDetails = async (scanId) => {
        try {
            const res = await api.get(`/security/scans/${scanId}`);
            setSelectedScan(res.data);
            setExpandedFinding(null);
        } catch (err) { }
    };

    const getChartData = (scan) => {
        return {
            labels: ['Critical', 'High', 'Medium', 'Low'],
            datasets: [{
                data: [scan.critical_count || 0, scan.high_count || 0, scan.medium_count || 0, scan.low_count || 0],
                backgroundColor: ['#e11d48', '#f97316', '#eab308', '#3b82f6'], // Rose, Orange, Yellow, Blue
                borderWidth: 0,
                hoverOffset: 4
            }]
        };
    };

    const getSeverityStyles = (sev) => {
        const s = sev?.toUpperCase() || '';
        if (s === 'CRITICAL') return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
        if (s === 'HIGH') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        if (s === 'MEDIUM') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[60px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                <div className="z-10 w-full">
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <ShieldAlert className="w-8 h-8 text-rose-400" /> Security Vulnerability Suite
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Advanced SAST & DAST scanning with OWASP Top 10 coverage to identify and remediate vulnerabilities.</p>
                </div>
            </motion.div>

            <div className="flex flex-col xl:flex-row gap-6 h-[800px]">
                {/* Left Panel: Scanners & History */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="xl:w-1/3 flex flex-col gap-6 shrink-0 h-full">
                    
                    {/* Scanner Config */}
                    <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl overflow-hidden shrink-0">
                        <div className="flex border-b border-white/10 bg-white/5">
                            <button onClick={() => setActiveTab('dast')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'dast' ? 'text-rose-400 border-b-2 border-rose-500 bg-rose-500/5' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                                <Globe className="w-4 h-4 inline mr-2 -mt-0.5" /> DAST Scan
                            </button>
                            <button onClick={() => setActiveTab('sast')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'sast' ? 'text-rose-400 border-b-2 border-rose-500 bg-rose-500/5' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                                <Code2 className="w-4 h-4 inline mr-2 -mt-0.5" /> SAST Scan
                            </button>
                        </div>

                        <div className="p-6">
                            {activeTab === 'dast' ? (
                                <form onSubmit={handleDastScan} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target URL</label>
                                        <input type="url" required placeholder="https://example.com" value={targetUrl} onChange={e => setTargetUrl(e.target.value)} className="w-full px-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-rose-500/50 transition-colors" />
                                        <p className="text-[10px] text-slate-500 mt-2">Checks for SQLi, XSS, Path Traversal, Info Leaks...</p>
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)] disabled:opacity-50">
                                        {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Scanning...</> : <><Globe className="w-4 h-4" /> Start DAST</>}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleSastScan} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Upload Code File</label>
                                        <label className="block w-full cursor-pointer">
                                            <div className={`w-full flex flex-col items-center justify-center p-4 border-2 border-dashed ${sastFile ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/10 bg-[#0D1424] hover:border-white/30'} rounded-xl transition-colors text-center`}>
                                                <UploadCloud className={`w-6 h-6 mb-2 ${sastFile ? 'text-rose-400' : 'text-slate-500'}`} />
                                                <span className={`text-xs font-bold truncate px-2 ${sastFile ? 'text-rose-400' : 'text-white'}`}>{sastFile ? sastFile.name : 'Select .js, .py, .txt file'}</span>
                                            </div>
                                            <input type="file" className="hidden" onChange={e => setSastFile(e.target.files[0])} />
                                        </label>
                                    </div>
                                    <div className="relative flex items-center py-2">
                                        <div className="flex-grow border-t border-white/10"></div>
                                        <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-600 uppercase">OR</span>
                                        <div className="flex-grow border-t border-white/10"></div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Paste Snippet</label>
                                        <textarea value={sastText} onChange={e => setSastText(e.target.value)} placeholder="// Paste code here to analyze..." className="w-full px-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-rose-500/50 transition-colors h-24 custom-scrollbar" />
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)] disabled:opacity-50">
                                        {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</> : <><Code2 className="w-4 h-4" /> Start SAST</>}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* History */}
                    <div className="flex-1 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-0">
                        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-4 h-4 text-rose-400" /> Scan History
                            </h2>
                            <button onClick={loadScans} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                            {scans.length === 0 && <p className="text-slate-500 text-center py-6 text-sm">No scans found.</p>}
                            {scans.map(scan => {
                                const isSelected = selectedScan?.scan_id === scan.scan_id;
                                return (
                                    <div key={scan.scan_id} onClick={() => viewDetails(scan.scan_id)} className={`group relative p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-rose-500/10 border-rose-500/30' : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2 text-xs font-bold text-white truncate max-w-[200px]">
                                                {scan.scan_type === 'SAST' ? <Code2 className="w-3.5 h-3.5 text-blue-400" /> : <Globe className="w-3.5 h-3.5 text-teal-400" />}
                                                <span className="truncate">{scan.target}</span>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${scan.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'}`}>
                                                {scan.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="text-[10px] text-slate-500 font-mono">{new Date(scan.scanned_at || Date.now()).toLocaleTimeString()}</div>
                                            {scan.status === 'Completed' && (
                                                <div className={`text-[10px] font-black ${scan.risk_score > 70 ? 'text-rose-400' : scan.risk_score > 40 ? 'text-orange-400' : 'text-emerald-400'}`}>
                                                    Risk: {scan.risk_score}
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={(e) => deleteScan(e, scan.scan_id)} className={`absolute right-2 bottom-2 p-1 bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 rounded transition-colors ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

                {/* Right Panel: Results */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex-1 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-0">
                    {selectedScan ? (
                        <div className="flex-1 flex flex-col min-h-0">
                            {/* Results Header & Overview */}
                            <div className="p-6 border-b border-white/10 bg-white/5 shrink-0 flex flex-col lg:flex-row gap-8 items-center relative overflow-hidden">
                                {selectedScan.status === 'Running' && (
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-red-500 animate-pulse" />
                                )}
                                
                                <div className="w-32 h-32 shrink-0">
                                    <Pie data={getChartData(selectedScan)} options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false }} />
                                </div>

                                <div className="flex-1 w-full">
                                    <h2 className="text-2xl font-black text-white mb-1">Scan Result #{selectedScan.scan_id}</h2>
                                    <div className="text-sm text-slate-400 font-mono mb-4 flex items-center gap-2">
                                        <Target className="w-4 h-4"/> {selectedScan.target}
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                        <div className={`col-span-2 sm:col-span-1 p-3 rounded-xl border flex flex-col justify-center items-center ${selectedScan.risk_score > 75 ? 'bg-rose-500/10 border-rose-500/30' : selectedScan.risk_score > 40 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Risk Score</div>
                                            <div className={`text-xl font-black ${selectedScan.risk_score > 75 ? 'text-rose-400' : selectedScan.risk_score > 40 ? 'text-orange-400' : 'text-emerald-400'}`}>{selectedScan.risk_score || 0}</div>
                                        </div>
                                        
                                        <div className="p-3 rounded-xl border bg-rose-500/5 border-rose-500/20 flex flex-col justify-center items-center">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-rose-400/70 mb-1">Critical</div>
                                            <div className="text-lg font-black text-rose-400">{selectedScan.critical_count || 0}</div>
                                        </div>
                                        <div className="p-3 rounded-xl border bg-orange-500/5 border-orange-500/20 flex flex-col justify-center items-center">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-orange-400/70 mb-1">High</div>
                                            <div className="text-lg font-black text-orange-400">{selectedScan.high_count || 0}</div>
                                        </div>
                                        <div className="p-3 rounded-xl border bg-amber-500/5 border-amber-500/20 flex flex-col justify-center items-center">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-amber-400/70 mb-1">Medium</div>
                                            <div className="text-lg font-black text-amber-400">{selectedScan.medium_count || 0}</div>
                                        </div>
                                        <div className="p-3 rounded-xl border bg-blue-500/5 border-blue-500/20 flex flex-col justify-center items-center">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-blue-400/70 mb-1">Low</div>
                                            <div className="text-lg font-black text-blue-400">{selectedScan.low_count || 0}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Findings List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#0D1424]">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Bug className="w-4 h-4 text-slate-400" /> Vulnerabilities Found
                                </h3>

                                {(!selectedScan.findings || selectedScan.findings.length === 0) ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center bg-emerald-500/5 border border-emerald-500/20 rounded-2xl mt-4">
                                        <ShieldCheck className="w-12 h-12 text-emerald-400 mb-3" />
                                        <h3 className="text-lg font-bold text-white mb-1">System Secure</h3>
                                        <p className="text-slate-400 text-sm">No vulnerabilities were detected during this scan.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedScan.findings.map(finding => {
                                            const isExpanded = expandedFinding === finding.finding_id;
                                            return (
                                                <div key={finding.finding_id} className={`rounded-xl border transition-all overflow-hidden ${isExpanded ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                                                    <div 
                                                        className="p-4 flex items-center gap-4 cursor-pointer select-none"
                                                        onClick={() => setExpandedFinding(isExpanded ? null : finding.finding_id)}
                                                    >
                                                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border shrink-0 w-20 text-center ${getSeverityStyles(finding.severity)}`}>
                                                            {finding.severity}
                                                        </span>
                                                        <span className="font-bold text-white text-sm flex-1 truncate">{finding.vulnerability_type}</span>
                                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                                                    </div>
                                                    
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/10 bg-black/20">
                                                                <div className="p-4 space-y-4">
                                                                    <div>
                                                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Description</div>
                                                                        <p className="text-xs text-slate-300 leading-relaxed">{finding.description}</p>
                                                                    </div>
                                                                    
                                                                    <div>
                                                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Location / Affected Code</div>
                                                                        <div className="bg-[#0B0F19] p-3 rounded-lg font-mono text-xs text-rose-400 overflow-x-auto border border-white/5">
                                                                            {finding.location}
                                                                        </div>
                                                                    </div>

                                                                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-start gap-2">
                                                                        <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                                                        <div>
                                                                            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Remediation</div>
                                                                            <p className="text-xs text-emerald-400/90 leading-relaxed">{finding.remediation}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-50 border-2 border-dashed border-white/5 rounded-3xl m-6">
                            <ShieldAlert className="w-16 h-16 mb-4 opacity-30" />
                            <h3 className="text-xl font-bold text-white mb-2">Select a Scan Report</h3>
                            <p className="text-sm">Choose a scan from the history panel or initiate a new SAST/DAST scan.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default SecurityTesting;
