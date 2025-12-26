import React from 'react';
import { Button } from '../ui/Button';
import { Container } from '../ui/Container';
import { ChevronDown, Search } from 'lucide-react';

export const Hero = ({ onStart, documentType = 'CNI' }) => {
    const content = {
        CNI: {
            title1: 'Votre CNI',
            title2: 'À portée de main',
            desc: 'Ne vous déplacez plus inutilement. Vérifiez instantanément la disponibilité et le lieu de retrait de votre Carte Nationale d\'Identité.',
            btn: 'Trouver ma carte'
        },
        PASSPORT: {
            title1: 'Votre Passeport',
            title2: 'Où en est-il ?',
            desc: 'Suivez le statut de votre demande de passeport biométrique et sachez exactement quand il est prêt.',
            btn: 'Trouver mon passeport'
        },
        BIRTH_CERT: {
            title1: 'Acte de Naissance',
            title2: 'Retrouvez vos actes',
            desc: 'Aidez à retrouver ou signalez un acte de naissance égaré. Simplifiez vos démarches citoyennes.',
            btn: 'Rechercher mon acte'
        },
        OTHER: {
            title1: 'Vos Documents',
            title2: 'Service Citoyen',
            desc: 'Recherchez tout type de document officiel égaré (Permis, Cartes grise, etc.).',
            btn: 'Lancer la recherche'
        }
    };

    const current = content[documentType] || content.CNI;

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

            {/* Decorative blobs */}
            <div className="absolute top-0 left-1/2 -ml-[40rem] w-[80rem] h-[40rem] opacity-20 bg-gradient-to-tr from-brand-200 to-brand-400 blur-3xl pointer-events-none -z-10 rounded-full mix-blend-multiply" />
        </div>
    );
};
