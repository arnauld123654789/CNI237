import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from './auth.js';

export const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">Admin Portal</h1>
          <nav className="flex items-center gap-4 text-sm">
            <Link className="hover:text-brand-700" to="/admin/dashboard">Dashboard</Link>
            <Link className="hover:text-brand-700" to="/admin/pickup-points">Pickup Points</Link>
            <Link className="hover:text-brand-700" to="/admin/users">Users</Link>
            <button onClick={handleLogout} className="text-red-600 hover:text-red-700">Logout</button>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};