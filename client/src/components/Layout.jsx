import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    LayoutDashboard, FolderKanban, FileSpreadsheet, PlaySquare, 
    Bug, FileText, Brain, Camera, Webhook, Zap, Bot, 
    Cloud, Activity, ShoppingCart, ShieldAlert, Users, 
    Settings, LogOut, Menu, X, ShieldCheck
} from 'lucide-react';

import AnimatedBackground from './AnimatedBackground';

const Layout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navLinks = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Projects', path: '/projects', icon: FolderKanban },
        { name: 'Test Cases', path: '/test-cases', icon: FileSpreadsheet },
        { name: 'Test Runs', path: '/test-runs', icon: PlaySquare },
        { name: 'Defects', path: '/defects', icon: Bug },
        { name: 'Requirements', path: '/requirements', icon: FileText },
        { name: 'AI Test Generator', path: '/ai-testgen', icon: Brain },
        { name: 'Visual Testing', path: '/visual-testing', icon: Camera },
        { name: 'API Testing', path: '/api-testing', icon: Webhook },
        { name: 'Performance', path: '/performance', icon: Zap },
        { name: 'Auto-Test', path: '/autotest', icon: Bot },
        { name: 'Selenium Cloud', path: '/selenium', icon: Cloud },
        { name: 'Web Monitor', path: '/monitor', icon: Activity },
        { name: 'E-Commerce Auto', path: '/ecommerce', icon: ShoppingCart },
        { name: 'Security Suite', path: '/security', icon: ShieldAlert },
    ];

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

    return (
        <div className="min-h-screen bg-[#060B14] flex relative overflow-hidden">
            <AnimatedBackground />

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0B0F19]/90 backdrop-blur-md border-b border-white/10 z-50 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-cyan-400" />
                    <span className="font-bold text-white">QA Platform</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300 p-2">
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0B0F19]/80 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                
                {/* Logo Area */}
                <div className="hidden lg:flex items-center gap-3 p-6 border-b border-white/10">
                    <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                        <ShieldCheck className="w-6 h-6 text-cyan-400" />
                    </div>
                    <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        QA Tool
                    </span>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 space-y-1 mt-16 lg:mt-0">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                isActive(link.path) 
                                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <link.icon className={`w-4 h-4 ${isActive(link.path) ? 'text-cyan-400' : 'text-slate-500'}`} />
                            {link.name}
                        </Link>
                    ))}

                    <div className="my-4 border-t border-white/10 mx-2"></div>
                    
                    {user?.role?.toLowerCase() === 'admin' && (
                        <Link
                            to="/users"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                isActive('/users') ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <Users className="w-4 h-4 text-slate-500" /> Manage Users
                        </Link>
                    )}
                    
                    <Link
                        to="/settings"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            isActive('/settings') ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                    >
                        <Settings className="w-4 h-4 text-slate-500" /> Settings
                    </Link>
                </div>

                {/* Sidebar Footer (User Info & Logout) */}
                <div className="p-4 border-t border-white/10 bg-white/5">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white capitalize">{user?.name || 'User'}</span>
                            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">{user?.role || 'Tester'}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                    </div>
                    
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold hover:bg-rose-500/20 transition-all shadow-[0_0_15px_rgba(244,63,94,0.1)]"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden pt-16 lg:pt-0 z-10">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
            
            {/* Mobile overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
};

export default Layout;
