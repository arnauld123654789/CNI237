import React from 'react';
import { Container } from '../ui/Container';

export const Footer = () => {
    return (
        <footer className="bg-gray-50 py-8 mt-auto border-t border-gray-200">
            <Container className="text-center">
                <p className="text-sm text-gray-500">
                    © {new Date().getFullYear()} CNI 237 - République du Cameroun
                </p>
                <p className="text-xs text-gray-400 mt-2">
                    Plateforme citoyenne d'information - version 1.0.0
                </p>
            </Container>
        </footer>
    );
};
