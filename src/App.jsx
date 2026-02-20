import React, { useEffect, useRef, useState } from 'react';
import { Layout } from './components/layout/Layout';
import { Hero } from './components/home/Hero';
import { SearchForm } from './components/search/SearchForm';
import { Verification } from './components/search/Verification';
import { Result } from './components/search/Result';
import { Container } from './components/ui/Container';
import { Modal } from './components/ui/Modal';
import { cniService } from './services/cniService';
import { Toaster, toast } from 'react-hot-toast';
import { DreamIntro } from './components/splash/DreamIntro';
import { AnimatePresence } from 'framer-motion';

const LANGUAGE_STORAGE_KEY = 'cni237.language';

const APP_TEXT = {
  fr: {
    chooseLanguageTitle: 'Choisir la langue',
    chooseLanguageDescription: 'Selectionnez votre langue pour afficher tous les textes.',
    french: 'Francais',
    english: 'English',
    close: 'Fermer',
    retry: 'Reessayer',
    ok: 'OK',
    noMatchTitle: 'Aucun dossier correspondant',
    noMatchDescription: "Nous n'avons trouve aucun enregistrement pour ces informations. Verifiez l'orthographe.",
    similarTitle: 'Nom introuvable, suggestions :',
    similarDescription: "Ce nom exact n'est pas dans la base. Voici des correspondances proches :",
    similarHint: "Rendez-vous a l'emplacement indique pour verifier.",
    phoneMismatchToast: 'Numero de telephone incorrect, mais voici le document trouve.',
    multipleTitle: 'Plusieurs dossiers trouves',
    multipleDescription: 'Plusieurs resultats correspondent. Veuillez affiner la recherche.',
    searchErrorTitle: 'Erreur de recherche',
    searchErrorDescription: 'Une erreur est survenue lors de la recherche. Veuillez reessayer plus tard.',
    verificationFailedTitle: 'Verification echouee',
    verificationFailedDescription: 'Les informations ne correspondent pas. Veuillez verifier et reessayer.',
    backToSearch: 'Retour a la recherche',
    openLanguageMenu: 'Langue'
  },
  en: {
    chooseLanguageTitle: 'Choose Language',
    chooseLanguageDescription: 'Select your language to display all texts.',
    french: 'French',
    english: 'English',
    close: 'Close',
    retry: 'Try again',
    ok: 'OK',
    noMatchTitle: 'No matching record',
    noMatchDescription: "We could not find any record for this information. Please check spelling and try again.",
    similarTitle: 'Name not found, suggestions:',
    similarDescription: "This exact name is not in the database. Here are close matches:",
    similarHint: 'Please go to the indicated location for verification.',
    phoneMismatchToast: 'Phone number mismatch, but this matching document was found.',
    multipleTitle: 'Multiple records found',
    multipleDescription: 'Multiple results match. Please refine your search.',
    searchErrorTitle: 'Search error',
    searchErrorDescription: 'An error occurred while searching. Please try again later.',
    verificationFailedTitle: 'Verification failed',
    verificationFailedDescription: 'The information does not match. Please verify and try again.',
    backToSearch: 'Back to search',
    openLanguageMenu: 'Language'
  }
};

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [documentType, setDocumentType] = useState('CNI');
  const [step, setStep] = useState('HERO'); // HERO, SEARCH, VERIFICATION, RESULT
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', description: '', actions: [] });
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_STORAGE_KEY) || '');
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(() => !localStorage.getItem(LANGUAGE_STORAGE_KEY));

  const searchSectionRef = useRef(null);

  const currentLanguage = language || 'fr';
  const t = APP_TEXT[currentLanguage];

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const selectLanguage = (nextLanguage) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    setLanguage(nextLanguage);
    setIsLanguageModalOpen(false);
  };

  const openLanguageModal = () => {
    setIsLanguageModalOpen(true);
  };

  const handleStart = () => {
    setStep('SEARCH');
    setTimeout(() => {
      searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSearch = async (formData) => {
    try {
      const searchResponse = await cniService.search(formData);
      const { matchType, candidates: results } = searchResponse || { matchType: 'NONE', candidates: [] };

      if (matchType === 'NONE' || results.length === 0) {
        setModalContent({
          title: t.noMatchTitle,
          description: t.noMatchDescription,
          actions: [{ label: t.close, onClick: () => setModalOpen(false) }]
        });
        setModalOpen(true);
      } else if (matchType === 'SIMILAR') {
        const suggestions = results
          .map((r) => `- ${r.first_name} ${r.last_name} -> ${r.current_location}`)
          .join('\n');

        setModalContent({
          title: t.similarTitle,
          description: (
            <div className="space-y-4">
              <p>{t.similarDescription}</p>
              <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line font-medium text-slate-700">
                {suggestions}
              </div>
              <p className="text-sm text-gray-500">{t.similarHint}</p>
            </div>
          ),
          actions: [{ label: t.close, onClick: () => setModalOpen(false) }]
        });
        setModalOpen(true);
      } else {
        if (matchType === 'PHONE_MISMATCH') {
          toast(t.phoneMismatchToast, {
            icon: '⚠️',
            duration: 5000
          });
        }

        if (results.length === 1) {
          setSelectedCandidate(results[0]);
          setStep('VERIFICATION');
        } else {
          setModalContent({
            title: t.multipleTitle,
            description: t.multipleDescription,
            actions: [{ label: t.ok, onClick: () => setModalOpen(false) }]
          });
          setModalOpen(true);
        }
      }
    } catch (error) {
      console.error(error);
      setModalContent({
        title: t.searchErrorTitle,
        description: t.searchErrorDescription,
        actions: [{ label: t.close, onClick: () => setModalOpen(false) }]
      });
      setModalOpen(true);
    }
  };

  const handleVerify = () => {
    setStep('RESULT');
  };

  const handleReset = () => {
    setStep('SEARCH');
    setSelectedCandidate(null);
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {showIntro ? (
          <DreamIntro
            key="intro"
            language={currentLanguage}
            onComplete={() => setShowIntro(false)}
          />
        ) : (
          <Layout
            key="main"
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            documentType={documentType}
            setDocumentType={setDocumentType}
            language={currentLanguage}
            onOpenLanguageModal={openLanguageModal}
            languageButtonLabel={t.openLanguageMenu}
          >
            <Hero onStart={handleStart} documentType={documentType} language={currentLanguage} />

            <div ref={searchSectionRef} className="bg-white scroll-mt-20">
              {(step === 'SEARCH' || step === 'VERIFICATION' || step === 'RESULT') && (
                <div className="py-12 bg-gray-50 min-h-[500px]">
                  <Container>
                    {step === 'SEARCH' && (
                      <div className="animate-in fade-in duration-700 slide-in-from-bottom-8">
                        <SearchForm onSearch={handleSearch} documentType={documentType} language={currentLanguage} />
                      </div>
                    )}

                    {step === 'VERIFICATION' && selectedCandidate && (
                      <div className="max-w-xl mx-auto">
                        <Verification
                          candidate={selectedCandidate}
                          language={currentLanguage}
                          onVerify={handleVerify}
                          onFail={(message) => {
                            setModalContent({
                              title: t.verificationFailedTitle,
                              description: message || t.verificationFailedDescription,
                              actions: [{ label: t.retry, onClick: () => setModalOpen(false) }]
                            });
                            setModalOpen(true);
                          }}
                        />
                        <button
                          onClick={() => setStep('SEARCH')}
                          className="mt-4 text-sm text-gray-500 hover:text-gray-700 w-full text-center underline"
                        >
                          {t.backToSearch}
                        </button>
                      </div>
                    )}

                    {step === 'RESULT' && selectedCandidate && (
                      <div className="max-w-xl mx-auto">
                        <Result candidate={selectedCandidate} language={currentLanguage} onReset={handleReset} />
                      </div>
                    )}
                  </Container>
                </div>
              )}
            </div>
          </Layout>
        )}
      </AnimatePresence>

      <Modal
        isOpen={isLanguageModalOpen}
        title={t.chooseLanguageTitle}
        description={t.chooseLanguageDescription}
        onClose={() => {}}
        showCloseButton={false}
        closeOnBackdrop={false}
        actions={[
          { label: t.french, onClick: () => selectLanguage('fr'), variant: 'primary' },
          { label: t.english, onClick: () => selectLanguage('en') }
        ]}
      />

      <Modal
        isOpen={modalOpen}
        title={modalContent.title}
        description={modalContent.description}
        actions={modalContent.actions}
        onClose={() => setModalOpen(false)}
        closeLabel={t.close}
      />

      <Toaster />
    </>
  );
}

export default App;
