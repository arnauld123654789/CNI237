import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, FileText, Landmark, UserPlus, HelpCircle } from 'lucide-react';

const DOCUMENT_TYPES = [
    { id: 'CNI', label: 'Carte d\'Identité (CNI)', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'PASSPORT', label: 'Passeport', icon: Landmark, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'BIRTH_CERT', label: 'Acte de Naissance', icon: FileText, color: 'text-green-500', bg: 'bg-green-50' },
    { id: 'OTHER', label: 'Autres Documents', icon: UserPlus, color: 'text-orange-500', bg: 'bg-orange-50' },
];

export const Sidebar = ({ isOpen, onClose, currentType, onSelectType }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
                    />

                    {/* Sidebar Drawer */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 bottom-0 w-80 bg-white shadow-2xl z-[70] overflow-y-auto"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black tracking-tighter">
                                    Menu <span className="text-blue-600">Services</span>
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4">
                                    Types de documents
                                </p>
                                {DOCUMENT_TYPES.map((doc) => (
                                    <button
                                        key={doc.id}
                                        onClick={() => {
                                            onSelectType(doc.id);
                                            onClose();
                                        }}
                                        className={`w-full flex items-center p-3 rounded-xl transition-all ${currentType === doc.id
                                                ? `${doc.bg} ring-2 ring-transparent`
                                                : 'hover:bg-slate-50 group'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-lg ${doc.bg} mr-4 transition-transform group-hover:scale-110`}>
                                            <doc.icon className={`w-5 h-5 ${doc.color}`} />
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-semibold text-sm ${currentType === doc.id ? doc.color : 'text-slate-700'
                                                }`}>
                                                {doc.label}
                                            </p>
                                            {doc.id === 'CNI' && (
                                                <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">
                                                    Principal
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-12 space-y-2">
                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4">
                                    Aide & Infos
                                </p>
                                <button className="w-full flex items-center p-3 rounded-xl hover:bg-slate-50 group transition-colors">
                                    <div className="p-2 rounded-lg bg-slate-100 mr-4">
                                        <HelpCircle className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <p className="font-semibold text-sm text-slate-700">Comment ça marche ?</p>
                                </button>
                            </div>

                            <div className="mt-12 p-4 bg-slate-900 rounded-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 blur-2xl rounded-full" />
                                <p className="text-white font-bold text-sm mb-1 relative z-10">Ma CNI 🇨🇲</p>
                                <p className="text-blue-300 text-[10px] relative z-10">Simplifiez vos recherches administratives au Cameroun.</p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
