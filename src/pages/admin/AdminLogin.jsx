import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from './auth.js';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 400));
    if (login(username.trim(), password)) {
      navigate('/admin/dashboard');
    } else {
      setError('Identifiants administrateur invalides.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h2 className="text-xl font-bold">Connexion Admin</h2>
          <p className="text-sm text-slate-600">Accédez aux outils de gestion sécurisés.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input id="username" label="Nom d'utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <Input id="password" label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required error={error} />
            <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-700" isLoading={loading}>Se connecter</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};