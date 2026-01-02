import React, { useState, useRef } from 'react';
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

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [documentType, setDocumentType] = useState('CNI');
  const [step, setStep] = useState('HERO'); // HERO, SEARCH, VERIFICATION, RESULT
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', description: '', actions: [] });

  const searchSectionRef = useRef(null);

  const handleStart = () => {
    setStep('SEARCH');
    // Smooth scroll to search section
    setTimeout(() => {
      searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSearch = async (formData) => {
    try {
      const results = await cniService.search(formData);
      if (results.length === 0) {
        setModalContent({
          title: 'Aucun dossier correspondant',
          description: "Nous n'avons trouvé aucun enregistrement pour ces informations. Vérifiez l'orthographe (nom/prénom) et essayez d'ajouter le numéro de téléphone.",
          actions: [
            { label: 'Fermer', onClick: () => setModalOpen(false) }
          ]
        });
        setModalOpen(true);
      } else if (results.length === 1) {
        setSelectedCandidate(results[0]);
        setStep('VERIFICATION');
      } else {
        setModalContent({
          title: 'Plusieurs dossiers trouvés',
          description: "Veuillez ajouter votre prénom ou votre numéro de téléphone pour affiner la recherche et réduire les résultats.",
          actions: [
            { label: 'OK', onClick: () => setModalOpen(false) }
          ]
        });
        setModalOpen(true);
      }
    } catch (error) {
      console.error(error);
      setModalContent({
        title: 'Erreur de recherche',
        description: "Une erreur est survenue lors de la recherche. Veuillez réessayer plus tard.",
        actions: [
          { label: 'Fermer', onClick: () => setModalOpen(false) }
        ]
      });
      setModalOpen(true);
    }
  };

  const handleVerify = () => {
    setStep('RESULT');
  };

  const handleReset = () => {
    setStep('SEARCH');
    setCandidates([]);
    setSelectedCandidate(null);
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {showIntro ? (
          <DreamIntro key="intro" onComplete={() => setShowIntro(false)} />
        ) : (
          <Layout
            key="main"
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            documentType={documentType}
            setDocumentType={setDocumentType}
          >
            <Hero onStart={handleStart} documentType={documentType} />

            <div ref={searchSectionRef} className="bg-white scroll-mt-20">
              {(step === 'SEARCH' || step === 'VERIFICATION' || step === 'RESULT') && (
                <div className="py-12 bg-gray-50 min-h-[500px]">
                  <Container>
                    {step === 'SEARCH' && (
                      <div className="animate-in fade-in duration-700 slide-in-from-bottom-8">
                        <SearchForm onSearch={handleSearch} documentType={documentType} />
                      </div>
                    )}

                    {step === 'VERIFICATION' && selectedCandidate && (
                      <div className="max-w-xl mx-auto">
                        <Verification
                          candidate={selectedCandidate}
                          onVerify={handleVerify}
                          onFail={(message) => {
                            setModalContent({
                              title: 'Vérification échouée',
                              description: message || "Les informations ne correspondent pas. Veuillez vérifier et réessayer.",
                              actions: [{ label: 'Réessayer', onClick: () => setModalOpen(false) }]
                            });
                            setModalOpen(true);
                          }}
                        />
                        <button
                          onClick={() => setStep('SEARCH')}
                          className="mt-4 text-sm text-gray-500 hover:text-gray-700 w-full text-center underline"
                        >
                          Retour à la recherche
                        </button>
                      </div>
                    )}

                    {step === 'RESULT' && selectedCandidate && (
                      <div className="max-w-xl mx-auto">
                        <Result
                          candidate={selectedCandidate}
                          onReset={handleReset}
                        />
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
        isOpen={modalOpen}
        title={modalContent.title}
        description={modalContent.description}
        actions={modalContent.actions}
        onClose={() => setModalOpen(false)}
      />
      <Toaster />
    </>
  );
}

export default App;
