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
        const firstTrim = (firstName || '').trim();
        const lastTrim = (lastName || '').trim();
        const phoneTrim = (phone || '').trim();

        let query = supabase
            .from('cni_data')
            .select('id, first_name, last_name, father_name, mother_name, status, birth_date, issue_place, current_location, phone');

        // Base ILIKE search (case-insensitive). We’ll also do client-side normalization
        // to be accent-insensitive and truly case-insensitive.
        if (firstTrim) query = query.ilike('first_name', `%${firstTrim}%`);
        if (lastTrim) query = query.ilike('last_name', `%${lastTrim}%`);
        if (phoneTrim) query = query.ilike('phone', `%${phoneTrim}%`);

        const { data, error } = await query;

        if (error) {
            console.error('Error searching CNI:', error);
            throw error;
        }

        const results = (data || []);

        // Client-side normalization filter to handle accents and ensure case-insensitive matching
        const nf = normalize(firstTrim || '');
        const nl = normalize(lastTrim || '');
        const np = normalize(phoneTrim || '');

        const filtered = results.filter((item) => {
            const ifn = normalize(item.first_name || '');
            const iln = normalize(item.last_name || '');
            const iph = normalize(item.phone || '');

            const matchFirst = nf ? ifn.includes(nf) : true;
            const matchLast = nl ? iln.includes(nl) : true;
            const matchPhone = np ? iph.includes(np) : true;
            return matchFirst && matchLast && matchPhone;
        });

        return filtered;
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
