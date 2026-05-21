import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { FolderKanban, FileSpreadsheet, PlaySquare, Bug, Plus, ArrowRight } from 'lucide-react';
import api from '../api';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalProjects: 0, totalTestCases: 0, totalRuns: 0, totalDefects: 0, openDefects: 0,
        defectsBySeverity: [], testCasesByPriority: [], recentRuns: []
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/stats');
                setStats(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, []);

    const PIE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];
    const BAR_COLOR = '#06b6d4'; // cyan-500

    const statCards = [
        { label: 'Total Projects', value: stats.totalProjects, icon: FolderKanban, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { label: 'Test Cases', value: stats.totalTestCases, icon: FileSpreadsheet, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        { label: 'Test Runs', value: stats.totalRuns, icon: PlaySquare, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
        { label: 'Open Defects', value: stats.openDefects, icon: Bug, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
    ];

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Dashboard Overview</h1>
                    <p className="text-sm text-slate-400 mt-1">High-level metrics and recent activity for your QA Platform.</p>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group"
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} blur-[50px] rounded-full -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50`} />
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-black text-white">{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.border} border`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
                >
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Bug className="w-5 h-5 text-rose-400" /> Defects by Severity
                    </h3>
                    {stats.defectsBySeverity?.length > 0 ? (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.defectsBySeverity}
                                        cx="50%" cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        innerRadius={60}
                                        stroke="#0B0F19"
                                        strokeWidth={4}
                                        dataKey="value"
                                    >
                                        {stats.defectsBySeverity?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#0D1424', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                                    <Legend wrapperStyle={{ paddingTop: '20px', color: '#94a3b8' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center border border-white/5 rounded-xl bg-white/5 border-dashed">
                            <p className="text-sm font-medium text-slate-500">No defect data available</p>
                        </div>
                    )}
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
                >
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Test Cases by Priority
                    </h3>
                    {stats.testCasesByPriority?.length > 0 ? (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.testCasesByPriority} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                                    <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ backgroundColor: '#0D1424', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                                    <Bar dataKey="value" fill={BAR_COLOR} radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center border border-white/5 rounded-xl bg-white/5 border-dashed">
                            <p className="text-sm font-medium text-slate-500">No test case data available</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
                >
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-2"><PlaySquare className="w-5 h-5 text-blue-400" /> Recent Test Runs</span>
                        <Link to="/test-runs" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></Link>
                    </h3>
                    
                    <div className="space-y-3">
                        {stats.recentRuns?.length > 0 ? (
                            stats.recentRuns.map((run, i) => (
                                <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between group">
                                    <div>
                                        <p className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">{run.name}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{run.project_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-slate-500">{new Date(run.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500 py-4 text-center border border-dashed border-white/5 rounded-xl">No recent test runs found.</p>
                        )}
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
                >
                    <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link 
                            to="/projects"
                            className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 transition-all border-cyan-500/20 hover:border-cyan-500/50 group"
                        >
                            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                                <Plus className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">New Project</span>
                        </Link>
                        
                        <Link 
                            to="/test-cases"
                            className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:border-white/20 group"
                        >
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform">
                                <FileSpreadsheet className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">New Test Case</span>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
