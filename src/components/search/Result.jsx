import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { MapPin, CheckCircle, Clock } from 'lucide-react';

const RESULT_TEXT = {
  fr: {
    readyTitle: 'Carte disponible !',
    pendingTitle: 'En cours de production',
    readyDescription: "Excellente nouvelle, votre carte nationale d'identite est prete.",
    pendingDescription: "Votre carte n'a pas encore ete emise ou expediee.",
    pickupLocation: 'Lieu de retrait',
    instructions: "Presentez-vous avec votre recepisse et vos documents d'identification.",
    newSearch: 'Nouvelle recherche'
  },
  en: {
    readyTitle: 'Card available!',
    pendingTitle: 'In production',
    readyDescription: 'Great news, your national ID card is ready.',
    pendingDescription: 'Your card has not been issued or shipped yet.',
    pickupLocation: 'Pickup location',
    instructions: 'Please come with your receipt and identification documents.',
    newSearch: 'New search'
  }
};

export const Result = ({ candidate, onReset, language = 'fr' }) => {
  const status = (candidate.status || '').toUpperCase();
  const isReady = status === 'DISPONIBLE' || status === 'READY' || status === 'ISSUED';
  const t = RESULT_TEXT[language] || RESULT_TEXT.fr;

  return (
    <Card className="animate-in fade-in zoom-in-95 duration-500 border-t-4 border-t-brand-500">
      <div className="p-8 text-center space-y-6">
        <div className="flex justify-center">
          {isReady ? (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <CheckCircle className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
              <Clock className="w-8 h-8" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            {isReady ? t.readyTitle : t.pendingTitle}
          </h2>
          <p className="text-gray-600">
            {isReady ? t.readyDescription : t.pendingDescription}
          </p>
        </div>

        {isReady && (
          <div className="bg-green-50 p-6 rounded-xl border border-green-100 text-left space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-green-700 mt-1 shrink-0" />
              <div>
                <p className="text-lg md:text-xl font-medium text-green-900">{t.pickupLocation}</p>
                <p className="text-2xl md:text-3xl font-bold text-green-800">{candidate.current_location}</p>
              </div>
            </div>
            <div className="text-xs text-green-700 pt-2 border-t border-green-200">
              {t.instructions}
            </div>
          </div>
        )}

        <Button onClick={onReset} variant="outline" className="mt-4">
          {t.newSearch}
        </Button>
      </div>
    </Card>
  );
};
