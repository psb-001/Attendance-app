import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { formatDate } from '../utils/dashboardHelpers';

const CARD_GAP = 16;
const SCREEN_PADDING = 24;

export default function BatchScreen() {
    const router = useRouter();
    const { width: windowWidth } = useWindowDimensions();
    const { subject, date, branch } = useLocalSearchParams();
    const [authChecked, setAuthChecked] = useState(false);
    const [dbBatches, setDbBatches] = useState([]);
    const { isDark } = useContext(ThemeContext);

    const t = (light, dark) => isDark ? dark : light;

    // Responsive Logic
    const contentWidth = Math.min(windowWidth - (SCREEN_PADDING * 2), 652);
    const cardWidth = (contentWidth - CARD_GAP) / 2;



    const isLab = subject?.toLowerCase().endsWith('lab');

    useEffect(() => {
        checkTeacherAndLoadBatches();
    }, []);

    const checkTeacherAndLoadBatches = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.replace('/login'); return; }
        
        // 🛡️ TRUST THE REGISTRY: Simplified role check
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (!profile || profile.role !== 'teacher') { 
            router.replace(profile?.role === 'admin' ? '/admin-dashboard' : '/student-dashboard'); 
            return; 
        }

        // Fetch batches from database
        const { data: batches, error } = await supabase
            .from('batches')
            .select('*')
            .order('sort_order', { ascending: true });
        
        if (!error && batches && batches.length > 0) {
            setDbBatches(batches.map(b => ({
                value: b.value,
                label: b.name,
                icon: b.icon || 'flask-outline', // Scientist icon for Labs
                color: b.color || '#3d637e',
                bg: `${b.color || '#3d637e'}20`,
            })));
        } else {
            // Fallback to our B1, B2, B3 standards
            setDbBatches([
                { value: 'B1', label: 'Batch B1', icon: 'account-group', color: '#0984E3', bg: '#0984E320' },
                { value: 'B2', label: 'Batch B2', icon: 'account-group', color: '#6C5CE7', bg: '#6C5CE720' },
                { value: 'B3', label: 'Batch B3', icon: 'account-group', color: '#E17055', bg: '#E1705520' },
            ]);
        }
        setAuthChecked(true);
    };

    const handleSelect = (batchValue) => {
        router.push({
            pathname: '/attendance',
            params: { date, branch, subject, batch: batchValue }
        });
    };

    if (!authChecked) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: '#000000' }]}>
                <ActivityIndicator size="large" color="#3d637e" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: '#000000' }]}>
            <View style={[styles.mainContent, { alignSelf: 'center', width: '100%', maxWidth: 700 }]}>
                <View style={styles.topNav}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={28} color="#ffffff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.headerSection}>
                    {isLab && (
                        <View style={styles.labBadge}>
                            <MaterialCommunityIcons name="flask-outline" size={16} color="#ff9800" />
                            <Text style={styles.labBadgeText}>LAB MODE ACTIVE</Text>
                        </View>
                    )}
                    <Text variant="headlineMedium" style={[styles.headerTitle, { color: '#ffffff' }]}>
                        {isLab ? 'Select Lab Batch' : 'Select Batch'}
                    </Text>
                    <Text style={[styles.headerSub, { color: '#aeafb4' }]}>
                        {subject} • {formatDate(date)}
                    </Text>
                </View>

                <View style={styles.grid}>
                    {dbBatches.map((batchItem) => (
                        <TouchableOpacity
                            key={batchItem.value}
                            style={[styles.card, {
                                width: cardWidth,
                                backgroundColor: t('#ffffff', '#121212'),
                                borderColor: t('rgba(174, 178, 187, 0.12)', 'rgba(255, 255, 255, 0.08)'),
                            }]}
                            onPress={() => handleSelect(batchItem.value)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconWrap, { backgroundColor: isDark ? `${batchItem.color}25` : batchItem.bg }]}>
                                <MaterialCommunityIcons
                                    name={batchItem.icon}
                                    size={32}
                                    color={batchItem.color}
                                />
                            </View>
                            <Text style={[styles.cardLabel, { color: t('#1a1a2e', '#ffffff') }]}>
                                {batchItem.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mainContent: {
        flex: 1,
    },
    topNav: {
        paddingHorizontal: SCREEN_PADDING,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerSection: {
        paddingHorizontal: SCREEN_PADDING,
        marginBottom: 32,
    },
    headerTitle: {
        fontWeight: '900',
        letterSpacing: -1.5,
    },
    headerSub: {
        fontSize: 15,
        fontWeight: '700',
        marginTop: 6,
        letterSpacing: -0.2,
    },
    labBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 152, 0, 0.2)',
    },
    labBadgeText: {
        color: '#ff9800',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginLeft: 6,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: CARD_GAP,
        paddingHorizontal: SCREEN_PADDING,
    },
    card: {
        aspectRatio: 1,
        borderRadius: 32,
        padding: 20,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        // Premium Shadow
        shadowColor: '#3d637e',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 6,
    },
    iconWrap: {
        width: 64,
        height: 64,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardLabel: {
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: -0.5,
        textAlign: 'center',
        lineHeight: 18,
    },
});
