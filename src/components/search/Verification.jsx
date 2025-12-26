import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ShieldCheck, UserCheck } from 'lucide-react';

export const Verification = ({ candidate, onVerify }) => {
    const [birthYear, setBirthYear] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Simulate network delay
        await new Promise(r => setTimeout(r, 600));

        const candidateYear = new Date(candidate.birth_date).getFullYear().toString();
        if (birthYear === candidateYear) {
            onVerify();
        } else {
            setError("L'année de naissance ne correspond pas.");
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
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm">
                    <p className="font-medium text-blue-900 mb-1">Information trouvée :</p>
                    <ul className="list-disc list-inside text-blue-800 space-y-1">
                        <li>Père : <strong>{candidate.father_name}</strong></li>
                        <li>Mère : <strong>{candidate.mother_name}</strong></li>
                    </ul>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                        Vérifier
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};
