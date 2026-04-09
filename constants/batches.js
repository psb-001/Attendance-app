import { supabase } from '../lib/supabase';

// In-memory cache so we don't hit the DB on every attendance screen
let batchCache = null;

/**
 * Fetches batch definitions from the database (cached after first call).
 * Returns array of { value, name, start_roll, end_roll }
 */
export const fetchBatches = async () => {
    if (batchCache) return batchCache;

    const { data, error } = await supabase
        .from('batches')
        .select('value, name, start_roll, end_roll, icon, color, sort_order')
        .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
        batchCache = data;
        return batchCache;
    }

    // Fallback to hardcoded defaults if DB table doesn't exist yet
    batchCache = [
        { value: 'B1', name: 'Batch B1', start_roll: 1, end_roll: 21 },
        { value: 'B2', name: 'Batch B2', start_roll: 22, end_roll: 42 },
        { value: 'B3', name: 'Batch B3', start_roll: 43, end_roll: 999 },
    ];
    return batchCache;
};

/**
 * Clears the batch cache (call on pull-to-refresh).
 */
export const clearBatchCache = () => {
    batchCache = null;
};

/**
 * Determines which batch a student belongs to based on roll number.
 * Uses cached DB data; falls back to hardcoded ranges if cache is empty.
 */
export const getStudentBatch = (rollNo) => {
    const roll = parseInt(rollNo, 10);
    if (isNaN(roll)) return null;

    // If batches were fetched from DB, and they contain roll configurations, use those
    if (batchCache && batchCache.length > 0 && batchCache[0].start_roll !== null && batchCache[0].start_roll !== undefined) {
        const match = batchCache.find(b => roll >= b.start_roll && roll <= b.end_roll);
        return match ? match.value : null;
    }

    // Hardcoded fallback (identical to original behavior)
    if (roll >= 1 && roll <= 21) return 'B1';
    if (roll >= 22 && roll <= 42) return 'B2';
    if (roll >= 43) return 'B3';
    return null;
};
