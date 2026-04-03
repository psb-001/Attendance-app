import { supabase } from '../lib/supabase';

// In-memory cache so we don't hit the DB on every attendance submission
let configCache = {};

/**
 * Fetches a config value from the Supabase `app_config` table.
 * Results are cached in memory for the session.
 */
export const getConfig = async (key) => {
    // Return cached value if available
    if (configCache[key] !== undefined) return configCache[key];

    try {
        const { data, error } = await supabase
            .from('app_config')
            .select('value')
            .eq('key', key)
            .maybeSingle();

        if (error) {
            console.warn(`Config fetch failed for "${key}":`, error.message);
            return null;
        }

        const value = data?.value || null;
        configCache[key] = value;
        return value;
    } catch (err) {
        console.warn(`Config fetch error for "${key}":`, err.message);
        return null;
    }
};

/**
 * Clears the config cache. Call this on pull-to-refresh
 * so the app picks up any config changes from the database.
 */
export const clearConfigCache = () => {
    configCache = {};
};
