import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Play, Square, Pause, Save, Plus, FileText, Bug, Lightbulb, HelpCircle, Clock, Bot, Code, Database } from 'lucide-react';
import api from '../api';

const Exploratory = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [sessions, setSessions] = useState([]);
    
    // Active Session State
    const [activeSession, setActiveSession] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [noteContent, setNoteContent] = useState('');
    const [noteType, setNoteType] = useState('Note');
    
    // AI Copilot State
    const [copilotExpanded, setCopilotExpanded] = useState(false);
    const [capturedMetadata, setCapturedMetadata] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // New Session State
    const [showNewModal, setShowNewModal] = useState(false);
    const [charter, setCharter] = useState('');

    useEffect(() => {
        api.get('/projects').then(res => {
            setProjects(res.data);
            if (res.data.length > 0) setSelectedProject(res.data[0].project_id);
        });
    }, []);

    useEffect(() => {
        if (selectedProject) fetchSessions();
    }, [selectedProject]);

    useEffect(() => {
        let interval;
        if (activeSession && activeSession.status === 'Active') {
            interval = setInterval(() => {
                const elapsed = Math.floor((new Date() - new Date(activeSession.start_time)) / 1000);
                setElapsedTime(elapsed);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeSession]);

    const fetchSessions = async () => {
        try {
            const res = await api.get(`/exploratory/${selectedProject}`);
            setSessions(res.data);
            const active = res.data.find(s => s.status === 'Active');
            if (active) setActiveSession(active);
        } catch (err) {
            console.error(err);
        }
    };

    const handleStartSession = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/exploratory', { project_id: selectedProject, charter });
            setActiveSession(res.data);
            setShowNewModal(false);
            setCharter('');
            fetchSessions();
        } catch (err) {
            alert('Failed to start session');
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!noteContent.trim()) return;
        try {
            const res = await api.post(`/exploratory/${activeSession._id}/notes`, { content: noteContent, type: noteType });
            setActiveSession(res.data);
            setNoteContent('');
        } catch (err) {
            alert('Failed to add note');
        }
    };

    const handleEndSession = async () => {
        if (!window.confirm('End this exploratory session?')) return;
        try {
            await api.post(`/exploratory/${activeSession._id}/end`);
            setActiveSession(null);
            setCopilotExpanded(false);
            setCapturedMetadata(null);
            fetchSessions();
        } catch (err) {
            alert('Failed to end session');
        }
    };

    const handleCopilotAnalyze = () => {
        setIsAnalyzing(true);
        // Mocking DOM state and LocalStorage capture
        setTimeout(() => {
            setCapturedMetadata({
                dom_snapshot: '<html><body class="dark-mode"><div id="app">...</div></body></html>',
                local_storage: '{ "theme": "dark", "auth_token": "hidden" }',
                network_logs: '2 Failed Requests: POST /api/checkout (500)'
            });
            setIsAnalyzing(false);
            setCopilotExpanded(true);
            setNoteContent(`[AI Auto-Log] The user encountered an error. 
Metadata Snapshot attached. 
Network Error: POST /api/checkout returned 500.`);
            setNoteType('Bug');
        }, 1500);
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const getTypeIcon = (type) => {
        switch(type) {
            case 'Bug': return <Bug className="w-4 h-4 text-rose-400" />;
            case 'Idea': return <Lightbulb className="w-4 h-4 text-amber-400" />;
            case 'Question': return <HelpCircle className="w-4 h-4 text-blue-400" />;
            default: return <FileText className="w-4 h-4 text-emerald-400" />;
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                        <Compass className="w-8 h-8 text-indigo-400" />
                        Exploratory Testing
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Session-based testing for creative and unscripted exploration.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 appearance-none min-w-[200px]">
                        <option value="" disabled>Select Project</option>
                        {projects.map(p => <option key={p.project_id} value={p.project_id} className="bg-[#0D1424]">{p.name}</option>)}
                    </select>
                    <button onClick={() => setShowNewModal(true)} disabled={!!activeSession} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed">
                        <Play className="w-4 h-4" /> New Session
                    </button>
                </div>
            </div>

            {activeSession && (
                <div className="bg-[#0D1424] border-2 border-indigo-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(99,102,241,0.1)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="flex h-2.5 w-2.5 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                                </span>
                                <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Active Session</span>
                            </div>
                            <h2 className="text-xl font-bold text-white">{activeSession.charter}</h2>
                        </div>
                        <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                            <Clock className="w-5 h-5 text-indigo-400" />
                            <span className="font-mono text-xl font-bold text-white tracking-widest">{formatTime(elapsedTime)}</span>
                            <div className="w-px h-6 bg-white/10 mx-2"></div>
                            <button onClick={handleEndSession} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors border border-rose-500/20" title="End Session">
                                <Square className="w-4 h-4 fill-current" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 border-r border-white/10 pr-6">
                            <form onSubmit={handleAddNote} className="space-y-4">
                                <h3 className="text-sm font-bold text-white mb-2">Log Observation</h3>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Type</label>
                                    <div className="flex gap-2">
                                        {['Note', 'Bug', 'Idea', 'Question'].map(t => (
                                            <button key={t} type="button" onClick={() => setNoteType(t)} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${noteType === t ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                                                {getTypeIcon(t)} <span className="hidden sm:inline">{t}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Details</label>
                                    <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)} required rows={4} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors resize-none placeholder-slate-600" placeholder="What did you observe?"></textarea>
                                </div>
                                {capturedMetadata && (
                                    <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl text-xs space-y-2">
                                        <div className="font-bold text-indigo-400 flex items-center gap-1.5"><Database className="w-3.5 h-3.5"/> Attached Metadata</div>
                                        <div className="text-slate-400 truncate"><span className="text-white font-mono">DOM:</span> {capturedMetadata.dom_snapshot}</div>
                                        <div className="text-slate-400"><span className="text-white font-mono">Network:</span> {capturedMetadata.network_logs}</div>
                                    </div>
                                )}
                                <button type="submit" className="w-full py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 text-indigo-300 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
                                    <Plus className="w-4 h-4" /> Save Log
                                </button>
                            </form>
                        </div>
                        
                        <div className="lg:col-span-2">
                            <h3 className="text-sm font-bold text-white mb-4">Session Log</h3>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {activeSession.notes && activeSession.notes.slice().reverse().map(note => (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={note._id} className="p-4 bg-black/40 border border-white/5 rounded-xl flex gap-4">
                                        <div className="mt-1">{getTypeIcon(note.type)}</div>
                                        <div>
                                            <div className="text-sm text-white mb-1">{note.content}</div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                {new Date(note.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                {(!activeSession.notes || activeSession.notes.length === 0) && (
                                    <div className="text-center py-8 text-slate-500 text-sm">No observations logged yet.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.filter(s => s.status === 'Completed').map(session => (
                    <div key={session._id} className="bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-white font-bold truncate pr-2" title={session.charter}>{session.charter}</h3>
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0">
                                {session.duration_minutes} min
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400 mb-6">
                            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-500" /> {new Date(session.start_time).toLocaleDateString()}</div>
                            <div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-500" /> {session.notes?.length || 0} Logs</div>
                        </div>
                        
                        <div className="flex gap-2">
                            {['Bug', 'Idea'].map(type => {
                                const count = session.notes?.filter(n => n.type === type).length || 0;
                                if (count === 0) return null;
                                return (
                                    <div key={type} className="flex items-center gap-1 text-xs font-bold text-slate-300 bg-black/40 px-2 py-1 rounded-md border border-white/5">
                                        {getTypeIcon(type)} {count}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Copilot Floating Widget */}
            {activeSession && (
                <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
                    <AnimatePresence>
                        {copilotExpanded && (
                            <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-[#0D1424] border border-indigo-500/30 rounded-2xl shadow-2xl p-4 w-72 pointer-events-auto">
                                <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                                    <Bot className="w-5 h-5 text-indigo-400" />
                                    <span className="font-bold text-white text-sm">Exploratory Copilot</span>
                                </div>
                                <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                                    I am analyzing your session. Click the button below to capture the current DOM and network state automatically.
                                </p>
                                <button 
                                    onClick={handleCopilotAnalyze} 
                                    disabled={isAnalyzing}
                                    className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50"
                                >
                                    {isAnalyzing ? (
                                        <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing State...</>
                                    ) : (
                                        <><Code className="w-3.5 h-3.5" /> Capture State & Log Defect</>
                                    )}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button 
                        onClick={() => setCopilotExpanded(!copilotExpanded)}
                        className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center text-white hover:scale-110 transition-transform pointer-events-auto border-2 border-indigo-400"
                    >
                        <Bot className="w-6 h-6" />
                    </button>
                </div>
            )}

            {/* New Session Modal */}
            <AnimatePresence>
                {showNewModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNewModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-[#0D1424] border border-white/10 rounded-3xl shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Play className="w-5 h-5 text-indigo-400" /> Start Exploratory Session</h3>
                            </div>
                            <form onSubmit={handleStartSession} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Session Charter / Mission</label>
                                    <input required type="text" value={charter} onChange={e => setCharter(e.target.value)} placeholder="e.g. Explore the new checkout flow for edge cases" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors" />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowNewModal(false)} className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold hover:bg-white/10 transition-colors">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-bold hover:from-indigo-400 hover:to-purple-400 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)]">Start Testing</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Exploratory;
