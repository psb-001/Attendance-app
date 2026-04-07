import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, Button, Card, List, Divider, ActivityIndicator } from 'react-native-paper';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAttendance, markAsSubmitted, isSubmitted, resetSubmission } from '../services/storage';
import { submitAttendance } from '../services/api';
import { getConfig } from '../services/config';
import { getStudentBatch, fetchBatches } from '../constants/batches';
import { supabase } from '../lib/supabase';
import { ThemeContext } from '../context/ThemeContext';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/dashboardHelpers';

export default function SummaryScreen() {
    const { date, branch, subject, batch } = useLocalSearchParams();
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [absentStudents, setAbsentStudents] = useState([]);
    const { isDark } = useContext(ThemeContext);
    const t = (light, dark) => isDark ? dark : light;



    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [attendance, setAttendance] = useState(null);
    const [allStudents, setAllStudents] = useState([]);
    const viewShotRef = useRef();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Ensure batch ranges are loaded from DB before filtering
            await fetchBatches();
            const fetchedAttendance = await getAttendance(date, branch, subject, batch);
            setAttendance(fetchedAttendance);
            const submitted = await isSubmitted(date, branch, subject, batch);
            setAlreadySubmitted(submitted);

            // Fetch students from Supabase
            const { data: fetchedStudents, error } = await supabase
                .from('students_registry')
                .select('roll_no, full_name, is_active')
                .eq('branch', branch)
                .order('roll_no', { ascending: true });

            if (error) throw error;

            let studentList = (fetchedStudents || [])
                .filter(s => s.is_active !== false) // Only active students
                .map(s => ({
                    rollNo: s.roll_no,
                    name: s.full_name,
                }));
            
            if (batch) {
                studentList = studentList.filter(s => getStudentBatch(s.rollNo) === batch);
            }
            
            setAllStudents(studentList);

            const total = studentList.length;
            let presentCount = 0;
            const absentList = [];

            studentList.forEach(s => {
                // If student is not in the record OR they are explicitly marked true, they are present.
                // They are only absent if strictly marked as FALSE.
                if (!fetchedAttendance || fetchedAttendance[s.rollNo] !== false) {
                    presentCount++;
                } else {
                    absentList.push(s);
                }
            });

            const absentCount = total - presentCount;
            const percentage = total > 0 ? ((presentCount / total) * 100).toFixed(2) : 0;

            setStats({ total, present: presentCount, absent: absentCount, percentage });
            setAbsentStudents(absentList);
        } catch (error) {
            if (__DEV__) console.error('SummaryScreen loadData error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            if (Platform.OS === 'web') {
                Alert.alert('Not Supported', 'Download feature is only available on mobile devices.');
                return;
            }

            // Capture the view
            const uri = await viewShotRef.current.capture();

            // Check if sharing is available
            if (!(await Sharing.isAvailableAsync())) {
                Alert.alert('Error', 'Sharing is not available on this device');
                return;
            }

            // Share the image
            await Sharing.shareAsync(uri);
        } catch (error) {
            if (__DEV__) console.error('Share error:', error);
            Alert.alert('Error', 'Failed to share image.');
        }
    };

    const handleSaveToGallery = async () => {
        try {
            if (Platform.OS === 'web') {
                Alert.alert('Not Supported', 'Save to Gallery is only available on mobile devices.');
                return;
            }

            // Ask for permissions
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'We need permission to save images to your gallery.');
                return;
            }

            // Capture the view
            const uri = await viewShotRef.current.capture();

            // Save to library
            await MediaLibrary.saveToLibraryAsync(uri);
            Alert.alert('Success', 'Image saved to your gallery!');
        } catch (error) {
            if (__DEV__) console.error('Save to Gallery error:', error);
            Alert.alert('Error', 'Failed to save image.');
        }
    };

    const handleReset = async () => {
        const confirmMsg = 'This will let you edit the attendance and re-submit. Your current marks will be preserved.';
        const executeReset = async () => {
            try {
                // Delete from Google Sheets (so we don't have stale data)
                const googleScriptUrl = await getConfig('google_script_url');
                if (__DEV__) console.log('[Reset] Google Script URL:', googleScriptUrl ? 'Found' : 'EMPTY');
                if (googleScriptUrl) {
                    if (__DEV__) console.log('[Reset] Sending delete to Google Sheets...');
                    await submitAttendance(googleScriptUrl, {
                        date,
                        branch,
                        subject,
                        batch,
                        action: 'delete'
                    });
                    if (__DEV__) console.log('[Reset] Google Sheets delete SUCCESS');
                }

                // Delete from Supabase
                if (__DEV__) console.log('[Reset] Deleting from Supabase...');
                if (allStudents && allStudents.length > 0) {
                    const rollNos = allStudents.map(s => s.rollNo);
                    let deleteQuery = supabase
                        .from('attendance_logs')
                        .delete()
                        .eq('date', date)
                        .eq('branch', branch)
                        .eq('subject', subject)
                        .in('roll_no', rollNos);
                    
                    if (batch && batch !== 'undefined' && batch !== 'null') {
                        deleteQuery = deleteQuery.eq('batch', batch);
                    }
                    
                    const { error: supabaseError } = await deleteQuery;
                    
                    if (supabaseError) {
                        if (__DEV__) console.warn('[Reset] Supabase delete failed:', supabaseError.message);
                    } else {
                        if (__DEV__) console.log('[Reset] Supabase delete SUCCESS');
                    }
                }

                // Only clear the submitted flag — keep attendance marks
                await resetSubmission(date, branch, subject, batch);
                setAlreadySubmitted(false);
                
                const successMsg = 'You can now edit the attendance. Your previous marks are preserved.';
                if (Platform.OS === 'web') {
                    window.alert(`Reset Complete\n\n${successMsg}`);
                    router.push({
                        pathname: '/attendance',
                        params: { date, branch, subject, batch }
                    });
                } else {
                    Alert.alert(
                        'Reset Complete',
                        successMsg,
                        [{
                            text: 'Edit Attendance',
                            onPress: () => router.push({
                                pathname: '/attendance',
                                params: { date, branch, subject, batch }
                            })
                        }]
                    );
                }
            } catch (error) {
                if (__DEV__) console.warn('[Reset] Error:', error.message);
                // Still reset locally even if something failed
                await resetSubmission(date, branch, subject, batch);
                setAlreadySubmitted(false);
                
                const failMsg = 'Could not update remote database, but you can still edit attendance locally.';
                if (Platform.OS === 'web') {
                    window.alert(`Reset Complete\n\n${failMsg}`);
                    router.push({
                        pathname: '/attendance',
                        params: { date, branch, subject, batch }
                    });
                } else {
                    Alert.alert(
                        'Reset Complete',
                        failMsg,
                        [{
                            text: 'Edit Attendance',
                            onPress: () => router.push({
                                pathname: '/attendance',
                                params: { date, branch, subject, batch }
                            })
                        }]
                    );
                }
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Reset Submission\n\n${confirmMsg}`)) {
                executeReset();
            }
        } else {
            Alert.alert(
                'Reset Submission',
                confirmMsg,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Reset', style: 'destructive', onPress: executeReset }
                ]
            );
        }
    };

    const handleSubmit = async () => {
        if (alreadySubmitted) {
            Alert.alert('Already Submitted', 'This attendance has already been submitted.');
            return;
        }

        const startTime = Date.now();
        setSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            // --- PRIMARY: Write to Supabase first ---
            const safeBatch = (batch && batch !== 'undefined' && batch !== 'null') ? batch : null;
            const supabaseRows = allStudents.map(s => ({
                branch,
                subject,
                date,
                batch: safeBatch,
                roll_no: s.rollNo,
                status: (attendance && attendance[s.rollNo]) ? 1 : 0,
            }));

            const { error: supabaseError } = await supabase
                .from('attendance_logs')
                .upsert(supabaseRows, { onConflict: 'branch,subject,date,batch,roll_no' });

            if (supabaseError) throw supabaseError;

            // Mark as submitted locally
            await markAsSubmitted(date, branch, subject, batch);
            setAlreadySubmitted(true);

            // --- LOGGING: Record success and latency for Admin Dashboard ---
            const latency = Date.now() - startTime;
            try {
                await supabase.from('system_logs').insert({
                    event_type: 'SUCCESS',
                    action_name: 'ATTENDANCE_SUBMIT',
                    message: `Submitted ${allStudents.length} students for ${subject}`,
                    user_id: session?.user?.id,
                    latency_ms: latency
                });
            } catch (_) { /* system_logs table may not exist yet */ }

            // --- SECONDARY: Try Google Sheets (non-blocking) ---
            const googleScriptUrl = await getConfig('google_script_url');
            if (googleScriptUrl) {
                const payload = {
                    date,
                    branch,
                    subject,
                    batch,
                    studentStatuses: allStudents.map(s => ({
                        rollNo: s.rollNo,
                        name: s.name,
                        status: (attendance && attendance[s.rollNo]) ? 1 : 0,
                    })),
                    total: stats.total,
                    present: stats.present,
                    absent: stats.absent,
                    percentage: stats.percentage,
                };
                submitAttendance(googleScriptUrl, payload)
                    .catch(err => { if (__DEV__) console.warn('[Google Sheets] Sync FAILED:', err.message); });
            }

            Alert.alert(
                'Submitted!',
                'Attendance saved successfully to the database.',
                [{ text: 'OK', onPress: () => router.push('/') }]
            );
        } catch (error) {
            // LOGGING: Record the failure
            const latency = Date.now() - startTime;
            try {
                await supabase.from('system_logs').insert({
                    event_type: 'ERROR',
                    action_name: 'ATTENDANCE_SUBMIT_FAILED',
                    message: error.message,
                    latency_ms: latency
                });
            } catch (_) { /* system_logs table may not exist yet */ }

            Alert.alert(
                'Submission Failed',
                `Error: ${error.message}\n\nPlease check your connection and try again.`
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: t('#f5f5f5', '#000000') }]}>
                <ActivityIndicator size="large" color="#3d637e" />
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: t('#f5f5f5', '#000000') }]}>
            <Card style={[styles.card, { backgroundColor: t('white', '#1e1e1e') }]}>
                <Card.Content style={{ paddingTop: 16 }}>
                    <Text variant="headlineSmall" style={{ color: t('black', 'white'), fontWeight: '900', marginBottom: 4 }}>Summary</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                        <View style={{ backgroundColor: t('#f0f0f0', '#2a2d35'), paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: t('#666', '#bbb') }}>{formatDate(date)}</Text>
                        </View>
                        <View style={{ backgroundColor: t('#e3f2fd', '#1a2a36'), paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#3d637e' }}>{branch}</Text>
                        </View>
                        {batch && (
                            <View style={{ backgroundColor: t('#e8f5e9', '#1b2e26'), paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#00b894' }}>{batch}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.statRow}>
                        <Text variant="bodyLarge" style={{ color: t('black', 'white') }}>Subject:</Text>
                        <Text variant="bodyLarge" style={[styles.bold, { color: t('black', 'white') }]}>{subject}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text variant="bodyLarge" style={{ color: t('black', 'white') }}>Total Students:</Text>
                        <Text variant="bodyLarge" style={[styles.bold, { color: t('black', 'white') }]}>{stats?.total}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text variant="bodyLarge" style={{ color: t('black', 'white') }}>Present:</Text>
                        <Text variant="bodyLarge" style={[styles.bold, { color: '#4caf50' }]}>{stats?.present}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text variant="bodyLarge" style={{ color: t('black', 'white') }}>Absent:</Text>
                        <Text variant="bodyLarge" style={[styles.bold, { color: '#f44336' }]}>{stats?.absent}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text variant="bodyLarge" style={{ color: t('black', 'white') }}>Percentage:</Text>
                        <Text variant="bodyLarge" style={[styles.bold, { color: t('black', 'white') }]}>{stats?.percentage}%</Text>
                    </View>
                </Card.Content>
            </Card>

             <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
                <Card style={[styles.card, { backgroundColor: t('white', '#1e1e1e') }]}>
                    <Card.Content style={{ paddingTop: 16 }}>
                        <Text variant="titleLarge" style={{ color: t('black', 'white'), fontWeight: '900', marginBottom: 2 }}>{subject}</Text>
                        <Text variant="bodySmall" style={{ color: t('#666', '#aaa'), marginBottom: 12 }}>{formatDate(date)} • {branch}{batch ? ` • ${batch}` : ''}</Text>
                        <Divider style={{ marginBottom: 12, backgroundColor: t('#eee', '#333') }} />
                        <Text variant="titleMedium" style={{ color: '#f44336', fontWeight: '800', marginBottom: 8 }}>ABSENT STUDENTS</Text>
                    </Card.Content>
                    <Card.Content>
                        {absentStudents.length === 0 ? (
                            <EmptyState 
                                icon="party-popper" 
                                message="Perfect Attendance!" 
                                subMessage="Every student is present today."
                                style={{ marginVertical: 10, padding: 20 }}
                            />
                        ) : (
                            absentStudents.map((s) => (
                                <View key={s.rollNo}>
                                    <Text style={{ color: t('black', 'white') }}>{s.rollNo}. {s.name}</Text>
                                    <Divider style={[styles.divider, { backgroundColor: t('#eee', '#333') }]} />
                                </View>
                            ))
                        )}
                    </Card.Content>
                </Card>
            </ViewShot>

            {absentStudents.length > 0 && (
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                    <Button
                        mode={isDark ? "contained-tonal" : "outlined"}
                        icon="share-variant"
                        onPress={handleDownload}
                        style={{ flex: 1 }}
                    >
                        Share List
                    </Button>
                    <Button
                        mode="contained"
                        icon="download"
                        onPress={handleSaveToGallery}
                        style={{ flex: 1 }}
                    >
                        Save Image
                    </Button>
                </View>
            )}

            <Card style={[styles.card, { backgroundColor: t('white', '#1e1e1e') }]}>
                <Card.Content>
                    <Button
                        mode="contained"
                        onPress={handleSubmit}
                        loading={submitting}
                        disabled={submitting || alreadySubmitted}
                        style={styles.button}
                    >
                        {alreadySubmitted ? 'Submitted' : 'Submit Attendance'}
                    </Button>
                    {alreadySubmitted && (
                        <Button
                            mode="outlined"
                            onPress={handleReset}
                            style={{ marginTop: 10 }}
                            textColor="#f44336"
                        >
                            Reset Submission
                        </Button>
                    )}
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        marginBottom: 15,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    bold: {
        fontWeight: 'bold',
    },
    divider: {
        marginVertical: 5,
    },
    button: {
        paddingVertical: 5,
    },
    downloadButton: {
        marginBottom: 15,
    }
});
