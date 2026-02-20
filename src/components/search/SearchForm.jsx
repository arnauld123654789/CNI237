import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Search } from 'lucide-react';

const SEARCH_TEXT = {
  fr: {
    headingPrefix: 'Recherche',
    subtitleCard: 'Remplissez les informations ci-dessous pour localiser votre carte.',
    subtitleDocument: 'Remplissez les informations ci-dessous pour localiser votre document.',
    lastNameLabel: 'Nom de famille',
    lastNamePlaceholder: 'Ex: Tchangang',
    firstNameLabel: 'Prenom',
    firstNamePlaceholder: 'Ex: Paul',
    phoneLabel: 'Numero de telephone',
    phonePlaceholder: 'Ex: 699...',
    submitCard: 'Rechercher carte',
    submitDocument: 'Rechercher document',
    docs: {
      CNI: 'de CNI',
      PASSPORT: 'de passeport',
      BIRTH_CERT: "d'acte de naissance",
      OTHER: 'de document'
    }
  },
  en: {
    headingPrefix: 'Search',
    subtitleCard: 'Fill in the fields below to locate your card.',
    subtitleDocument: 'Fill in the fields below to locate your document.',
    lastNameLabel: 'Last name',
    lastNamePlaceholder: 'Ex: Tchangang',
    firstNameLabel: 'First name',
    firstNamePlaceholder: 'Ex: Paul',
    phoneLabel: 'Phone number',
    phonePlaceholder: 'Ex: 699...',
    submitCard: 'Search card',
    submitDocument: 'Search document',
    docs: {
      CNI: 'for CNI',
      PASSPORT: 'for passport',
      BIRTH_CERT: 'for birth certificate',
      OTHER: 'for document'
    }
  }
};

export const SearchForm = ({ onSearch, documentType = 'CNI', className, language = 'fr' }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const t = SEARCH_TEXT[language] || SEARCH_TEXT.fr;
  const docLabel = t.docs[documentType] || t.docs.CNI;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const sanitized = {
      firstName: (formData.firstName || '').trim(),
      lastName: (formData.lastName || '').trim(),
      phone: (formData.phone || '').trim()
    };
    await onSearch(sanitized);
    setIsLoading(false);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  return (
    <Card className={className}>
      <CardHeader className="bg-brand-50 border-b-brand-100">
        <h2 className="text-xl font-semibold text-brand-900 flex items-center gap-2">
          <Search className="w-5 h-5" />
          {t.headingPrefix} {docLabel}
        </h2>
        <p className="text-sm text-brand-600 mt-1">
          {documentType === 'CNI' ? t.subtitleCard : t.subtitleDocument}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="lastName"
            label={t.lastNameLabel}
            placeholder={t.lastNamePlaceholder}
            value={formData.lastName}
            onChange={handleChange}
            required
          />
          <Input
            id="firstName"
            label={t.firstNameLabel}
            placeholder={t.firstNamePlaceholder}
            value={formData.firstName}
            onChange={handleChange}
          />
          <Input
            id="phone"
            label={t.phoneLabel}
            placeholder={t.phonePlaceholder}
            type="tel"
            value={formData.phone}
            onChange={handleChange}
          />

          <Button
            type="submit"
            className="w-full mt-4 bg-brand-600 hover:bg-brand-700"
            isLoading={isLoading}
          >
            {documentType === 'CNI' ? t.submitCard : t.submitDocument}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
