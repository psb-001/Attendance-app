import AsyncStorage from '@react-native-async-storage/async-storage';

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
        return jsonValue != null ? JSON.parse(jsonValue) : null;
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
        const key = `${getAttendanceKey(date, branch, subject, batch)}_submitted`;
        await AsyncStorage.removeItem(key);
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
