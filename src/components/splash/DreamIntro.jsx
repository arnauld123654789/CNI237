import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const INTRO_TEXT = {
  fr: 'Cliquez pour demarrer',
  en: 'Click to start'
};

export const DreamIntro = ({ onComplete, language = 'fr' }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 12000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const text = INTRO_TEXT[language] || INTRO_TEXT.fr;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onComplete}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl cursor-pointer p-4"
    >
      <div className="relative w-full max-w-xl max-h-[80dvh] flex flex-col items-center justify-center gap-4 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full flex flex-col items-center pointer-events-auto"
          >
            <div
              onClick={onComplete}
              className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl p-2 md:p-4 border-2 md:border-6 border-blue-50 relative w-full flex flex-col items-center overflow-hidden cursor-pointer"
            >
              <div className="relative w-full bg-slate-50/50 rounded-lg md:rounded-xl overflow-hidden max-h-[73dvh] flex items-center justify-center p-1 border border-slate-100">
                <img
                  src="/dream.jpg"
                  alt="Dream intro"
                  className="max-h-full w-auto object-contain"
                  loading="eager"
                />
              </div>

              <div className="absolute -bottom-3 left-10 md:-bottom-5 md:left-12 w-0 h-0 border-l-[8px] md:border-l-[15px] border-l-transparent border-r-[8px] md:border-r-[15px] border-r-transparent border-t-[10px] md:border-t-[20px] border-t-white" />
            </div>
          </motion.div>
        </AnimatePresence>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.8 }}
          className="text-white text-[9px] md:text-xs font-black tracking-[0.3em] uppercase mt-4 text-center"
        >
          {text}
        </motion.p>
      </div>
    </motion.div>
  );
};
