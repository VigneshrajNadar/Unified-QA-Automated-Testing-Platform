import { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000); // poll every 15s
        return () => clearInterval(interval);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id, e) => {
        e.stopPropagation();
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/read-all');
            setNotifications([]);
        } catch (err) {
            console.error(err);
        }
    };

    const handleNotificationClick = (notif) => {
        if (notif.link) {
            navigate(notif.link);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                        {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 mb-3 w-80 bg-[#0D1424] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                    >
                        <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                            <h4 className="text-sm font-bold text-white">Notifications</h4>
                            {notifications.length > 0 && (
                                <button onClick={markAllAsRead} className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 hover:text-cyan-300">
                                    Mark All Read
                                </button>
                            )}
                        </div>
                        
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-6 text-center text-slate-500">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">You're all caught up!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {notifications.map(n => (
                                        <div 
                                            key={n._id} 
                                            onClick={() => handleNotificationClick(n)}
                                            className="p-3 hover:bg-white/5 cursor-pointer transition-colors group flex gap-3"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-white mb-1 truncate">{n.title}</p>
                                                <p className="text-xs text-slate-400 line-clamp-2">{n.message}</p>
                                                <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-widest">{new Date(n.createdAt).toLocaleTimeString()}</p>
                                            </div>
                                            <button 
                                                onClick={(e) => markAsRead(n._id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-emerald-400 transition-all shrink-0 self-center"
                                                title="Mark as read"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
