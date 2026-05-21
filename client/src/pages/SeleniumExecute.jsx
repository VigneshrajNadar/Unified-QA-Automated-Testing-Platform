import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, FileCode2, Globe, CheckCircle2, UploadCloud, Server } from 'lucide-react';
import api from '../api';

const SeleniumExecute = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [scriptName, setScriptName] = useState('');
    const [targetUrl, setTargetUrl] = useState('');
    const [browsers, setBrowsers] = useState(['chrome']); // Default chrome
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleBrowserToggle = (browser) => {
        setBrowsers(prev =>
            prev.includes(browser)
                ? prev.filter(b => b !== browser)
                : [...prev, browser]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !scriptName) return alert('Please provide script and name.');
        if (browsers.length === 0) return alert('Select at least one browser.');

        setUploading(true);
        try {
            // 1. Upload Script
            const formData = new FormData();
            formData.append('script', file);
            formData.append('name', scriptName);
            formData.append('description', 'Uploaded via Web UI');
            formData.append('user_id', 1);

            const uploadRes = await api.post('/selenium/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const scriptId = uploadRes.data.script_id;

            // 2. Run Test
            const runRes = await api.post('/selenium/run', {
                script_id: scriptId,
                browsers: browsers,
                target_url: targetUrl,
                user_id: 1
            });

            navigate(`/selenium/job/${runRes.data.job_id}`);

        } catch (err) {
            console.error(err);
            alert('Failed to execute test.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl shrink-0">
                <div className="flex items-center gap-4">
                    <Link to="/selenium" className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/5"><ArrowLeft className="w-5 h-5" /></Link>
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-3">
                            <Play className="w-6 h-6 text-purple-400" /> Execute Selenium Test
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">Upload a script and run it across multiple browser nodes simultaneously</p>
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[50px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                
                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Target URL <span className="text-purple-400">*</span></label>
                            <div className="relative">
                                <input required type="url" placeholder="https://example.com" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500/50 transition-colors" />
                                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1.5 ml-1">The starting URL for your automation script.</p>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Test Script Name <span className="text-purple-400">*</span></label>
                            <div className="relative">
                                <input required type="text" placeholder="e.g., Login Flow Regression" value={scriptName} onChange={(e) => setScriptName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors" />
                                <FileCode2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Selenium Script (.js) <span className="text-purple-400">*</span></label>
                        <label className="block w-full cursor-pointer">
                            <div className={`w-full flex flex-col items-center justify-center p-8 border-2 border-dashed ${file ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/10 bg-[#0D1424] hover:border-white/30'} rounded-2xl transition-colors text-center`}>
                                <UploadCloud className={`w-10 h-10 mb-3 ${file ? 'text-purple-400' : 'text-slate-500'}`} />
                                <span className={`text-sm font-bold ${file ? 'text-purple-400' : 'text-white'}`}>{file ? file.name : 'Click to select Node.js Selenium script'}</span>
                                <span className="text-xs text-slate-500 mt-1 font-mono">Accepts .js files</span>
                            </div>
                            <input required type="file" className="hidden" accept=".js" onChange={handleFileChange} />
                        </label>
                    </div>

                    {/* Grid Nodes / Browsers */}
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                            <span>Execution Grid <span className="text-purple-400">*</span></span>
                            <span className="text-[10px] flex items-center gap-1"><Server className="w-3 h-3"/> {browsers.length} Nodes Selected</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className={`relative flex items-center p-4 rounded-xl border cursor-pointer transition-all ${browsers.includes('chrome') ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-[#0D1424] border-white/10 hover:border-white/20'}`}>
                                <input type="checkbox" className="hidden" checked={browsers.includes('chrome')} onChange={() => handleBrowserToggle('chrome')} />
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 border ${browsers.includes('chrome') ? 'bg-blue-500/20 border-blue-500/30' : 'bg-white/5 border-white/10'}`}>
                                    <div className={`w-4 h-4 rounded-full ${browsers.includes('chrome') ? 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-slate-500'}`} />
                                </div>
                                <div className="flex-1">
                                    <div className={`font-bold text-sm ${browsers.includes('chrome') ? 'text-blue-400' : 'text-white'}`}>Google Chrome</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">V114.0 Linux</div>
                                </div>
                                {browsers.includes('chrome') && <CheckCircle2 className="w-5 h-5 text-blue-400 absolute right-4" />}
                            </label>

                            <label className={`relative flex items-center p-4 rounded-xl border cursor-pointer transition-all ${browsers.includes('firefox') ? 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'bg-[#0D1424] border-white/10 hover:border-white/20'}`}>
                                <input type="checkbox" className="hidden" checked={browsers.includes('firefox')} onChange={() => handleBrowserToggle('firefox')} />
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 border ${browsers.includes('firefox') ? 'bg-orange-500/20 border-orange-500/30' : 'bg-white/5 border-white/10'}`}>
                                    <div className={`w-4 h-4 rounded-full ${browsers.includes('firefox') ? 'bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-slate-500'}`} />
                                </div>
                                <div className="flex-1">
                                    <div className={`font-bold text-sm ${browsers.includes('firefox') ? 'text-orange-400' : 'text-white'}`}>Mozilla Firefox</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">V115.0 Linux</div>
                                </div>
                                {browsers.includes('firefox') && <CheckCircle2 className="w-5 h-5 text-orange-400 absolute right-4" />}
                            </label>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 flex justify-end">
                        <button type="submit" disabled={uploading || browsers.length === 0} className="flex justify-center items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] disabled:opacity-50 disabled:cursor-not-allowed">
                            {uploading ? (
                                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Initializing Grid...</>
                            ) : (
                                <><Play className="w-5 h-5" /> Start Execution</>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default SeleniumExecute;
