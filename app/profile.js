import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput as RNTextInput } from 'react-native';
import { Text, Surface, IconButton, ActivityIndicator as PaperActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';

export default function ProfileScreen() {
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const { isDark } = useContext(ThemeContext);
    
    const t = (light, dark) => isDark ? dark : light;

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            const profileData = data ? {
                ...data,
                email: data.email || session.user.email,
                full_name: data.full_name || data.name
            } : {
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || 'Academic User'
            };

            setProfile(profileData);
            setNewEmail(profileData.email);
        } catch (err) {
            console.error("Profile fetch failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEmail = async () => {
        if (!newEmail || newEmail === profile?.email) {
            setIsEditingEmail(false);
            return;
        }

        try {
            setIsUpdating(true);
            const { error } = await supabase.auth.updateUser({ email: newEmail });
            if (error) throw error;

            Alert.alert(
                "Verification Sent",
                "Check your new email to confirm the change. The app will update once verified.",
                [{ text: "OK", onPress: () => setIsEditingEmail(false) }]
            );
        } catch (err) {
            Alert.alert("Update Failed", err.message);
        } finally {
            setIsUpdating(false);
        }
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
                <View style={{ width: 48 }} /> {/* Balancer */}
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Profile Info Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <Surface style={[styles.avatarGlow, { backgroundColor: t('#3d637e1a', '#3d637e33') }]} elevation={0} />
                        {profile?.avatar_url ? (
                            <Image 
                                source={{ uri: profile.avatar_url }} 
                                style={[styles.profileAvatar, { borderColor: t('#ffffff', '#121212') }]}
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
                    <Surface style={[styles.statCard, { backgroundColor: t('#f2f3fa', '#121212'), borderColor: t('#3d637e20', '#3d637e40') }]} elevation={0}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.statLabel, { color: t('#5b5f68', '#aeafb4') }]}>DEPARTMENT</Text>
                            <Text style={[styles.statValue, { color: t('#2f333a', '#ffffff') }]} numberOfLines={1}>
                                {profile?.branch || 'Information Technology'}
                            </Text>
                        </View>
                    </Surface>
                    {profile?.roll_no && (
                        <Surface style={[styles.statCard, { backgroundColor: t('#f2f3fa', '#121212'), borderColor: t('#3d637e20', '#3d637e40'), marginLeft: 12 }]} elevation={0}>
                            <View style={[styles.statIconBox, { backgroundColor: t('#3d637e10', '#3d637e20') }]}>
                                <MaterialCommunityIcons name="numeric" size={20} color={t('#3d637e', '#b8dffe')} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.statLabel, { color: t('#5b5f68', '#aeafb4') }]}>ROLL NUMBER</Text>
                                <Text style={[styles.statValue, { color: t('#2f333a', '#ffffff') }]} numberOfLines={1}>
                                    {profile?.roll_no}
                                </Text>
                            </View>
                        </Surface>
                    )}
                </View>

                {/* Account Settings */}
                <Text style={[styles.sectionHeader, { color: t('#91939c', '#aeafb4') }]}>ACCOUNT SETTINGS</Text>
                
                <Surface style={[styles.settingsCard, { backgroundColor: t('#ffffff', '#121212'), borderColor: t('#3d637e20', '#3d637e40') }]} elevation={0}>
                    <View style={styles.settingItem}>
                        <View style={[styles.settingIconContainer, { backgroundColor: t('#f2f3fa', '#1e1e1e') }]}>
                            <MaterialCommunityIcons name="email-outline" size={20} color={t('#3d637e', '#b8dffe')} />
                        </View>
                        <View style={styles.settingTextContainer}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={[styles.settingLabel, { color: t('#5b5f68', '#aeafb4') }]}>Email Address</Text>
                                {!isEditingEmail && (
                                    <TouchableOpacity onPress={() => setIsEditingEmail(true)}>
                                        <MaterialCommunityIcons name="pencil" size={14} color={t('#3d637e', '#b8dffe')} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {isEditingEmail ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                    <RNTextInput
                                        value={newEmail}
                                        onChangeText={setNewEmail}
                                        style={{
                                            flex: 1,
                                            color: t('#2f333a', '#ffffff'),
                                            fontSize: 15,
                                            fontWeight: '800',
                                            padding: 0,
                                            borderBottomWidth: 1,
                                            borderBottomColor: t('#3d637e', '#b8dffe')
                                        }}
                                        autoFocus
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity onPress={handleUpdateEmail} style={{ marginLeft: 12 }}>
                                        {isUpdating ? (
                                            <PaperActivityIndicator size={18} color="#3d637e" />
                                        ) : (
                                            <MaterialCommunityIcons name="check" size={20} color="#4caf50" />
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setIsEditingEmail(false)} style={{ marginLeft: 12 }}>
                                        <MaterialCommunityIcons name="close" size={20} color="#fa746f" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <Text style={[styles.settingValue, { color: t('#2f333a', '#ffffff') }]}>{profile?.email || 'N/A'}</Text>
                            )}
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: t('#3d637e1a', '#3d637e33') }]} />

                    <TouchableOpacity style={styles.settingItem}>
                        <View style={[styles.settingIconContainer, { backgroundColor: t('#f2f3fa', '#1e1e1e') }]}>
                            <MaterialCommunityIcons name="shield-check-outline" size={20} color={t('#3d637e', '#b8dffe')} />
                        </View>
                        <View style={styles.settingTextContainer}>
                            <Text style={[styles.settingLabel, { color: t('#5b5f68', '#aeafb4') }]}>Privacy & Security</Text>
                            <Text style={[styles.settingValue, { color: t('#2f333a', '#ffffff') }]}>Manage Permissions</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={t('#aeafb4', '#5b5f68')} />
                    </TouchableOpacity>
                </Surface>

                {/* Logout Button */}
                <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: t('#ffffff', '#121212'), borderColor: t('#fa746f30', '#fa746f50') }]} onPress={handleLogout}>
                    <View style={styles.logoutIconCircle}>
                        <MaterialCommunityIcons name="logout-variant" size={18} color="#fa746f" />
                    </View>
                    <Text style={styles.logoutText}>Logout from Session</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#fa746f50" />
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
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarGlow: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        opacity: 0.5,
    },
    profileAvatar: {
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
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 4,
    },
    roleText: {
        textAlign: 'center',
        fontWeight: '600',
        letterSpacing: 0.5,
        opacity: 0.8,
    },
    statsRow: {
        marginBottom: 24,
    },
    statCard: {
        borderRadius: 24,
        padding: 20,
        borderWidth: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    sectionHeader: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 2,
        marginTop: 24,
        marginBottom: 16,
        opacity: 0.6,
    },
    settingsCard: {
        borderRadius: 28,
        paddingVertical: 10,
        borderWidth: 1.5,
        marginBottom: 32,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    settingIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    settingTextContainer: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 12,
        fontWeight: '700',
    },
    settingValue: {
        fontSize: 15,
        fontWeight: '800',
        marginTop: 4,
    },
    divider: {
        height: 1,
        marginHorizontal: 20,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 72,
        borderRadius: 24,
        borderWidth: 1.5,
        marginBottom: 40,
    },
    logoutIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#fa746f15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    logoutText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '900',
        color: '#fa746f',
    },
    footer: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    footerText: {
        fontSize: 10,
        color: '#aeafb4',
        fontWeight: '800',
        letterSpacing: 1,
        opacity: 0.5,
    }
});
