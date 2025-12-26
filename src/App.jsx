import React, { useState, useRef } from 'react';
import { Layout } from './components/layout/Layout';
import { Hero } from './components/home/Hero';
import { SearchForm } from './components/search/SearchForm';
import { Verification } from './components/search/Verification';
import { Result } from './components/search/Result';
import { Container } from './components/ui/Container';
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
        // Show not found message directly or handled in UI?
        // Requirement: "Carte non encore émise" -> Case 2
        // But if not in DB at all? Maybe same message.
        alert("Aucun dossier trouvé pour ces informations. Vérifiez l'orthographe ou essayez avec d'autres détails.");
      } else if (results.length === 1) {
        setSelectedCandidate(results[0]);
        setStep('VERIFICATION');
      } else {
        // Multiple matches
        // Requirement: "Le site doit être intelligent... Il peut demander des informations supplémentaires"
        // For prototype, we'll just pick the first one or ask user to refine.
        // Let's show a list if multiple? Or simplest: Ask to refine.
        alert("Plusieurs dossiers trouvés. Veuillez ajouter votre prénom ou numéro de téléphone pour préciser la recherche.");
      }
    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue lors de la recherche.");
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
    </>
  );
}

export default App;
