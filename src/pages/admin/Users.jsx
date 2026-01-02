import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { listCniData, addCniRecord, updateCniRecord, removeCniRecord } from '../../services/cniAdminService.js';
import { Modal } from '../../components/ui/Modal';
import { pickupPointsService } from '../../services/pickupPointsService';
import { aiService } from '../../services/aiService.js';
import { Sparkles, Upload, Scan, Loader2 } from 'lucide-react';

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

  // AI State
  const [useAI, setUseAI] = useState(false);
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [agentMessage, setAgentMessage] = useState('');

  const handleImageChange = (e, setImg) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImg(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!frontImage || !backImage) {
      setError("Veuillez charger les photos du RECTO et du VERSO de la CNI.");
      return;
    }
    setAnalyzing(true);
    setError('');

    // Sequence of messages to simulate agent "thought"
    const steps = [
      "Initialisation de l'agent visuel...",
      "Numérisation du RECTO de la CNI...",
      "Numérisation du VERSO de la CNI...",
      "Extraction des textes et validation...",
      "Structuration des données..."
    ];

    let stepIndex = 0;
    setAgentMessage(steps[0]);

    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setAgentMessage(steps[stepIndex]);
      }
    }, 1500);

    try {
      const fBase64 = frontImage.split(',')[1];
      const bBase64 = backImage.split(',')[1];

      const data = await aiService.extractCniData(fBase64, bBase64);

      setForm(prev => ({
        ...prev,
        ...data,
        status: 'en cours de traitement'
      }));

      // Success! Turn off AI mode to show the filled form
      setUseAI(false);
      setFrontImage(null);
      setBackImage(null);
    } catch (err) {
      console.error(err);
      setError("Échec de l'analyse IA. Veuillez vérifier les images ou remplir manuellement.");
    } finally {
      clearInterval(interval);
      setAnalyzing(false);
    }
  };

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
          <div className="mb-6 flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Remplissage Automatique IA</p>
                <p className="text-xs text-slate-500">Scanner une CNI pour remplir le formulaire</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUseAI(!useAI)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useAI ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useAI ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {useAI ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              {analyzing ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
                    <div className="relative bg-white p-4 rounded-full shadow-lg border border-indigo-100">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Analyse en cours...</h3>
                    <p className="text-slate-500 font-mono text-sm mt-1">{agentMessage}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Front Image Upload */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Recto de la CNI</label>
                    <div className="relative group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, setFrontImage)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors ${frontImage ? 'border-indigo-300 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                        {frontImage ? (
                          <>
                            <img src={frontImage} alt="Recto Preview" className="h-32 object-contain mb-2 rounded shadow-sm" />
                            <p className="text-xs text-indigo-600 font-medium">Image chargée</p>
                          </>
                        ) : (
                          <>
                            <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                              <Upload className="w-5 h-5 text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-600 font-medium">Cliquez pour charger ou photo</p>
                            <p className="text-xs text-slate-400 mt-1">Recto de la carte</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Back Image Upload */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Verso de la CNI</label>
                    <div className="relative group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, setBackImage)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors ${backImage ? 'border-indigo-300 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                        {backImage ? (
                          <>
                            <img src={backImage} alt="Verso Preview" className="h-32 object-contain mb-2 rounded shadow-sm" />
                            <p className="text-xs text-indigo-600 font-medium">Image chargée</p>
                          </>
                        ) : (
                          <>
                            <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                              <Upload className="w-5 h-5 text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-600 font-medium">Cliquez pour charger ou photo</p>
                            <p className="text-xs text-slate-400 mt-1">Verso de la carte</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Button
                      type="button"
                      onClick={handleAnalyze}
                      disabled={!frontImage || !backImage}
                      className="w-full h-12 text-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md flex items-center justify-center gap-2"
                    >
                      <Scan className="w-5 h-5" />
                      Lancer l&apos;analyse IA
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
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
                <Button type="submit" className="bg-brand-600 hover:bg-brand-700 w-full md:w-auto">Ajouter</Button>
              </div>
            </form>
          )}
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