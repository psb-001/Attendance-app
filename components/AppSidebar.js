import React, { useContext, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { getInitials } from '../utils/dashboardHelpers';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

/**
 * Shared Sidebar Drawer with smooth slide-in animation.
 * Props:
 *   - isOpen: boolean
 *   - onClose: () => void
 *   - profile: object
 *   - activeTab: string
 *   - onNavigate: (tab) => void
 *   - onLogout: () => void
 *   - fallbackName: string
 */
export default function AppSidebar({ isOpen, onClose, profile, activeTab, onNavigate, onLogout, fallbackName = 'User' }) {
    const { isDark } = useContext(ThemeContext);
    const t = (light, dark) => isDark ? dark : light;
    const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isOpen) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 65,
                    friction: 11,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -SIDEBAR_WIDTH,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const menuItems = [
        { key: 'home', icon: 'view-dashboard-outline', label: 'Dashboard' },
        { key: 'about', icon: 'information-outline', label: 'About Us' },
        { key: 'privacy', icon: 'shield-account-outline', label: 'Privacy Policy' },
    ];

    return (
        <View style={styles.sidebarOverlay}>
            <Animated.View style={[styles.sidebarBackdrop, { opacity: fadeAnim }]}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onClose}
                />
            </Animated.View>
            <Animated.View style={[styles.sidebarSlider, { transform: [{ translateX: slideAnim }] }]}>
                <Surface style={[styles.sidebarContent, { backgroundColor: t('#ffffff', '#000000') }]} elevation={5}>
                    <View style={styles.sidebarHeader}>
                        <Surface style={[styles.sidebarAvatar, { backgroundColor: t('#f2f3fa', '#1e1e1e') }]} elevation={0}>
                            <Text style={[styles.sidebarAvatarText, { color: t('#3d637e', '#ffffff') }]}>
                                {getInitials(profile?.full_name || profile?.name)}
                            </Text>
                        </Surface>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.sidebarName, { color: t('#2f333a', '#ffffff') }]}>
                                {profile?.full_name || fallbackName}
                            </Text>
                            <Text style={[styles.sidebarRole, { color: t('#91939c', '#aeafb4') }]}>
                                {profile?.role === 'teacher' ? 'Faculty' : 'Student'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.sidebarMenu}>
                        {menuItems.map((item) => (
                            <TouchableOpacity
                                key={item.key}
                                style={[
                                    styles.sidebarItem,
                                    activeTab === item.key && { backgroundColor: t('rgba(61, 99, 126, 0.08)', 'rgba(61, 99, 126, 0.15)'), borderRadius: 12 }
                                ]}
                                onPress={() => { onNavigate(item.key); onClose(); }}
                            >
                                <MaterialCommunityIcons
                                    name={item.icon}
                                    size={24}
                                    color={activeTab === item.key ? '#3d637e' : t('#5b5f68', '#aeafb4')}
                                />
                                <Text style={[styles.sidebarLabel, { color: activeTab === item.key ? '#3d637e' : t('#2f333a', '#ffffff') }]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.sidebarLogout} onPress={onLogout}>
                        <MaterialCommunityIcons name="logout" size={24} color="#fa746f" />
                        <Text style={styles.sidebarLogoutLabel}>Logout</Text>
                    </TouchableOpacity>
                </Surface>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    sidebarOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        flexDirection: 'row',
    },
    sidebarBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sidebarSlider: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        zIndex: 1001,
    },
    sidebarContent: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    sidebarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
    },
    sidebarAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    sidebarAvatarText: {
        fontSize: 18,
        fontWeight: '900',
    },
    sidebarName: {
        fontSize: 18,
        fontWeight: '800',
    },
    sidebarRole: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 2,
    },
    sidebarMenu: {
        flex: 1,
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 12,
        marginBottom: 4,
    },
    sidebarLabel: {
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 15,
    },
    sidebarLogout: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(250, 116, 111, 0.1)',
        marginBottom: 20,
    },
    sidebarLogoutLabel: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fa746f',
        marginLeft: 15,
    },
});
