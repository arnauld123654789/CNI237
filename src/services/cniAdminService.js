import { supabase } from './supabase';

const TABLE = 'cni_data';

const BASE_SELECT =
  'id, first_name, last_name, father_name, mother_name, birth_date, issue_place, current_location, pickup_point_id, phone, status, created_at';
const EXTENDED_SELECT =
  ', emergency_contact_1_name, emergency_contact_1_phone, emergency_contact_2_name, emergency_contact_2_phone, medical_allergies';

let hasExtendedColumns;

async function checkExtendedColumnsSupport() {
  if (typeof hasExtendedColumns === 'boolean') {
    return hasExtendedColumns;
  }

  const { error } = await supabase
    .from(TABLE)
    .select('id, emergency_contact_1_name')
    .limit(1);

  hasExtendedColumns = !error;
  return hasExtendedColumns;
}

export async function listCniData() {
  const useExtended = await checkExtendedColumnsSupport();
  const columns = useExtended ? `${BASE_SELECT}${EXTENDED_SELECT}` : BASE_SELECT;

  let { data, error } = await supabase
    .from(TABLE)
    .select(columns)
    .order('created_at', { ascending: false });

  if (error && useExtended) {
    hasExtendedColumns = false;
    ({ data, error } = await supabase
      .from(TABLE)
      .select(BASE_SELECT)
      .order('created_at', { ascending: false }));
  }

  if (error) throw error;
  return data || [];
}

export async function addCniRecord(record) {
  const useExtended = await checkExtendedColumnsSupport();
  let clean = normalizeRecord(record, useExtended);

  let { data, error } = await supabase.from(TABLE).insert([clean]).select();

  if (error && useExtended) {
    hasExtendedColumns = false;
    clean = normalizeRecord(record, false);
    ({ data, error } = await supabase.from(TABLE).insert([clean]).select());
  }

  if (error) throw error;
  return data?.[0] || null;
}

export async function updateCniRecord(id, updates) {
  const useExtended = await checkExtendedColumnsSupport();
  let clean = normalizeRecord(updates, useExtended);

  let { data, error } = await supabase
    .from(TABLE)
    .update(clean)
    .eq('id', id)
    .select();

  if (error && useExtended) {
    hasExtendedColumns = false;
    clean = normalizeRecord(updates, false);
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
  const allowed = new Set(['Disponible', 'en cours de traitement']);
  const normalizedStatus = t(r.status) || 'en cours de traitement';

  const normalized = {
    first_name: t(r.first_name) || '',
    last_name: t(r.last_name) || '',
    father_name: t(r.father_name) || '',
    mother_name: t(r.mother_name) || '',
    birth_date: r.birth_date || null, // expect ISO string 'YYYY-MM-DD'
    issue_place: t(r.issue_place) || '',
    current_location: t(r.current_location) || '',
    pickup_point_id: r.pickup_point_id ?? null,
    phone: t(r.phone) || '',
    status: allowed.has(normalizedStatus) ? normalizedStatus : 'en cours de traitement'
  };

  if (includeExtended) {
    normalized.emergency_contact_1_name = t(r.emergency_contact_1_name) || '';
    normalized.emergency_contact_1_phone = t(r.emergency_contact_1_phone) || '';
    normalized.emergency_contact_2_name = t(r.emergency_contact_2_name) || '';
    normalized.emergency_contact_2_phone = t(r.emergency_contact_2_phone) || '';
    normalized.medical_allergies = t(r.medical_allergies) || '';
  }

  return normalized;
}
