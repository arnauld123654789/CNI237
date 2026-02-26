import { supabase } from './supabase';

const TABLE = 'cni_data';

const BASE_COLUMNS = [
  'id',
  'first_name',
  'last_name',
  'father_name',
  'mother_name',
  'birth_date',
  'issue_place',
  'current_location',
  'pickup_point_id',
  'phone',
  'status',
  'created_at'
];

const OPTIONAL_COLUMNS = [
  'emergency_contact_1_name',
  'emergency_contact_1_phone',
  'emergency_contact_2_name',
  'emergency_contact_2_phone',
  'medical_allergies',
  'medical_preferences',
  'chronic_diseases'
];

let availableOptionalColumns;

const joinColumns = (columns) => columns.join(', ');

async function resolveOptionalColumns() {
  if (Array.isArray(availableOptionalColumns)) {
    return availableOptionalColumns;
  }

  const checks = await Promise.all(
    OPTIONAL_COLUMNS.map(async (column) => {
      const { error } = await supabase
        .from(TABLE)
        .select(`id, ${column}`)
        .limit(1);

      return error ? null : column;
    })
  );

  availableOptionalColumns = checks.filter(Boolean);
  return availableOptionalColumns;
}

export async function listCniData() {
  const optionalColumns = await resolveOptionalColumns();
  const columns = joinColumns([...BASE_COLUMNS, ...optionalColumns]);

  let { data, error } = await supabase
    .from(TABLE)
    .select(columns)
    .order('created_at', { ascending: false });

  if (error && optionalColumns.length > 0) {
    availableOptionalColumns = [];
    ({ data, error } = await supabase
      .from(TABLE)
      .select(joinColumns(BASE_COLUMNS))
      .order('created_at', { ascending: false }));
  }

  if (error) throw error;
  return data || [];
}

export async function addCniRecord(record) {
  const optionalColumns = await resolveOptionalColumns();
  let clean = normalizeRecord(record, optionalColumns);

  let { data, error } = await supabase.from(TABLE).insert([clean]).select();

  if (error && optionalColumns.length > 0) {
    availableOptionalColumns = [];
    clean = normalizeRecord(record, []);
    ({ data, error } = await supabase.from(TABLE).insert([clean]).select());
  }

  if (error) throw error;
  return data?.[0] || null;
}

export async function updateCniRecord(id, updates) {
  const optionalColumns = await resolveOptionalColumns();
  let clean = normalizeRecord(updates, optionalColumns);
  if (Object.keys(clean).length === 0) {
    return null;
  }

  let { data, error } = await supabase
    .from(TABLE)
    .update(clean)
    .eq('id', id)
    .select();

  if (error && optionalColumns.length > 0) {
    availableOptionalColumns = [];
    clean = normalizeRecord(updates, []);
    if (Object.keys(clean).length === 0) {
      return null;
    }
    ({ data, error } = await supabase
      .from(TABLE)
      .update(clean)
      .eq('id', id)
      .select());
  }

  if (error) throw error;
  return data?.[0] || null;
}

export async function removeCniRecord(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
  return true;
}

function normalizeRecord(r, includeExtended = false) {
  const t = (v) => (typeof v === 'string' ? v.trim() : v);
  const has = (key) => Object.prototype.hasOwnProperty.call(r, key);
  const set = (key, value) => {
    if (has(key)) {
      normalized[key] = value;
    }
  };
  const allowed = new Set(['Disponible', 'en cours de traitement']);
  const optional = new Set(Array.isArray(includeExtended) ? includeExtended : []);
  const normalized = {};

  set('first_name', t(r.first_name) || '');
  set('last_name', t(r.last_name) || '');
  set('father_name', t(r.father_name) || '');
  set('mother_name', t(r.mother_name) || '');
  set('birth_date', r.birth_date || null); // expect ISO string 'YYYY-MM-DD'
  set('issue_place', t(r.issue_place) || '');
  set('current_location', t(r.current_location) || '');
  set('pickup_point_id', r.pickup_point_id ?? null);
  set('phone', t(r.phone) || '');

  if (has('status')) {
    const normalizedStatus = t(r.status) || 'en cours de traitement';
    set('status', allowed.has(normalizedStatus) ? normalizedStatus : 'en cours de traitement');
  }

  if (optional.has('emergency_contact_1_name')) {
    set('emergency_contact_1_name', t(r.emergency_contact_1_name) || '');
  }
  if (optional.has('emergency_contact_1_phone')) {
    set('emergency_contact_1_phone', t(r.emergency_contact_1_phone) || '');
  }
  if (optional.has('emergency_contact_2_name')) {
    set('emergency_contact_2_name', t(r.emergency_contact_2_name) || '');
  }
  if (optional.has('emergency_contact_2_phone')) {
    set('emergency_contact_2_phone', t(r.emergency_contact_2_phone) || '');
  }
  if (optional.has('medical_allergies')) {
    set('medical_allergies', t(r.medical_allergies) || '');
  }
  if (optional.has('medical_preferences')) {
    set('medical_preferences', t(r.medical_preferences) || '');
  }
  if (optional.has('chronic_diseases')) {
    set('chronic_diseases', t(r.chronic_diseases) || '');
  }

  return normalized;
}
