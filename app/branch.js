import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Platform, useWindowDimensions } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { formatDate } from '../utils/dashboardHelpers';
import AppHeader from '../components/AppHeader';

const SCREEN_PADDING = 24;
const CARD_GAP = 16;
const MAX_CONTENT_WIDTH = 1200;

export default function BranchScreen() {
    const router = useRouter();
    const { width: windowWidth } = useWindowDimensions();
    const { subject, date } = useLocalSearchParams();
    const [authChecked, setAuthChecked] = useState(false);
    const [dbBranches, setDbBranches] = useState([]);
    const [profile, setProfile] = useState(null);
    const { isDark } = useContext(ThemeContext);

    const t = (light, dark) => isDark ? dark : light;

    // Responsive Logic
    const contentWidth = Math.min(windowWidth - (SCREEN_PADDING * 2), 600);
    const cardWidth = (contentWidth - CARD_GAP) / 2;



    useEffect(() => {
        checkTeacher();
    }, []);

    const checkTeacher = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.replace('/login'); return; }
        
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

        if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
            if (__DEV__) console.warn("Access Denied: You are not authorized for this view.");
            router.replace('/');
            return;
        }

        setProfile(profile);

        // Fetch branches from database
        const { data: branches, error: branchError } = await supabase
            .from('branches')
            .select('*')
            .order('sort_order', { ascending: true });
        
        if (!branchError && branches && branches.length > 0) {
            setDbBranches(branches.map(b => ({
                value: b.value,
                label: b.label.replace('\\n', '\n'),
                icon: b.icon || 'robot-outline',
                color: b.color || '#3d637e',
                bg: b.bg_light || '#f5f5f5',
            })));
        } else {
            // Fallback if the Supabase `branches` table hasn't been created yet
            setDbBranches([
                { value: 'Computer Engineering', label: 'Computer\nEngineering', icon: 'laptop', color: '#0984E3', bg: '#e6f3ff' },
                { value: 'AI / ML', label: 'AI & Machine\nLearning', icon: 'robot-outline', color: '#6C5CE7', bg: '#f1efff' },
                { value: 'Information Technology', label: 'Information\nTechnology', icon: 'database', color: '#00B894', bg: '#e0fff4' },
                { value: 'Electronics and Telecommunication Engineering', label: 'Electronics &\nTelecom', icon: 'broadcast', color: '#E17055', bg: '#ffebe3' },
            ]);
        }
        
        setAuthChecked(true);
    };

    const handleSelect = (branchValue) => {
        const isLab = subject && subject.toLowerCase().includes('lab');
        
        router.push({
            pathname: isLab ? '/batch' : '/attendance',
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
            <View style={[styles.mainContent, { alignSelf: 'center', width: '100%', maxWidth: 700 }]}>
                {/* Unified Header & Nav */}
                <View style={styles.topNav}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={28} color={t('#2f333a', '#ffffff')} />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={dbBranches}
                    keyExtractor={(item) => item.value}
                    numColumns={2}
                    contentContainerStyle={styles.content}
                    columnWrapperStyle={styles.row}
                    ListHeaderComponent={() => (
                        <View style={styles.headerSection}>
                            <Text variant="headlineMedium" style={[styles.headerTitle, { color: t('#2f333a', '#ffffff') }]}>
                                Select Branch
                            </Text>
                            <Text style={[styles.headerSub, { color: t('#91939c', '#aeafb4') }]}>
                                {subject} • {formatDate(date)}
                            </Text>
                        </View>
                    )}
                    renderItem={({ item: branch }) => (
                        <TouchableOpacity
                            style={[styles.card, {
                                width: (Math.min(windowWidth, 700) - (SCREEN_PADDING * 2) - CARD_GAP) / 2,
                                backgroundColor: t('#ffffff', '#121212'),
                                borderColor: t('rgba(174, 178, 187, 0.12)', 'rgba(255, 255, 255, 0.08)'),
                            }]}
                            onPress={() => handleSelect(branch.value)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconWrap, { backgroundColor: isDark ? `${branch.color}25` : branch.bg }]}>
                                <MaterialCommunityIcons
                                    name={branch.icon}
                                    size={32}
                                    color={branch.color}
                                />
                            </View>
                            <Text style={[styles.cardLabel, { color: t('#1a1a2e', '#ffffff') }]}>
                                {branch.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
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
        paddingBottom: 0,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        paddingHorizontal: SCREEN_PADDING,
        paddingTop: 20,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerSection: {
        marginBottom: 40,
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
    row: {
        justifyContent: 'space-between',
        marginBottom: CARD_GAP,
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
        lineHeight: 18,
        textAlign: 'center',
    }
});
