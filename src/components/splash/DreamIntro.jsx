import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const DreamIntro = ({ onComplete }) => {
    const [step, setStep] = useState(1);

    useEffect(() => {
        // Step 1 lasts longer now (7 seconds)
        const timer1 = setTimeout(() => setStep(2), 7000);
        // Auto-complete after 20 seconds total
        const timer2 = setTimeout(onComplete, 20000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onComplete}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md cursor-pointer"
        >
            {/* Modal Container */}
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-2xl w-full mx-4 cursor-default"
            >
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 1.1, opacity: 0, y: -20 }}
                            className="relative flex flex-col items-center"
                        >
                            <div className="bg-white rounded-[40px] shadow-2xl p-3 border-4 border-blue-100 relative w-full h-full flex flex-col items-center">
                                <p className="text-xl md:text-2xl font-bold text-slate-800 mb-2 text-center flex-shrink-0">
                                    Où est ma CNI ? 🤔
                                </p>
                                {/* Increased relative size: flex-grow to take remaining space */}
                                <div className="relative w-full flex-grow overflow-hidden rounded-2xl shadow-inner bg-slate-50 border-2 border-slate-100 min-h-[300px] md:min-h-[400px]">
                                    <motion.img
                                        initial={{ scale: 1.2 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 6 }}
                                        src="/wanda.jpg"
                                        alt="Recherche"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* Bubble tail -- adjusted to fit new padding */}
                                <div className="absolute -bottom-6 left-12 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-white" />
                            </div>

                            {/* Small decorative bubbles */}
                            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="w-8 h-8 bg-white rounded-full mt-8 mr-32 shadow-lg border-2 border-blue-50" />
                            <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 2.5 }} className="w-4 h-4 bg-white rounded-full mt-2 mr-48 shadow-md" />
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 1.1, opacity: 0, y: -20 }}
                            className="relative flex flex-col items-center w-full max-h-[85vh] aspect-[4/5] md:aspect-square"
                        >
                            <div className="bg-gradient-to-br from-white to-green-50 rounded-[40px] shadow-2xl p-3 border-4 border-green-200 relative w-full h-full flex flex-col items-center">
                                <p className="text-xl md:text-2xl font-black text-green-600 mb-2 text-center flex-shrink-0">
                                    Voici ta CNI ! ✨
                                </p>
                                <div className="relative w-full flex-grow overflow-hidden rounded-2xl shadow-xl border-4 border-white min-h-[300px] md:min-h-[400px]">
                                    <motion.img
                                        initial={{ rotate: -5, scale: 0.9 }}
                                        animate={{ rotate: 0, scale: 1 }}
                                        transition={{ duration: 0.8 }}
                                        src="/wandacni.png"
                                        alt="Trouvée"
                                        className="w-full h-full object-contain cursor-pointer"
                                        onClick={onComplete}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                </div>
                                {/* Bubble tail */}
                                <div className="absolute -bottom-6 right-12 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-white" />
                            </div>

                            {/* Celebration effects */}
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute -top-10 -right-10 text-4xl"
                            >
                                🌟
                            </motion.div>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
                                className="absolute -bottom-10 -left-10 text-4xl"
                            >
                                🎉
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Status indicator */}
                <div className="absolute top-0 right-0 p-4">
                    <div className="flex gap-1">
                        <div className={`w-2 h-2 rounded-full transition-colors ${step === 1 ? 'bg-blue-500' : 'bg-slate-300'}`} />
                        <div className={`w-2 h-2 rounded-full transition-colors ${step === 2 ? 'bg-green-500' : 'bg-slate-300'}`} />
                    </div>
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    className="text-center mt-12 text-white text-xs font-bold tracking-[0.2em] uppercase"
                >
                    Cliquez n'importe où pour fermer
                </motion.p>
            </div>
        </motion.div>
    );
};
