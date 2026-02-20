import React from 'react';
import { Container } from '../ui/Container';

const FOOTER_TEXT = {
  fr: {
    country: 'Republique du Cameroun',
    subtitle: "Plateforme citoyenne d'information - version 1.0.0"
  },
  en: {
    country: 'Republic of Cameroon',
    subtitle: 'Citizen information platform - version 1.0.0'
  }
};

export const Footer = ({ language = 'fr' }) => {
  const t = FOOTER_TEXT[language] || FOOTER_TEXT.fr;

  return (
    <footer className="bg-gray-50 py-8 mt-auto border-t border-gray-200">
      <Container className="text-center">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} CNI 237 - {t.country}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          {t.subtitle}
        </p>
      </Container>
    </footer>
  );
};
