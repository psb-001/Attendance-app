import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';

const CARD_GAP = 16;
const SCREEN_PADDING = 24;

const BATCHES = [
    { value: 'B1', label: 'Batch B1', icon: 'account-group', color: '#0984E3', bg: '#E3F2FD' },
    { value: 'B2', label: 'Batch B2', icon: 'account-group', color: '#00B894', bg: '#E8F5E9' },
    { value: 'B3', label: 'Batch B3', icon: 'account-group', color: '#00CEC9', bg: '#E0F7FA' },
];

export default function BatchScreen() {
    const router = useRouter();
    const { width: windowWidth } = useWindowDimensions();
    const { subject, date, branch } = useLocalSearchParams();
    const [authChecked, setAuthChecked] = useState(false);
    const { isDark } = useContext(ThemeContext);

    const t = (light, dark) => isDark ? dark : light;

    // Responsive Logic
    const contentWidth = Math.min(windowWidth - (SCREEN_PADDING * 2), 652); // Keep it compact for 2 columns
    const cardWidth = (contentWidth - CARD_GAP) / 2;

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

    useEffect(() => {
        checkTeacher();
    }, []);

    const checkTeacher = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.replace('/login'); return; }
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (!profile || profile.role !== 'teacher') { router.replace('/student-dashboard'); return; }
        setAuthChecked(true);
    };

    const handleSelect = (batchValue) => {
        router.push({
            pathname: '/attendance',
            params: {
                date,
                branch,
                subject,
                batch: batchValue
            }
        });
    };

    if (!authChecked) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: t('#f9f9fe', '#000000') }]}>
                <ActivityIndicator size="large" color="#3d637e" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: t('#f9f9fe', '#000000') }]}>
            <View style={[styles.mainContent, { alignSelf: 'center', width: '100%', maxWidth: 700 }]}>
                <View style={styles.topNav}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={28} color={t('#2f333a', '#ffffff')} />
                    </TouchableOpacity>
                </View>

                <View style={styles.headerSection}>
                    <Text variant="headlineMedium" style={[styles.headerTitle, { color: t('#2f333a', '#ffffff') }]}>
                        Select Batch
                    </Text>
                    <Text style={[styles.headerSub, { color: t('#91939c', '#aeafb4') }]}>
                        {subject} • {branch} • {formatDate(date)}
                    </Text>
                </View>

                <View style={styles.grid}>
                    {BATCHES.map((batchItem) => (
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
