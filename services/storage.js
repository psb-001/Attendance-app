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
        console.error('Failed to save attendance', e);
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
        console.error('Failed to fetch attendance', e);
        return null;
    }
};

export const markAsSubmitted = async (date, branch, subject, batch = null) => {
    try {
        const key = `${getAttendanceKey(date, branch, subject, batch)}_submitted`;
        await AsyncStorage.setItem(key, 'true');
    } catch (e) {
        console.error('Failed to mark as submitted', e);
    }
};

export const isSubmitted = async (date, branch, subject, batch = null) => {
    try {
        let query = supabase
            .from('attendance_logs')
            .select('id', { head: true, count: 'exact' })
            .eq('date', date)
            .eq('branch', branch)
            .eq('subject', subject);

        const { count, error } = await query;
        if (!error && count !== null && count > 0) {
            // Sync local cache
            const key = `${getAttendanceKey(date, branch, subject, batch)}_submitted`;
            await AsyncStorage.setItem(key, 'true');
            return true;
        }

        const key = `${getAttendanceKey(date, branch, subject, batch)}_submitted`;
        const value = await AsyncStorage.getItem(key);
        return value === 'true';
    } catch (e) {
        console.error('Failed to check submission status', e);
        return false;
    }
};

export const resetSubmission = async (date, branch, subject, batch = null) => {
    try {
        const baseKey = getAttendanceKey(date, branch, subject, batch);
        const submittedKey = `${baseKey}_submitted`;
        await AsyncStorage.removeItem(submittedKey);
        await AsyncStorage.removeItem(baseKey);

        let query = supabase
            .from('attendance_logs')
            .delete()
            .eq('date', date)
            .eq('branch', branch)
            .eq('subject', subject);
        await query;
    } catch (e) {
        console.error('Failed to reset submission status', e);
    }
};

export const resetAllAttendance = async () => {
    try {
        const allKeys = await AsyncStorage.getAllKeys();
        const attendanceKeys = allKeys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));
        await AsyncStorage.multiRemove(attendanceKeys);
        return { success: true, count: attendanceKeys.length };
    } catch (e) {
        console.error('Failed to reset all attendance', e);
        throw new Error('Failed to reset all attendance data');
    }
};
