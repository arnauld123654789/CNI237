import { supabase } from './supabase';

const TABLE = 'cni_data';

export async function listCniData() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, first_name, last_name, father_name, mother_name, birth_date, issue_place, current_location, pickup_point_id, phone, status, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addCniRecord(record) {
  const clean = normalizeRecord(record);
  const { data, error } = await supabase.from(TABLE).insert([clean]).select();
  if (error) throw error;
  return data?.[0] || null;
}

export async function updateCniRecord(id, updates) {
  const clean = normalizeRecord(updates);
  const { data, error } = await supabase
    .from(TABLE)
    .update(clean)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0] || null;
}

export async function removeCniRecord(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
  return true;
}

function normalizeRecord(r) {
  const t = (v) => (typeof v === 'string' ? v.trim() : v);
  const allowed = new Set(['Disponible','en cours de traitement']);
  const normalizedStatus = t(r.status) || 'en cours de traitement';
  return {
    first_name: t(r.first_name) || '',
    last_name: t(r.last_name) || '',
    father_name: t(r.father_name) || '',
    mother_name: t(r.mother_name) || '',
    birth_date: r.birth_date || null, // expect ISO string 'YYYY-MM-DD'
    issue_place: t(r.issue_place) || '',
    current_location: t(r.current_location) || '',
    pickup_point_id: r.pickup_point_id ?? null,
    phone: t(r.phone) || '',
    status: allowed.has(normalizedStatus) ? normalizedStatus : 'en cours de traitement',
  };
}