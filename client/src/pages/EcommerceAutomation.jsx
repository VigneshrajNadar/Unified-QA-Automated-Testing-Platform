import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Shield, ShieldAlert, Play, CheckCircle2, XCircle, AlertTriangle, Crosshair, Clock, ShieldCheck, ShoppingBag, ExternalLink, Activity } from 'lucide-react';
import api from '../api';

const SecurityDashboard = ({ data }) => {
    if (!data) return null;

    const { summary, riskRating, findings, targetUrl, scanTime } = data;

    const getRiskStyles = (risk) => {
        if (risk === 'HIGH') return { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
        if (risk === 'MEDIUM') return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
        return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    };
    
    const riskStyles = getRiskStyles(riskRating);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 mt-6">
            <div className={`p-6 rounded-3xl border backdrop-blur-xl bg-[#0B0F19]/80 shadow-xl ${riskStyles.border}`}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-3">
                            <ShieldAlert className={`w-8 h-8 ${riskStyles.color}`} /> Security Audit Report
                        </h2>
                        <div className="text-sm text-slate-400 mt-2 font-mono flex items-center gap-2">
                            <Crosshair className="w-4 h-4"/> Target: {targetUrl}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Scan Completed</div>
                        <div className="text-sm text-slate-300 font-mono mt-1">{scanTime}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${riskStyles.bg} ${riskStyles.border}`}>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Overall Risk</div>
                        <div className={`text-2xl font-black ${riskStyles.color}`}>{riskRating}</div>
                    </div>
                    <div className="p-4 rounded-2xl border bg-rose-500/10 border-rose-500/20 flex flex-col items-center justify-center text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-rose-400/70 mb-1">High Severity</div>
                        <div className="text-2xl font-black text-rose-400">{summary.high}</div>
                    </div>
                    <div className="p-4 rounded-2xl border bg-amber-500/10 border-amber-500/20 flex flex-col items-center justify-center text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-amber-400/70 mb-1">Medium Severity</div>
                        <div className="text-2xl font-black text-amber-400">{summary.medium}</div>
                    </div>
                    <div className="p-4 rounded-2xl border bg-emerald-500/10 border-emerald-500/20 flex flex-col items-center justify-center text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400/70 mb-1">Low Severity</div>
                        <div className="text-2xl font-black text-emerald-400">{summary.low}</div>
                    </div>
                </div>
            </div>

            <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                    <Activity className="w-5 h-5 text-slate-400" /> Detailed Findings
                </h3>

                {findings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                        <ShieldCheck className="w-16 h-16 text-emerald-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Vulnerabilities Found</h3>
                        <p className="text-slate-400">The security smoke test did not detect any obvious issues.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {findings.map((item, idx) => {
                            const itemStyle = getRiskStyles(item.severity);
                            return (
                                <div key={idx} className={`rounded-2xl border overflow-hidden ${itemStyle.border} bg-white/5 hover:bg-white/10 transition-colors`}>
                                    <div className={`p-4 flex justify-between items-center ${itemStyle.bg}`}>
                                        <h3 className="font-bold text-white text-base">{item.title}</h3>
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${itemStyle.color} border-current`}>
                                            {item.severity}
                                        </span>
                                    </div>
                                    <div className="p-5 space-y-3">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Description</span>
                                            <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Recommendation</span>
                                            <p className="text-sm font-mono text-emerald-400/90">{item.recommendation}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const EcommerceDashboard = ({ data }) => {
    if (!data) return null;
    const { summary, steps, scanTime } = data;
    const isPassed = summary.failed === 0;
    const statusStyle = isPassed 
        ? { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' }
        : { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 mt-6">
            {/* Header */}
            <div className={`p-6 rounded-3xl border backdrop-blur-xl bg-[#0B0F19]/80 shadow-xl ${statusStyle.border}`}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-3">
                            <ShoppingCart className={`w-8 h-8 ${statusStyle.color}`} /> E-Commerce Test Report
                        </h2>
                        <div className="text-sm text-slate-400 mt-2 flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4"/> SauceDemo E2E Purchasing Flow
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Executed At</div>
                        <div className="text-sm text-slate-300 font-mono mt-1">{scanTime}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${statusStyle.bg} ${statusStyle.border}`}>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Final Result</div>
                        <div className={`text-2xl font-black ${statusStyle.color}`}>{isPassed ? 'PASSED' : 'FAILED'}</div>
                    </div>
                    <div className="p-4 rounded-2xl border bg-emerald-500/10 border-emerald-500/20 flex flex-col items-center justify-center text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400/70 mb-1">Steps Passed</div>
                        <div className="text-2xl font-black text-emerald-400">{summary.passed}</div>
                    </div>
                    <div className="p-4 rounded-2xl border bg-rose-500/10 border-rose-500/20 flex flex-col items-center justify-center text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-rose-400/70 mb-1">Steps Failed</div>
                        <div className="text-2xl font-black text-rose-400">{summary.failed}</div>
                    </div>
                </div>
            </div>

            {/* Steps Timeline */}
            <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                    <Activity className="w-5 h-5 text-slate-400" /> Execution Steps
                </h3>
                
                <div className="space-y-4">
                    {steps.map((step, idx) => (
                        <div key={idx} className={`flex items-start gap-4 p-4 rounded-2xl border ${step.status === 'PASSED' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'} hover:bg-white/5 transition-colors`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-sm ${step.status === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-base font-bold text-white mb-1">{step.step}</h4>
                                <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                                {step.error && (
                                    <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-mono text-rose-400">
                                        <AlertTriangle className="w-4 h-4 inline mr-2 -mt-0.5" />
                                        {step.error}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${step.status === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                                    {step.status}
                                </span>
                                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {step.timestamp}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

const EcommerceAutomation = ({ initialMode = 'sauce' }) => {
    // Mode drives the UI aesthetic: Security (Rose) vs E-Commerce (Pink/Indigo)
    const [mode] = useState(initialMode);
    const [targetUrl, setTargetUrl] = useState('https://google-gruyere.appspot.com/part1');
    const [running, setRunning] = useState(false);
    const [securityData, setSecurityData] = useState(null);
    const [ecommerceData, setEcommerceData] = useState(null);
    const [logs, setLogs] = useState('');

    const isSecurity = mode === 'security';

    const runTest = async () => {
        setRunning(true);
        setSecurityData(null);
        setEcommerceData(null);

        if (isSecurity) {
            setLogs(`🚀 Initializing Security Smoke Test for: ${targetUrl}...\n`);
        } else {
            setLogs('🚀 Initializing E2E Automation Suite (SauceDemo)...\n');
        }

        try {
            const payload = { targetUrl, testType: mode };
            const res = await api.post('/ecommerce/run', payload);
            const data = res.data;

            if (data.success) {
                setLogs(prev => prev + '✅ Test Execution Completed!\n');

                if (data.securityData) {
                    setSecurityData(data.securityData);
                    setLogs(prev => prev + '✅ Security Analysis Ready.\n');
                }
                if (data.ecommerceData) {
                    setEcommerceData(data.ecommerceData);
                    setLogs(prev => prev + '✅ E-Commerce Report Ready.\n');
                }
            } else {
                setLogs(prev => prev + '❌ Test Execution Failed (Check Console).\n');
            }
        } catch (err) {
            setLogs(prev => prev + `❌ Error: ${err.response?.data?.error || err.message}\n`);
            if (err.response?.data?.details) {
                setLogs(prev => prev + `Details: ${err.response.data.details}\n`);
            }
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header Area */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 w-64 h-64 blur-[60px] rounded-full -mr-20 -mt-20 pointer-events-none ${isSecurity ? 'bg-rose-500/20' : 'bg-pink-500/20'}`} />
                
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        {isSecurity ? <Shield className="w-8 h-8 text-rose-400" /> : <ShoppingCart className="w-8 h-8 text-pink-400" />}
                        {isSecurity ? 'Security Smoke Testing Tool' : 'E-Commerce Automation'}
                    </h1>
                    <p className="text-sm text-slate-400 mt-2 max-w-2xl">
                        {isSecurity
                            ? 'Perform a comprehensive security smoke test on target applications to identify basic vulnerabilities and misconfigurations.'
                            : 'Run automated end-to-end purchasing flows on e-commerce platforms to verify cart, checkout, and inventory logic.'}
                    </p>

                    <div className="mt-8">
                        {isSecurity && (
                            <div className="mb-6 max-w-2xl">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Target Website URL</label>
                                <div className="relative">
                                    <input
                                        type="url"
                                        value={targetUrl}
                                        onChange={(e) => setTargetUrl(e.target.value)}
                                        placeholder="https://example.com"
                                        className="w-full pl-12 pr-4 py-4 bg-[#0D1424] border border-white/10 rounded-2xl text-white font-mono focus:outline-none focus:border-rose-500/50 transition-colors shadow-inner"
                                    />
                                    <ExternalLink className="w-5 h-5 text-slate-400 absolute left-4 top-4 pointer-events-none" />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={runTest}
                            disabled={running}
                            className={`flex justify-center items-center gap-2 px-8 py-4 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                isSecurity 
                                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-[0_0_15px_rgba(225,29,72,0.3)] hover:shadow-[0_0_25px_rgba(225,29,72,0.5)]' 
                                : 'bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 shadow-[0_0_15px_rgba(219,39,119,0.3)] hover:shadow-[0_0_25px_rgba(219,39,119,0.5)]'
                            }`}
                        >
                            {running ? (
                                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {isSecurity ? 'Running Analysis...' : 'Executing Flow...'}</>
                            ) : (
                                <><Play className="w-5 h-5" /> {isSecurity ? 'Start Security Scan' : 'Run E-Commerce Test'}</>
                            )}
                        </button>

                        {/* Terminal Logs */}
                        <AnimatePresence>
                            {logs && !securityData && !ecommerceData && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6">
                                    <div className="bg-[#0D1424] border border-white/10 rounded-2xl p-4 font-mono text-xs overflow-x-auto">
                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5 text-slate-500">
                                            <div className="flex gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50"></div>
                                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
                                            </div>
                                            <span>Execution Logs</span>
                                        </div>
                                        <div className="text-emerald-400 whitespace-pre-wrap leading-relaxed">
                                            {logs}
                                            {running && <span className="animate-pulse">_</span>}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            {/* Results Rendering */}
            <AnimatePresence mode="wait">
                {isSecurity && securityData && <SecurityDashboard key="security" data={securityData} />}
                {!isSecurity && ecommerceData && <EcommerceDashboard key="ecommerce" data={ecommerceData} />}
            </AnimatePresence>

        </div>
    );
};

export default EcommerceAutomation;
