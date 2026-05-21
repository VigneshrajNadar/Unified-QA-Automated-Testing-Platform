import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Github, UploadCloud, FolderOpen, Play, CheckCircle2, AlertCircle, AlertTriangle, ShieldCheck, Bug, Activity, Terminal, Code2, Layers, Server, Search, Folder, ExternalLink, ActivitySquare } from 'lucide-react';

const AutoTest = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [file, setFile] = useState(null);
    const [gitUrl, setGitUrl] = useState('');
    const [mode, setMode] = useState('upload'); // 'upload' or 'git'
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [activeTab, setActiveTab] = useState('terminal');
    const [selectedTests, setSelectedTests] = useState({
        unit: true,
        static: true,
        security: true,
        complexity: true,
        coverage: true,
        performance: false,
        integration: false,
        regression: false
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleTestSelection = (type) => {
        setSelectedTests(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    const handleExecute = async () => {
        if (!selectedProject) {
            alert('Please select a project first. Tests must be linked to a project.');
            return;
        }

        if (mode === 'upload' && !file) {
            alert('Please upload a .zip file');
            return;
        }
        if (mode === 'git' && !gitUrl) {
            alert('Please enter a GitHub URL');
            return;
        }

        const formData = new FormData();
        formData.append('projectId', selectedProject);

        if (mode === 'upload' && file) {
            formData.append('projectFile', file);
        } else if (mode === 'git') {
            formData.append('gitUrl', gitUrl);
        }

        const testsToRun = Object.keys(selectedTests).filter(key => selectedTests[key]);
        formData.append('selectedTests', JSON.stringify(testsToRun));

        setLoading(true);
        setResults(null);

        try {
            const res = await api.post('/autotest/execute', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResults(res.data);
            setActiveTab('terminal'); // Default to terminal on completion
        } catch (err) {
            console.error(err);
            alert('Execution failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const testTypeConfig = [
        { id: 'unit', label: 'Unit Testing', icon: <Bug className="w-4 h-4" /> },
        { id: 'static', label: 'Static Analysis', icon: <Code2 className="w-4 h-4" /> },
        { id: 'security', label: 'Security Scan', icon: <ShieldCheck className="w-4 h-4" /> },
        { id: 'complexity', label: 'Complexity Analysis', icon: <Layers className="w-4 h-4" /> },
        { id: 'coverage', label: 'Code Coverage', icon: <Search className="w-4 h-4" /> },
        { id: 'performance', label: 'Performance (API)', icon: <Activity className="w-4 h-4" /> },
        { id: 'integration', label: 'Integration Testing', icon: <FolderOpen className="w-4 h-4" /> },
        { id: 'regression', label: 'Regression Testing', icon: <ActivitySquare className="w-4 h-4" /> }
    ];

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[50px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                <div className="z-10">
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Cpu className="w-8 h-8 text-cyan-400" /> Automated Pipeline
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Configure test suites and execute automated CI/CD checks</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* CONFIGURATION PANEL */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1 space-y-6">
                    
                    {/* Source & Project */}
                    <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-5">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                            <Folder className="w-5 h-5 text-cyan-400" /> Source Configuration
                        </h2>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                                Target Project <span className="text-rose-400">*</span>
                            </label>
                            <select 
                                value={selectedProject} 
                                onChange={(e) => setSelectedProject(e.target.value)}
                                className={`w-full px-4 py-3 bg-[#0D1424] border ${!selectedProject ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/10 focus:border-cyan-500/50'} rounded-xl text-white text-sm focus:outline-none transition-colors appearance-none`}
                            >
                                <option value="" className="bg-[#0D1424]">-- Select a Project --</option>
                                {projects.map(p => (
                                    <option key={p.project_id} value={p.project_id} className="bg-[#0D1424]">{p.name}</option>
                                ))}
                            </select>
                            {!selectedProject && (
                                <p className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Required to save execution results</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Code Source</label>
                            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                                <button onClick={() => setMode('upload')} className={`flex-1 flex justify-center items-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'upload' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                                    <UploadCloud className="w-4 h-4" /> File Upload
                                </button>
                                <button onClick={() => setMode('git')} className={`flex-1 flex justify-center items-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'git' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                                    <Github className="w-4 h-4" /> Git Repo
                                </button>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {mode === 'upload' ? (
                                <motion.div key="upload" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-2">
                                    <label className="block w-full cursor-pointer">
                                        <div className={`w-full flex flex-col items-center justify-center p-6 border-2 border-dashed ${file ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/10 bg-white/5 hover:border-white/30'} rounded-xl transition-colors text-center`}>
                                            <UploadCloud className={`w-8 h-8 mb-2 ${file ? 'text-cyan-400' : 'text-slate-400'}`} />
                                            <span className={`text-sm font-bold ${file ? 'text-cyan-400' : 'text-slate-300'}`}>{file ? file.name : 'Click to select .zip file'}</span>
                                            <span className="text-xs text-slate-500 mt-1">Upload project archive</span>
                                        </div>
                                        <input type="file" className="hidden" accept=".zip" onChange={handleFileChange} />
                                    </label>
                                </motion.div>
                            ) : (
                                <motion.div key="git" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Repository URL</label>
                                    <div className="relative">
                                        <input type="text" value={gitUrl} onChange={e => setGitUrl(e.target.value)} placeholder="https://github.com/user/repo.git" className="w-full pl-10 pr-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-cyan-500/50 transition-colors" />
                                        <Github className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Test Selection */}
                    <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                            <Activity className="w-5 h-5 text-cyan-400" /> Test Suite Selection
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {testTypeConfig.map(test => (
                                <button 
                                    key={test.id} 
                                    onClick={() => handleTestSelection(test.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedTests[test.id] ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${selectedTests[test.id] ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-slate-500 bg-transparent'}`}>
                                        {selectedTests[test.id] && <CheckCircle2 className="w-3 h-3" />}
                                    </div>
                                    <div className="flex items-center gap-2 min-w-0">
                                        {test.icon}
                                        <span className="text-xs font-bold uppercase tracking-wider truncate">{test.label}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={handleExecute} 
                            disabled={loading} 
                            className="w-full mt-6 flex justify-center items-center gap-2 px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                        >
                            {loading ? (
                                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Executing Pipeline...</>
                            ) : (
                                <><Play className="w-5 h-5" /> Start Automation</>
                            )}
                        </button>
                    </div>
                </motion.div>

                {/* RESULTS PANEL */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl flex flex-col h-[800px] overflow-hidden">
                    
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-cyan-500/20 rounded-full"></div>
                                <div className="w-20 h-20 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                                <Cpu className="w-8 h-8 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
                            </div>
                            <h3 className="text-xl font-bold text-white mt-6 mb-2">Pipeline Running</h3>
                            <p className="text-slate-400">Executing selected tests, please wait...</p>
                        </div>
                    ) : results ? (
                        <>
                            <div className="p-6 border-b border-white/10 bg-white/5 flex flex-wrap justify-between items-center gap-4 shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-400" /> Execution Complete
                                    </h2>
                                    <p className="text-xs text-slate-400 font-mono mt-1">Run ID: {results.runId}</p>
                                </div>
                                {results.runId && (
                                    <button onClick={() => navigate(`/runs/${results.runId}`)} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors border border-white/10">
                                        Full Report <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* TABS */}
                            <div className="flex overflow-x-auto custom-scrollbar border-b border-white/10 bg-black/20 shrink-0 px-2 pt-2">
                                <button onClick={() => setActiveTab('terminal')} className={`px-4 py-3 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${activeTab === 'terminal' ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-slate-500 hover:text-white rounded-t-xl hover:bg-white/5'}`}>
                                    <div className="flex items-center gap-2"><Terminal className="w-4 h-4"/> Console Output</div>
                                </button>
                                
                                {testTypeConfig.map(test => {
                                    if (!selectedTests[test.id]) return null;
                                    return (
                                        <button key={test.id} onClick={() => setActiveTab(test.id)} className={`px-4 py-3 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${activeTab === test.id ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-slate-500 hover:text-white rounded-t-xl hover:bg-white/5'}`}>
                                            <div className="flex items-center gap-2">{test.icon} {test.label}</div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* TAB CONTENT */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#0D1424]">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'terminal' && (
                                        <motion.div key="terminal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full font-mono text-xs">
                                            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 h-full overflow-y-auto custom-scrollbar shadow-inner text-emerald-400 leading-relaxed">
                                                {results.logs?.length > 0 ? (
                                                    results.logs.map((log, i) => (
                                                        <div key={i} className="mb-1 pb-1 border-b border-white/5 hover:bg-white/5 px-2 -mx-2 rounded">
                                                            <span className="text-slate-600 mr-3">[{i.toString().padStart(4, '0')}]</span>
                                                            <span className={log.includes('ERROR') || log.includes('FAIL') ? 'text-rose-400' : log.includes('WARN') ? 'text-amber-400' : 'text-emerald-400'}>
                                                                {log}
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-slate-500 italic">No console logs available.</div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'unit' && (
                                        <motion.div key="unit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                            {results.results?.unitTests?.total > 0 ? (
                                                <>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="bg-slate-500/10 border border-slate-500/20 rounded-2xl p-4 text-center">
                                                            <div className="text-3xl font-black text-white mb-1">{results.results.unitTests.total}</div>
                                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Tests</div>
                                                        </div>
                                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                                                            <div className="text-3xl font-black text-emerald-400 mb-1">{results.results.unitTests.passed}</div>
                                                            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Passed</div>
                                                        </div>
                                                        <div className={`border rounded-2xl p-4 text-center ${results.results.unitTests.failed > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-500/10 border-slate-500/20'}`}>
                                                            <div className={`text-3xl font-black mb-1 ${results.results.unitTests.failed > 0 ? 'text-rose-400' : 'text-slate-500'}`}>{results.results.unitTests.failed}</div>
                                                            <div className={`text-[10px] font-black uppercase tracking-widest ${results.results.unitTests.failed > 0 ? 'text-rose-500' : 'text-slate-500'}`}>Failed</div>
                                                        </div>
                                                    </div>
                                                    <div className={`p-6 rounded-2xl border text-center ${results.results.unitTests.failed > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                                                        {results.results.unitTests.failed > 0 ? (
                                                            <><AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3"/><h3 className="text-xl font-bold text-rose-400">Tests Failed</h3><p className="text-sm text-rose-400/80 mt-2">Check terminal logs for specific assertion failures.</p></>
                                                        ) : (
                                                            <><CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3"/><h3 className="text-xl font-bold text-emerald-400">All Tests Passed!</h3><p className="text-sm text-emerald-400/80 mt-2">Your test suite ran perfectly.</p></>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/10 rounded-3xl bg-[#0B0F19]/50">
                                                    <Bug className="w-12 h-12 text-slate-500 mb-4" />
                                                    <h3 className="text-lg font-bold text-white mb-2">No Unit Tests Found</h3>
                                                    <p className="text-sm text-slate-400">This project either has no unit tests or they could not be detected. Add tests in a <code className="bg-black/30 px-2 py-1 rounded text-cyan-400 font-mono">tests/</code> directory.</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {activeTab === 'static' && (
                                        <motion.div key="static" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            {results.results?.staticAnalysis?.length > 0 ? (
                                                <div className="space-y-3">
                                                    {results.results.staticAnalysis.map((issue, i) => (
                                                        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4">
                                                            <div className={`shrink-0 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest self-start ${issue.severity === 'Error' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                                                                {issue.severity}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-bold text-white mb-1">{issue.message}</p>
                                                                <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                                                                    <span className="truncate" title={issue.file}>{issue.file}:{issue.line}</span>
                                                                    <span className="px-2 py-0.5 bg-black/30 rounded text-cyan-400 border border-white/5">{issue.rule}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/10 rounded-3xl bg-[#0B0F19]/50">
                                                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-4" />
                                                    <h3 className="text-lg font-bold text-white mb-2">No Static Analysis Issues</h3>
                                                    <p className="text-sm text-slate-400">Your code passed all static analysis checks with flying colors!</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {activeTab === 'security' && (
                                        <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            {results.results?.security?.length > 0 ? (
                                                <div className="space-y-3">
                                                    {results.results.security.map((issue, i) => (
                                                        <div key={i} className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 flex gap-4">
                                                            <div className="shrink-0 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest self-start bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                                                {issue.severity}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-white mb-1 font-mono text-rose-200">{issue.rule}</p>
                                                                <p className="text-sm text-slate-300 leading-relaxed">{issue.description}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-emerald-500/20 rounded-3xl bg-emerald-500/5">
                                                    <ShieldCheck className="w-12 h-12 text-emerald-400 mb-4" />
                                                    <h3 className="text-lg font-bold text-white mb-2">No Security Vulnerabilities</h3>
                                                    <p className="text-sm text-slate-400">All dependencies and code patterns appear secure.</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {activeTab === 'complexity' && (
                                        <motion.div key="complexity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            {results.results?.complexity?.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-sm text-slate-300">
                                                        <thead className="text-xs font-black uppercase tracking-widest text-slate-500 bg-white/5 border-b border-white/10">
                                                            <tr>
                                                                <th className="px-4 py-3 rounded-tl-lg">File</th>
                                                                <th className="px-4 py-3 text-center">Complexity</th>
                                                                <th className="px-4 py-3 text-right rounded-tr-lg">Maintainability</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {results.results.complexity.map((metric, i) => (
                                                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                                                    <td className="px-4 py-3 font-mono text-xs">{metric.file}</td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <span className={`px-2 py-1 rounded-md text-[10px] font-black tracking-widest ${metric.complexity > 10 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                                                            {metric.complexity}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right font-mono">{metric.maintainability}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-emerald-500/20 rounded-3xl bg-emerald-500/5">
                                                    <Layers className="w-12 h-12 text-emerald-400 mb-4" />
                                                    <h3 className="text-lg font-bold text-white mb-2">Excellent Code Complexity</h3>
                                                    <p className="text-sm text-slate-400">All analyzed functions are within acceptable complexity thresholds.</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {activeTab === 'coverage' && (
                                        <motion.div key="coverage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            {results.results?.coverage?.lines?.total > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    {[
                                                        { label: 'Line Coverage', data: results.results.coverage.lines },
                                                        { label: 'Branch Coverage', data: results.results.coverage.branches },
                                                        { label: 'Function Coverage', data: results.results.coverage.functions }
                                                    ].map((cov, idx) => (
                                                        <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                                                            <div className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${cov.data.pct < 60 ? 'bg-rose-500' : cov.data.pct < 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${cov.data.pct}%` }} />
                                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{cov.label}</div>
                                                            <div className={`text-4xl font-black mb-2 ${cov.data.pct < 60 ? 'text-rose-400' : cov.data.pct < 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                                {cov.data.pct.toFixed(1)}%
                                                            </div>
                                                            <div className="text-xs text-slate-400 font-mono">
                                                                <span className="text-white font-bold">{cov.data.covered}</span> / {cov.data.total}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/10 rounded-3xl bg-[#0B0F19]/50">
                                                    <Search className="w-12 h-12 text-slate-500 mb-4" />
                                                    <h3 className="text-lg font-bold text-white mb-2">Coverage Data Unavailable</h3>
                                                    <p className="text-sm text-slate-400">Ensure coverage tools (like istanbul/nyc) are configured and generate LCOV or JSON reports during testing.</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {activeTab === 'performance' && (
                                        <motion.div key="performance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            {results.results?.performance?.tested ? (
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
                                                            <div className="text-2xl font-black text-blue-400 mb-1 font-mono">{results.results.performance.summary.avgResponseTime}ms</div>
                                                            <div className="text-[9px] font-black uppercase tracking-widest text-blue-500">Avg Response</div>
                                                        </div>
                                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                                                            <div className="text-2xl font-black text-emerald-400 mb-1">{results.results.performance.summary.passed}</div>
                                                            <div className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Passed Endpoints</div>
                                                        </div>
                                                        <div className={`border rounded-2xl p-4 text-center ${results.results.performance.summary.failed > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-500/10 border-slate-500/20'}`}>
                                                            <div className={`text-2xl font-black mb-1 ${results.results.performance.summary.failed > 0 ? 'text-rose-400' : 'text-slate-500'}`}>{results.results.performance.summary.failed}</div>
                                                            <div className={`text-[9px] font-black uppercase tracking-widest ${results.results.performance.summary.failed > 0 ? 'text-rose-500' : 'text-slate-500'}`}>Failed Endpoints</div>
                                                        </div>
                                                    </div>
                                                    <div className="overflow-x-auto border border-white/10 rounded-xl">
                                                        <table className="w-full text-left text-sm text-slate-300">
                                                            <thead className="text-xs font-black uppercase tracking-widest text-slate-500 bg-white/5 border-b border-white/10">
                                                                <tr>
                                                                    <th className="px-4 py-3">Method</th>
                                                                    <th className="px-4 py-3">Endpoint Path</th>
                                                                    <th className="px-4 py-3">Response Time</th>
                                                                    <th className="px-4 py-3 text-right">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-white/5">
                                                                {results.results.performance.endpoints.map((ep, i) => (
                                                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                                                        <td className="px-4 py-3 font-black text-cyan-400 text-xs tracking-wider">{ep.method}</td>
                                                                        <td className="px-4 py-3 font-mono text-xs">{ep.path}</td>
                                                                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{ep.responseTime}ms</td>
                                                                        <td className="px-4 py-3 text-right">
                                                                            <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${ep.passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                                                                                {ep.status}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/10 rounded-3xl bg-[#0B0F19]/50">
                                                    <Activity className="w-12 h-12 text-slate-500 mb-4" />
                                                    <h3 className="text-lg font-bold text-white mb-2">Performance Test Unavailable</h3>
                                                    <p className="text-sm text-slate-400 max-w-md">{results.results?.performance?.message || 'Could not detect an API server to test. Ensure server.js, app.js, or index.js exists with Express routes.'}</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {activeTab === 'integration' && (
                                        <motion.div key="integration" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            {results.results?.integration?.tested ? (
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="bg-slate-500/10 border border-slate-500/20 rounded-2xl p-4 text-center">
                                                            <div className="text-3xl font-black text-white mb-1">{results.results.integration.summary.total}</div>
                                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</div>
                                                        </div>
                                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                                                            <div className="text-3xl font-black text-emerald-400 mb-1">{results.results.integration.summary.passed}</div>
                                                            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Passed</div>
                                                        </div>
                                                        <div className={`border rounded-2xl p-4 text-center ${results.results.integration.summary.failed > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-500/10 border-slate-500/20'}`}>
                                                            <div className={`text-3xl font-black mb-1 ${results.results.integration.summary.failed > 0 ? 'text-rose-400' : 'text-slate-500'}`}>{results.results.integration.summary.failed}</div>
                                                            <div className={`text-[10px] font-black uppercase tracking-widest ${results.results.integration.summary.failed > 0 ? 'text-rose-500' : 'text-slate-500'}`}>Failed</div>
                                                        </div>
                                                    </div>
                                                    <div className="overflow-x-auto border border-white/10 rounded-xl">
                                                        <table className="w-full text-left text-sm text-slate-300">
                                                            <thead className="text-xs font-black uppercase tracking-widest text-slate-500 bg-white/5 border-b border-white/10">
                                                                <tr>
                                                                    <th className="px-4 py-3">Integration Test File</th>
                                                                    <th className="px-4 py-3 text-right">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-white/5">
                                                                {results.results.integration.tests.map((test, i) => (
                                                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                                                        <td className="px-4 py-3 font-mono text-xs text-white">{test.file}</td>
                                                                        <td className="px-4 py-3 text-right">
                                                                            <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${test.passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                                                                                {test.status}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/10 rounded-3xl bg-[#0B0F19]/50">
                                                    <FolderOpen className="w-12 h-12 text-slate-500 mb-4" />
                                                    <h3 className="text-lg font-bold text-white mb-2">Integration Tests Not Found</h3>
                                                    <p className="text-sm text-slate-400 max-w-md">{results.results?.integration?.message || 'No integration test files found. Add files with *.integration.js or *.int.test.js naming patterns.'}</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {activeTab === 'regression' && (
                                        <motion.div key="regression" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            {results.results?.regression?.tested ? (
                                                <div className="flex flex-col items-center justify-center p-12 text-center bg-white/5 border border-white/10 rounded-3xl">
                                                    <div className="flex gap-10 mb-8">
                                                        <div className="text-center">
                                                            <div className={`text-5xl font-black mb-2 ${results.results.regression.summary.totalRegressions > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                                {results.results.regression.summary.totalRegressions}
                                                            </div>
                                                            <div className="text-xs font-black uppercase tracking-widest text-slate-400">New Regressions</div>
                                                        </div>
                                                        <div className="w-px bg-white/10"></div>
                                                        <div className="text-center">
                                                            <div className="text-5xl font-black mb-2 text-emerald-400">
                                                                {results.results.regression.summary.totalImprovements}
                                                            </div>
                                                            <div className="text-xs font-black uppercase tracking-widest text-slate-400">Fixed Issues</div>
                                                        </div>
                                                    </div>
                                                    {results.results.regression.summary.totalRegressions === 0 ? (
                                                        <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                                                            <CheckCircle2 className="w-5 h-5"/> No new regressions introduced!
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-rose-400 font-bold bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20">
                                                            <AlertTriangle className="w-5 h-5"/> Warning: New issues detected since last run.
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/10 rounded-3xl bg-[#0B0F19]/50">
                                                    <ActivitySquare className="w-12 h-12 text-slate-500 mb-4" />
                                                    <h3 className="text-lg font-bold text-white mb-2">Regression Analysis Unavailable</h3>
                                                    <p className="text-sm text-slate-400 max-w-md">{results.results?.regression?.message || 'Need multiple test runs on the same project to compare and detect regressions.'}</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-[#0D1424] opacity-50 border-2 border-dashed border-white/5 rounded-3xl m-6">
                            <Cpu className="w-16 h-16 mb-4 opacity-20" />
                            <h3 className="text-lg font-bold text-white mb-2">Waiting for Execution</h3>
                            <p className="text-sm max-w-md text-center">Configure your source code and test suite on the left, then click Start Automation to see results here.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default AutoTest;
