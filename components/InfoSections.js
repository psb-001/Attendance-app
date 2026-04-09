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
                        About PRESENTLY
                    </Text>
                    <Text style={[styles.infoText, { color: t('#5b5f68', '#aeafb4') }]}>
                        PRESENTLY is an advanced academic platform designed to streamline attendance management and resource sharing with precision and efficiency. It empowers institutions with real-time analytics and effortless access to learning materials.
                    </Text>
                    <View style={styles.infoFooter}>
                        <Text style={styles.footerBrand}>Powered by MES MLCOE</Text>
                        <Text style={styles.footerVersion}>v2.4.0 (Stable)</Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: t('#91939c', '#aeafb4'), marginTop: 8 }}>
                        Developed and maintained by Prathamesh Bhujbal
                    </Text>
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
                        Last Updated: April 5, 2026
                        {"\n\n"}
                        PRESENTLY ("the App") is an institutional attendance management system developed for internal academic use. Your privacy is our priority.
                        {"\n\n"}
                        1. DATA WE COLLECT{"\n"}
                        • Account Information: Name, institutional email address, and role (student/teacher/admin) collected during Google Sign-In.{"\n"}
                        • Academic Data: Branch, roll number, subject enrollment, and daily attendance records (present/absent status).{"\n"}
                        • Device Data: Minimal local storage (AsyncStorage) is used to cache attendance status for offline access. No device identifiers are collected.
                        {"\n\n"}
                        2. HOW WE USE YOUR DATA{"\n"}
                        • To record and display attendance for students and teachers.{"\n"}
                        • To generate attendance reports and PDF exports for institutional use.{"\n"}
                        • To sync attendance records with authorized Google Sheets for administrative reporting.{"\n"}
                        • To provide real-time analytics on the Admin Dashboard.
                        {"\n\n"}
                        3. DATA STORAGE & SECURITY{"\n"}
                        • All data is stored securely on Supabase (PostgreSQL) with Row Level Security (RLS) policies enforced.{"\n"}
                        • Authentication is handled via Supabase Auth with Google OAuth 2.0 — we never store your Google password.{"\n"}
                        • Attendance data is additionally synced to a designated Google Sheet via Google Apps Script for backup and reporting.{"\n"}
                        • Local device cache is used only for performance optimization and is cleared on logout.
                        {"\n\n"}
                        4. THIRD-PARTY SERVICES{"\n"}
                        • Google Sign-In (Authentication){"\n"}
                        • Supabase (Database & Auth){"\n"}
                        • Google Sheets API (Attendance Backup){"\n"}
                        We do not use any advertising, analytics, or tracking SDKs.
                        {"\n\n"}
                        5. DATA SHARING{"\n"}
                        • Your data is never sold or shared with third-party marketing services.{"\n"}
                        • Attendance records are accessible only to authorized teachers (their assigned subjects) and administrators.{"\n"}
                        • Students can only view their own attendance data.
                        {"\n\n"}
                        6. DATA RETENTION & DELETION{"\n"}
                        • Attendance records are retained for the academic year.{"\n"}
                        • Administrators can delete attendance records at any time via the Admin Dashboard.{"\n"}
                        • Account deletion requests can be made to your institution's administrator.
                        {"\n\n"}
                        7. CONTACT{"\n"}
                        For any privacy-related questions, please contact your institution's IT administrator.
                    </Text>
                    <View style={styles.infoFooter}>
                        <MaterialCommunityIcons name="shield-check" size={24} color="#426658" />
                        <Text style={[styles.footerText, { color: '#426658' }]}>Your data is protected by RLS & OAuth 2.0</Text>
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
