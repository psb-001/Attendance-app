import React, { useState, useCallback, useContext } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Text, Button, ActivityIndicator, Card, IconButton, Searchbar } from 'react-native-paper';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useNetInfo } from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';
import { getAttendance, saveAttendance, isSubmitted } from '../services/storage';
import { getStudentBatch, fetchBatches } from '../constants/batches';
import { ThemeContext } from '../context/ThemeContext';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/dashboardHelpers';

export default function AttendanceScreen() {
    const { date, branch, subject, batch } = useLocalSearchParams();
    const router = useRouter();
    const netInfo = useNetInfo();
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { isDark } = useContext(ThemeContext);
    const t = (light, dark) => isDark ? dark : light;



    useFocusEffect(
        useCallback(() => {
            // 🧪 SMART LAB DETECTION: If it's a lab but no batch is selected, send them to select one.
            const isLab = subject?.toLowerCase().endsWith('lab');
            if (isLab && (!batch || batch === 'ALL')) {
                router.replace({
                    pathname: '/batch',
                    params: { date, branch, subject }
                });
                return;
            }

            loadData();

            // Auto-refresh submission status every 5 seconds
            const interval = setInterval(async () => {
                const submitted = await isSubmitted(date, branch, subject, batch);
                setAlreadySubmitted(submitted);
            }, 5000);

            return () => clearInterval(interval);
        }, [date, branch, subject, batch])
    );

    const loadData = async () => {
        setLoading(true);
        try {
            await fetchBatches();
            
            // 🛡️ IRONCLAD REGISTRY: We now fetch students from the 'students_registry' table.
            // This is the single source of truth for enrolled students.
            const { data: fetchedStudents, error } = await supabase
                .from('students_registry')
                .select('roll_no, full_name')
                .eq('branch', branch)
                .eq('is_active', true)
                .order('roll_no', { ascending: true });

            if (error) throw error;

            // Normalize to match local state shape
            let normalizedStudents = (fetchedStudents || []).map(s => ({
                rollNo: s.roll_no,
                name: s.full_name,
            }));

            // Filter by Batch (B1, B2, B3) if selected
            if (batch && batch !== 'ALL') {
                normalizedStudents = normalizedStudents.filter(s => getStudentBatch(s.rollNo) === batch);
            }

            setStudents(normalizedStudents);

            // Check if already submitted
            const submitted = await isSubmitted(date, branch, subject, batch);
            setAlreadySubmitted(submitted);

            // Load existing attendance or default to all present
            const savedAttendance = await getAttendance(date, branch, subject, batch);
            const initialAttendance = savedAttendance || {};
            
            normalizedStudents.forEach(s => {
                if (initialAttendance[s.rollNo] === undefined) {
                    initialAttendance[s.rollNo] = true; 
                }
            });

            setAttendance(initialAttendance);
            if (!savedAttendance) {
                saveAttendance(date, branch, subject, batch, initialAttendance);
            }
        } catch (error) {
            if (__DEV__) console.error('loadData error:', error);
            Alert.alert('Data Error', error.message || 'Failed to load students.');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    const setStatus = useCallback((rollNo, status) => {
        if (alreadySubmitted) return;
        setAttendance(prev => {
            const newAttendance = { ...prev, [rollNo]: status };
            saveAttendance(date, branch, subject, batch, newAttendance);
            return newAttendance;
        });
    }, [alreadySubmitted, date, branch, subject, batch]);

    const handleReview = () => {
        router.push({
            pathname: '/summary',
            params: { date, branch, subject, batch },
        });
    };

    const renderItem = useCallback(({ item }) => (
        <StudentCard
            item={item}
            isPresent={attendance[item.rollNo]}
            onToggle={setStatus}
            disabled={alreadySubmitted}
            isDark={isDark}
        />
    ), [attendance, setStatus, alreadySubmitted, isDark]);

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.rollNo.toString().includes(searchQuery)
    );

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: t('#f5f5f5', '#000000') }]}>
                <ActivityIndicator size="large" color="#3d637e" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: t('#f5f5f5', '#000000') }]}>
            <View style={[styles.header, { backgroundColor: t('white', '#1e1e1e'), borderBottomColor: t('#ddd', '#333'), borderBottomWidth: 1 }]}>
                <Text variant="titleSmall" style={{ color: t('#666', '#aaa'), fontWeight: '700', textTransform: 'uppercase' }}>{formatDate(date)}</Text>
                <Text variant="titleMedium" style={{ color: t('black', 'white'), fontWeight: '900' }} numberOfLines={1}>{subject}</Text>
                <Text variant="bodySmall" style={{ color: t('#3d637e', '#b8dffe'), fontWeight: '800' }}>{branch}{batch ? ` • ${batch}` : ''}</Text>
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
                style={[styles.searchBar, { backgroundColor: t('white', '#2a2d35') }]}
                inputStyle={{ color: t('black', 'white') }}
                placeholderTextColor={t('#666', '#aaa')}
                iconColor={t('#666', '#aaa')}
            />

            {filteredStudents.length > 0 ? (
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
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={onRefresh} 
                            tintColor={isDark ? '#3d637e' : '#3d637e'} 
                            colors={['#3d637e']} 
                        />
                    }
                />
            ) : (
                <EmptyState 
                    icon="account-search" 
                    message="No Students Found" 
                    subMessage="Try adjusting your search query."
                    style={{ marginTop: 40 }}
                />
            )}

            <View style={[styles.footer, { backgroundColor: t('white', '#1e1e1e'), borderTopColor: t('#eee', '#333'), borderTopWidth: 1 }]}>
                <Button mode="contained" onPress={handleReview} style={styles.button}>
                    Review & Submit
                </Button>
            </View>
        </View>
    );
}

const StudentCard = React.memo(({ item, isPresent, onToggle, disabled, isDark }) => {
    const t = (light, dark) => isDark ? dark : light;
    return (
        <Card style={[styles.card, { backgroundColor: t('white', '#1e1e1e') }]}>
            <Card.Title
                title={item.name}
                subtitle={`Roll No: ${item.rollNo}`}
                titleStyle={{ color: t('black', 'white') }}
                subtitleStyle={{ color: t('#666', '#aaa') }}
                right={(props) => (
                    <View style={{ flexDirection: 'row' }}>
                        <IconButton
                            icon="check-circle"
                            iconColor={isPresent ? '#4caf50' : t('#e0e0e0', '#333')}
                            size={30}
                            onPress={() => onToggle(item.rollNo, true)}
                            disabled={disabled}
                        />
                        <IconButton
                            icon="close-circle"
                            iconColor={!isPresent ? '#f44336' : t('#e0e0e0', '#333')}
                            size={30}
                            onPress={() => onToggle(item.rollNo, false)}
                            disabled={disabled}
                        />
                    </View>
                )}
            />
        </Card>
    );
});

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
        padding: 15,
        elevation: 2,
        gap: 2,
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
        elevation: 8,
    },
    button: {
        paddingVertical: 5,
    },
    searchBar: {
        margin: 10,
        marginBottom: 5,
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
