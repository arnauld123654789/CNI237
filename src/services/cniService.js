import { supabase } from './supabase';

// Helper to normalize text (remove accents, lowercase)
const normalize = (text) => {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
};

export const cniService = {
    /**
     * Search for a CNI application by name details.
     * Supabase doesn't natively support unaccented search easily without extensions,
     * so we will try to match as best as we can. Ideally we would store a normalized column.
     * For this prototype, we'll fetch matches on normalized text if possible, or use ILIKE.
     */
    async search(searchParams) {
        const { firstName, lastName, phone } = searchParams;

        let query = supabase
            .from('cni_data')
            .select('id, first_name, last_name, father_name, mother_name, status, birth_date, issue_place, current_location');

        // Simple ILIKE search (case insensitive)
        // Note: In a real production app with millions of rows, we'd use Full Text Search in Postgres.
        if (firstName) query = query.ilike('first_name', `%${firstName}%`);
        if (lastName) query = query.ilike('last_name', `%${lastName}%`);
        if (phone) query = query.ilike('phone', `%${phone}%`);

        const { data, error } = await query;

        if (error) {
            console.error('Error searching CNI:', error);
            throw error;
        }

        return data || [];
    },

    /**
     * Verify identity by checking birth year
     */
    async verifyBirthYear(id, year) {
        const { data, error } = await supabase
            .from('cni_data')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) return false;

        // Check if the year matches the birth_date year
        const birthYear = new Date(data.birth_date).getFullYear().toString();
        return birthYear === year.toString() ? data : null;
    }
};
