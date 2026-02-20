import React from 'react';
import { Button } from '../ui/Button';
import { Container } from '../ui/Container';
import { ChevronDown } from 'lucide-react';

const HERO_CONTENT = {
  fr: {
    CNI: {
      title1: 'Votre CNI',
      title2: 'A portee de main',
      desc: "Ne vous deplacez plus inutilement. Verifiez instantanement la disponibilite et le lieu de retrait de votre carte nationale d'identite.",
      btn: 'Trouver ma carte'
    },
    PASSPORT: {
      title1: 'Votre passeport',
      title2: 'Ou est-il ?',
      desc: 'Suivez la disponibilite de votre passeport et retrouvez rapidement le lieu de retrait.',
      btn: 'Trouver mon passeport'
    },
    BIRTH_CERT: {
      title1: 'Acte de naissance',
      title2: 'Retrouvez vos actes',
      desc: 'Aidez a retrouver ou signalez un acte de naissance egare. Simplifiez vos demarches citoyennes.',
      btn: 'Rechercher mon acte'
    },
    OTHER: {
      title1: 'Vos documents',
      title2: 'Service citoyen',
      desc: 'Recherchez tout type de document officiel egare (permis, carte grise, etc.).',
      btn: 'Lancer la recherche'
    }
  },
  en: {
    CNI: {
      title1: 'Your CNI',
      title2: 'Within reach',
      desc: 'Avoid unnecessary trips. Instantly check availability and pickup location of your national ID card.',
      btn: 'Find my card'
    },
    PASSPORT: {
      title1: 'Your passport',
      title2: 'Where is it?',
      desc: 'Track your passport status and quickly find the pickup location.',
      btn: 'Find my passport'
    },
    BIRTH_CERT: {
      title1: 'Birth certificate',
      title2: 'Find your records',
      desc: 'Help recover or report a missing birth certificate. Simplify your citizen procedures.',
      btn: 'Search my record'
    },
    OTHER: {
      title1: 'Your documents',
      title2: 'Citizen service',
      desc: 'Search any type of lost official document (license, vehicle registration, etc.).',
      btn: 'Start search'
    }
  }
};

export const Hero = ({ onStart, documentType = 'CNI', language = 'fr' }) => {
  const langContent = HERO_CONTENT[language] || HERO_CONTENT.fr;
  const current = langContent[documentType] || langContent.CNI;

  return (
    <div className="relative overflow-hidden bg-brand-50 pb-16 pt-12 sm:pb-24 lg:pb-32">
      <Container className="relative z-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-brand-900 sm:text-5xl md:text-6xl">
          <span className="block mb-2">{current.title1}</span>
          <span className="block text-brand-600">{current.title2}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-lg text-brand-700 sm:max-w-3xl">
          {current.desc}
        </p>
        <div className="mx-auto mt-10 max-w-sm sm:flex sm:max-w-none sm:justify-center">
          <Button
            size="lg"
            onClick={onStart}
            className="w-full sm:w-auto text-lg px-8 py-4 shadow-xl shadow-brand-200/50"
          >
            {current.btn}
            <ChevronDown className="ml-2 h-5 w-5 animate-bounce" />
          </Button>
        </div>
      </Container>

      <div className="absolute top-0 left-1/2 -ml-[40rem] w-[80rem] h-[40rem] opacity-20 bg-gradient-to-tr from-brand-200 to-brand-400 blur-3xl pointer-events-none -z-10 rounded-full mix-blend-multiply" />
    </div>
  );
};
