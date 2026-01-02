import React, { useEffect, useState } from 'react';
import { pickupPointsService } from '../../services/pickupPointsService';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const PickupPoints = () => {
  const [points, setPoints] = useState([]);
  const [form, setForm] = useState({ name: '', address: '', lat: '', lng: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const list = await pickupPointsService.list();
      setPoints(list);
    } catch (e) {
      setError('Erreur de chargement des points de retrait.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const addPoint = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const lat = parseFloat(form.lat);
      const lng = parseFloat(form.lng);
      if (isNaN(lat) || isNaN(lng)) {
        setError('Coordonnées invalides.');
      } else {
        await pickupPointsService.add({ name: form.name.trim(), address: form.address.trim(), lat, lng });
        setForm({ name: '', address: '', lat: '', lng: '' });
        await load();
      }
    } catch (e) {
      setError('Impossible d’ajouter le point.');
    } finally {
      setLoading(false);
    }
  };

  const updatePoint = async (id, update) => {
    try {
      setLoading(true);
      await pickupPointsService.update(id, update);
      await load();
    } catch (e) {
      setError('Échec de la mise à jour.');
    } finally {
      setLoading(false);
    }
  };

  const removePoint = async (id) => {
    try {
      setLoading(true);
      await pickupPointsService.remove(id);
      await load();
    } catch (e) {
      setError('Suppression impossible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl md:text-3xl font-bold">Gestion des points de retrait</h2>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Ajouter un point</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={addPoint} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input id="name" label="Nom" value={form.name} onChange={handleChange} required />
            <Input id="address" label="Adresse" value={form.address} onChange={handleChange} required />
            <Input id="lat" label="Latitude" value={form.lat} onChange={handleChange} required />
            <Input id="lng" label="Longitude" value={form.lng} onChange={handleChange} required />
            <div className="md:col-span-2">
              <Button type="submit" className="bg-brand-600 hover:bg-brand-700" isLoading={loading}>Ajouter</Button>
              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Liste des points</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Nom</th>
                  <th className="p-2">Adresse</th>
                  <th className="p-2">Coordonnées</th>
                  <th className="p-2">Carte</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {points.map(p => (
                  <tr key={p.id} className="border-b">
                    <td className="p-2 font-medium">{p.name}</td>
                    <td className="p-2">{p.address}</td>
                    <td className="p-2 text-sm">{p.lat}, {p.lng}</td>
                    <td className="p-2">
                      {p.lat && p.lng && (
                        <iframe
                          title={`Map-${p.id}`}
                          className="w-64 h-40 rounded-lg border"
                          src={`https://maps.google.com/maps?q=${p.lat},${p.lng}&z=15&output=embed`}
                          loading="lazy"
                        />
                      )}
                    </td>
                    <td className="p-2 space-x-2">
                      <Button variant="outline" onClick={() => updatePoint(p.id, { name: p.name + ' *' })}>Edit</Button>
                      <Button className="bg-red-600 hover:bg-red-700" onClick={() => removePoint(p.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
                {points.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-slate-600">Aucun point disponible.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};