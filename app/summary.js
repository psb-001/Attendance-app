import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, Button, Card, List, Divider, ActivityIndicator } from 'react-native-paper';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import studentsData from '../data/students.json';
import { getAttendance, markAsSubmitted, isSubmitted, resetSubmission } from '../services/storage';
import { submitAttendance } from '../services/api';
import { SUBJECT_URLS } from '../constants/config';

export default function SummaryScreen() {
    const { date, division, subject } = useLocalSearchParams();
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [absentStudents, setAbsentStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const viewShotRef = useRef();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const attendance = await getAttendance(date, division, subject);
            const submitted = await isSubmitted(date, division, subject);
            setAlreadySubmitted(submitted);

            const filteredStudents = studentsData.filter(s => s.division === division);
            const total = filteredStudents.length;

            let presentCount = 0;
            const absentList = [];

            filteredStudents.forEach(s => {
                if (attendance && attendance[s.rollNo]) {
                    presentCount++;
                } else {
                    absentList.push(s);
                }
            });

            const absentCount = total - presentCount;
            const percentage = total > 0 ? ((presentCount / total) * 100).toFixed(2) : 0;

            setStats({
                total,
                present: presentCount,
                absent: absentCount,
                percentage,
            });
            setAbsentStudents(absentList);
        } catch (error) {
            console.error(error);
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
                                    division,
                                    subject,
                                    action: 'delete'
                                });
                            }
                            await resetSubmission(date, division, subject);
                            setAlreadySubmitted(false);
                            Alert.alert(
                                'Reset Complete',
                                'Submission deleted from Google Sheet and reset locally. You can now edit the attendance.',
                                [{
                                    text: 'OK',
                                    onPress: () => router.push({
                                        pathname: '/attendance',
                                        params: { date, division, subject }
                                    })
                                }]
                            );
                        } catch (error) {
                            Alert.alert(
                                'Reset Complete',
                                'Failed to delete from Google Sheet, but reset locally. You can now edit the attendance.',
                                [{
                                    text: 'OK',
                                    onPress: () => router.push({
                                        pathname: '/attendance',
                                        params: { date, division, subject }
                                    })
                                }]
                            );
                            await resetSubmission(date, division, subject);
                            setAlreadySubmitted(false);
                        }
                    }
                }
            ]
        );
    };

    const handleSubmit = async () => {
        const webhookUrl = SUBJECT_URLS[subject];

        if (!webhookUrl) {
            Alert.alert('Error', `No Google Sheet URL found for subject: ${subject}. Please configure it in constants/config.js`);
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                date,
                division,
                subject,
                total: stats.total,
                present: stats.present,
                absent: stats.absent,
                percentage: stats.percentage,
                absentList: absentStudents.map(s => `${s.name} (${s.rollNo})`).join(', '),
            };

            const result = await submitAttendance(webhookUrl, payload);
            await markAsSubmitted(date, division, subject);
            setAlreadySubmitted(true);
            Alert.alert(
                'Success',
                `Data saved to: "${result.spreadsheetName}"\nSheet: "${result.sheetName}"\n\nURL: ${result.spreadsheetUrl}`,
                [{ text: 'OK', onPress: () => router.push('/') }]
            );
        } catch (error) {
            Alert.alert('Error', `Failed to submit: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Title title="Summary" subtitle={`${date} - Division ${division}`} />
                <Card.Content>
                    <View style={styles.statRow}>
                        <Text variant="bodyLarge">Subject:</Text>
                        <Text variant="bodyLarge" style={styles.bold}>{subject}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text variant="bodyLarge">Total Students:</Text>
                        <Text variant="bodyLarge" style={styles.bold}>{stats?.total}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text variant="bodyLarge">Present:</Text>
                        <Text variant="bodyLarge" style={{ ...styles.bold, color: 'green' }}>{stats?.present}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text variant="bodyLarge">Absent:</Text>
                        <Text variant="bodyLarge" style={{ ...styles.bold, color: 'red' }}>{stats?.absent}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text variant="bodyLarge">Percentage:</Text>
                        <Text variant="bodyLarge" style={styles.bold}>{stats?.percentage}%</Text>
                    </View>
                </Card.Content>
            </Card>

            <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
                <Card style={styles.card}>
                    <Card.Title title="Absent Students" subtitle={`${subject} - ${date} - Division ${division}`} />
                    <Card.Content>
                        {absentStudents.length === 0 ? (
                            <Text>All students present!</Text>
                        ) : (
                            absentStudents.map((s) => (
                                <View key={s.rollNo}>
                                    <Text>{s.rollNo}. {s.name}</Text>
                                    <Divider style={styles.divider} />
                                </View>
                            ))
                        )}
                    </Card.Content>
                </Card>
            </ViewShot>

            {absentStudents.length > 0 && (
                <Button
                    mode="outlined"
                    icon="share-variant"
                    onPress={handleDownload}
                    style={styles.downloadButton}
                >
                    Share Absent List
                </Button>
            )}

            <Card style={styles.card}>
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
