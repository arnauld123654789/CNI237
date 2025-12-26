import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

export const SearchForm = ({ onSearch, documentType = 'CNI', className }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const docLabels = {
        CNI: 'de CNI',
        PASSPORT: 'de Passeport',
        BIRTH_CERT: "d'Acte de Naissance",
        OTHER: 'de Document'
    };

    const label = docLabels[documentType] || docLabels.CNI;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate generic delay for nicer UX
        await new Promise(resolve => setTimeout(resolve, 800));
        await onSearch(formData);
        setIsLoading(false);
    };

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.id]: e.target.value
        }));
    };

    return (
        <Card className={className}>
            <CardHeader className="bg-brand-50 border-b-brand-100">
                <h2 className="text-xl font-semibold text-brand-900 flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Recherche {label}
                </h2>
                <p className="text-sm text-brand-600 mt-1">
                    Remplissez les informations ci-dessous pour localiser votre {documentType === 'CNI' ? 'carte' : 'document'}.
                </p>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        id="lastName"
                        label="Nom de famille"
                        placeholder="Ex: Tchangang"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        id="firstName"
                        label="Prénom"
                        placeholder="Ex: Paul"
                        value={formData.firstName}
                        onChange={handleChange}
                    />
                    <Input
                        id="phone"
                        label="Numéro de téléphone"
                        placeholder="Ex: 699..."
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                    />

                    <Button
                        type="submit"
                        className="w-full mt-4 bg-brand-600 hover:bg-brand-700"
                        isLoading={isLoading}
                    >
                        Rechercher mon {documentType === 'CNI' ? 'carte' : 'document'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};
