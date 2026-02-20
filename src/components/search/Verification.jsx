import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { UserCheck } from 'lucide-react';

const VERIFICATION_TEXT = {
  fr: {
    heading: "Verification d'identite",
    subtitle: 'Pour proteger vos donnees, veuillez confirmer votre identite.',
    foundInfo: 'Informations trouvees :',
    father: 'Pere',
    mother: 'Mere',
    confirmQuestion: 'Confirmez-vous que ces noms sont ceux de vos parents ?',
    yes: 'Oui, je confirme',
    no: 'Non',
    birthYearQuestion: 'Quelle est votre annee de naissance ?',
    birthYearPlaceholder: 'Ex: 1990',
    continue: 'Continuer',
    parentsMismatch: 'Les noms des parents ne correspondent pas.',
    birthYearMismatch: "L'annee de naissance ne correspond pas."
  },
  en: {
    heading: 'Identity verification',
    subtitle: 'To protect your data, please confirm your identity.',
    foundInfo: 'Found information:',
    father: 'Father',
    mother: 'Mother',
    confirmQuestion: 'Do you confirm these are your parents names?',
    yes: 'Yes, I confirm',
    no: 'No',
    birthYearQuestion: 'What is your birth year?',
    birthYearPlaceholder: 'Ex: 1990',
    continue: 'Continue',
    parentsMismatch: 'Parents names do not match.',
    birthYearMismatch: 'Birth year does not match.'
  }
};

export const Verification = ({ candidate, onVerify, onFail, language = 'fr' }) => {
  const [stage, setStage] = useState('CONFIRM_PARENTS');
  const [birthYear, setBirthYear] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const t = VERIFICATION_TEXT[language] || VERIFICATION_TEXT.fr;

  const handleConfirm = (ok) => {
    if (!ok) {
      if (onFail) onFail(t.parentsMismatch);
      return;
    }
    setStage('ENTER_BIRTH_YEAR');
  };

  const handleSubmitBirth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    await new Promise((r) => setTimeout(r, 600));

    const candidateYear = new Date(candidate.birth_date).getFullYear().toString();
    if ((birthYear || '').trim() === candidateYear) {
      onVerify();
    } else {
      setError(t.birthYearMismatch);
      if (onFail) onFail(t.birthYearMismatch);
    }
    setIsLoading(false);
  };

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="bg-brand-50 border-b-brand-100">
        <h2 className="text-xl font-semibold text-brand-900 flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          {t.heading}
        </h2>
        <p className="text-sm text-brand-600 mt-1">
          {t.subtitle}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
          <p className="font-bold text-blue-900 mb-3 text-lg md:text-xl">{t.foundInfo}</p>
          <ul className="list-disc list-inside text-blue-800 space-y-3">
            <li className="text-2xl md:text-3xl">
              {t.father}: <strong className="text-3xl md:text-4xl">{candidate.father_name}</strong>
            </li>
            <li className="text-2xl md:text-3xl">
              {t.mother}: <strong className="text-3xl md:text-4xl">{candidate.mother_name}</strong>
            </li>
          </ul>
        </div>

        {stage === 'CONFIRM_PARENTS' && (
          <div className="space-y-4">
            <p className="text-base md:text-lg text-slate-700">{t.confirmQuestion}</p>
            <div className="flex gap-3">
              <Button className="flex-1 bg-brand-600 hover:bg-brand-700" onClick={() => handleConfirm(true)}>
                {t.yes}
              </Button>
              <Button className="flex-1" variant="outline" onClick={() => handleConfirm(false)}>
                {t.no}
              </Button>
            </div>
          </div>
        )}

        {stage === 'ENTER_BIRTH_YEAR' && (
          <form onSubmit={handleSubmitBirth} className="space-y-4">
            <Input
              label={t.birthYearQuestion}
              placeholder={t.birthYearPlaceholder}
              type="number"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              error={error}
              required
              min="1900"
              max={new Date().getFullYear()}
            />
            <Button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700"
              isLoading={isLoading}
            >
              {t.continue}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};
