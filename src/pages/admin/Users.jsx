import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { MultiValueAutocomplete } from '../../components/ui/MultiValueAutocomplete';
import { listCniData, addCniRecord, updateCniRecord, removeCniRecord } from '../../services/cniAdminService.js';
import { Modal } from '../../components/ui/Modal';
import { pickupPointsService } from '../../services/pickupPointsService';
import { aiService } from '../../services/aiService.js';
import { formatMultiValueText, parseMultiValueText } from '../../lib/multiValueText';
import { Sparkles, Upload, Scan, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';

const MAX_IMAGE_SIZE_BYTES = 1024 * 1024; // 1 MB
const START_QUALITY = 0.95;
const MIN_QUALITY = 0.82;
const QUALITY_STEP = 0.05;
const SCALE_STEP = 0.9;
const MIN_SHORT_SIDE = 900;
const MAX_COMPRESSION_PASSES = 12;

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Failed to read image file.'));
  reader.readAsDataURL(file);
});

const dataUrlSizeBytes = (dataUrl) => {
  const base64 = (dataUrl || '').split(',')[1] || '';
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
};

const loadImageFromDataUrl = (dataUrl) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error('Failed to decode image.'));
  img.src = dataUrl;
});

const renderJpegDataUrl = (img, width, height, quality) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context is not available.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
};

const compressImageIfNeeded = async (file) => {
  const originalDataUrl = await readFileAsDataUrl(file);

  // Only compress when the uploaded file itself is above 1MB.
  if (file.size <= MAX_IMAGE_SIZE_BYTES) {
    return originalDataUrl;
  }

  const img = await loadImageFromDataUrl(originalDataUrl);
  const originalWidth = img.naturalWidth || img.width;
  const originalHeight = img.naturalHeight || img.height;

  if (!originalWidth || !originalHeight) {
    return originalDataUrl;
  }

  let bestDataUrl = originalDataUrl;
  let quality = START_QUALITY;
  let scale = 1;
  let pass = 0;

  while (pass < MAX_COMPRESSION_PASSES) {
    const width = Math.max(1, Math.round(originalWidth * scale));
    const height = Math.max(1, Math.round(originalHeight * scale));
    const candidate = renderJpegDataUrl(img, width, height, quality);
    const candidateSize = dataUrlSizeBytes(candidate);

    bestDataUrl = candidate;
    if (candidateSize <= MAX_IMAGE_SIZE_BYTES) {
      return candidate;
    }

    if (quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
    } else {
      const shortestSide = Math.min(width, height);
      if (shortestSide <= MIN_SHORT_SIDE) {
        return bestDataUrl;
      }
      scale *= SCALE_STEP;
    }

    pass += 1;
  }

  return bestDataUrl;
};

const formatDateDisplay = (isoDate) => {
  if (!isoDate) return 'N/A';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('fr-FR');
};

const toCardField = (value, fallback = 'N/A') => {
  const text = (value || '').toString().trim();
  return text || fallback;
};

const MEDICAL_ALLERGY_SUGGESTIONS = [
  'Penicilline',
  'Arachides',
  'Fruits a coque',
  'Lait',
  'Oeufs',
  'Soja',
  'Poisson',
  'Crustaces',
  'Latex',
  "Piqures d'abeille",
  'Sulfamides',
  'Ibuprofene'
];

const CHRONIC_DISEASE_SUGGESTIONS = [
  'Diabete type 1',
  'Diabete type 2',
  'Hypertension arterielle',
  'Asthme',
  'Epilepsie',
  'Drepanocytose',
  'Insuffisance renale chronique',
  'Insuffisance cardiaque',
  'VIH',
  'Tuberculose',
  'Maladie coronarienne',
  'Hypothyroidie'
];

const MEDICAL_PREFERENCE_SUGGESTIONS = [
  'Pas de transfusion sanguine',
  "Refus de produits derives du sang",
  'Informer la famille avant intervention',
  'Medecin traitant a contacter en priorite',
  'Pas de sedation sans consentement',
  'Pas de reanimation cardiopulmonaire',
  'Preference pour traitement oral si possible'
];

const SMART_LIST_HELPER_TEXT = 'Tapez pour voir les suggestions. Entree ou virgule pour ajouter plusieurs elements.';

const EDITABLE_HEALTH_AND_EMERGENCY_FIELDS = [
  'emergency_contact_1_name',
  'emergency_contact_1_phone',
  'emergency_contact_2_name',
  'emergency_contact_2_phone',
  'medical_allergies',
  'medical_preferences',
  'chronic_diseases'
];

const pickEditableHealthAndEmergencyData = (source) => EDITABLE_HEALTH_AND_EMERGENCY_FIELDS.reduce((acc, field) => {
  acc[field] = source[field];
  return acc;
}, {});

const buildDigitalCardData = (formData) => {
  const firstName = toCardField(formData.first_name, '');
  const lastName = toCardField(formData.last_name, '');
  const fullName = `${firstName} ${lastName}`.trim() || 'IDENTITE NON RENSEIGNEE';
  const allergiesList = parseMultiValueText(formData.medical_allergies);
  const medicalPreferencesList = parseMultiValueText(formData.medical_preferences);
  const chronicDiseasesList = parseMultiValueText(formData.chronic_diseases);

  const seed = `${firstName}|${lastName}|${formData.birth_date || ''}|${formData.issue_place || ''}`.toUpperCase();
  let checksum = 0;
  for (let i = 0; i < seed.length; i += 1) {
    checksum = (checksum * 31 + seed.charCodeAt(i)) % 100000000;
  }
  const ref = `CMR-${String(checksum).padStart(8, '0')}`;

  return {
    fullName: fullName.toUpperCase(),
    firstName: toCardField(formData.first_name),
    lastName: toCardField(formData.last_name),
    fatherName: toCardField(formData.father_name),
    motherName: toCardField(formData.mother_name),
    birthDate: formatDateDisplay(formData.birth_date),
    birthDateRaw: toCardField(formData.birth_date, '--'),
    issuePlace: toCardField(formData.issue_place),
    currentLocation: toCardField(formData.current_location, '--'),
    phone: toCardField(formData.phone, '--'),
    emergencyContact1Name: toCardField(formData.emergency_contact_1_name, '--'),
    emergencyContact1Phone: toCardField(formData.emergency_contact_1_phone, '--'),
    emergencyContact2Name: toCardField(formData.emergency_contact_2_name, '--'),
    emergencyContact2Phone: toCardField(formData.emergency_contact_2_phone, '--'),
    medicalAllergies: allergiesList.length > 0 ? formatMultiValueText(allergiesList) : 'Aucune allergie declaree',
    medicalAllergiesList: allergiesList,
    medicalPreferences: medicalPreferencesList.length > 0 ? formatMultiValueText(medicalPreferencesList) : 'Aucune preference medicale declaree',
    medicalPreferencesList,
    chronicDiseases: chronicDiseasesList.length > 0 ? formatMultiValueText(chronicDiseasesList) : 'Aucune maladie chronique declaree',
    chronicDiseasesList,
    status: toCardField(formData.status, 'en cours de traitement'),
    generatedOn: new Date().toLocaleDateString('fr-FR'),
    ref
  };
};

const createEmptyRecordForm = () => ({
  first_name: '',
  last_name: '',
  father_name: '',
  mother_name: '',
  birth_date: '',
  issue_place: '',
  current_location: '',
  pickup_point_id: null,
  phone: '',
  emergency_contact_1_name: '',
  emergency_contact_1_phone: '',
  emergency_contact_2_name: '',
  emergency_contact_2_phone: '',
  medical_allergies: '',
  medical_preferences: '',
  chronic_diseases: '',
  status: 'en cours de traitement'
});

const DIGITAL_CARD_ANIMATION_CSS = `
@keyframes cardSignalScan {
  0% { transform: translateX(-35%) skewX(-18deg); opacity: 0; }
  15% { opacity: .45; }
  55% { opacity: .2; }
  100% { transform: translateX(135%) skewX(-18deg); opacity: 0; }
}

@keyframes cardSignalGrid {
  0% { background-position: 0 0, 0 0; }
  100% { background-position: 0 64px, 64px 0; }
}

@keyframes cardSignalPulse {
  0%, 100% { opacity: .18; transform: scale(1); }
  50% { opacity: .42; transform: scale(1.06); }
}

.digital-card-grid-signal {
  background-image:
    linear-gradient(to bottom, rgba(148,163,184,.16) 1px, transparent 1px),
    linear-gradient(to right, rgba(56,189,248,.12) 1px, transparent 1px);
  background-size: 24px 24px, 24px 24px;
  animation: cardSignalGrid 6s linear infinite;
}

.digital-card-scan-signal {
  animation: cardSignalScan 3.8s ease-in-out infinite;
}

.digital-card-pulse-orb {
  animation: cardSignalPulse 2.6s ease-in-out infinite;
}
`;

export const Users = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(createEmptyRecordForm);
  // Editing via modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState(createEmptyRecordForm);
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
  const [isCardPreviewOpen, setIsCardPreviewOpen] = useState(false);
  const [cardQrCode, setCardQrCode] = useState('');
  const [isDownloadingCardImage, setIsDownloadingCardImage] = useState(false);
  const cardPreviewRef = useRef(null);

  const cardData = useMemo(() => buildDigitalCardData(form), [form]);
  const canPreviewDigitalCard = Boolean((form.first_name || '').trim() && (form.last_name || '').trim());

  useEffect(() => {
    let cancelled = false;

    const buildQrCode = async () => {
      if (!isCardPreviewOpen) return;
      try {
        const payload = JSON.stringify({
          version: 2,
          ref: cardData.ref,
          generated_on: cardData.generatedOn,
          identity: {
            full_name: cardData.fullName,
            first_name: cardData.firstName,
            last_name: cardData.lastName,
            father_name: cardData.fatherName,
            mother_name: cardData.motherName,
            birth_date: cardData.birthDateRaw,
            birth_date_display: cardData.birthDate,
            issue_place: cardData.issuePlace,
            current_location: cardData.currentLocation,
            phone: cardData.phone,
            status: cardData.status
          },
          emergency_contacts: [
            { name: cardData.emergencyContact1Name, phone: cardData.emergencyContact1Phone },
            { name: cardData.emergencyContact2Name, phone: cardData.emergencyContact2Phone }
          ],
          medical: {
            allergies: cardData.medicalAllergiesList,
            preferences: cardData.medicalPreferencesList,
            chronic_diseases: cardData.chronicDiseasesList
          },
          medical_display: {
            allergies_text: cardData.medicalAllergies,
            preferences_text: cardData.medicalPreferences,
            chronic_diseases_text: cardData.chronicDiseases
          }
        });
        const qrDataUrl = await QRCode.toDataURL(payload, {
          width: 104,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#0f172a',
            light: '#0000'
          }
        });
        if (!cancelled) {
          setCardQrCode(qrDataUrl);
        }
      } catch (err) {
        console.error('QR generation error:', err);
        if (!cancelled) {
          setCardQrCode('');
        }
      }
    };

    buildQrCode();
    return () => {
      cancelled = true;
    };
  }, [isCardPreviewOpen, cardData]);

  const handleOpenCardPreview = () => {
    if (!canPreviewDigitalCard) {
      setError('Veuillez renseigner au moins le prenom et le nom avant la previsualisation.');
      return;
    }
    setError('');
    setIsCardPreviewOpen(true);
  };

  const handleDownloadCardImage = async () => {
    if (isDownloadingCardImage) return;
    if (!cardPreviewRef.current) {
      setError("Impossible de generer l'image de la carte.");
      return;
    }

    setIsDownloadingCardImage(true);
    setError('');

    try {
      const dataUrl = await toPng(cardPreviewRef.current, {
        cacheBust: true,
        pixelRatio: 2.2,
        backgroundColor: '#020617'
      });

      const first = (form.first_name || '').trim().replace(/\s+/g, '_').toLowerCase() || 'prenom';
      const last = (form.last_name || '').trim().replace(/\s+/g, '_').toLowerCase() || 'nom';
      const anchor = document.createElement('a');
      anchor.href = dataUrl;
      anchor.download = `donnees_numerique_du_citoiyen_${first}_${last}_${cardData.ref}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (err) {
      console.error('Card image export error:', err);
      setError("Echec de generation de l'image. Reessayez.");
    } finally {
      setIsDownloadingCardImage(false);
    }
  };

  const handleImageChange = async (e, setImg) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const processedDataUrl = await compressImageIfNeeded(file);
      setImg(processedDataUrl);
    } catch (err) {
      console.error('Image preprocessing error:', err);
      setError("Impossible de traiter l'image. Veuillez reessayer.");
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
      setForm(createEmptyRecordForm());
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
      emergency_contact_1_name: r.emergency_contact_1_name || '',
      emergency_contact_1_phone: r.emergency_contact_1_phone || '',
      emergency_contact_2_name: r.emergency_contact_2_name || '',
      emergency_contact_2_phone: r.emergency_contact_2_phone || '',
      medical_allergies: r.medical_allergies || '',
      medical_preferences: r.medical_preferences || '',
      chronic_diseases: r.chronic_diseases || '',
      status: r.status || 'en cours de traitement'
    });
  };

  const cancelEdit = () => {
    setIsEditOpen(false);
    setEditingRecord(null);
    setEditForm(createEmptyRecordForm());
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const updates = pickEditableHealthAndEmergencyData(editForm);
      await updateCniRecord(editingRecord.id, updates);
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
      r.phone, r.issue_place, r.current_location, r.status,
      r.emergency_contact_1_name, r.emergency_contact_1_phone,
      r.emergency_contact_2_name, r.emergency_contact_2_phone,
      r.medical_allergies, r.medical_preferences, r.chronic_diseases
    ];
    const locName = (() => { const m = locations.find(p => p.id === r.pickup_point_id); return m ? m.name : ''; })();
    haystack.push(locName);
    const q = norm(query);
    return q === '' || haystack.some(v => norm(v || '').includes(q));
  };
  const filteredRecords = records.filter(r => filterGlobal(r) && filterName(r) && filterPhone(r) && filterLocation(r) && filterStatus(r));

  return (
    <div className="space-y-8">
      <style>{DIGITAL_CARD_ANIMATION_CSS}</style>
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
              <div className="md:col-span-2 mt-2">
                <p className="text-sm font-semibold text-slate-800">Personnes a contacter en cas d'urgence</p>
              </div>
              <Input
                id="emergency_contact_1_name"
                label="Contact 1 - Nom"
                value={form.emergency_contact_1_name}
                onChange={(e) => setForm({ ...form, emergency_contact_1_name: e.target.value })}
              />
              <Input
                id="emergency_contact_1_phone"
                label="Contact 1 - Telephone"
                value={form.emergency_contact_1_phone}
                onChange={(e) => setForm({ ...form, emergency_contact_1_phone: e.target.value })}
              />
              <Input
                id="emergency_contact_2_name"
                label="Contact 2 - Nom"
                value={form.emergency_contact_2_name}
                onChange={(e) => setForm({ ...form, emergency_contact_2_name: e.target.value })}
              />
              <Input
                id="emergency_contact_2_phone"
                label="Contact 2 - Telephone"
                value={form.emergency_contact_2_phone}
                onChange={(e) => setForm({ ...form, emergency_contact_2_phone: e.target.value })}
              />
              <div className="md:col-span-2">
                <MultiValueAutocomplete
                  id="medical_allergies"
                  label="Allergies medicales (urgence)"
                  value={form.medical_allergies}
                  suggestions={MEDICAL_ALLERGY_SUGGESTIONS}
                  helperText={SMART_LIST_HELPER_TEXT}
                  placeholder="Ex: Penicilline"
                  onChange={(nextValue) => setForm({ ...form, medical_allergies: nextValue })}
                />
              </div>
              <div className="md:col-span-2">
                <MultiValueAutocomplete
                  id="medical_preferences"
                  label="Preferences medicales"
                  value={form.medical_preferences}
                  suggestions={MEDICAL_PREFERENCE_SUGGESTIONS}
                  helperText={SMART_LIST_HELPER_TEXT}
                  placeholder="Ex: Pas de transfusion sanguine"
                  onChange={(nextValue) => setForm({ ...form, medical_preferences: nextValue })}
                />
              </div>
              <div className="md:col-span-2">
                <MultiValueAutocomplete
                  id="chronic_diseases"
                  label="Maladies chroniques"
                  value={form.chronic_diseases}
                  suggestions={CHRONIC_DISEASE_SUGGESTIONS}
                  helperText={SMART_LIST_HELPER_TEXT}
                  placeholder="Ex: Diabete type 2"
                  onChange={(nextValue) => setForm({ ...form, chronic_diseases: nextValue })}
                />
              </div>
              <div className="md:col-span-2 flex flex-col md:flex-row gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleOpenCardPreview}
                  disabled={!canPreviewDigitalCard}
                  className="w-full md:w-auto"
                >
                  Previsualiser les donnees numerique du citoiyen
                </Button>
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

      <Modal
        isOpen={isCardPreviewOpen}
        title="Previsualisation - donnees numerique du citoiyen"
        description={(
          <div className="space-y-4">
            <div
              ref={cardPreviewRef}
              className="relative overflow-hidden rounded-2xl p-5 text-white border border-slate-500/50 bg-[radial-gradient(circle_at_18%_22%,rgba(34,197,94,.3),transparent_34%),radial-gradient(circle_at_84%_18%,rgba(59,130,246,.35),transparent_38%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#111827_100%)] shadow-2xl"
            >
              <div className="absolute inset-0 pointer-events-none digital-card-grid-signal opacity-40" />
              <div className="absolute inset-y-0 left-[-35%] w-[26%] pointer-events-none bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent blur-sm digital-card-scan-signal" />
              <div className="absolute top-[28%] left-[22%] h-2 w-2 rounded-full bg-cyan-300/60 blur-[1px] digital-card-pulse-orb" />
              <div className="absolute top-[70%] left-[62%] h-1.5 w-1.5 rounded-full bg-emerald-300/60 blur-[1px] digital-card-pulse-orb" style={{ animationDelay: '0.7s' }} />
              <div className="absolute top-[42%] left-[82%] h-1.5 w-1.5 rounded-full bg-sky-300/70 blur-[1px] digital-card-pulse-orb" style={{ animationDelay: '1.2s' }} />
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-cyan-300/20 blur-2xl" />
              <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-emerald-300/20 blur-2xl" />

              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-12 rounded-md border border-amber-900/40 bg-gradient-to-br from-amber-300 via-amber-200 to-yellow-100 shadow-inner" />
                  <div>
                    <p className="text-[10px] tracking-[0.22em] uppercase text-sky-200">Donnees numerique du citoiyen</p>
                    <h4 className="text-lg sm:text-xl font-bold tracking-wide mt-1">{cardData.fullName}</h4>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-slate-300">Republique du Cameroun</p>
                  </div>
                </div>
                <p className="text-[10px] uppercase tracking-[0.1em] text-slate-300">Ref: {cardData.ref}</p>
              </div>

              <div className="relative mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-lg border border-slate-500/40 bg-slate-900/45 p-2.5">
                  <p className="text-[10px] tracking-[0.14em] uppercase text-sky-200">Prenom</p>
                  <p className="mt-1 font-semibold">{cardData.firstName}</p>
                </div>
                <div className="rounded-lg border border-slate-500/40 bg-slate-900/45 p-2.5">
                  <p className="text-[10px] tracking-[0.14em] uppercase text-sky-200">Nom</p>
                  <p className="mt-1 font-semibold">{cardData.lastName}</p>
                </div>
                <div className="rounded-lg border border-slate-500/40 bg-slate-900/45 p-2.5">
                  <p className="text-[10px] tracking-[0.14em] uppercase text-sky-200">Date de naissance</p>
                  <p className="mt-1 font-semibold">{cardData.birthDate}</p>
                </div>
                <div className="rounded-lg border border-slate-500/40 bg-slate-900/45 p-2.5">
                  <p className="text-[10px] tracking-[0.14em] uppercase text-sky-200">Lieu d'emission</p>
                  <p className="mt-1 font-semibold">{cardData.issuePlace}</p>
                </div>
                <div className="rounded-lg border border-slate-500/40 bg-slate-900/45 p-2.5">
                  <p className="text-[10px] tracking-[0.14em] uppercase text-sky-200">Nom du pere</p>
                  <p className="mt-1 font-semibold">{cardData.fatherName}</p>
                </div>
                <div className="rounded-lg border border-slate-500/40 bg-slate-900/45 p-2.5">
                  <p className="text-[10px] tracking-[0.14em] uppercase text-sky-200">Nom de la mere</p>
                  <p className="mt-1 font-semibold">{cardData.motherName}</p>
                </div>
                <div className="sm:col-span-2 rounded-lg border border-slate-500/40 bg-slate-900/45 p-2.5">
                  <p className="text-[10px] tracking-[0.14em] uppercase text-sky-200">Personnes a contacter en cas d'urgence</p>
                  <div className="mt-1.5 space-y-1 text-[11px]">
                    <p className="font-semibold">
                      1. {cardData.emergencyContact1Name} - {cardData.emergencyContact1Phone}
                    </p>
                    <p className="font-semibold">
                      2. {cardData.emergencyContact2Name} - {cardData.emergencyContact2Phone}
                    </p>
                  </div>
                </div>
                <div className="sm:col-span-2 rounded-lg border border-red-400/35 bg-red-900/25 p-2.5">
                  <p className="text-[10px] tracking-[0.14em] uppercase text-red-200">Allergies medicales (urgence)</p>
                  <p className="mt-1 text-[11px] font-semibold text-red-100 break-words">{cardData.medicalAllergies}</p>
                </div>
                <div className="sm:col-span-2 rounded-lg border border-amber-400/35 bg-amber-900/20 p-2.5">
                  <p className="text-[10px] tracking-[0.14em] uppercase text-amber-200">Preferences medicales</p>
                  <p className="mt-1 text-[11px] font-semibold text-amber-100 break-words">{cardData.medicalPreferences}</p>
                </div>
                <div className="sm:col-span-2 rounded-lg border border-orange-400/35 bg-orange-900/20 p-2.5">
                  <p className="text-[10px] tracking-[0.14em] uppercase text-orange-200">Maladies chroniques</p>
                  <p className="mt-1 text-[11px] font-semibold text-orange-100 break-words">{cardData.chronicDiseases}</p>
                </div>
              </div>

              <div className="relative mt-4 flex items-end justify-between gap-3">
                <div className="flex items-end gap-3">
                  <div className="h-20 w-24 rounded-xl border border-dashed border-slate-400/60 bg-slate-900/55 p-2 text-[9px] uppercase tracking-[0.08em] text-slate-300 text-center flex flex-col items-center justify-center">
                    <div className="h-7 w-7 rounded-full border-2 border-slate-400/80 relative mb-2">
                      <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 h-1.5 w-3.5 rounded-full border-t-2 border-slate-400/80" />
                    </div>
                    sans photo<br />profil neutre
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-slate-300">Statut: {cardData.status}</p>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-slate-300 mt-1">Generee le: {cardData.generatedOn}</p>
                  </div>
                </div>

                <div className="rounded-md bg-white/95 p-1.5 shadow-lg border border-slate-300">
                  {cardQrCode ? (
                    <img src={cardQrCode} alt="QR Code donnees numerique du citoiyen" className="h-[52px] w-[52px] object-contain" />
                  ) : (
                    <div className="h-[52px] w-[52px] flex items-center justify-center text-[9px] text-slate-700 border border-dashed border-slate-400">QR</div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Version numerique neutre: aucune photo affichee. Le QR contient les informations d'identite, les contacts d'urgence et les infos medicales.
            </p>
          </div>
        )}
        onClose={() => setIsCardPreviewOpen(false)}
        actions={[
          {
            label: isDownloadingCardImage ? 'Generation...' : 'Telecharger image',
            onClick: handleDownloadCardImage,
            variant: 'primary'
          },
          {
            label: 'Fermer',
            onClick: () => setIsCardPreviewOpen(false),
            variant: 'secondary'
          }
        ]}
        className="p-4"
      />

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        title="Modifier contacts d'urgence et infos medicales"
        description={(
          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Informations personnelles verrouillees</p>
              <p className="text-xs text-slate-500 mt-1">
                Le nom, la filiation, la date de naissance, le lieu d'emission, le point de retrait, le telephone et le statut ne sont pas modifiables ici.
              </p>
            </div>
            <Input
              id="edit_first_name"
              label="Prenom"
              value={editForm.first_name}
              readOnly
              className="bg-slate-100 text-slate-500 cursor-not-allowed"
              required
            />
            <Input
              id="edit_last_name"
              label="Nom"
              value={editForm.last_name}
              readOnly
              className="bg-slate-100 text-slate-500 cursor-not-allowed"
              required
            />
            <Input
              id="edit_father_name"
              label="Nom du pere"
              value={editForm.father_name}
              readOnly
              className="bg-slate-100 text-slate-500 cursor-not-allowed"
            />
            <Input
              id="edit_mother_name"
              label="Nom de la mere"
              value={editForm.mother_name}
              readOnly
              className="bg-slate-100 text-slate-500 cursor-not-allowed"
            />
            <Input
              id="edit_birth_date"
              type="date"
              label="Date de naissance"
              value={editForm.birth_date}
              readOnly
              className="bg-slate-100 text-slate-500 cursor-not-allowed"
            />
            <Input
              id="edit_issue_place"
              label="Lieu d'emission"
              value={editForm.issue_place}
              readOnly
              className="bg-slate-100 text-slate-500 cursor-not-allowed"
            />
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-600 mb-1">Point de retrait</label>
              <select
                className="w-full border border-slate-300 rounded px-3 py-2 bg-slate-100 text-slate-500 cursor-not-allowed"
                value={editForm.pickup_point_id ?? ''}
                disabled
              >
                <option value="">Selectionner...</option>
                {locations.map((p) => (<option key={p.id} value={p.id}>{p.name} - {p.address}</option>))}
              </select>
            </div>
            <Input
              id="edit_phone"
              label="Telephone"
              value={editForm.phone}
              readOnly
              className="bg-slate-100 text-slate-500 cursor-not-allowed"
            />
            <div>
              <label className="block text-xs text-slate-600 mb-1">Statut</label>
              <select
                className="w-full border border-slate-300 rounded px-3 py-2 bg-slate-100 text-slate-500 cursor-not-allowed"
                value={editForm.status}
                disabled
              >
                <option value="en cours de traitement">En cours de traitement</option>
                <option value="Disponible">Disponible</option>
              </select>
            </div>
            <div className="md:col-span-2 mt-2">
              <p className="text-sm font-semibold text-slate-800">Personnes a contacter en cas d'urgence</p>
            </div>
            <Input
              id="edit_emergency_contact_1_name"
              label="Contact 1 - Nom"
              value={editForm.emergency_contact_1_name}
              onChange={(e) => setEditForm({ ...editForm, emergency_contact_1_name: e.target.value })}
            />
            <Input
              id="edit_emergency_contact_1_phone"
              label="Contact 1 - Telephone"
              value={editForm.emergency_contact_1_phone}
              onChange={(e) => setEditForm({ ...editForm, emergency_contact_1_phone: e.target.value })}
            />
            <Input
              id="edit_emergency_contact_2_name"
              label="Contact 2 - Nom"
              value={editForm.emergency_contact_2_name}
              onChange={(e) => setEditForm({ ...editForm, emergency_contact_2_name: e.target.value })}
            />
            <Input
              id="edit_emergency_contact_2_phone"
              label="Contact 2 - Telephone"
              value={editForm.emergency_contact_2_phone}
              onChange={(e) => setEditForm({ ...editForm, emergency_contact_2_phone: e.target.value })}
            />
            <div className="md:col-span-2">
              <MultiValueAutocomplete
                id="edit_medical_allergies"
                label="Allergies medicales (urgence)"
                value={editForm.medical_allergies}
                suggestions={MEDICAL_ALLERGY_SUGGESTIONS}
                helperText={SMART_LIST_HELPER_TEXT}
                placeholder="Ex: Penicilline"
                onChange={(nextValue) => setEditForm({ ...editForm, medical_allergies: nextValue })}
              />
            </div>
            <div className="md:col-span-2">
              <MultiValueAutocomplete
                id="edit_medical_preferences"
                label="Preferences medicales"
                value={editForm.medical_preferences}
                suggestions={MEDICAL_PREFERENCE_SUGGESTIONS}
                helperText={SMART_LIST_HELPER_TEXT}
                placeholder="Ex: Pas de transfusion sanguine"
                onChange={(nextValue) => setEditForm({ ...editForm, medical_preferences: nextValue })}
              />
            </div>
            <div className="md:col-span-2">
              <MultiValueAutocomplete
                id="edit_chronic_diseases"
                label="Maladies chroniques"
                value={editForm.chronic_diseases}
                suggestions={CHRONIC_DISEASE_SUGGESTIONS}
                helperText={SMART_LIST_HELPER_TEXT}
                placeholder="Ex: Diabete type 2"
                onChange={(nextValue) => setEditForm({ ...editForm, chronic_diseases: nextValue })}
              />
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
