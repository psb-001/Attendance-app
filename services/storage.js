import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const STORAGE_KEY_PREFIX = 'attendance_';

export const getAttendanceKey = (date, branch, subject, batch = null) => {
    let base = `${STORAGE_KEY_PREFIX}${date}_${branch}_${subject}`;
    if (batch) base += `_${batch}`;
    return base;
};

export const saveAttendance = async (date, branch, subject, batch, data) => {
    try {
        const key = getAttendanceKey(date, branch, subject, batch);
        await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        if (__DEV__) console.error('Failed to save attendance', e);
    }
};

export const getAttendance = async (date, branch, subject, batch = null) => {
    try {
        const key = getAttendanceKey(date, branch, subject, batch);
        const jsonValue = await AsyncStorage.getItem(key);
        if (jsonValue != null) {
            return JSON.parse(jsonValue);
        }

        // Try Supabase if not found locally
        let query = supabase
            .from('attendance_logs')
            .select('roll_no, status')
            .eq('date', date)
            .eq('branch', branch)
            .eq('subject', subject);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
            const fetchedAttendance = {};
            data.forEach(row => {
                fetchedAttendance[row.roll_no] = row.status === 1;
            });
            await saveAttendance(date, branch, subject, batch, fetchedAttendance);
            await markAsSubmitted(date, branch, subject, batch);
            return fetchedAttendance;
        }

        return null;
    } catch (e) {
        if (__DEV__) console.error('Failed to fetch attendance', e);
        return null;
    }
};

export const markAsSubmitted = async (date, branch, subject, batch = null) => {
    try {
        const key = `${getAttendanceKey(date, branch, subject, batch)}_submitted`;
        await AsyncStorage.setItem(key, 'true');
    } catch (e) {
        if (__DEV__) console.error('Failed to mark as submitted', e);
    }
};

export const isSubmitted = async (date, branch, subject, batch = null) => {
    try {
        const key = `${getAttendanceKey(date, branch, subject, batch)}_submitted`;
        const localValue = await AsyncStorage.getItem(key);

        // If teacher explicitly reset, trust that — don't check Supabase
        if (localValue === 'reset') {
            return false;
        }

        // Always verify against Supabase (source of truth)
        // This ensures admin-side deletions are immediately reflected in the app
        let query = supabase
            .from('attendance_logs')
            .select('id', { head: true, count: 'exact' })
            .eq('date', date)
            .eq('branch', branch)
            .eq('subject', subject);

        if (batch && batch !== 'undefined' && batch !== 'null') {
            query = query.eq('batch', batch);
        }

        const { count, error } = await query;

        if (!error && count !== null && count > 0) {
            // Supabase confirms data exists — mark locally and return true
            await AsyncStorage.setItem(key, 'true');
            return true;
        }

        // Supabase says no data — clear stale local flag and return false
        await AsyncStorage.removeItem(key);
        return false;

    } catch (e) {
        if (__DEV__) console.error('Failed to check submission status', e);
        // On network error, fall back to local cache if available
        const key = `${getAttendanceKey(date, branch, subject, batch)}_submitted`;
        const localValue = await AsyncStorage.getItem(key).catch(() => null);
        return localValue === 'true';
    }
};

export const resetSubmission = async (date, branch, subject, batch = null) => {
    try {
        const baseKey = getAttendanceKey(date, branch, subject, batch);
        const submittedKey = `${baseKey}_submitted`;
        // Set to 'reset' so isSubmitted knows this was explicitly reset
        // and won't override it by checking Supabase
        await AsyncStorage.setItem(submittedKey, 'reset');

        // Keep attendance data intact — teacher will edit and re-submit
    } catch (e) {
        if (__DEV__) console.error('Failed to reset submission status', e);
    }
};

export const resetAllAttendance = async () => {
    try {
        const allKeys = await AsyncStorage.getAllKeys();
        const attendanceKeys = allKeys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));
        await AsyncStorage.multiRemove(attendanceKeys);
        return { success: true, count: attendanceKeys.length };
    } catch (e) {
        if (__DEV__) console.error('Failed to reset all attendance', e);
        throw new Error('Failed to reset all attendance data');
    }
};
