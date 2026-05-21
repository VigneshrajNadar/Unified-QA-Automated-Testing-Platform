import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, CheckCircle2, AlertCircle, AlertTriangle, Search, Clock, Monitor, Globe, X, FolderOpen, ImageIcon, ShieldCheck, Bug } from 'lucide-react';
import api from '../api';

function VisualResults() {
    const { runId } = useParams();
    const navigate = useNavigate();

    const [run, setRun] = useState(null);
    const [diffs, setDiffs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        fetchRunData();
    }, [runId]);

    const fetchRunData = async () => {
        try {
            const runResponse = await api.get(`/visual/run/${runId}`);
            setRun(runResponse.data);

            if (runResponse.data && runResponse.data.run_type === 'comparison') {
                const diffsResponse = await api.get(`/visual/diffs/${runId}`);
                setDiffs(diffsResponse.data);
            }
        } catch (error) {
            console.error('Error fetching run data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'pass') {
            return <span className="px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4"/> Match</span>;
        } else if (status === 'warning') {
            return <span className="px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl border bg-amber-500/10 border-amber-500/20 text-amber-400 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4"/> Notice</span>;
        } else {
            return <span className="px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl border bg-rose-500/10 border-rose-500/20 text-rose-400 flex items-center gap-1.5"><AlertCircle className="w-4 h-4"/> Diff Found</span>;
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin" />
        </div>
    );

    if (!run) return (
        <div className="flex flex-col items-center justify-center h-64 bg-[#0B0F19]/50 border border-white/10 rounded-3xl">
            <AlertCircle className="w-10 h-10 text-rose-400 mb-4" />
            <h2 className="text-xl font-bold text-white mb-4">Run Not Found</h2>
            <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/10">Go Back</button>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 blur-[50px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                <div className="flex items-center gap-4 z-10">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/5"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-3">
                            {run.run_type === 'baseline' ? <Camera className="w-6 h-6 text-fuchsia-400" /> : <Search className="w-6 h-6 text-blue-400" />}
                            {run.run_type === 'baseline' ? 'Baseline Results' : 'Comparison Results'}
                        </h1>
                        <p className="text-sm text-slate-400 mt-1 font-mono">Run ID #{runId}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap z-10">
                    <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-xl border border-white/5">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-300 font-medium">{new Date(run.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-xl border border-white/5">
                        <Globe className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-300 font-medium capitalize">{run.browser}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-xl border border-white/5">
                        <Monitor className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-300 font-medium capitalize">{run.viewport}</span>
                    </div>
                </div>
            </motion.div>

            {run.run_type === 'baseline' ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-emerald-400 mb-2">Baseline Established Successfully</h3>
                            <p className="text-slate-300 leading-relaxed max-w-3xl">
                                {run.total_screenshots || 0} screenshot(s) were captured and saved as reference images. 
                                These images will serve as the source of truth for future visual comparison tests.
                            </p>
                        </div>
                    </div>

                    <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <FolderOpen className="w-5 h-5 text-fuchsia-400" />
                            <h3 className="text-lg font-bold text-white">Storage Location</h3>
                        </div>
                        <div className="p-4 bg-black/20 rounded-2xl border border-white/5 font-mono text-sm text-slate-300 break-all mb-4">
                            server/uploads/visual-tests/baselines/vp_{run.visual_project_id}/
                        </div>
                        <p className="text-sm text-slate-400 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-slate-500" /> Note: To view these screenshots, either inspect the server directory or run a comparison test to see them rendered in the UI alongside current captures.
                        </p>
                    </div>
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
                    
                    {diffs.length === 0 ? (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-8 flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-amber-400 mb-2">No Comparison Data Found</h3>
                                <p className="text-slate-300 leading-relaxed max-w-3xl mb-4">
                                    The comparison test executed but no differences were evaluated. This typically happens when:
                                </p>
                                <ul className="list-disc list-inside text-sm text-slate-400 space-y-2 mb-4">
                                    <li>No baseline exists for the tested URLs</li>
                                    <li>Screenshots are still being processed in the background</li>
                                    <li>An unexpected error occurred during the image diffing process</li>
                                </ul>
                                <p className="text-sm font-bold text-amber-500/80">Action Required: Ensure you have run a baseline test first with identical parameters (URL, browser, viewport).</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 text-center">
                                    <div className="text-4xl font-black text-emerald-400 mb-2">{diffs.filter(d => d.status === 'pass').length}</div>
                                    <div className="text-xs font-black uppercase tracking-widest text-emerald-500">Perfect Matches</div>
                                </div>
                                <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 text-center">
                                    <div className="text-4xl font-black text-amber-400 mb-2">{diffs.filter(d => d.status === 'warning').length}</div>
                                    <div className="text-xs font-black uppercase tracking-widest text-amber-500">Minor Deviations</div>
                                </div>
                                <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 text-center">
                                    <div className="text-4xl font-black text-rose-400 mb-2">{diffs.filter(d => d.status === 'fail').length}</div>
                                    <div className="text-xs font-black uppercase tracking-widest text-rose-500">Visual Failures</div>
                                </div>
                            </div>

                            {/* Diff List */}
                            <div className="space-y-6">
                                {diffs.map((diff, index) => (
                                    <motion.div key={diff.diff_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className={`bg-[#0B0F19]/80 backdrop-blur-xl border-2 rounded-3xl shadow-xl overflow-hidden ${diff.status === 'fail' ? 'border-rose-500/30' : diff.status === 'warning' ? 'border-amber-500/30' : 'border-emerald-500/30'}`}>
                                        
                                        <div className="p-6 border-b border-white/5 bg-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{diff.page_name || 'Captured Page'}</h3>
                                                <p className="text-sm text-slate-400 font-mono mt-1">{diff.page_url}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex gap-4 mr-4">
                                                    <div className="text-center">
                                                        <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mismatch</span>
                                                        <span className={`text-lg font-bold ${diff.status === 'pass' ? 'text-emerald-400' : 'text-white'}`}>{diff.mismatch_percentage?.toFixed(2)}%</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Pixels</span>
                                                        <span className="text-lg font-bold text-white">{diff.mismatch_pixels?.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                {getStatusBadge(diff.status)}
                                            </div>
                                        </div>

                                        <div className="p-6 bg-[#0D1424] grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Baseline Image */}
                                            <div className="flex flex-col h-full">
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Camera className="w-4 h-4"/> Baseline Reference</h4>
                                                <div className="flex-1 rounded-2xl border border-white/10 bg-black/50 overflow-hidden group cursor-pointer relative" onClick={() => diff.baseline_image_path && setSelectedImage({ src: `http://localhost:5000/uploads/${diff.baseline_image_path.split('uploads\\')[1]?.replace(/\\/g, '/')}`, title: 'Baseline - ' + diff.page_name })}>
                                                    {diff.baseline_image_path ? (
                                                        <>
                                                            <img src={`http://localhost:5000/uploads/${diff.baseline_image_path.split('uploads\\')[1]?.replace(/\\/g, '/')}`} alt="Baseline" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="%23999">Image not found</text></svg>'; }} />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"><Search className="w-8 h-8 text-white drop-shadow-lg" /></div>
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full min-h-[200px] text-slate-500">No Baseline Available</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Current Image */}
                                            <div className="flex flex-col h-full">
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Monitor className="w-4 h-4"/> Current Capture</h4>
                                                <div className="flex-1 rounded-2xl border border-white/10 bg-black/50 overflow-hidden group cursor-pointer relative" onClick={() => diff.current_image_path && setSelectedImage({ src: `http://localhost:5000/uploads/${diff.current_image_path.split('uploads\\')[1]?.replace(/\\/g, '/')}`, title: 'Current - ' + diff.page_name })}>
                                                    {diff.current_image_path ? (
                                                        <>
                                                            <img src={`http://localhost:5000/uploads/${diff.current_image_path.split('uploads\\')[1]?.replace(/\\/g, '/')}`} alt="Current" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="%23999">Image not found</text></svg>'; }} />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"><Search className="w-8 h-8 text-white drop-shadow-lg" /></div>
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full min-h-[200px] text-slate-500">No Current Capture</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Diff Overlay */}
                                            <div className="flex flex-col h-full">
                                                <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Bug className="w-4 h-4"/> Difference Map</h4>
                                                <div className={`flex-1 rounded-2xl border bg-black/50 overflow-hidden group cursor-pointer relative ${diff.status === 'pass' ? 'border-white/10 opacity-70' : 'border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]'}`} onClick={() => diff.diff_image_path && setSelectedImage({ src: `http://localhost:5000/uploads/${diff.diff_image_path.split('uploads\\')[1]?.replace(/\\/g, '/')}`, title: 'Difference Map - ' + diff.page_name })}>
                                                    {diff.diff_image_path ? (
                                                        <>
                                                            <img src={`http://localhost:5000/uploads/${diff.diff_image_path.split('uploads\\')[1]?.replace(/\\/g, '/')}`} alt="Diff Map" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="%23999">Image not found</text></svg>'; }} />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"><Search className="w-8 h-8 text-white drop-shadow-lg" /></div>
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full min-h-[200px] text-slate-500">No Differences Detected</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}
                </motion.div>
            )}

            {/* FULLSCREEN IMAGE MODAL */}
            <AnimatePresence>
                {selectedImage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSelectedImage(null)} />
                        
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-7xl h-full flex flex-col items-center justify-center pointer-events-none">
                            <div className="w-full flex justify-between items-center p-4 bg-black/50 border border-white/10 rounded-t-2xl backdrop-blur-sm pointer-events-auto">
                                <h3 className="text-lg font-bold text-white">{selectedImage.title}</h3>
                                <button onClick={() => setSelectedImage(null)} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="w-full flex-1 overflow-auto bg-black border-x border-b border-white/10 rounded-b-2xl pointer-events-auto flex items-center justify-center p-4">
                                <img src={selectedImage.src} alt={selectedImage.title} className="max-w-full h-auto object-contain border border-white/5 rounded-xl shadow-2xl" />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default VisualResults;
