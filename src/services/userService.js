import { supabase } from './supabase';

// Table name for people looking for their ID cards
const TABLE = 'citizen_seekers';

export async function listSeekers() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, first_name, last_name, phone, email, notes, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addSeeker(seeker) {
  const clean = normalizeSeeker(seeker);
  const { data, error } = await supabase.from(TABLE).insert([clean]).select();
  if (error) throw error;
  return data?.[0] || null;
}

export async function updateSeeker(id, updates) {
  const clean = normalizeSeeker(updates);
  const { data, error } = await supabase
    .from(TABLE)
    .update(clean)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0] || null;
}

export async function removeSeeker(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
  return true;
}

function normalizeSeeker(s) {
  const t = (v) => (typeof v === 'string' ? v.trim() : v);
  return {
    first_name: t(s.first_name) || '',
    last_name: t(s.last_name) || '',
    phone: t(s.phone) || '',
    email: t(s.email) || '',
    notes: t(s.notes) || '',
  };
}