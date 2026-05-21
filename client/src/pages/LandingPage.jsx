import { motion, AnimatePresence } from 'framer-motion';
import { 
    Brain, Zap, ShieldCheck, PieChart, Landmark, 
    ArrowRight, ChevronRight, Activity, Wallet, 
    CheckCircle2, AlertCircle, Sparkles, Plus, Minus,
    Cpu, Video, Lock, Search, FileText, Smartphone,
    Eye, HelpCircle, Layers, ScanFace, Database,
    TrendingUp, ShieldAlert, BarChart3, Globe,
    LayoutDashboard, Users, Clock, ShoppingCart,
    ArrowUpRight, Target, Network, Fingerprint, Server, Monitor,
    FileSpreadsheet, PlaySquare, Bug, Bot
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- UTILITY COMPONENTS (LOANWISE STYLE) ---

function RevealOnScroll({ children, delay = 0 }) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); 
                }
            },
            { threshold: 0.08 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className={`transition-all duration-500 ease-out transform ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`} style={{ transitionDelay: `${delay}ms` }}>
            {children}
        </div>
    );
}

function Stat({ number, label, sublabel, delay = 0 }) {
    return (
        <RevealOnScroll delay={delay}>
            <div className="p-6 group relative h-full flex flex-col justify-center glass-panel border border-white/0 hover:border-white/5 transition-all duration-700 bg-white/[0.01] rounded-3xl">
                <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/[0.02] transition-all duration-700 rounded-3xl" />
                <div className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tighter italic group-hover:text-cyan-400 transition-colors duration-500 leading-none">{number}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-[0.25em] font-black mb-1 group-hover:text-slate-300 transition-colors uppercase">{label}</div>
                <div className="text-[8px] text-emerald-500/60 uppercase tracking-widest font-black opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-2 group-hover:translate-y-0">{sublabel}</div>
            </div>
        </RevealOnScroll>
    );
}

function DefenseCard({ icon: Icon, step, title, desc, delay }) {
    return (
        <RevealOnScroll delay={delay}>
            <div className="glass-panel border border-white/5 rounded-[32px] p-8 hover:border-cyan-500/30 transition-all hover:shadow-[0_20px_50px_rgba(6,182,212,0.1)] group h-full flex flex-col relative overflow-hidden">
                <div className="absolute -top-4 -right-4 text-7xl font-black text-white/[0.02] group-hover:text-cyan-500/[0.05] transition-colors italic pointer-events-none select-none">{step}</div>
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/5 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-colors shadow-2xl">
                    <Icon className="w-7 h-7 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </div>
                <h3 className="text-xl font-black mb-3 group-hover:text-cyan-400 transition-colors uppercase italic tracking-tight">{title}</h3>
                <p className="text-slate-400 font-medium leading-relaxed text-xs opacity-80 group-hover:opacity-100 transition-opacity">{desc}</p>
            </div>
        </RevealOnScroll>
    );
}

function MLVisualizer() {
    return (
        <div className="relative h-64 md:h-80 w-full glass-panel rounded-[32px] border border-white/5 flex items-center justify-between px-8 md:px-20 overflow-hidden shadow-2xl group">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c12] via-transparent to-[#0a0c12] z-20 pointer-events-none" />

            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-10" 
                 style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 -translate-y-1/2 z-0" />
            
            <motion.div 
                animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 h-1 w-32 bg-gradient-to-r from-transparent via-cyan-400 to-transparent -translate-y-1/2 z-0"
            />

            {[
                { icon: FileText, label: "Code Commit", color: "cyan" },
                { icon: ShieldCheck, label: "Environment Spin-up", color: "indigo" },
                { icon: Brain, label: "AI Test Gen", color: "blue" },
                { icon: Zap, label: "Parallel Execution", color: "emerald" }
            ].map((node, i) => (
                <div key={i} className="relative z-30 flex flex-col items-center gap-3 group/node translate-y-2">
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#0d0f1a] flex items-center justify-center border border-white/5 shadow-3xl group-hover/node:border-${node.color}-500 group-hover/node:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-700 relative overflow-hidden group/box`}>
                        <div className="absolute inset-0 bg-white/[0.02] group-hover/box:bg-white/[0.05] transition-all" />
                        {i === 2 && <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />}
                        <node.icon className={`w-7 h-7 md:w-8 md:h-8 text-slate-500 group-hover/node:text-white transition-all duration-500 scale-100 group-hover/node:scale-110`} />
                        
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                    </div>
                    <span className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest group-hover/node:text-white transition-colors uppercase">{node.label}</span>
                </div>
            ))}
        </div>
    );
}

function AtmosphericBlob({ color, size, top, left, delay }) {
    return (
        <div
            className="absolute pointer-events-none -z-10 blur-[120px] rounded-full opacity-[0.07]"
            style={{
                backgroundColor: color,
                width: size,
                height: size,
                top: top,
                left: left,
                animation: `blobFloat 20s ease-in-out ${delay}s infinite`,
                willChange: 'transform',
            }}
        />
    );
}

function BackgroundParticles() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-cyan-400/20 rounded-full"
                    initial={{ x: Math.random() * 100 + "%", y: Math.random() * 100 + "%", opacity: Math.random() * 0.5 }}
                    animate={{ y: [null, Math.random() * -100 - 50 + "%"], opacity: [0, 0.4, 0] }}
                    transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear", delay: Math.random() * 10 }}
                />
            ))}
        </div>
    );
}

function FAQItem({ question, answer, delay }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <RevealOnScroll delay={delay}>
            <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-colors mb-4">
                <button 
                    onClick={() => setIsOpen(!isOpen)} 
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none group"
                >
                    <span className="font-bold text-white group-hover:text-cyan-400 transition-colors">{question}</span>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-cyan-500/20 transition-colors">
                        {isOpen ? <Minus className="w-4 h-4 text-cyan-400" /> : <Plus className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />}
                    </div>
                </button>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-6 pb-5 text-sm text-slate-400 leading-relaxed"
                        >
                            <div className="pt-2 border-t border-white/5">
                                {answer}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </RevealOnScroll>
    );
}

// --- MAIN PAGE ---

export default function LandingPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalProjects: 0, totalRuns: 0, totalTestCases: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Using raw axios to bypass the global interceptor's redirect on 401
                const res = await axios.get('http://localhost:5000/api/dashboard/stats');
                setStats(res.data);
            } catch (err) {}
        };
        fetchStats();
    }, []);

    return (
        <div className="bg-[#0a0c12] min-h-screen text-white selection:bg-cyan-500/30 font-sans overflow-x-hidden relative">
            
            {/* Atmospheric Backdrop */}
            <div className="fixed inset-0 pointer-events-none -z-20">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0c17] via-[#0d101a] to-[#0a0c12]" />
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none animate-grid-slow" 
                     style={{ 
                         backgroundImage: `linear-gradient(to right, #ffffff1a 1px, transparent 1px), linear-gradient(to bottom, #ffffff1a 1px, transparent 1px)`,
                         backgroundSize: '60px 60px',
                     }} 
                />
                <BackgroundParticles />
                <AtmosphericBlob color="#0891b2" size="60vw" top="-10%" left="-10%" delay={0} />
                <AtmosphericBlob color="#4f46e5" size="50vw" top="40%" left="60%" delay={5} />
                <AtmosphericBlob color="#10b981" size="40vw" top="80%" left="-5%" delay={2} />
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-[#0a0c12]/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300 py-4">
                <div className="max-w-7xl mx-auto px-6 md:px-8 flex justify-between items-center">
                    <Link to="/" className="text-xl md:text-2xl font-black italic tracking-tighter text-white flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] group-hover:shadow-[0_0_25px_rgba(6,182,212,0.8)] transition-all">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        QA <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Tool</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/login')} className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors">
                            Log In
                        </button>
                        <button onClick={() => navigate('/signup')} className="glass-button px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                            Launch Dashboard
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center">
                    <RevealOnScroll delay={100}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-cyan-500/30 mb-8 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse-fast" />
                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-cyan-100">Unified Automation Hub v2.0</span>
                        </div>
                    </RevealOnScroll>

                    <RevealOnScroll delay={200}>
                        <h1 className="text-5xl md:text-7xl lg:text-[7rem] font-black text-white leading-[0.9] tracking-tighter mb-8 italic uppercase flex flex-col gap-2">
                            <span>TEST WITH</span>
                            <span className="glow-text">ABSOLUTE ASSURANCE.</span>
                        </h1>
                    </RevealOnScroll>

                    <RevealOnScroll delay={300}>
                        <p className="text-slate-400 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed font-medium mb-12">
                            The world's most advanced automated testing platform. Unify UI regression, API testing, and performance stress-testing into a single cloud-native engine.
                        </p>
                    </RevealOnScroll>

                    <RevealOnScroll delay={400}>
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <button onClick={() => navigate('/signup')} className="relative group px-8 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <span className="relative flex items-center gap-3 group-hover:text-white transition-colors duration-300">
                                    <ShieldCheck className="w-4 h-4" /> Start Simulation
                                </span>
                            </button>
                            
                            <button onClick={() => navigate('/login')} className="group px-8 py-4 rounded-2xl glass-panel text-white font-bold uppercase tracking-widest text-xs flex items-center gap-3 hover:border-white/20 transition-all">
                                Go to Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* Stats Strip */}
            <section className="border-y border-white/5 bg-[#05060a] relative z-20">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5 border-x border-white/5">
                    <Stat number={stats.totalRuns || "42K+"} label="Test Executions" sublabel="Live Verified" delay={0} />
                    <Stat number={stats.totalProjects || "120+"} label="Active Suites" sublabel="Global Workspaces" delay={100} />
                    <Stat number={stats.totalTestCases || "1.2M+"} label="Monitored Assertions" sublabel="Automated Checks" delay={200} />
                    <Stat number="99.9%" label="Uptime Monitor" sublabel="High Availability" delay={300} />
                </div>
            </section>

            {/* Enterprise Stack Banner */}
            <section className="py-16 relative overflow-hidden bg-[#05060a] border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-4 mb-12">
                            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-white/20" />
                            <p className="text-[10px] text-slate-400 uppercase tracking-[0.5em] font-black">Supported Execution Engines</p>
                            <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-white/20" />
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24">
                             {[
                                { i: Server, t: "Selenium Cloud", c: "text-emerald-400" },
                                { i: Activity, t: "k6 Performance", c: "text-purple-400" },
                                { i: Brain, t: "AI Test Gen", c: "text-blue-400" },
                                { i: Database, t: "MongoDB Atlas", c: "text-rose-400" },
                                { i: Globe, t: "Web Monitor", c: "text-cyan-400" }
                             ].map((tech, i) => (
                                <RevealOnScroll key={i} delay={i * 100}>
                                    <div className="flex flex-col items-center gap-4 group cursor-default">
                                        <div className="relative">
                                            <div className={`absolute inset-0 blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 ${tech.c.replace('text', 'bg')}`} />
                                            <tech.i className={`w-8 h-8 text-slate-400 group-hover:text-white transition-all duration-500 relative z-10 transform group-hover:scale-110`} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-600 group-hover:text-white uppercase tracking-widest transition-colors duration-500">{tech.t}</span>
                                    </div>
                                </RevealOnScroll>
                             ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Visualizer Engine */}
            <section className="py-24 px-6 md:px-12 relative z-20">
                <div className="max-w-7xl mx-auto">
                    <RevealOnScroll>
                        <div className="mb-16">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">
                                <Activity className="w-3 h-3 text-emerald-400" /> Execution Engine
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tight text-white max-w-2xl leading-none">
                                Inside the <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Pipeline Pipeline</span>
                            </h2>
                        </div>
                    </RevealOnScroll>
                    
                    <RevealOnScroll delay={200}>
                        <MLVisualizer />
                    </RevealOnScroll>
                </div>
            </section>

            {/* Defense Architecture Grid */}
            <section className="py-24 px-6 md:px-12 relative z-20">
                <div className="max-w-7xl mx-auto">
                    <RevealOnScroll>
                        <div className="mb-16">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">
                                <ShieldCheck className="w-3 h-3 text-rose-400" /> Platform Architecture
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tight text-white max-w-2xl leading-none">
                                Unbreakable <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-500">Defense Architecture</span>
                            </h2>
                        </div>
                    </RevealOnScroll>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <DefenseCard 
                            icon={Network} step="01"
                            title="Visual Regression"
                            desc="Pixel-perfect diff overlays that detect UI shifts before they reach production."
                            delay={0}
                        />
                        <DefenseCard 
                            icon={Activity} step="02"
                            title="Performance Engine"
                            desc="High-concurrency load testing to identify bottlenecks and latency spikes under stress."
                            delay={100}
                        />
                        <DefenseCard 
                            icon={Lock} step="03"
                            title="Security Scans"
                            desc="Integrated DAST/SAST identifying vulnerabilities, open ports, and XSS risks automatically."
                            delay={200}
                        />
                        <DefenseCard 
                            icon={Monitor} step="04"
                            title="Uptime Monitoring"
                            desc="24/7 endpoint polling guaranteeing 99.99% availability and swift incident alerting."
                            delay={300}
                        />
                    </div>
                </div>
            </section>

            {/* Detailed Features Section */}
            <section className="py-24 px-6 md:px-12 relative z-20 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
                
                <div className="max-w-7xl mx-auto space-y-32">
                    
                    {/* Feature 1 */}
                    <RevealOnScroll>
                        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
                            <div className="flex-1 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-400">
                                    <Brain className="w-3 h-3" /> AI Test Generator
                                </div>
                                <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white leading-none">
                                    Code that <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">tests itself.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                                    Paste your React components or raw functions into our AI engine. In seconds, it analyzes the syntax, maps out edge cases, and generates highly robust, production-ready Jest and RTL test suites. Stop writing boilerplate and start focusing on application logic.
                                </p>
                                <ul className="space-y-3 pt-4">
                                    {['Understands React Hooks & Context', 'Generates Mock Data Automatically', 'Aims for 100% Branch Coverage'].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-300">
                                            <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-3 h-3 text-blue-400" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex-1 w-full relative">
                                <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" />
                                <div className="relative glass-panel border border-white/10 rounded-3xl p-6 shadow-2xl">
                                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/5">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                                            <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                                            <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                                        </div>
                                        <div className="text-[10px] font-mono text-slate-500 ml-2">ai-test-generator.js</div>
                                    </div>
                                    <pre className="text-xs font-mono text-blue-300 overflow-hidden">
                                        <code className="block mb-2 text-slate-400">// Generating assertions...</code>
                                        <code className="block mb-1"><span className="text-pink-400">expect</span>(screen.<span className="text-emerald-400">getByRole</span>('button')).toBeInTheDocument();</code>
                                        <code className="block mb-1"><span className="text-pink-400">fireEvent</span>.click(submitBtn);</code>
                                        <code className="block mb-1"><span className="text-pink-400">await</span> waitFor(() =&gt; &#123;</code>
                                        <code className="block mb-1 pl-4"><span className="text-pink-400">expect</span>(mockFn).<span className="text-emerald-400">toHaveBeenCalledWith</span>(data);</code>
                                        <code className="block">&#125;);</code>
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Feature 2 */}
                    <RevealOnScroll>
                        <div className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-20">
                            <div className="flex-1 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest text-rose-400">
                                    <ShoppingCart className="w-3 h-3" /> E-Commerce Auto
                                </div>
                                <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white leading-none">
                                    Automate the <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500">Checkout.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                                    Ensure your revenue streams never break. Our E-Commerce automation suite runs simulated user journeys from product selection to cart validation and final checkout, identifying UI blocks before your customers do.
                                </p>
                                <ul className="space-y-3 pt-4">
                                    {['Cart State Validation', 'Payment Gateway Mocking', 'Inventory Sync Checks'].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-300">
                                            <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-3 h-3 text-rose-400" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex-1 w-full relative">
                                <div className="absolute inset-0 bg-rose-500/20 blur-[100px] rounded-full" />
                                <div className="relative grid grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map((step, idx) => (
                                        <div key={idx} className="glass-panel border border-white/10 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 text-rose-400 font-black italic">0{step}</div>
                                            <div className="text-xs font-bold text-white mb-1">
                                                {idx === 0 ? 'Add to Cart' : idx === 1 ? 'Apply Discount' : idx === 2 ? 'Form Validation' : 'Confirm Order'}
                                            </div>
                                            <div className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase">Passed</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Feature 3 - API */}
                    <RevealOnScroll>
                        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
                            <div className="flex-1 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                    <Globe className="w-3 h-3" /> API Testing
                                </div>
                                <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white leading-none">
                                    Secure the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Endpoints.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                                    Build, execute, and validate complex API collections. Verify status codes, assert JSON response structures, and measure latency across all your microservices seamlessly.
                                </p>
                                <ul className="space-y-3 pt-4">
                                    {['JSON Schema Validation', 'Authentication Handlers', 'Latency Assertions'].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-300">
                                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex-1 w-full relative">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full" />
                                <div className="relative glass-panel border border-white/10 rounded-3xl p-6 shadow-2xl">
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5 text-sm font-mono text-emerald-400">
                                        <span>GET /api/v1/users</span>
                                        <span className="text-slate-400">200 OK - 124ms</span>
                                    </div>
                                    <pre className="text-xs font-mono text-slate-300 overflow-hidden">
                                        <code className="block">&#123;</code>
                                        <code className="block pl-4 text-slate-400">"status": <span className="text-emerald-400">"success"</span>,</code>
                                        <code className="block pl-4 text-slate-400">"data": [</code>
                                        <code className="block pl-8">&#123; <span className="text-blue-300">"id"</span>: <span className="text-amber-400">1</span>, <span className="text-blue-300">"role"</span>: <span className="text-emerald-400">"admin"</span> &#125;</code>
                                        <code className="block pl-4">]</code>
                                        <code className="block">&#125;</code>
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Feature 4 - Visual */}
                    <RevealOnScroll>
                        <div className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-20">
                            <div className="flex-1 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-black uppercase tracking-widest text-purple-400">
                                    <Eye className="w-3 h-3" /> Visual Testing
                                </div>
                                <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white leading-none">
                                    Pixel Perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500">Accuracy.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                                    Catch unwanted CSS changes before they hit production. Our engine captures baseline screenshots and performs pixel-by-pixel diffing on subsequent builds, highlighting any layout shifts.
                                </p>
                                <ul className="space-y-3 pt-4">
                                    {['Automated Image Diffing', 'Configurable Tolerance Thresholds', 'Side-by-Side Comparison'].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-300">
                                            <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-3 h-3 text-purple-400" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex-1 w-full relative">
                                <div className="absolute inset-0 bg-purple-500/20 blur-[100px] rounded-full" />
                                <div className="relative glass-panel border border-white/10 rounded-3xl p-6 shadow-2xl flex items-center justify-center h-48 bg-gradient-to-br from-black/40 to-transparent">
                                    <div className="relative w-full h-full border border-dashed border-white/10 rounded-xl flex items-center justify-center overflow-hidden group">
                                        <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="text-center">
                                            <Eye className="w-8 h-8 text-purple-400 mx-auto mb-2 opacity-50" />
                                            <span className="text-xs font-mono text-purple-300 tracking-widest uppercase">Diff Overlay Generator</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Feature 5 - Selenium */}
                    <RevealOnScroll>
                        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
                            <div className="flex-1 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest text-amber-400">
                                    <Server className="w-3 h-3" /> Selenium Cloud
                                </div>
                                <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white leading-none">
                                    Distributed <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Execution.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                                    Run thousands of End-to-End browser tests concurrently. Manage nodes, track execution status, and view deep analytics without managing your own Selenium infrastructure.
                                </p>
                            </div>
                            <div className="flex-1 w-full relative grid grid-cols-2 gap-4">
                                <div className="absolute inset-0 bg-amber-500/20 blur-[100px] rounded-full pointer-events-none" />
                                {[
                                    { t: 'Chrome Node', s: 'Active', c: 'text-emerald-400' },
                                    { t: 'Firefox Node', s: 'Active', c: 'text-emerald-400' },
                                    { t: 'Edge Node', s: 'Busy', c: 'text-amber-400' },
                                    { t: 'Safari Node', s: 'Offline', c: 'text-rose-400' }
                                ].map((node, i) => (
                                    <div key={i} className="relative glass-panel border border-white/10 rounded-2xl p-4 flex flex-col justify-center items-center">
                                        <Monitor className={`w-6 h-6 mb-2 ${node.c}`} />
                                        <div className="text-xs font-bold text-white mb-1">{node.t}</div>
                                        <div className={`text-[10px] font-mono tracking-widest uppercase ${node.c}`}>{node.s}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Feature 6 - Security */}
                    <RevealOnScroll>
                        <div className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-20">
                            <div className="flex-1 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest text-rose-400">
                                    <Lock className="w-3 h-3" /> Security Suite
                                </div>
                                <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white leading-none">
                                    Lock Down <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-red-600">Vulnerabilities.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                                    Integrate DAST (Dynamic Application Security Testing) directly into your CI pipeline. Automatically scan for XSS, SQLi, and open ports during every build to prevent deploying insecure code.
                                </p>
                            </div>
                            <div className="flex-1 w-full relative">
                                <div className="absolute inset-0 bg-rose-600/20 blur-[100px] rounded-full pointer-events-none" />
                                <div className="relative glass-panel border border-rose-500/20 rounded-3xl p-6 shadow-2xl">
                                    <div className="flex items-center gap-3 mb-6">
                                        <ShieldAlert className="w-8 h-8 text-rose-500" />
                                        <div>
                                            <div className="text-sm font-bold text-white">Vulnerability Found</div>
                                            <div className="text-[10px] text-rose-400 uppercase tracking-widest font-mono">Critical Severity</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex justify-between items-center">
                                            <span className="text-xs text-slate-300 font-mono">Cross-Site Scripting (XSS)</span>
                                            <span className="text-xs font-bold text-rose-500">FAILED</span>
                                        </div>
                                        <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex justify-between items-center">
                                            <span className="text-xs text-slate-300 font-mono">SQL Injection Check</span>
                                            <span className="text-xs font-bold text-emerald-500">PASSED</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Feature 7 - Performance */}
                    <RevealOnScroll>
                        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
                            <div className="flex-1 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black uppercase tracking-widest text-cyan-400">
                                    <Activity className="w-3 h-3" /> Performance
                                </div>
                                <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white leading-none">
                                    Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Scale.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                                    Simulate thousands of concurrent Virtual Users hitting your endpoints. Monitor response times, error rates, and throughput to ensure your app stays fast under heavy load.
                                </p>
                            </div>
                            <div className="flex-1 w-full relative h-48 glass-panel border border-white/10 rounded-3xl p-6 shadow-2xl flex items-end justify-between overflow-hidden">
                                <div className="absolute inset-0 bg-cyan-500/10 blur-[100px] pointer-events-none" />
                                {[40, 60, 30, 80, 50, 90, 70, 100].map((h, i) => (
                                    <motion.div 
                                        key={i} 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{ duration: 1.5, delay: i * 0.1 }}
                                        className="w-[8%] bg-gradient-to-t from-cyan-500/20 to-cyan-400 rounded-t-sm"
                                    />
                                ))}
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Feature 8 - Test Cases */}
                    <RevealOnScroll>
                        <div className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-20">
                            <div className="flex-1 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                    <FileSpreadsheet className="w-3 h-3" /> Test Cases
                                </div>
                                <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white leading-none">
                                    Centralize your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">Repository.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                                    Organize, version control, and manage all your manual and automated test cases in a single, searchable cloud repository. Say goodbye to scattered spreadsheets.
                                </p>
                            </div>
                            <div className="flex-1 w-full relative">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full" />
                                <div className="relative glass-panel border border-white/10 rounded-3xl p-6 shadow-2xl space-y-3">
                                    {[
                                        { title: 'Login Validation', status: 'Automated' },
                                        { title: 'Checkout Edge Case', status: 'Manual' },
                                        { title: 'API Rate Limiting', status: 'Automated' }
                                    ].map((tc, idx) => (
                                        <div key={idx} className="p-3 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-300">{tc.title}</span>
                                            <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded ${tc.status === 'Automated' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-500/20 text-slate-400'}`}>{tc.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Feature 9 - Test Runs */}
                    <RevealOnScroll>
                        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
                            <div className="flex-1 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                    <PlaySquare className="w-3 h-3" /> Test Runs
                                </div>
                                <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white leading-none">
                                    Execute with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">Precision.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                                    Group your cases into execution cycles. Track real-time progress, assign testers, and generate comprehensive PDF/Excel reports the moment a run finishes.
                                </p>
                            </div>
                            <div className="flex-1 w-full relative glass-panel border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center">
                                <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] pointer-events-none" />
                                <div className="w-32 h-32 rounded-full border-8 border-white/10 border-t-emerald-400 flex items-center justify-center animate-spin-slow">
                                    <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        <span className="text-xl font-black text-emerald-400">84%</span>
                                    </div>
                                </div>
                                <div className="mt-4 text-xs font-black text-slate-400 uppercase tracking-widest">Execution Progress</div>
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Feature 10 - Defects */}
                    <RevealOnScroll>
                        <div className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-20">
                            <div className="flex-1 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest text-rose-400">
                                    <Bug className="w-3 h-3" /> Defects
                                </div>
                                <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white leading-none">
                                    Squash bugs <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-500">Instantly.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                                    Log defects directly from failed test steps. Automatically attach screenshots, logs, and stack traces. Bi-directionally sync with JIRA, Linear, or GitHub Issues.
                                </p>
                            </div>
                            <div className="flex-1 w-full relative">
                                <div className="absolute inset-0 bg-rose-500/20 blur-[100px] rounded-full" />
                                <div className="relative grid grid-cols-2 gap-4">
                                    {[
                                        { id: 'BUG-104', state: 'Open', color: 'rose' },
                                        { id: 'BUG-103', state: 'In Progress', color: 'amber' },
                                        { id: 'BUG-102', state: 'In Review', color: 'blue' },
                                        { id: 'BUG-101', state: 'Resolved', color: 'emerald' }
                                    ].map((bug, i) => (
                                        <div key={i} className="glass-panel border border-white/10 rounded-2xl p-4 flex flex-col justify-center items-center">
                                            <Bug className={`w-6 h-6 mb-2 text-${bug.color}-400`} />
                                            <div className="text-xs font-bold text-white mb-1">{bug.id}</div>
                                            <div className={`text-[10px] font-mono tracking-widest uppercase text-${bug.color}-400`}>{bug.state}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Feature 11 - Requirements */}
                    <RevealOnScroll>
                        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
                            <div className="flex-1 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest text-amber-400">
                                    <FileText className="w-3 h-3" /> Requirements
                                </div>
                                <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white leading-none">
                                    Traceability <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">Matrix.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                                    Map every user story or PRD requirement directly to a test case. Ensure 100% functional coverage before every release and prove compliance effortlessly.
                                </p>
                            </div>
                            <div className="flex-1 w-full relative">
                                <div className="absolute inset-0 bg-amber-500/20 blur-[100px] rounded-full pointer-events-none" />
                                <div className="relative glass-panel border border-white/10 rounded-3xl p-6 shadow-2xl">
                                    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                                        <span className="text-xs font-bold text-slate-300">REQ-UI-01</span>
                                        <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"/><div className="w-2 h-2 rounded-full bg-white/20"/></div>
                                    </div>
                                    <div className="text-sm font-mono text-amber-300 mb-4">"User must be able to reset password via email link."</div>
                                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Linked Cases: 3</span>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">100% Covered</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Feature 12 - Auto-Test */}
                    <RevealOnScroll>
                        <div className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-20">
                            <div className="flex-1 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black uppercase tracking-widest text-cyan-400">
                                    <Bot className="w-3 h-3" /> Auto-Test
                                </div>
                                <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white leading-none">
                                    Self-Healing <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Automation.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                                    Deploy our autonomous bot to crawl your application, learn the DOM structure, and automatically repair flaky UI tests when selectors change.
                                </p>
                            </div>
                            <div className="flex-1 w-full relative">
                                <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none" />
                                <div className="relative glass-panel border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center h-48">
                                    <Bot className="w-12 h-12 text-cyan-400 mb-4 animate-pulse" />
                                    <div className="text-xs font-mono text-cyan-300 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"/> Healing Selectors...
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Feature 13 - Web Monitor */}
                    <RevealOnScroll>
                        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
                            <div className="flex-1 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                    <Activity className="w-3 h-3" /> Web Monitor
                                </div>
                                <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white leading-none">
                                    24/7 Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Uptime.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                                    Poll your critical endpoints from multiple geographic regions every minute. Receive instant Slack/Email alerts the second a service degrades or goes offline.
                                </p>
                            </div>
                            <div className="flex-1 w-full relative">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none" />
                                <div className="relative glass-panel border border-emerald-500/20 rounded-3xl p-6 shadow-2xl">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="text-sm font-bold text-white">Global Nodes</div>
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"/>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { region: 'us-east-1', ping: '12ms' },
                                            { region: 'eu-west-2', ping: '45ms' },
                                            { region: 'ap-southeast-1', ping: '112ms' }
                                        ].map((node, i) => (
                                            <div key={i} className="flex justify-between items-center p-2 border-b border-white/5 last:border-0">
                                                <span className="text-xs font-mono text-slate-400">{node.region}</span>
                                                <span className="text-xs font-mono text-emerald-400">{node.ping}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>
                    
                </div>

            </section>

            {/* FAQ Section */}
            <section className="py-24 px-6 md:px-12 relative z-20 bg-[#05060a] border-t border-white/5">
                <div className="max-w-3xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-black uppercase italic tracking-tight text-white mb-4">
                                Frequently Asked Questions
                            </h2>
                            <p className="text-slate-400 text-sm">Everything you need to know about the platform and how it works.</p>
                        </div>
                    </RevealOnScroll>

                    <div className="space-y-2">
                        <FAQItem 
                            question="How does the AI Test Generator work?" 
                            answer="Our AI engine analyzes your component code and automatically generates comprehensive Jest and React Testing Library suites, aiming for maximum coverage. It understands React hooks, contexts, and standard DOM interactions."
                            delay={0}
                        />
                        <FAQItem 
                            question="Can I integrate this with my existing CI/CD pipeline?" 
                            answer="Yes! We offer a full REST API that allows you to trigger test suites, security scans, and visual regression checks directly from GitHub Actions, Jenkins, or GitLab CI."
                            delay={100}
                        />
                        <FAQItem 
                            question="What kind of vulnerabilities does the Security Tool detect?" 
                            answer="The integrated scanner covers the OWASP Top 10, including SQL Injection, Cross-Site Scripting (XSS), Security Misconfigurations, and Broken Access Control."
                            delay={200}
                        />
                        <FAQItem 
                            question="Is Selenium Grid supported for E2E testing?" 
                            answer="Absolutely. Our Selenium Cloud dashboard allows you to execute end-to-end tests across multiple distributed nodes concurrently, massively reducing your test execution time."
                            delay={300}
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6 relative z-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-900/20 to-transparent pointer-events-none" />
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <RevealOnScroll>
                        <h2 className="text-5xl md:text-6xl font-black text-white italic uppercase tracking-tight mb-8">
                            Ready to Automate <br/><span className="text-cyan-400">Everything?</span>
                        </h2>
                        <button onClick={() => navigate('/signup')} className="relative group px-12 py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm overflow-hidden transition-transform hover:scale-105 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <span className="relative group-hover:text-white transition-colors duration-300">Create Free Account</span>
                        </button>
                    </RevealOnScroll>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 pt-20 pb-10 bg-[#05060a] relative z-20">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-cyan-500" />
                        <span className="text-xl font-black italic tracking-tighter text-white">QA Tool</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
                        © 2026 QA Platform. All Rights Reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
