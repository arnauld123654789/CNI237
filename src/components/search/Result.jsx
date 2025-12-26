import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { MapPin, CheckCircle, Clock } from 'lucide-react';

export const Result = ({ candidate, onReset }) => {
    const isReady = candidate.status === 'READY' || candidate.status === 'ISSUED';

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
                    <h2 className="text-2xl font-bold text-gray-900">
                        {isReady ? 'Carte disponible !' : 'En cours de production'}
                    </h2>
                    <p className="text-gray-600">
                        {isReady
                            ? "Excellente nouvelle, votre carte nationale d'identité est prête."
                            : "Votre carte n'a pas encore été émise ou expédiée."}
                    </p>
                </div>

                {isReady && (
                    <div className="bg-green-50 p-6 rounded-xl border border-green-100 text-left space-y-4">
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-green-700 mt-1 shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-green-900">Lieu de retrait</p>
                                <p className="text-lg font-bold text-green-800">{candidate.current_location}</p>
                            </div>
                        </div>
                        <div className="text-xs text-green-700 pt-2 border-t border-green-200">
                            Présentez-vous avec votre récépissé muni de vos documents d'identification.
                        </div>
                    </div>
                )}

                <Button onClick={onReset} variant="outline" className="mt-4">
                    Nouvelle recherche
                </Button>
            </div>
        </Card>
    );
};
