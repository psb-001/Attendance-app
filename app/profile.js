import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';

export default function ProfileScreen() {
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const { isDark } = useContext(ThemeContext);
    
    const t = (light, dark) => isDark ? dark : light;

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        setProfile(data);
        setLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/login');
    };

    const getInitials = (name) => {
        if (!name) return 'JS';
        const parts = name.split(' ');
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: t('#f9f9fe', '#000000') }]}>
                <ActivityIndicator size="large" color="#3d637e" />
            </View>
        );
    }

    const isTeacher = profile?.role === 'teacher';

    return (
        <View style={[styles.root, { backgroundColor: t('#f9f9fe', '#000000') }]}>
            {/* Header */}
            <View style={styles.header}>
                <IconButton 
                    icon="arrow-left" 
                    size={24} 
                    onPress={() => router.back()} 
                    iconColor={t('#2f333a', '#ffffff')}
                />
                <Text variant="titleLarge" style={[styles.headerTitle, { color: t('#2f333a', '#ffffff') }]}>Profile</Text>
                <IconButton 
                    icon="cog-outline" 
                    size={24} 
                    onPress={() => {}} 
                    iconColor={t('#2f333a', '#ffffff')}
                />
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Profile Info */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        {profile?.avatar_url ? (
                            <Image 
                                source={{ uri: profile.avatar_url }} 
                                style={[styles.avatar, { borderColor: t('#ffffff', '#121212') }]}
                            />
                        ) : (
                            <Surface style={[styles.avatarFallback, { backgroundColor: t('#e3f2fd', 'rgba(61, 99, 126, 0.2)'), borderColor: t('#ffffff', '#121212') }]} elevation={0}>
                                <Text style={[styles.avatarFallbackText, { color: t('#3d637e', '#ffffff') }]}>{getInitials(profile?.full_name)}</Text>
                            </Surface>
                        )}
                        <Surface style={[styles.verifiedBadge, { borderColor: t('#ffffff', '#121212') }]} elevation={2}>
                            <MaterialCommunityIcons name="check-decagram" size={16} color="#ffffff" />
                        </Surface>
                    </View>
                    
                    <Text variant="headlineMedium" style={[styles.name, { color: t('#2f333a', '#ffffff') }]}>
                        {profile?.full_name || (isTeacher ? 'Faculty Member' : 'Student')}
                    </Text>
                    <Text variant="bodyLarge" style={[styles.roleText, { color: t('#3d637e', '#b8dffe') }]}>
                        {isTeacher ? (profile?.role_title || 'Assistant Professor, Dept. of CS') : 'Academic Student'}
                    </Text>
                </View>

                {/* Info Cards */}
                <View style={styles.statsRow}>
                    <Surface style={[styles.statCard, { backgroundColor: t('#f2f3fa', '#1e1e1e'), borderColor: t('rgba(174, 178, 187, 0.1)', 'rgba(255, 255, 255, 0.05)') }]} elevation={0}>
                        <Text style={[styles.statLabel, { color: t('#5b5f68', '#aeafb4') }]}>DEPARTMENT</Text>
                        <Text style={[styles.statValue, { color: t('#2f333a', '#ffffff') }]}>
                            {profile?.branch || 'Information Technology'}
                        </Text>
                    </Surface>
                </View>

                <View style={styles.statsRow}>
                    <Surface style={[styles.statCard, styles.subjectsCard, { backgroundColor: t('#e3f2fd', 'rgba(61, 99, 126, 0.2)'), borderColor: t('rgba(61, 99, 126, 0.1)', 'transparent') }]} elevation={0}>
                        <Text style={[styles.statLabelBlue, { color: t('#3d637e', '#b8dffe') }]}>SUBJECTS</Text>
                        <Text style={[styles.subjectsCount, { color: t('#3d637e', '#ffffff') }]}>
                            {profile?.subjects?.length || '03'}
                        </Text>
                        <Text style={[styles.statSubText, { color: t('#3d637e', '#b8dffe') }]}>Active Courses</Text>
                    </Surface>
                </View>

                {/* Account Settings */}
                <Text style={[styles.sectionHeader, { color: t('#91939c', '#aeafb4') }]}>ACCOUNT SETTINGS</Text>
                
                <Surface style={[styles.settingsCard, { backgroundColor: t('#ffffff', '#121212'), borderColor: t('rgba(174, 178, 187, 0.1)', 'rgba(255, 255, 255, 0.05)') }]} elevation={0}>
                    <TouchableOpacity style={styles.settingItem}>
                        <View style={[styles.settingIconContainer, { backgroundColor: t('#f2f3fa', '#1e1e1e') }]}>
                            <MaterialCommunityIcons name="email-outline" size={20} color={t('#3d637e', '#b8dffe')} />
                        </View>
                        <View style={styles.settingTextContainer}>
                            <Text style={[styles.settingLabel, { color: t('#5b5f68', '#aeafb4') }]}>Email Address</Text>
                            <Text style={[styles.settingValue, { color: t('#2f333a', '#ffffff') }]}>{profile?.email || 'user@university.edu'}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={t('#aeafb4', '#5b5f68')} />
                    </TouchableOpacity>

                    <View style={[styles.divider, { backgroundColor: t('rgba(174, 178, 187, 0.1)', 'rgba(255, 255, 255, 0.05)') }]} />

                    <TouchableOpacity style={styles.settingItem}>
                        <View style={[styles.settingIconContainer, { backgroundColor: t('#f2f3fa', '#1e1e1e') }]}>
                            <MaterialCommunityIcons name="lock-outline" size={20} color={t('#3d637e', '#b8dffe')} />
                        </View>
                        <View style={styles.settingTextContainer}>
                            <Text style={[styles.settingLabel, { color: t('#5b5f68', '#aeafb4') }]}>Security</Text>
                            <Text style={[styles.settingValue, { color: t('#2f333a', '#ffffff') }]}>Change Password</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={t('#aeafb4', '#5b5f68')} />
                    </TouchableOpacity>
                </Surface>

                {/* Logout Button */}
                <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: t('#fff', '#121212'), borderColor: t('#fa746f20', 'rgba(250, 116, 111, 0.2)') }]} onPress={handleLogout}>
                    <MaterialCommunityIcons name="logout-variant" size={20} color="#fa746f" style={{ marginRight: 8 }} />
                    <Text style={[styles.logoutText, { color: '#fa746f' }]}>Logout</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Academic Portal v2.4.0</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    headerTitle: {
        fontWeight: '800',
    },
    container: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    profileHeader: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 32,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
    },
    avatarFallback: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
    },
    avatarFallbackText: {
        fontSize: 40,
        fontWeight: '900',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#426658',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    name: {
        fontWeight: '900',
        marginBottom: 8,
    },
    roleText: {
        textAlign: 'center',
        fontWeight: '600',
        paddingHorizontal: 20,
        lineHeight: 22,
    },
    statsRow: {
        marginBottom: 16,
    },
    statCard: {
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
    },
    subjectsCard: {
        borderWidth: 1,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 8,
    },
    statLabelBlue: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    subjectsCount: {
        fontSize: 48,
        fontWeight: '900',
        marginTop: -8,
    },
    statSubText: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginTop: 24,
        marginBottom: 16,
    },
    settingsCard: {
        borderRadius: 20,
        paddingVertical: 8,
        borderWidth: 1,
        marginBottom: 32,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    settingIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    settingTextContainer: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    settingValue: {
        fontSize: 15,
        fontWeight: '800',
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 32,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '900',
    },
    footer: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    footerText: {
        fontSize: 12,
        color: '#aeafb4',
        fontWeight: '500',
    }
});
