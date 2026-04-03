import React, { useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { ThemeContext } from '../context/ThemeContext';
import { getInitials } from '../utils/dashboardHelpers';

/**
 * Shared Header used by both Student and Teacher dashboards.
 * Props:
 *   - activeTab: string (determines the title)
 *   - profile: object
 *   - onOpenMenu: () => void
 *   - onAvatarPress: () => void
 *   - roleTitle: string (e.g. 'STUDENT DASHBOARD' or 'TEACHER DASHBOARD')
 */
export default function AppHeader({
    activeTab,
    profile,
    onOpenMenu,
    onAvatarPress,
    roleTitle = 'DASHBOARD'
}) {
    const { isDark, toggleTheme } = useContext(ThemeContext);
    const t = (light, dark) => isDark ? dark : light;

    const getTitle = () => {
        if (activeTab === 'about') return 'About Us';
        if (activeTab === 'privacy') return 'Privacy Policy';
        if (activeTab === 'profile') return 'Profile';
        return roleTitle;
    };

    return (
        <View style={styles.header}>
            <IconButton 
                icon="menu" 
                size={24} 
                onPress={onOpenMenu} 
                iconColor={t('#2f333a', '#ffffff')}
                style={{ margin: 0 }}
            />
            
            <Text variant="titleMedium" style={[
                styles.headerTitle, 
                { color: roleTitle === 'ADMIN DASHBOARD' ? t('#E17055', '#FF7F50') : t('#3d637e', '#ffffff') }
            ]}>
                {getTitle()}
            </Text>
            
            <View style={styles.headerRight}>
                <IconButton 
                    icon={isDark ? 'weather-sunny' : 'weather-night'} 
                    size={24} 
                    onPress={toggleTheme} 
                    iconColor={t('#454950', '#ffffff')}
                    style={{ margin: 0 }}
                />
                <TouchableOpacity onPress={onAvatarPress} style={styles.avatarTouch}>
                    <Surface style={[styles.headerAvatar, { backgroundColor: t('#f2f3fa', '#1e1e1e'), borderColor: t('rgba(174, 178, 187, 0.2)', 'rgba(255, 255, 255, 0.1)') }]} elevation={0}>
                        {profile?.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.headerAvatarImage} />
                        ) : (
                            <Text style={[styles.headerAvatarText, { color: t('#3d637e', '#ffffff') }]}>
                                {getInitials(profile?.full_name || profile?.name)}
                            </Text>
                        )}
                    </Surface>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerTitle: {
        fontWeight: '900',
        letterSpacing: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarTouch: {
        marginLeft: 8,
    },
    headerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        overflow: 'hidden',
    },
    headerAvatarImage: {
        width: '100%',
        height: '100%',
    },
    headerAvatarText: {
        fontSize: 14,
        fontWeight: '900',
    },
});
