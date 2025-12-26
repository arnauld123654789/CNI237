import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Sidebar } from './Sidebar';

export const Layout = ({ children, isSidebarOpen, setIsSidebarOpen, documentType, setDocumentType }) => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                currentType={documentType}
                onSelectType={setDocumentType}
            />
            <Header onOpenSidebar={() => setIsSidebarOpen(true)} />
            <main className="flex-grow flex flex-col">
                {children}
            </main>
            <Footer />
        </div>
    );
};
