import { supabase } from './supabase';

// Helper to normalize text (remove accents, lowercase)
const normalize = (text) => {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
};

// Helper for Levenshtein distance
const levenshtein = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

export const cniService = {
    /**
     * Search for a CNI application by name details.
     */
    async search(searchParams) {
        const { firstName, lastName, phone } = searchParams;
        const firstTrim = normalize(firstName || '');
        const lastTrim = normalize(lastName || '');
        const phoneTrim = (phone || '').replace(/\s/g, '');

        let query = supabase
            .from('cni_data')
            .select('id, first_name, last_name, father_name, mother_name, status, birth_date, issue_place, current_location, phone');

        // Relaxed database search: If we have both names, check if EITHER matches somewhat.
        // This ensures that if "Eto'os" (typo) is searched but "Eto'o" exists, we don't filter it out
        // just because last_name doesn't match, PROVIDED first_name matches.
        if (firstTrim && lastTrim) {
            query = query.or(`first_name.ilike.%${firstTrim}%,last_name.ilike.%${lastTrim}%`);
        } else {
            if (firstTrim) query = query.ilike('first_name', `%${firstTrim}%`);
            if (lastTrim) query = query.ilike('last_name', `%${lastTrim}%`);
        }

        // Note: Phone is not used in DB filtering to allow for "Phone Mismatch" detection.

        const { data, error } = await query;

        if (error) {
            console.error('Error searching CNI:', error);
            throw error;
        }

        const rawResults = data || [];

        // 1. Client-side Exact Match Check (Name + Phone)
        const exactMatches = rawResults.filter(r => {
            const rFirst = normalize(r.first_name || '');
            const rLast = normalize(r.last_name || '');
            const rPhone = (r.phone || '').replace(/\s/g, '');

            // Allow partial name match if it contains the search term
            const nameMatch = rFirst.includes(firstTrim) && rLast.includes(lastTrim);
            const phoneMatch = phoneTrim ? rPhone.includes(phoneTrim) : true;

            return nameMatch && phoneMatch;
        });

        if (exactMatches.length > 0) {
            return { matchType: 'EXACT', candidates: exactMatches };
        }

        // 2. Phone Mismatch Check
        const strictNameMatches = rawResults.filter(r => {
            const rFirst = normalize(r.first_name || '');
            const rLast = normalize(r.last_name || '');
            return rFirst.includes(firstTrim) && rLast.includes(lastTrim);
        });

        if (strictNameMatches.length > 0 && phoneTrim) {
            return { matchType: 'PHONE_MISMATCH', candidates: strictNameMatches };
        }

        // 3. Smart Fuzzy Search (Levenshtein)
        // Check if names are "close enough" (e.g., within 2-3 edits)
        const SIMILARITY_THRESHOLD = 3;

        const similarCandidates = rawResults.filter(r => {
            // Avoid duplicates of what we already checked (strict matches are already handled)
            const rFirst = normalize(r.first_name || '');
            const rLast = normalize(r.last_name || '');

            // Check distance for First Name (if user provided one)
            const distFirst = firstTrim ? levenshtein(firstTrim, rFirst) : 0;
            // Check distance for Last Name (if user provided one)
            const distLast = lastTrim ? levenshtein(lastTrim, rLast) : 0;

            // If user provided both: total distance check or individual check?
            // Let's be generous: if BOTH are within threshold OR one is exact and other is close.

            let isSimilar = false;

            if (firstTrim && lastTrim) {
                // E.g. Sammy (dist large) + Eto'o (dist 0) -> Maybe too far?
                // Let's require both to be reasonably close.
                // Or: Total Distance < Threshold + 1?
                // "eto'os" (dist 1) + "samuel" (dist 0) -> Total 1. Good.
                const totalDist = distFirst + distLast;
                isSimilar = totalDist <= SIMILARITY_THRESHOLD;
            } else if (firstTrim) {
                isSimilar = distFirst <= SIMILARITY_THRESHOLD;
            } else if (lastTrim) {
                isSimilar = distLast <= SIMILARITY_THRESHOLD;
            }

            return isSimilar;
        });

        if (similarCandidates.length > 0) {
            return { matchType: 'SIMILAR', candidates: similarCandidates };
        }

        return { matchType: 'NONE', candidates: [] };
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
