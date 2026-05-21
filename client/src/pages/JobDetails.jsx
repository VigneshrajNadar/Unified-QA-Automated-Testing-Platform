import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Monitor, XCircle, CheckCircle2, RefreshCw, AlertCircle, Camera, Video, MonitorPlay } from 'lucide-react';
import api, { SERVER_URL } from '../api';

const JobDetails = () => {
    const { id } = useParams();
    const [job, setJob] = useState(null);

    useEffect(() => {
        fetchJob();
        const interval = setInterval(fetchJob, 3000);
        return () => clearInterval(interval);
    }, [id]);

    const fetchJob = async () => {
        try {
            const res = await api.get(`/selenium/job/${id}`);
            setJob(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusStyles = (status) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('pass') || s.includes('success')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        if (s.includes('fail') || s.includes('error')) return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
        if (s.includes('run') || s.includes('progress')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30 animate-pulse';
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    };

    const getStatusIcon = (status) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('pass') || s.includes('success')) return <CheckCircle2 className="w-4 h-4" />;
        if (s.includes('fail') || s.includes('error')) return <XCircle className="w-4 h-4" />;
        return <RefreshCw className="w-4 h-4" />;
    };

    if (!job) return (
        <div className="flex flex-col justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
            <div className="text-purple-400 font-mono text-sm">Fetching Job Details...</div>
        </div>
    );

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[50px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                <div className="z-10 flex items-center gap-4">
                    <Link to="/selenium" className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/5"><ArrowLeft className="w-5 h-5" /></Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-white flex items-center gap-2">
                                <MonitorPlay className="w-6 h-6 text-purple-400" /> Job #{job.job_id}
                            </h1>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(job.status)}`}>
                                {getStatusIcon(job.status)}
                                {job.status}
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 mt-1 font-mono">Started: {new Date(job.created_at).toLocaleString()}</p>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {job.executions.map((exec, index) => (
                        <motion.div 
                            key={exec.execution_id} 
                            initial={{ opacity: 0, scale: 0.95 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            transition={{ delay: index * 0.1 }}
                            className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl overflow-hidden flex flex-col group hover:border-white/20 transition-colors"
                        >
                            {/* Card Header */}
                            <div className="p-5 border-b border-white/10 bg-white/5 flex justify-between items-center relative overflow-hidden">
                                {exec.status.toLowerCase().includes('run') && (
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500 animate-pulse" />
                                )}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-black/30 border border-white/5 flex items-center justify-center">
                                        <Monitor className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white capitalize">{exec.browser} Node</h3>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(exec.status)}`}>
                                    {getStatusIcon(exec.status)}
                                </span>
                            </div>

                            {/* Details */}
                            <div className="p-5 flex-1 space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Session ID</span>
                                    <span className="text-xs font-mono text-slate-300 bg-black/30 px-2 py-1 rounded">{exec.session_id || 'Pending'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Duration</span>
                                    <span className="text-xs font-mono text-cyan-400 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {exec.start_time && exec.end_time 
                                            ? `${((new Date(exec.end_time) - new Date(exec.start_time)) / 1000).toFixed(1)}s` 
                                            : 'Running...'}
                                    </span>
                                </div>

                                {exec.error_message && (
                                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                                        <div className="flex items-center gap-1.5 font-bold mb-1"><AlertCircle className="w-3.5 h-3.5"/> Error Details</div>
                                        <div className="font-mono break-words leading-relaxed">{exec.error_message}</div>
                                    </div>
                                )}
                            </div>

                            {/* Artifacts */}
                            <div className="p-5 border-t border-white/10 bg-black/20">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Test Artifacts</h4>
                                {exec.video_path ? (
                                    <div className="flex flex-wrap gap-2">
                                        {exec.video_path.endsWith('.png') ? (
                                            <a href={`${SERVER_URL}${exec.video_path}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold rounded-xl transition-colors border border-blue-500/20">
                                                <Camera className="w-4 h-4" /> View Screenshot
                                            </a>
                                        ) : (
                                            <a href={`${SERVER_URL}${exec.video_path}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-bold rounded-xl transition-colors border border-purple-500/20">
                                                <Video className="w-4 h-4" /> View Video
                                            </a>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 bg-white/5 border border-white/5 rounded-xl border-dashed">
                                        <span className="text-xs text-slate-500 italic">No artifacts available yet</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default JobDetails;
