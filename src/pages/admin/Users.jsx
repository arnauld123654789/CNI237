import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { listCniData, addCniRecord, updateCniRecord, removeCniRecord } from '../../services/cniAdminService.js';
import { Modal } from '../../components/ui/Modal';
import { pickupPointsService } from '../../services/pickupPointsService';

export const Users = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ first_name: '', last_name: '', father_name: '', mother_name: '', birth_date: '', issue_place: '', current_location: '', pickup_point_id: null, phone: '', status: 'en cours de traitement' });
  // Editing via modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', father_name: '', mother_name: '', birth_date: '', issue_place: '', current_location: '', pickup_point_id: null, phone: '', status: 'en cours de traitement' });
  const [locations, setLocations] = useState([]);
  // Search and filters
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ name: '', phone: '', location: '', status: '' });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [data, points] = await Promise.all([listCniData(), pickupPointsService.list()]);
        setRecords(data);
        setLocations(points);
      } catch (e) {
        console.error(e);
        setError("Impossible de charger les enregistrements ou les points de retrait.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refresh = async () => {
    const data = await listCniData();
    setRecords(data);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await addCniRecord(form);
      setForm({ first_name: '', last_name: '', father_name: '', mother_name: '', birth_date: '', issue_place: '', current_location: '', phone: '', status: '' });
      await refresh();
    } catch (e) {
      console.error(e);
      setError("Échec de l'ajout. Vérifiez la configuration Supabase et réessayez.");
    }
  };

  const startEdit = (r) => {
    setEditingRecord(r);
    setIsEditOpen(true);
    setEditForm({
      first_name: r.first_name || '',
      last_name: r.last_name || '',
      father_name: r.father_name || '',
      mother_name: r.mother_name || '',
      birth_date: r.birth_date || '',
      issue_place: r.issue_place || '',
      current_location: r.current_location || '',
      pickup_point_id: r.pickup_point_id ?? null,
      phone: r.phone || '',
      status: r.status || 'en cours de traitement'
    });
  };

  const cancelEdit = () => {
    setIsEditOpen(false);
    setEditingRecord(null);
    setEditForm({ first_name: '', last_name: '', father_name: '', mother_name: '', birth_date: '', issue_place: '', current_location: '', phone: '', status: '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await updateCniRecord(editingRecord.id, editForm);
      cancelEdit();
      await refresh();
    } catch (e) {
      console.error(e);
      setError("Échec de la mise à jour. Réessayez.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      await removeCniRecord(id);
      await refresh();
    } catch (e) {
      console.error(e);
      setError("Échec de la suppression. Réessayez.");
    }
  };

  const norm = (v) => (v || '').toString().toLowerCase();
  const filterName = (r) => {
    const name = `${r.first_name || ''} ${r.last_name || ''}`.trim();
    return norm(name).includes(norm(filters.name));
  };
  const filterPhone = (r) => norm(r.phone || '').includes(norm(filters.phone));
  const filterLocation = (r) => {
    const locName = (() => { const m = locations.find(p => p.id === r.pickup_point_id); return m ? m.name : (r.current_location || ''); })();
    return norm(locName).includes(norm(filters.location));
  };
  const filterStatus = (r) => norm(r.status || '').includes(norm(filters.status));
  const filterGlobal = (r) => {
    const haystack = [
      r.first_name, r.last_name, r.father_name, r.mother_name,
      r.phone, r.issue_place, r.current_location, r.status
    ];
    const locName = (() => { const m = locations.find(p => p.id === r.pickup_point_id); return m ? m.name : ''; })();
    haystack.push(locName);
    const q = norm(query);
    return q === '' || haystack.some(v => norm(v || '').includes(q));
  };
  const filteredRecords = records.filter(r => filterGlobal(r) && filterName(r) && filterPhone(r) && filterLocation(r) && filterStatus(r));

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <h2 className="text-xl md:text-2xl font-bold">Enregistrements CNI (cni_data)</h2>
          <p className="text-sm text-slate-600">Gérez les données des citoyens et associez un point de retrait existant.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input id="first_name" label="Prénom" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
            <Input id="last_name" label="Nom" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
            <Input id="father_name" label="Nom du père" value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })} />
            <Input id="mother_name" label="Nom de la mère" value={form.mother_name} onChange={(e) => setForm({ ...form, mother_name: e.target.value })} />
            <Input id="birth_date" label="Date de naissance" type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
            <Input id="issue_place" label="Lieu d'émission" value={form.issue_place} onChange={(e) => setForm({ ...form, issue_place: e.target.value })} />
            <div>
              <label className="block text-xs text-slate-600 mb-1">Point de retrait</label>
              <select
                className="w-full border border-slate-300 rounded px-3 py-2"
                value={form.pickup_point_id ?? ''}
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : null;
                  const selected = locations.find((p) => p.id === id) || null;
                  setForm({
                    ...form,
                    pickup_point_id: id,
                    current_location: selected ? selected.name : ''
                  });
                }}
              >
                <option value="">Sélectionner…</option>
                {locations.map((p) => (<option key={p.id} value={p.id}>{p.name} — {p.address}</option>))}
              </select>
            </div>
            <Input id="phone" label="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <div>
              <label className="block text-xs text-slate-600 mb-1">Statut</label>
              <select
                className="w-full border border-slate-300 rounded px-3 py-2"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="en cours de traitement">En cours de traitement</option>
                <option value="Disponible">Disponible</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="bg-brand-600 hover:bg-brand-700">Ajouter</Button>
            </div>
          </form>
          {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg md:text-xl font-semibold">Liste</h3>
          <div className="mt-3">
            <Input id="global_search" label="Recherche" placeholder="Nom, téléphone, lieu, statut…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-600">Chargement…</p>
          ) : records.length === 0 ? (
            <p className="text-slate-600">Aucun enregistrement CNI.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-200">
                    <th className="py-2 pr-4">Nom</th>
                    <th className="py-2 pr-4">Téléphone</th>
                    <th className="py-2 pr-4">Lieu actuel</th>
                    <th className="py-2 pr-4">Statut</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                  {/* Filters Row */}
                  <tr className="text-left border-b border-slate-100 bg-slate-50">
                    <th className="py-2 pr-4">
                      <input
                        aria-label="Filtrer par nom"
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                        placeholder="Filtrer nom…"
                        value={filters.name}
                        onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                      />
                    </th>
                    <th className="py-2 pr-4">
                      <input
                        aria-label="Filtrer par téléphone"
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                        placeholder="Filtrer téléphone…"
                        value={filters.phone}
                        onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
                      />
                    </th>
                    <th className="py-2 pr-4">
                      <input
                        aria-label="Filtrer par lieu"
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                        placeholder="Filtrer lieu…"
                        value={filters.location}
                        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                      />
                    </th>
                    <th className="py-2 pr-4">
                      <input
                        aria-label="Filtrer par statut"
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                        placeholder="Filtrer statut…"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      />
                    </th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100">
                      <td className="py-2 pr-4">
                        <span className="font-medium">{r.first_name} {r.last_name}</span>
                      </td>
                      <td className="py-2 pr-4">
                        <span>{r.phone || '—'}</span>
                      </td>
                      <td className="py-2 pr-4">
                        <span className="text-slate-600">{(() => { const m = locations.find(p => p.id === r.pickup_point_id); return m ? m.name : (r.current_location || '—'); })()}</span>
                      </td>
                      <td className="py-2 pr-4">
                        <span className="text-slate-600">{r.status || '—'}</span>
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-2">
                          <Button onClick={() => startEdit(r)} className="bg-brand-600 hover:bg-brand-700">Modifier</Button>
                          <Button onClick={() => handleDelete(r.id)} className="bg-red-600 hover:bg-red-700">Supprimer</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        title="Modifier l'enregistrement"
        description={(
          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input id="edit_first_name" label="Prénom" value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} required />
            <Input id="edit_last_name" label="Nom" value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} required />
            <Input id="edit_father_name" label="Nom du père" value={editForm.father_name} onChange={(e) => setEditForm({ ...editForm, father_name: e.target.value })} />
            <Input id="edit_mother_name" label="Nom de la mère" value={editForm.mother_name} onChange={(e) => setEditForm({ ...editForm, mother_name: e.target.value })} />
            <Input id="edit_birth_date" type="date" label="Date de naissance" value={editForm.birth_date} onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })} />
            <Input id="edit_issue_place" label="Lieu d'émission" value={editForm.issue_place} onChange={(e) => setEditForm({ ...editForm, issue_place: e.target.value })} />
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-600 mb-1">Point de retrait</label>
              <select
                className="w-full border border-slate-300 rounded px-3 py-2"
                value={editForm.pickup_point_id ?? ''}
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : null;
                  const selected = locations.find((p) => p.id === id) || null;
                  setEditForm({
                    ...editForm,
                    pickup_point_id: id,
                    current_location: selected ? selected.name : ''
                  });
                }}
              >
                <option value="">Sélectionner…</option>
                {locations.map((p) => (<option key={p.id} value={p.id}>{p.name} — {p.address}</option>))}
              </select>
            </div>
            <Input id="edit_phone" label="Téléphone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            <div>
              <label className="block text-xs text-slate-600 mb-1">Statut</label>
              <select
                className="w-full border border-slate-300 rounded px-3 py-2"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                <option value="en cours de traitement">En cours de traitement</option>
                <option value="Disponible">Disponible</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" className="bg-brand-600 hover:bg-brand-700 flex-1">Enregistrer</Button>
              <Button type="button" className="bg-slate-200 text-slate-900 flex-1" onClick={cancelEdit}>Annuler</Button>
            </div>
          </form>
        )}
        onClose={cancelEdit}
        actions={[]}
        className="p-4"
      />
    </div>
  );
};