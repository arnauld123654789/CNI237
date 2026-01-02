import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { UserCheck } from 'lucide-react';

export const Verification = ({ candidate, onVerify, onFail }) => {
    const [stage, setStage] = useState('CONFIRM_PARENTS'); // CONFIRM_PARENTS | ENTER_BIRTH_YEAR
    const [birthYear, setBirthYear] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = (ok) => {
        if (!ok) {
            const msg = "Les noms des parents ne correspondent pas.";
            if (onFail) onFail(msg);
            return;
        }
        setStage('ENTER_BIRTH_YEAR');
    };

    const handleSubmitBirth = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        await new Promise(r => setTimeout(r, 600));

        const candidateYear = new Date(candidate.birth_date).getFullYear().toString();
        if ((birthYear || '').trim() === candidateYear) {
            onVerify();
        } else {
            const msg = "L'année de naissance ne correspond pas.";
            setError(msg);
            if (onFail) onFail(msg);
        }
        setIsLoading(false);
    };

    return (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="bg-brand-50 border-b-brand-100">
                <h2 className="text-xl font-semibold text-brand-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Vérification d'identité
                </h2>
                <p className="text-sm text-brand-600 mt-1">
                    Pour protéger vos données, veuillez confirmer votre identité.
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                    <p className="font-bold text-blue-900 mb-3 text-lg md:text-xl">Informations trouvées :</p>
                    <ul className="list-disc list-inside text-blue-800 space-y-3">
                        <li className="text-2xl md:text-3xl">Père : <strong className="text-3xl md:text-4xl">{candidate.father_name}</strong></li>
                        <li className="text-2xl md:text-3xl">Mère : <strong className="text-3xl md:text-4xl">{candidate.mother_name}</strong></li>
                    </ul>
                </div>

                {stage === 'CONFIRM_PARENTS' && (
                    <div className="space-y-4">
                        <p className="text-base md:text-lg text-slate-700">Confirmez-vous que ces noms sont ceux de vos parents ?</p>
                        <div className="flex gap-3">
                            <Button className="flex-1 bg-brand-600 hover:bg-brand-700" onClick={() => handleConfirm(true)}>Oui, je confirme</Button>
                            <Button className="flex-1" variant="outline" onClick={() => handleConfirm(false)}>Non</Button>
                        </div>
                    </div>
                )}

                {stage === 'ENTER_BIRTH_YEAR' && (
                    <form onSubmit={handleSubmitBirth} className="space-y-4">
                        <Input
                            label="Quelle est votre année de naissance ?"
                            placeholder="Ex: 1990"
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
                            Continuer
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
};
