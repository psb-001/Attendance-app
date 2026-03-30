import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';

/**
 * Shared Info Sections (About Us & Privacy Policy) used by both dashboards.
 * Props:
 *   - activeTab: string ('about' | 'privacy')
 */
export default function InfoSections({ activeTab }) {
    const { isDark } = useContext(ThemeContext);
    const t = (light, dark) => isDark ? dark : light;

    if (activeTab === 'about') {
        return (
            <View style={{ marginTop: 24 }}>
                <Surface style={[styles.infoCard, { backgroundColor: t('#ffffff', '#1e1e1e') }]} elevation={2}>
                    <Text variant="headlineSmall" style={[styles.infoTitle, { color: t('#2f333a', '#ffffff') }]}>
                        About Academic Portal
                    </Text>
                    <Text style={[styles.infoText, { color: t('#5b5f68', '#aeafb4') }]}>
                        This Academic Portal is an advanced system designed for high-performance attendance tracking and resource sharing.
                        {"\n\n"}
                        Built with a mission to simplify the academic experience, we provide teachers and students with real-time analytics and seamless access to study materials.
                    </Text>
                    <View style={styles.infoFooter}>
                        <Text style={styles.footerBrand}>Powered by Academic Services</Text>
                        <Text style={styles.footerVersion}>v2.4.0 (Stable)</Text>
                    </View>
                </Surface>
            </View>
        );
    }

    if (activeTab === 'privacy') {
        return (
            <View style={{ marginTop: 24 }}>
                <Surface style={[styles.infoCard, { backgroundColor: t('#ffffff', '#1e1e1e') }]} elevation={2}>
                    <Text variant="headlineSmall" style={[styles.infoTitle, { color: t('#2f333a', '#ffffff') }]}>
                        Privacy Policy
                    </Text>
                    <Text style={[styles.infoText, { color: t('#5b5f68', '#aeafb4') }]}>
                        Your privacy is extremely important to us. This application does not share your personal attendance data or identity with third-party tracking services.
                        {"\n\n"}
                        All academic data is securely stored and encrypted via Supabase and used strictly for institutional reporting and performance monitoring.
                    </Text>
                    <View style={styles.infoFooter}>
                        <MaterialCommunityIcons name="shield-check" size={24} color="#426658" />
                        <Text style={[styles.footerText, { color: '#426658' }]}>Your data is safe and encrypted.</Text>
                    </View>
                </Surface>
            </View>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    infoCard: {
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(174, 178, 187, 0.1)',
    },
    infoTitle: {
        fontWeight: '900',
        marginBottom: 16,
    },
    infoText: {
        fontSize: 15,
        lineHeight: 24,
        fontWeight: '500',
    },
    infoFooter: {
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(174, 178, 187, 0.05)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    footerBrand: {
        fontSize: 12,
        fontWeight: '700',
        color: '#3d637e',
    },
    footerVersion: {
        fontSize: 10,
        fontWeight: '600',
        color: '#aeafb4',
    },
    footerText: {
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 10,
    },
});
