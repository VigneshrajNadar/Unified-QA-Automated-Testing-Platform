import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Server, ShieldCheck, Database, HardDrive, Cpu, ShieldAlert, List, Clock } from 'lucide-react';
import api from '../api';

const SystemDashboard = () => {
    const [health, setHealth] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [healthRes, auditRes] = await Promise.all([
                api.get('/system/health'),
                api.get('/system/audit')
            ]);
            setHealth(healthRes.data);
            setAuditLogs(auditRes.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch system data:', err);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
    );

    const getActionColor = (action) => {
        if (action.includes('delete') || action.includes('remove')) return 'text-rose-400';
        if (action.includes('create') || action.includes('add')) return 'text-emerald-400';
        if (action.includes('update') || action.includes('edit')) return 'text-amber-400';
        return 'text-blue-400';
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                    <Server className="w-8 h-8 text-indigo-400" />
                    Global System Dashboard
                </h1>
                <p className="text-sm text-slate-400 mt-1">Admin view for system health, resources, and audit logs.</p>
            </div>

            {/* Health Stats */}
            {health && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0D1424] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Activity className="w-16 h-16 text-emerald-500" /></div>
                        <div className="flex items-center gap-3 mb-2 text-emerald-400"><Activity className="w-5 h-5" /><h3 className="font-bold text-sm uppercase tracking-widest">Status</h3></div>
                        <p className="text-3xl font-black text-white">{health.status}</p>
                    </div>
                    
                    <div className="bg-[#0D1424] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Clock className="w-16 h-16 text-cyan-500" /></div>
                        <div className="flex items-center gap-3 mb-2 text-cyan-400"><Clock className="w-5 h-5" /><h3 className="font-bold text-sm uppercase tracking-widest">Uptime</h3></div>
                        <p className="text-3xl font-black text-white">{(health.uptime / 3600).toFixed(1)} <span className="text-sm text-slate-400 font-medium">hrs</span></p>
                    </div>
                    
                    <div className="bg-[#0D1424] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Cpu className="w-16 h-16 text-amber-500" /></div>
                        <div className="flex items-center gap-3 mb-2 text-amber-400"><Cpu className="w-5 h-5" /><h3 className="font-bold text-sm uppercase tracking-widest">CPU</h3></div>
                        <p className="text-3xl font-black text-white">{health.cpu}</p>
                        <p className="text-xs font-medium text-slate-400 mt-1">{health.platform}</p>
                    </div>
                    
                    <div className="bg-[#0D1424] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><HardDrive className="w-16 h-16 text-purple-500" /></div>
                        <div className="flex items-center gap-3 mb-2 text-purple-400"><HardDrive className="w-5 h-5" /><h3 className="font-bold text-sm uppercase tracking-widest">Memory</h3></div>
                        <p className="text-3xl font-black text-white">{health.memory.percentage}%</p>
                        <div className="w-full bg-white/5 h-2 rounded-full mt-2 overflow-hidden">
                            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${health.memory.percentage}%` }}></div>
                        </div>
                        <p className="text-xs font-medium text-slate-400 mt-1">{health.memory.used} / {health.memory.total} MB</p>
                    </div>
                </div>
            )}

            {/* Audit Logs Table */}
            <div className="bg-[#0D1424] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/10 flex items-center gap-3 bg-white/[0.02]">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-white text-lg">System Audit Log</h3>
                    <span className="ml-auto px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-black text-slate-400 uppercase tracking-widest">Last 50 Events</span>
                </div>
                
                {auditLogs.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-sm">No audit logs found.</div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">Entity Type</th>
                                    <th className="px-6 py-4">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-slate-300">
                                {auditLogs.map(log => (
                                    <tr key={log._id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                                        <td className="px-6 py-4 font-bold text-white">{log.user_name || 'System'}</td>
                                        <td className={`px-6 py-4 font-bold ${getActionColor(log.action.toLowerCase())}`}>{log.action}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono text-slate-400">
                                                {log.entity_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-slate-500">{log.ip_address || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemDashboard;
