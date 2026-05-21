import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, FolderKanban, Save, TerminalSquare, FileSpreadsheet, Check, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import api from '../api';

const AITestGenerator = () => {
    const [prompt, setPrompt] = useState('');
    const [generatedCases, setGeneratedCases] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedCases, setSelectedCases] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (err) {
            console.error("Error fetching projects", err);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setGeneratedCases([]);
        setSuccessMsg('');

        try {
            const res = await api.post('/ai/generate', { prompt });
            let resultText = res.data.result;

            const startIndex = resultText.indexOf('[');
            const endIndex = resultText.lastIndexOf(']');

            if (startIndex !== -1 && endIndex !== -1) {
                resultText = resultText.substring(startIndex, endIndex + 1);
            } else {
                resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
            }

            try {
                const parsed = JSON.parse(resultText);
                if (Array.isArray(parsed)) {
                    setGeneratedCases(parsed);
                    const initialSelection = {};
                    parsed.forEach((_, idx) => initialSelection[idx] = true);
                    setSelectedCases(initialSelection);
                } else {
                    setError("AI response was not a valid list. Raw output: " + resultText.substring(0, 100) + "...");
                }
            } catch (parseErr) {
                setError("Failed to parse AI response as JSON. Try again. Raw: " + resultText.substring(0, 100));
            }

        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedProject) {
            setError("Please select a project to save these test cases to.");
            return;
        }

        setSaving(true);
        setSuccessMsg('');
        let savedCount = 0;

        try {
            const casesToSave = generatedCases.filter((_, idx) => selectedCases[idx]);

            for (const tc of casesToSave) {
                await api.post('/testcases', {
                    project_id: selectedProject,
                    title: tc.title,
                    description: tc.description,
                    preconditions: tc.preconditions,
                    steps: tc.steps,
                    expected_result: tc.expected_result,
                    priority: tc.priority || 'Medium',
                    module_id: null
                });
                savedCount++;
            }
            setSuccessMsg(`Successfully saved ${savedCount} test cases to project!`);
            setGeneratedCases([]); 
        } catch (err) {
            setError("Error saving test cases: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleSelection = (idx) => {
        setSelectedCases(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const toggleAll = () => {
        const allSelected = generatedCases.every((_, idx) => selectedCases[idx]);
        const newSelection = {};
        generatedCases.forEach((_, idx) => newSelection[idx] = !allSelected);
        setSelectedCases(newSelection);
    };

    const selectedCount = generatedCases.filter((_, idx) => selectedCases[idx]).length;

    return (
        <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Bot className="w-8 h-8 text-cyan-400" /> AI Test Generator
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Describe your feature requirements and let AI generate test cases instantly.</p>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                
                {/* LEFT PANEL: INPUT FORM */}
                <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl flex flex-col overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500/10 blur-[50px] rounded-full -ml-20 -mt-20 pointer-events-none" />
                    
                    <div className="p-6 border-b border-white/10 bg-white/5 shrink-0 flex items-center gap-3 z-10">
                        <TerminalSquare className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-lg font-bold text-white">Prompt Definition</h2>
                    </div>

                    <form onSubmit={handleGenerate} className="flex-1 flex flex-col p-6 z-10 overflow-y-auto custom-scrollbar">
                        <div className="space-y-6 flex-1 flex flex-col">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <FolderKanban className="w-4 h-4 text-blue-400" /> Target Project (Required for Saving)
                                </label>
                                <select
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none"
                                >
                                    <option value="" className="bg-[#0D1424]">-- Select Project --</option>
                                    {projects.map(p => <option key={p.project_id} value={p.project_id} className="bg-[#0D1424]">{p.name}</option>)}
                                </select>
                            </div>

                            <div className="flex-1 flex flex-col min-h-[300px]">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-400" /> Feature Requirement
                                </label>
                                <textarea
                                    placeholder="Describe the feature, user story, or acceptance criteria in detail...&#10;&#10;Example:&#10;As a user, I want to be able to reset my password using my email address so that I can regain access to my account if I forget my password."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="flex-1 w-full px-5 py-4 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors resize-none custom-scrollbar leading-relaxed"
                                    required
                                />
                            </div>

                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                                        <p className="text-sm text-rose-400">{error}</p>
                                    </motion.div>
                                )}
                                {successMsg && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                        <p className="text-sm text-emerald-400 font-bold">{successMsg}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="pt-6 mt-6 border-t border-white/10 shrink-0">
                            <button 
                                type="submit" 
                                disabled={loading || !prompt.trim()} 
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-[#060B14] font-black text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                            >
                                {loading ? (
                                    <><div className="w-5 h-5 border-2 border-[#060B14]/30 border-t-[#060B14] rounded-full animate-spin" /> Generating magic...</>
                                ) : (
                                    <><Sparkles className="w-5 h-5" /> Generate Test Cases</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* RIGHT PANEL: RESULTS */}
                <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl flex flex-col overflow-hidden relative">
                    <div className="p-6 border-b border-white/10 bg-white/5 shrink-0 flex justify-between items-center z-10">
                        <div className="flex items-center gap-3">
                            <FileSpreadsheet className="w-5 h-5 text-purple-400" />
                            <h2 className="text-lg font-bold text-white">Generated Output</h2>
                            {generatedCases.length > 0 && (
                                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black">
                                    {generatedCases.length}
                                </span>
                            )}
                        </div>
                        {generatedCases.length > 0 && (
                            <button 
                                onClick={handleSave} 
                                disabled={saving || selectedCount === 0} 
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-sm border border-emerald-500/20 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? <><div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save ({selectedCount})</>}
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#0D1424] z-10 relative">
                        {loading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0D1424]/80 backdrop-blur-sm z-20">
                                <div className="relative mb-6">
                                    <div className="w-16 h-16 border-4 border-cyan-500/20 rounded-full"></div>
                                    <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                                    <Bot className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Analyzing Requirements...</h3>
                                <p className="text-sm text-cyan-400/70 font-mono">Synthesizing optimal test coverage...</p>
                            </div>
                        ) : generatedCases.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex justify-end mb-2">
                                    <button onClick={toggleAll} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest flex items-center gap-1">
                                        <Check className="w-3.5 h-3.5" /> Toggle All
                                    </button>
                                </div>
                                {generatedCases.map((tc, idx) => (
                                    <motion.div 
                                        key={idx} 
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                        onClick={() => toggleSelection(idx)}
                                        className={`p-5 rounded-2xl border cursor-pointer transition-all group relative overflow-hidden ${selectedCases[idx] ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'}`}
                                    >
                                        <div className="flex gap-4">
                                            <div className="shrink-0 mt-1">
                                                {selectedCases[idx] ? <CheckCircle2 className="w-5 h-5 text-cyan-400" /> : <Circle className="w-5 h-5 text-slate-500 group-hover:text-slate-400" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${tc.priority === 'High' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : tc.priority === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                                                        {tc.priority || 'Medium'}
                                                    </span>
                                                </div>
                                                <h4 className="text-base font-bold text-white mb-2">{tc.title}</h4>
                                                <p className="text-sm text-slate-300 leading-relaxed mb-4">{tc.description}</p>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                                    {tc.steps && (
                                                        <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Steps</p>
                                                            <p className="text-xs text-slate-300 font-mono line-clamp-3">{tc.steps}</p>
                                                        </div>
                                                    )}
                                                    {tc.expected_result && (
                                                        <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Expected</p>
                                                            <p className="text-xs text-slate-300 line-clamp-3">{tc.expected_result}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
                                <Bot className="w-16 h-16 text-slate-500 mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Awaiting Instructions</h3>
                                <p className="text-sm text-slate-400 max-w-sm">Enter your feature requirements in the prompt box and click Generate to see AI-crafted test cases here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AITestGenerator;
