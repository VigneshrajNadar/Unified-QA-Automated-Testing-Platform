import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, FileText, Lock, Globe, ChevronRight } from 'lucide-react';
import api from '../api';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/audit');
            // If DB is empty, seed demo data then refetch
            if (res.data.length === 0) {
                await api.post('/audit/seed-demo');
                const seeded = await api.get('/audit');
                setLogs(seeded.data);
            } else {
                setLogs(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch audit logs', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(l => 
        l.action.toLowerCase().includes(search.toLowerCase()) || 
        l.entity.toLowerCase().includes(search.toLowerCase()) ||
        (l.details && l.details.toLowerCase().includes(search.toLowerCase()))
    );

    const getActionColor = (action) => {
        if (action.includes('Delete') || action.includes('Failed')) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
        if (action.includes('Update') || action.includes('Edit')) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        if (action.includes('Create') || action.includes('Add')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/10 blur-[50px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                <div className="z-10 w-full flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-slate-500/20 text-slate-400 text-xs font-black uppercase tracking-widest rounded-lg border border-slate-500/30 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> SOC2 / ISO 27001</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            <Shield className="w-8 h-8 text-slate-400" /> Compliance Audit Log
                        </h1>
                        <p className="text-sm text-slate-400 mt-2 max-w-xl">Immutable cryptographic ledger of all critical system events, access requests, and state changes for regulatory compliance.</p>
                    </div>
                    
                    <button onClick={fetchLogs} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-sm font-bold transition-colors">
                        Refresh Ledger
                    </button>
                </div>
            </motion.div>

            <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <input 
                    type="text" 
                    placeholder="Search by action, entity, or details..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    className="w-full px-4 py-3 bg-[#0D1424] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-slate-500/50 transition-colors mb-6"
                />

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02]">
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap"><Clock className="inline w-3.5 h-3.5 mr-1"/> Timestamp</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Action / Entity</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Details / Payload</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap"><Globe className="inline w-3.5 h-3.5 mr-1"/> Source IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                            {loading ? (
                                <tr><td colSpan="4" className="p-8 text-center text-slate-500">Decrypting ledger...</td></tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr><td colSpan="4" className="p-8 text-center text-slate-500">No matching audit records found.</td></tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log._id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 font-mono text-xs whitespace-nowrap text-slate-400">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </div>
                                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5 text-slate-500" /> {log.entity}
                                                {log.entity_id && <span className="text-slate-500 font-mono">[{log.entity_id.substring(0,8)}...]</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 hidden md:table-cell text-xs font-mono text-slate-400 max-w-sm truncate">
                                            {log.details || '—'}
                                        </td>
                                        <td className="p-4 font-mono text-xs text-slate-500 whitespace-nowrap flex items-center gap-2">
                                            {log.ip_address}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
