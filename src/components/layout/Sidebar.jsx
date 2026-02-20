import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, FileText, Landmark, UserPlus, HelpCircle, Languages } from 'lucide-react';

const SIDEBAR_TEXT = {
  fr: {
    menu: 'Menu',
    services: 'Services',
    documentTypes: 'Types de documents',
    principal: 'Principal',
    help: 'Aide et infos',
    howItWorks: 'Comment ca marche ?',
    language: 'Choisir la langue',
    appName: 'Ma CNI',
    appDescription: 'Simplifiez vos recherches administratives au Cameroun.',
    docs: {
      CNI: "Carte d'identite (CNI)",
      PASSPORT: 'Passeport',
      BIRTH_CERT: 'Acte de naissance',
      OTHER: 'Autres documents'
    }
  },
  en: {
    menu: 'Menu',
    services: 'Services',
    documentTypes: 'Document types',
    principal: 'Main',
    help: 'Help and info',
    howItWorks: 'How does it work?',
    language: 'Choose language',
    appName: 'My CNI',
    appDescription: 'Simplify your administrative searches in Cameroon.',
    docs: {
      CNI: 'National ID (CNI)',
      PASSPORT: 'Passport',
      BIRTH_CERT: 'Birth certificate',
      OTHER: 'Other documents'
    }
  }
};

const DOCUMENT_TYPES = [
  { id: 'CNI', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'PASSPORT', icon: Landmark, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'BIRTH_CERT', icon: FileText, color: 'text-green-500', bg: 'bg-green-50' },
  { id: 'OTHER', icon: UserPlus, color: 'text-orange-500', bg: 'bg-orange-50' }
];

export const Sidebar = ({ isOpen, onClose, currentType, onSelectType, language = 'fr', onOpenLanguageModal }) => {
  const t = SIDEBAR_TEXT[language] || SIDEBAR_TEXT.fr;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
          />

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
                  {t.menu} <span className="text-blue-600">{t.services}</span>
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
                  {t.documentTypes}
                </p>
                {DOCUMENT_TYPES.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      onSelectType(doc.id);
                      onClose();
                    }}
                    className={`w-full flex items-center p-3 rounded-xl transition-all ${
                      currentType === doc.id
                        ? `${doc.bg} ring-2 ring-transparent`
                        : 'hover:bg-slate-50 group'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${doc.bg} mr-4 transition-transform group-hover:scale-110`}>
                      <doc.icon className={`w-5 h-5 ${doc.color}`} />
                    </div>
                    <div className="text-left">
                      <p className={`font-semibold text-sm ${currentType === doc.id ? doc.color : 'text-slate-700'}`}>
                        {t.docs[doc.id]}
                      </p>
                      {doc.id === 'CNI' && (
                        <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">
                          {t.principal}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-12 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4">
                  {t.help}
                </p>
                <button className="w-full flex items-center p-3 rounded-xl hover:bg-slate-50 group transition-colors">
                  <div className="p-2 rounded-lg bg-slate-100 mr-4">
                    <HelpCircle className="w-5 h-5 text-slate-500" />
                  </div>
                  <p className="font-semibold text-sm text-slate-700">{t.howItWorks}</p>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenLanguageModal?.();
                  }}
                  className="w-full flex items-center p-3 rounded-xl hover:bg-slate-50 group transition-colors"
                >
                  <div className="p-2 rounded-lg bg-slate-100 mr-4">
                    <Languages className="w-5 h-5 text-slate-500" />
                  </div>
                  <p className="font-semibold text-sm text-slate-700">{t.language}</p>
                </button>
              </div>

              <div className="mt-12 p-4 bg-slate-900 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 blur-2xl rounded-full" />
                <p className="text-white font-bold text-sm mb-1 relative z-10">{t.appName}</p>
                <p className="text-blue-300 text-[10px] relative z-10">{t.appDescription}</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
