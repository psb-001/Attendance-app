import { View, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput as RNTextInput } from 'react-native';
import { Text, Surface, IconButton, ActivityIndicator as PaperActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useContext, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ThemeContext } from '../context/ThemeContext';
import { getInitials } from '../utils/dashboardHelpers';

/**
 * Shared Profile Tab used by both Student and Teacher dashboards.
 * Props:
 *   - profile: object (user profile data)
 *   - onLogout: () => void
 *   - roleLabel: string (e.g. 'Academic Student' or 'Faculty Member')
 */
export default function ProfileTab({ profile, onLogout, roleLabel = 'User' }) {
    const { isDark } = useContext(ThemeContext);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [newEmail, setNewEmail] = useState(profile?.email || '');
    const [isUpdating, setIsUpdating] = useState(false);

    const t = (light, dark) => isDark ? dark : light;

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
                "Please check your new email inbox to confirm the change. You will remain logged in with your current email until verified.",
                [{ text: "OK", onPress: () => setIsEditingEmail(false) }]
            );
        } catch (err) {
            Alert.alert("Update Failed", err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <View style={{ marginTop: 24, paddingBottom: 60 }}>
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
                            <Text style={[styles.avatarFallbackText, { color: t('#3d637e', '#ffffff') }]}>
                                {getInitials(profile?.full_name || profile?.name)}
                            </Text>
                        </Surface>
                    )}
                    <Surface style={[styles.verifiedBadge, { borderColor: t('#ffffff', '#121212') }]} elevation={2}>
                        <MaterialCommunityIcons name="check-decagram" size={16} color="#ffffff" />
                    </Surface>
                </View>

                <Text variant="headlineMedium" style={[styles.profileName, { color: t('#2f333a', '#ffffff') }]}>
                    {profile?.full_name || profile?.name || 'User'}
                </Text>
                <Text variant="bodyLarge" style={[styles.profileRole, { color: t('#3d637e', '#b8dffe') }]}>
                    {roleLabel}
                </Text>
            </View>

            {/* Info Cards */}
            <View style={styles.profileStatsRow}>
                <Surface style={[styles.profileStatCard, { backgroundColor: t('#f2f3fa', '#121212'), borderColor: t('#3d637e20', '#3d637e40') }]} elevation={0}>
                    <View style={[styles.statIconBox, { backgroundColor: t('#3d637e10', '#3d637e20') }]}>
                        <MaterialCommunityIcons name="office-building" size={20} color={t('#3d637e', '#b8dffe')} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.profileStatLabel, { color: t('#5b5f68', '#aeafb4') }]}>DEPARTMENT</Text>
                        <Text style={[styles.profileStatValue, { color: t('#2f333a', '#ffffff') }]} numberOfLines={1}>
                            {profile?.branch || profile?.department || 'Information Technology'}
                        </Text>
                    </View>
                </Surface>
            </View>

            {/* Account Settings */}
            <Text style={[styles.profileSectionHeader, { color: t('#91939c', '#aeafb4') }]}>ACCOUNT SETTINGS</Text>

            <Surface style={[styles.profileSettingsCard, { backgroundColor: t('#ffffff', '#121212'), borderColor: t('rgba(174, 178, 187, 0.1)', 'rgba(255, 255, 255, 0.05)') }]} elevation={0}>
                <View style={styles.profileSettingItem}>
                    <View style={[styles.profileSettingIconContainer, { backgroundColor: t('#f2f3fa', '#1e1e1e') }]}>
                        <MaterialCommunityIcons name="email-outline" size={20} color={t('#3d637e', '#b8dffe')} />
                    </View>
                    <View style={styles.profileSettingTextContainer}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={[styles.profileSettingLabel, { color: t('#5b5f68', '#aeafb4') }]}>Email Address</Text>
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
                            <Text style={[styles.profileSettingValue, { color: t('#2f333a', '#ffffff') }]}>{profile?.email || 'N/A'}</Text>
                        )}
                    </View>
                </View>

                <View style={[styles.profileDivider, { backgroundColor: t('rgba(174, 178, 187, 0.1)', 'rgba(255, 255, 255, 0.05)') }]} />

                <View style={styles.profileSettingItem}>
                    <View style={[styles.profileSettingIconContainer, { backgroundColor: t('#f2f3fa', '#1e1e1e') }]}>
                        <MaterialCommunityIcons name="shield-check-outline" size={20} color={t('#3d637e', '#b8dffe')} />
                    </View>
                    <View style={styles.profileSettingTextContainer}>
                        <Text style={[styles.profileSettingLabel, { color: t('#5b5f68', '#aeafb4') }]}>
                            {profile?.roll_no ? 'Roll Number' : 'Role'}
                        </Text>
                        <Text style={[styles.profileSettingValue, { color: t('#2f333a', '#ffffff') }]}>
                            {profile?.roll_no || profile?.role || 'N/A'}
                        </Text>
                    </View>
                </View>
            </Surface>

            {/* Logout Button */}
            <TouchableOpacity
                style={[styles.profileLogoutBtn, { backgroundColor: t('#ffffff', '#121212'), borderColor: t('#fa746f30', '#fa746f50') }]}
                onPress={onLogout}
            >
                <View style={styles.logoutIconCircle}>
                    <MaterialCommunityIcons name="logout-variant" size={18} color="#fa746f" />
                </View>
                <Text style={styles.profileLogoutText}>Logout from Session</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#fa746f50" />
            </TouchableOpacity>

            <View style={styles.profileFooter}>
                <Text style={styles.profileFooterText}>Academic Portal v2.4.0</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
    profileName: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 4,
    },
    profileRole: {
        textAlign: 'center',
        fontWeight: '600',
        letterSpacing: 0.5,
        opacity: 0.8,
    },
    profileStatsRow: {
        marginBottom: 24,
    },
    profileStatCard: {
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
    profileStatLabel: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    profileStatValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    profileSectionHeader: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 2,
        marginTop: 24,
        marginBottom: 16,
        opacity: 0.6,
    },
    profileSettingsCard: {
        borderRadius: 28,
        paddingVertical: 10,
        borderWidth: 1.5,
        marginBottom: 32,
    },
    profileSettingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    profileSettingIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    profileSettingTextContainer: {
        flex: 1,
    },
    profileSettingLabel: {
        fontSize: 12,
        fontWeight: '700',
    },
    profileSettingValue: {
        fontSize: 15,
        fontWeight: '800',
        marginTop: 4,
    },
    profileDivider: {
        height: 1,
        marginHorizontal: 20,
    },
    profileLogoutBtn: {
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
    profileLogoutText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '900',
        color: '#fa746f',
    },
    profileFooter: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    profileFooterText: {
        fontSize: 10,
        color: '#aeafb4',
        fontWeight: '800',
        letterSpacing: 1,
        opacity: 0.5,
    },
});
