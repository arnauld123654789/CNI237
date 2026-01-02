import { supabase } from './supabase';

export const pickupPointsService = {
  async list() {
    const { data, error } = await supabase
      .from('pickup_points')
      .select('id, name, address, lat, lng, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async add(point) {
    const { data, error } = await supabase
      .from('pickup_points')
      .insert([{ name: point.name, address: point.address, lat: point.lat, lng: point.lng }])
      .select();
    if (error) throw error;
    return data?.[0];
  },
  async update(id, update) {
    const { data, error } = await supabase
      .from('pickup_points')
      .update(update)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data?.[0];
  },
  async remove(id) {
    const { error } = await supabase
      .from('pickup_points')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};