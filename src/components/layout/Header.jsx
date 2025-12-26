import React from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { Container } from '../ui/Container';

export const Header = ({ onOpenSidebar }) => {
    return (
        <header className="sticky top-0 z-50 w-full overflow-hidden">
            {/* Cosmos Background with Glassmorphism */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl border-b border-white/10" />

            {/* Animated Cosmos Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-50%] left-[-10%] w-[40%] h-[200%] bg-purple-600/20 blur-[100px] rotate-12 animate-pulse" />
                <div className="absolute bottom-[-50%] right-[-10%] w-[30%] h-[200%] bg-blue-600/20 blur-[100px] -rotate-12 animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <Container className="relative flex items-center justify-between py-3">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onOpenSidebar}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors group relative z-10"
                    >
                        <Menu className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                        <div className="absolute -inset-0.5 bg-blue-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    {/* Logo Container with Neon Glow */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-slate-900 ring-1 ring-white/10 p-1 rounded-full overflow-hidden">
                            <img
                                src="/logocni237.jpg"
                                alt="CNI237 Logo"
                                className="w-10 h-10 object-cover rounded-full"
                            />
                        </div>
                    </motion.div>

                    <div className="flex flex-col">
                        <motion.h1
                            animate={{
                                filter: ["brightness(1) contrast(1.2)", "brightness(1.5) contrast(1.5)", "brightness(1) contrast(1.2)"],
                                textShadow: [
                                    "0 0 10px rgba(239, 68, 68, 0.5)",
                                    "0 0 20px rgba(245, 158, 11, 0.8)",
                                    "0 0 10px rgba(239, 68, 68, 0.5)"
                                ],
                                y: [0, -1, 0]
                            }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#007a5e] via-[#ce1126] to-[#fcd116]"
                        >
                            CNI237
                        </motion.h1>
                        <div className="flex items-center space-x-2">
                            <span className="h-[1px] w-4 bg-blue-500/50"></span>
                            <p className="text-[9px] uppercase tracking-[0.2em] text-blue-300/80 font-bold">
                                République du Cameroun
                            </p>
                        </div>
                    </div>
                </div>

                {/* Futuristic Accent */}
                <div className="hidden md:flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></div>
                    <span className="text-[10px] uppercase tracking-widest text-blue-400/60 font-medium">Ma CNI</span>
                </div>
            </Container>
        </header>
    );
};
