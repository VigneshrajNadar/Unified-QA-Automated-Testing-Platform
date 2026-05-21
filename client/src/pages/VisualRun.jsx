import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Plus, X, Camera, Settings, History, CheckCircle2, AlertCircle, Maximize, Smartphone, Monitor, ShieldCheck, Search, Image as ImageIcon, Globe } from 'lucide-react';
import api from '../api';

function VisualRun() {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [runs, setRuns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [runningTest, setRunningTest] = useState(false);

    // Run configuration
    const [runConfig, setRunConfig] = useState({
        urls: [''],
        runType: 'baseline',
        browser: 'chrome',
        viewport: 'desktop'
    });

    useEffect(() => {
        fetchProject();
        fetchRuns();
    }, [projectId]);

    const fetchProject = async () => {
        try {
            const response = await api.get(`/visual/project/${projectId}`);
            setProject(response.data);
            if (response.data.base_url) {
                setRunConfig(prev => ({ ...prev, urls: [response.data.base_url] }));
            }
        } catch (error) {
            console.error('Error fetching project:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRuns = async () => {
        try {
            const response = await api.get(`/visual/runs/${projectId}`);
            setRuns(response.data);
        } catch (error) {
            console.error('Error fetching runs:', error);
        }
    };

    const handleAddUrl = () => {
        setRunConfig(prev => ({ ...prev, urls: [...prev.urls, ''] }));
    };

    const handleRemoveUrl = (index) => {
        setRunConfig(prev => ({
            ...prev,
            urls: prev.urls.filter((_, i) => i !== index)
        }));
    };

    const handleUrlChange = (index, value) => {
        const newUrls = [...runConfig.urls];
        newUrls[index] = value;
        setRunConfig(prev => ({ ...prev, urls: newUrls }));
    };

    const handleRunTest = async (e) => {
        e.preventDefault();
        setRunningTest(true);

        const validUrls = runConfig.urls.filter(url => url.trim() !== '');
        if (validUrls.length === 0) {
            alert('Please add at least one URL');
            setRunningTest(false);
            return;
        }

        try {
            const endpoint = runConfig.runType === 'baseline'
                ? '/visual/run-baseline'
                : '/visual/run-comparison';

            const response = await api.post(endpoint, {
                visual_project_id: projectId,
                urls: validUrls,
                browser: runConfig.browser,
                viewport: runConfig.viewport
            });

            alert(`Test completed! ${response.data.successful || response.data.summary?.total || 0} screenshots captured`);
            fetchRuns();
        } catch (error) {
            alert('Error running test: ' + error.message);
        } finally {
            setRunningTest(false);
        }
    };

    const handleViewDiffs = (runId) => {
        navigate(`/visual-results/${runId}`);
    };

    const getRunStatusBadge = (run) => {
        if (run.status === 'running') {
            return <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border bg-amber-500/10 border-amber-500/20 text-amber-400 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"/> Running</span>;
        } else if (run.failed > 0) {
            return <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border bg-rose-500/10 border-rose-500/20 text-rose-400 flex items-center gap-1.5"><AlertCircle className="w-3 h-3"/> {run.failed} Failed</span>;
        } else if (run.passed > 0) {
            return <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3"/> {run.passed} Passed</span>;
        } else {
            return <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border bg-slate-500/10 border-slate-500/20 text-slate-400">Completed</span>;
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin" />
        </div>
    );

    if (!project) return (
        <div className="flex flex-col items-center justify-center h-64 bg-[#0B0F19]/50 border border-white/10 rounded-3xl">
            <AlertCircle className="w-10 h-10 text-rose-400 mb-4" />
            <h2 className="text-xl font-bold text-white">Project Not Found</h2>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
                <button 
                    onClick={() => navigate('/visual-testing')}
                    className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/5"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        {project.name || 'Visual Test Project'}
                    </h1>
                    <p className="text-sm text-fuchsia-400 mt-1 font-mono">{project.base_url}</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* RUN CONFIGURATION */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl overflow-hidden flex flex-col relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 blur-[50px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                    
                    <div className="p-6 border-b border-white/10 bg-white/5 shrink-0 flex items-center gap-3 z-10">
                        <Settings className="w-5 h-5 text-fuchsia-400" />
                        <h2 className="text-lg font-bold text-white">Run Configuration</h2>
                    </div>

                    <form onSubmit={handleRunTest} className="p-6 space-y-6 z-10">
                        {/* Run Type Selection */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Run Type</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${runConfig.runType === 'baseline' ? 'bg-fuchsia-500/10 border-fuchsia-500/30 shadow-[0_0_15px_rgba(192,38,211,0.15)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                                    <input type="radio" value="baseline" checked={runConfig.runType === 'baseline'} onChange={e => setRunConfig({ ...runConfig, runType: e.target.value })} className="mt-1" />
                                    <div>
                                        <div className={`font-bold ${runConfig.runType === 'baseline' ? 'text-fuchsia-400' : 'text-white'}`}>Baseline</div>
                                        <div className="text-xs text-slate-400 mt-1">Capture reference screenshots</div>
                                    </div>
                                </label>
                                <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${runConfig.runType === 'comparison' ? 'bg-fuchsia-500/10 border-fuchsia-500/30 shadow-[0_0_15px_rgba(192,38,211,0.15)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                                    <input type="radio" value="comparison" checked={runConfig.runType === 'comparison'} onChange={e => setRunConfig({ ...runConfig, runType: e.target.value })} className="mt-1" />
                                    <div>
                                        <div className={`font-bold ${runConfig.runType === 'comparison' ? 'text-fuchsia-400' : 'text-white'}`}>Comparison</div>
                                        <div className="text-xs text-slate-400 mt-1">Detect pixel changes against baseline</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* URLs */}
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">URLs to Test</label>
                            <div className="space-y-3">
                                {runConfig.urls.map((url, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="url"
                                            placeholder="https://example.com/page"
                                            value={url}
                                            onChange={e => handleUrlChange(index, e.target.value)}
                                            className="flex-1 px-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-fuchsia-500/50 transition-colors"
                                        />
                                        {runConfig.urls.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveUrl(index)} className="px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-colors shrink-0">
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddUrl} className="flex items-center gap-2 text-xs font-bold text-fuchsia-400 hover:text-fuchsia-300 transition-colors uppercase tracking-widest mt-2">
                                    <Plus className="w-3.5 h-3.5" /> Add Another URL
                                </button>
                            </div>
                        </div>

                        {/* Browser & Viewport */}
                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Browser</label>
                                <div className="relative">
                                    <select value={runConfig.browser} onChange={e => setRunConfig({ ...runConfig, browser: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-fuchsia-500/50 transition-colors appearance-none">
                                        <option value="chrome" className="bg-[#0D1424]">Chrome</option>
                                        <option value="firefox" className="bg-[#0D1424]">Firefox</option>
                                        <option value="safari" className="bg-[#0D1424]">Safari (WebKit)</option>
                                    </select>
                                    <Globe className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Viewport</label>
                                <div className="relative">
                                    <select value={runConfig.viewport} onChange={e => setRunConfig({ ...runConfig, viewport: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-fuchsia-500/50 transition-colors appearance-none">
                                        <option value="desktop" className="bg-[#0D1424]">Desktop (1920x1080)</option>
                                        <option value="tablet" className="bg-[#0D1424]">Tablet (768x1024)</option>
                                        <option value="mobile" className="bg-[#0D1424]">Mobile (375x667)</option>
                                    </select>
                                    {runConfig.viewport === 'mobile' ? <Smartphone className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" /> : runConfig.viewport === 'tablet' ? <Maximize className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" /> : <Monitor className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/10 mt-6">
                            <button 
                                type="submit" 
                                disabled={runningTest} 
                                className="w-full flex justify-center items-center gap-2 px-6 py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black rounded-xl transition-all shadow-[0_0_15px_rgba(192,38,211,0.3)] hover:shadow-[0_0_25px_rgba(192,38,211,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                            >
                                {runningTest ? (
                                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Running Test...</>
                                ) : (
                                    <><Play className="w-5 h-5" /> Run Visual Test</>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>

                {/* RUN HISTORY */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl flex flex-col h-[calc(100vh-220px)] lg:h-auto min-h-[600px]">
                    <div className="p-6 border-b border-white/10 bg-white/5 shrink-0 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <History className="w-5 h-5 text-blue-400" />
                            <h2 className="text-lg font-bold text-white">Run History</h2>
                        </div>
                        {runs.length > 0 && <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black">{runs.length} Runs</span>}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        {runs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                                <ImageIcon className="w-16 h-16 text-slate-500 mb-4" />
                                <h3 className="text-lg font-bold text-white mb-1">No Runs Yet</h3>
                                <p className="text-sm text-slate-400">Configure and execute your first visual test on the left.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {runs.map((run, idx) => (
                                    <motion.div key={run.run_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${run.run_type === 'baseline' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'} flex items-center gap-1.5`}>
                                                    {run.run_type === 'baseline' ? <Camera className="w-3 h-3" /> : <Search className="w-3 h-3" />}
                                                    {run.run_type}
                                                </span>
                                                {getRunStatusBadge(run)}
                                            </div>
                                            <span className="text-xs font-medium text-slate-500">{new Date(run.created_at).toLocaleString()}</span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                            <div className="bg-[#0D1424] rounded-xl p-3 border border-white/5">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Browser</p>
                                                <p className="text-sm text-slate-300 font-medium capitalize flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-slate-400" /> {run.browser}</p>
                                            </div>
                                            <div className="bg-[#0D1424] rounded-xl p-3 border border-white/5">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Viewport</p>
                                                <p className="text-sm text-slate-300 font-medium capitalize flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5 text-slate-400" /> {run.viewport}</p>
                                            </div>
                                            <div className="bg-[#0D1424] rounded-xl p-3 border border-white/5">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Captured</p>
                                                <p className="text-sm text-slate-300 font-medium flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5 text-slate-400" /> {run.total_screenshots || 0}</p>
                                            </div>
                                            
                                            {run.run_type === 'comparison' && run.total_diffs > 0 && (
                                                <div className="bg-[#0D1424] rounded-xl p-3 border border-white/5">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Result</p>
                                                    <p className="text-sm font-medium flex items-center gap-1">
                                                        <span className="text-emerald-400">{run.passed || 0} ✓</span>
                                                        <span className="text-slate-600">/</span>
                                                        <span className="text-rose-400">{run.failed || 0} ✗</span>
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <button onClick={() => handleViewDiffs(run.run_id)} className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors border border-white/5">
                                            View Results <ArrowLeft className="w-4 h-4 rotate-180" />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default VisualRun;
