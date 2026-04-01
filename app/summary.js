import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, Button, Card, List, Divider, ActivityIndicator } from 'react-native-paper';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAttendance, markAsSubmitted, isSubmitted, resetSubmission } from '../services/storage';
import { submitAttendance } from '../services/api';
import { GOOGLE_SCRIPT_URL } from '../constants/config';
import { getStudentBatch } from '../constants/batches';
import { supabase } from '../lib/supabase';
import { ThemeContext } from '../context/ThemeContext';
import EmptyState from '../components/EmptyState';

export default function SummaryScreen() {
    const { date, branch, subject, batch } = useLocalSearchParams();
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [absentStudents, setAbsentStudents] = useState([]);
    const { isDark } = useContext(ThemeContext);
    const t = (light, dark) => isDark ? dark : light;

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Today';
        try {
            const [y, m, d] = dateStr.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            return dateObj.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    };

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
            const fetchedAttendance = await getAttendance(date, branch, subject, batch);
            setAttendance(fetchedAttendance);
            const submitted = await isSubmitted(date, branch, subject, batch);
            setAlreadySubmitted(submitted);

            // Fetch students from Supabase
            const { data: fetchedStudents, error } = await supabase
                .from('students')
                .select('roll_no, name')
                .eq('branch', branch)
                .order('roll_no', { ascending: true });

            if (error) throw error;

            let studentList = (fetchedStudents || []).map(s => ({
                rollNo: s.roll_no,
                name: s.name,
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
            console.error('SummaryScreen loadData error:', error);
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
            console.error('Share error:', error);
            Alert.alert('Error', 'Failed to share image.');
        }
    };

    const handleReset = async () => {
        Alert.alert(
            'Reset Submission',
            'Are you sure you want to reset? This will allow you to edit the attendance again.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const webhookUrl = SUBJECT_URLS[subject];
                            if (webhookUrl) {
                                await submitAttendance(webhookUrl, {
                                    date,
                                    branch,
                                    subject,
                                    action: 'delete'
                                });
                            }
                            await resetSubmission(date, branch, subject, batch);
                            setAlreadySubmitted(false);
                            Alert.alert(
                                'Reset Complete',
                                'Submission deleted from Google Sheet and reset locally. You can now edit the attendance.',
                                [{
                                    text: 'OK',
                                    onPress: () => router.push({
                                        pathname: '/attendance',
                                        params: { date, branch, subject, batch }
                                    })
                                }]
                            );
                        } catch (error) {
                            await resetSubmission(date, branch, subject, batch);
                            setAlreadySubmitted(false);
                            Alert.alert(
                                'Reset Complete',
                                'Failed to delete from Google Sheet, but reset locally. You can now edit the attendance.',
                                [{
                                    text: 'OK',
                                    onPress: () => router.push({
                                        pathname: '/attendance',
                                        params: { date, branch, subject, batch }
                                    })
                                }]
                            );
                        }
                    }
                }
            ]
        );
    };

    const handleSubmit = async () => {
        // Prevent duplicate submissions
        if (alreadySubmitted) {
            Alert.alert('Already Submitted', 'This attendance has already been submitted.');
            return;
        }

        setSubmitting(true);
        try {
            // --- PRIMARY: Write to Supabase first ---
            const supabaseRows = allStudents.map(s => ({
                branch,
                subject,
                date,
                roll_no: s.rollNo,
                status: (attendance && attendance[s.rollNo]) ? 1 : 0,
            }));

            const { error: supabaseError } = await supabase
                .from('attendance_logs')
                .upsert(supabaseRows, { onConflict: 'branch,subject,date,roll_no' });

            if (supabaseError) throw supabaseError;

            // Mark as submitted locally
            await markAsSubmitted(date, branch, subject, batch);
            setAlreadySubmitted(true);

            // --- SECONDARY: Try Google Sheets (non-blocking) ---
            if (GOOGLE_SCRIPT_URL) {
                const payload = {
                    date,
                    branch,
                    subject,
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
                submitAttendance(GOOGLE_SCRIPT_URL, payload).catch(err => {
                    console.warn('Google Sheets sync failed (non-blocking):', err.message);
                });
            }

            Alert.alert(
                'Submitted!',
                'Attendance saved successfully to the database.',
                [{ text: 'OK', onPress: () => router.push('/') }]
            );
        } catch (error) {
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
                <Button
                    mode={isDark ? "contained-tonal" : "outlined"}
                    icon="share-variant"
                    onPress={handleDownload}
                    style={styles.downloadButton}
                >
                    Share Absent List
                </Button>
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
