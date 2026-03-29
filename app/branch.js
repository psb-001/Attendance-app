import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_GAP = 16;
const CARD_WIDTH = (width - 48 - CARD_GAP) / 2;

const BRANCHES = [
    { value: 'AI_ML', label: 'AI / ML', icon: 'robot-outline', color: '#0984E3', bg: '#E3F2FD' },
    { value: 'Computer_Engineering', label: 'Computer\nEngineering', icon: 'code-braces', color: '#00B894', bg: '#E8F5E9' },
    { value: 'Electronics_and_Telecommunication_Engineering', label: 'E&TC', icon: 'chip', color: '#00CEC9', bg: '#E0F7FA' },
    { value: 'Information_Technology', label: 'Information\nTechnology', icon: 'monitor', color: '#636E72', bg: '#F5F5F5' },
];

export default function BranchScreen() {
    const router = useRouter();
    const { subject, date } = useLocalSearchParams();
    const [authChecked, setAuthChecked] = useState(false);
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

    const handleSelect = (branchValue) => {
        router.push({
            pathname: '/attendance',
            params: {
                date: date || new Date().toISOString().split('T')[0],
                branch: branchValue,
                subject
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
            <View style={styles.headerSection}>
                <Text style={[styles.headerTitle, { color: t('#2f333a', '#ffffff') }]}>
                    Select Branch
                </Text>
                <Text style={[styles.headerSub, { color: t('#91939c', '#aeafb4') }]}>
                    {subject} • {formatDate(date)}
                </Text>
            </View>

            <View style={styles.grid}>
                {BRANCHES.map((branch) => (
                    <TouchableOpacity
                        key={branch.value}
                        style={[styles.card, {
                            backgroundColor: t('#ffffff', '#181818'),
                            borderColor: t('rgba(0,0,0,0.04)', 'rgba(255,255,255,0.06)'),
                        }]}
                        onPress={() => handleSelect(branch.value)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconWrap, { backgroundColor: isDark ? `${branch.color}20` : branch.bg }]}>
                            <MaterialCommunityIcons
                                name={branch.icon}
                                size={24}
                                color={branch.color}
                            />
                        </View>
                        <Text style={[styles.cardLabel, { color: t('#1a1a2e', '#ffffff') }]}>
                            {branch.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerSection: {
        marginTop: 20,
        marginBottom: 32,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: -1,
    },
    headerSub: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: CARD_GAP,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 0.85,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        justifyContent: 'space-between',
    },
    iconWrap: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardLabel: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
});
