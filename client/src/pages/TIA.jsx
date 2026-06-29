import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Network, Search, GitPullRequest, Code, FileCode, CheckCircle2, AlertTriangle, AlertCircle, Play, Bot } from 'lucide-react';
import api from '../api';

const TIA = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [diff, setDiff] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        api.get('/projects').then(res => {
            setProjects(res.data);
            if (res.data.length > 0) setSelectedProject(res.data[0].project_id);
        });
    }, []);

    const handleAnalyze = async (e) => {
        e.preventDefault();
        if (!diff.trim() || !selectedProject) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await api.post('/tia/analyze-diff', {
                project_id: selectedProject,
                diff
            });
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to analyze diff');
        } finally {
            setLoading(false);
        }
    };

    const loadMockDiff = () => {
        setDiff(`diff --git a/src/components/Checkout.js b/src/components/Checkout.js
index e3a3a9a..9b9e9c9 100644
--- a/src/components/Checkout.js
+++ b/src/components/Checkout.js
@@ -45,7 +45,7 @@
     const handlePayment = async () => {
-        if (cartTotal > 100) { applyDiscount(); }
+        if (cartTotal > 150) { applyBulkDiscount(); } // CHANGED LOGIC
         try {
             await processStripePayment();
         }
`);
    };

    const getRiskBadge = (level) => {
        if (level === 'High') return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
        if (level === 'Medium') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 blur-[50px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                <div className="z-10 w-full flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-fuchsia-500/20 text-fuchsia-400 text-xs font-black uppercase tracking-widest rounded-lg border border-fuchsia-500/30 flex items-center gap-1.5"><Network className="w-3.5 h-3.5" /> AI Engine</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            <GitPullRequest className="w-8 h-8 text-fuchsia-400" /> Test Impact Analysis
                        </h1>
                        <p className="text-sm text-slate-400 mt-2 max-w-xl">Paste a Git Diff to automatically identify which existing test cases should be re-run based on the code changes.</p>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Panel */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col">
                    <form onSubmit={handleAnalyze} className="flex-1 flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Target Project</label>
                            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-fuchsia-500/50 appearance-none">
                                {projects.map(p => <option key={p.project_id} value={p.project_id} className="bg-[#0D1424]">{p.name}</option>)}
                            </select>
                        </div>

                        <div className="flex-1 flex flex-col">
                            <div className="flex justify-between items-end mb-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Git Diff Source</label>
                                <button type="button" onClick={loadMockDiff} className="text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors font-bold flex items-center gap-1">
                                    <FileCode className="w-3.5 h-3.5" /> Load Sample Diff
                                </button>
                            </div>
                            <textarea 
                                value={diff} 
                                onChange={e => setDiff(e.target.value)} 
                                required 
                                className="w-full flex-1 min-h-[300px] p-4 bg-black/60 border border-white/10 rounded-xl text-emerald-400 font-mono text-xs focus:outline-none focus:border-fuchsia-500/50 transition-colors resize-none placeholder-slate-700" 
                                placeholder="Paste your git diff here (e.g. git diff HEAD~1)..."
                            ></textarea>
                        </div>

                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading || !diff.trim()} 
                            className="w-full py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(192,38,211,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing Impact...</> : <><Search className="w-5 h-5" /> Analyze Diff Impact</>}
                        </button>
                    </form>
                </motion.div>

                {/* Results Panel */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col relative overflow-hidden">
                    {loading ? (
                        <div className="absolute inset-0 bg-[#0B0F19]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin mb-4" />
                            <div className="text-white font-bold animate-pulse">AI is mapping code changes to test cases...</div>
                        </div>
                    ) : null}

                    {!result && !loading && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
                            <Code className="w-16 h-16 text-slate-500 mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Awaiting Diff</h3>
                            <p className="text-sm text-slate-400 max-w-sm">Paste a git diff on the left and run the analyzer to see which test cases are impacted by the changes.</p>
                        </div>
                    )}

                    {result && (
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                            {/* Summary Card */}
                            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-white mb-1">Impact Analysis Complete</h3>
                                    <p className="text-sm text-slate-400">{result.impacted_test_details?.length || 0} existing tests impacted.</p>
                                </div>
                                <div className={`px-4 py-2 rounded-xl border text-sm font-black uppercase tracking-wider ${getRiskBadge(result.risk_level)}`}>
                                    {result.risk_level || 'Unknown'} Risk
                                </div>
                            </div>

                            {/* Reasoning */}
                            <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-2xl">
                                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Bot className="w-4 h-4"/> AI Reasoning</h4>
                                <p className="text-sm text-indigo-200/80 leading-relaxed">{result.reasoning}</p>
                            </div>

                            {/* Impacted Tests */}
                            <div>
                                <h4 className="text-sm font-bold text-white mb-3 border-b border-white/10 pb-2 flex items-center justify-between">
                                    <span>Impacted Test Cases</span>
                                    <button className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg transition-colors flex items-center gap-1"><Play className="w-3.5 h-3.5"/> Run Selected</button>
                                </h4>
                                {result.impacted_test_details && result.impacted_test_details.length > 0 ? (
                                    <div className="space-y-3">
                                        {result.impacted_test_details.map(t => (
                                            <div key={t._id} className="bg-black/40 border border-white/5 hover:border-white/20 p-4 rounded-xl flex items-start gap-3 transition-colors">
                                                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                                <div>
                                                    <h5 className="text-sm font-bold text-white">{t.title}</h5>
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-500 p-4 bg-white/5 rounded-xl border border-white/5 border-dashed text-center">
                                        No existing tests match the impacted area.
                                    </div>
                                )}
                            </div>

                            {/* Suggested Tests */}
                            {result.suggested_new_tests && result.suggested_new_tests.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-3 border-b border-white/10 pb-2">Suggested New Tests</h4>
                                    <div className="space-y-2">
                                        {result.suggested_new_tests.map((s, idx) => (
                                            <div key={idx} className="flex items-start gap-2 text-sm text-slate-300 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                                <span>{s}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default TIA;
