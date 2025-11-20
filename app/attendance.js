import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Checkbox, Text, Button, ActivityIndicator, Card, Avatar, IconButton, Searchbar } from 'react-native-paper';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useNetInfo } from '@react-native-community/netinfo';
import studentsData from '../data/students.json';
import { getAttendance, saveAttendance, isSubmitted } from '../services/storage';

export default function AttendanceScreen() {
    const { date, division, subject } = useLocalSearchParams();
    const router = useRouter();
    const netInfo = useNetInfo();
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(true);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [date, division, subject])
    );

    const loadData = async () => {
        setLoading(true);
        try {
            // Filter students by division
            const filteredStudents = studentsData.filter(s => s.division === division);
            setStudents(filteredStudents);

            // Check if already submitted
            const submitted = await isSubmitted(date, division, subject);
            setAlreadySubmitted(submitted);

            // Load existing attendance or default to all present
            const savedAttendance = await getAttendance(date, division, subject);
            if (savedAttendance) {
                setAttendance(savedAttendance);
            } else {
                const initialAttendance = {};
                filteredStudents.forEach(s => {
                    initialAttendance[s.rollNo] = true; // Default present
                });
                setAttendance(initialAttendance);
                // Save initial state immediately so it persists even if no changes are made
                saveAttendance(date, division, subject, initialAttendance);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const setStatus = useCallback((rollNo, status) => {
        if (alreadySubmitted) return;
        setAttendance(prev => {
            const newAttendance = { ...prev, [rollNo]: status };
            saveAttendance(date, division, subject, newAttendance);
            return newAttendance;
        });
    }, [alreadySubmitted, date, division, subject]);

    const handleReview = () => {
        router.push({
            pathname: '/summary',
            params: { date, division, subject },
        });
    };

    const renderItem = useCallback(({ item }) => (
        <StudentCard
            item={item}
            isPresent={attendance[item.rollNo]}
            onToggle={setStatus}
            disabled={alreadySubmitted}
        />
    ), [attendance, setStatus, alreadySubmitted]);

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.rollNo.toString().includes(searchQuery)
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text variant="titleMedium">Date: {date}</Text>
                <Text variant="titleMedium">Division: {division}</Text>
                <Text variant="titleMedium">Subject: {subject}</Text>
            </View>

            {netInfo.isConnected === false && (
                <View style={styles.offlineBanner}>
                    <Text style={styles.offlineText}>You are offline. Changes will be saved locally.</Text>
                </View>
            )}

            {alreadySubmitted && (
                <View style={styles.banner}>
                    <Text style={styles.bannerText}>Attendance already submitted for this date.</Text>
                </View>
            )}

            <Searchbar
                placeholder="Search by name or roll no"
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
            />

            <FlatList
                data={filteredStudents}
                renderItem={renderItem}
                keyExtractor={(item) => item.rollNo.toString()}
                contentContainerStyle={styles.list}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                getItemLayout={(data, index) => (
                    { length: 80, offset: 80 * index, index }
                )}
            />

            <View style={styles.footer}>
                <Button mode="contained" onPress={handleReview} style={styles.button}>
                    Review & Submit
                </Button>
            </View>
        </View>
    );
}

const StudentCard = React.memo(({ item, isPresent, onToggle, disabled }) => (
    <Card style={styles.card}>
        <Card.Title
            title={item.name}
            subtitle={`Roll No: ${item.rollNo}`}
            right={(props) => (
                <View style={{ flexDirection: 'row' }}>
                    <IconButton
                        icon="check-circle"
                        iconColor={isPresent ? '#4caf50' : '#e0e0e0'}
                        size={30}
                        onPress={() => onToggle(item.rollNo, true)}
                        disabled={disabled}
                    />
                    <IconButton
                        icon="close-circle"
                        iconColor={!isPresent ? '#f44336' : '#e0e0e0'}
                        size={30}
                        onPress={() => onToggle(item.rollNo, false)}
                        disabled={disabled}
                    />
                </View>
            )}
        />
    </Card>
));

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: 'white',
        elevation: 2,
    },
    banner: {
        backgroundColor: '#ffcc00',
        padding: 10,
        alignItems: 'center',
    },
    bannerText: {
        fontWeight: 'bold',
    },
    list: {
        padding: 10,
        paddingBottom: 80,
    },
    card: {
        marginBottom: 10,
        height: 70, // Fixed height for optimization
        justifyContent: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 15,
        backgroundColor: 'white',
        elevation: 8,
    },
    button: {
        paddingVertical: 5,
    },
    searchBar: {
        margin: 10,
        marginBottom: 5,
        backgroundColor: 'white',
    },
    offlineBanner: {
        backgroundColor: '#f44336',
        padding: 10,
        alignItems: 'center',
    },
    offlineText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
