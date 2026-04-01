import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { ThemeContext } from '../context/ThemeContext';
import EmptyState from './EmptyState';

export default function TeacherSubjectsTab({ profile }) {
    const { isDark } = useContext(ThemeContext);
    const [loading, setLoading] = useState(true);
    const [subjectStats, setSubjectStats] = useState({});
    const [lowAttendanceStudents, setLowAttendanceStudents] = useState([]);
    
    const t = (light, dark) => isDark ? dark : light;

    const fetchSubjectStats = async () => {
        setLoading(true);
        try {
            // Fetch all logs for this teacher's branch
            let query = supabase
                .from('attendance_logs')
                .select('subject, roll_no, status, date');
            
            if (profile?.branch) {
                query = query.eq('branch', profile.branch);
            }

            const { data, error } = await query;
            if (error) throw error;
            
            if (!data || data.length === 0) {
                setLoading(false);
                return;
            }

            // Aggregate by subject
            const stats = {};
            // Track total classes and attendance per student
            const studentStats = {};

            data.forEach(log => {
                // Subject metrics
                if (!stats[log.subject]) {
                    stats[log.subject] = { present: 0, total: 0, classesHeld: new Set() };
                }
                stats[log.subject].total += 1;
                stats[log.subject].classesHeld.add(log.date);
                if (log.status === 1) stats[log.subject].present += 1;

                // Student metrics
                if (!studentStats[log.roll_no]) {
                    studentStats[log.roll_no] = { present: 0, total: 0 };
                }
                studentStats[log.roll_no].total += 1;
                if (log.status === 1) studentStats[log.roll_no].present += 1;
            });

            // Convert Subject Set to number length
            Object.keys(stats).forEach(key => {
                stats[key].totalClassesHeld = stats[key].classesHeld.size;
            });

            setSubjectStats(stats);

            // Find low attendance students (< 75%)
            const lowAttendees = [];
            Object.keys(studentStats).forEach(roll => {
                const s = studentStats[roll];
                // Only consider students who have had at least 5 total classes recorded to avoid early-semester noise
                if (s.total >= 5) {
                    const pct = Math.round((s.present / s.total) * 100);
                    if (pct < 75) {
                        lowAttendees.push({ roll_no: roll, pct, present: s.present, total: s.total });
                    }
                }
            });
            lowAttendees.sort((a, b) => a.pct - b.pct);
            setLowAttendanceStudents(lowAttendees);

        } catch (err) {
            console.error("Fetch subject stats error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjectStats();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3d637e" />
            </View>
        );
    }

    if (Object.keys(subjectStats).length === 0) {
        return (
            <View style={{ marginTop: 60, paddingHorizontal: 24 }}>
                <EmptyState 
                    icon="book-open-page-variant" 
                    message="No Subject Data Yet" 
                    subMessage="Take attendance to see global subject metrics."
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text variant="headlineSmall" style={[styles.sectionTitle, { color: t('#2f333a', '#ffffff') }]}>Subject Overview</Text>
            <Text style={[styles.sectionSub, { color: t('#91939c', '#aeafb4'), marginBottom: 20 }]}>Global attendance metrics across your classes</Text>

            <View style={styles.statsGrid}>
                {Object.keys(subjectStats).map((subject, idx) => {
                    const stat = subjectStats[subject];
                    const pct = Math.round((stat.present / stat.total) * 100);
                    return (
                        <View key={idx} style={[styles.statCard, { backgroundColor: t('#ffffff', '#1e1e1e'), borderColor: t('#e2e8f0', '#333') }]}>
                            <Text style={[styles.subjectName, { color: t('#1a1a2e', '#ffffff') }]}>{subject}</Text>
                            <Text style={{ fontSize: 12, color: t('#64748b', '#94a3b8'), marginTop: 4 }}>
                                {stat.totalClassesHeld} Classes Held
                            </Text>
                            <View style={{ alignItems: 'flex-start', marginTop: 12 }}>
                                <Text style={{ fontSize: 24, fontWeight: '900', color: pct >= 75 ? '#4caf50' : pct >= 50 ? '#f57c00' : '#f44336' }}>
                                    {pct}%
                                </Text>
                                <Text style={{ fontSize: 10, color: t('#94a3b8', '#64748b'), marginTop: 2 }}>AVERAGE ATTENDANCE</Text>
                            </View>
                        </View>
                    );
                })}
            </View>

            <View style={{ marginTop: 40 }}>
                <Text variant="titleLarge" style={[styles.sectionTitle, { color: t('#2f333a', '#ffffff') }]}>Attention Required</Text>
                <Text style={[styles.sectionSub, { color: t('#91939c', '#aeafb4'), marginBottom: 16 }]}>Students with &lt; 75% overall attendance</Text>
                
                {lowAttendanceStudents.length > 0 ? (
                    <View style={[styles.lowAttendeesContainer, { backgroundColor: t('#ffffff', '#1e1e1e'), borderColor: t('#ffebee', '#3d1c1c') }]}>
                        {lowAttendanceStudents.map((s, idx) => (
                            <View key={idx} style={[styles.lowAttendeeRow, { borderBottomColor: t('#f1f5f9', '#333'), borderBottomWidth: idx < lowAttendanceStudents.length - 1 ? 1 : 0 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={[styles.alertDot, { backgroundColor: s.pct < 50 ? '#d32f2f' : '#f57c00' }]} />
                                    <Text style={{ fontWeight: '600', color: t('#1a1a2e', '#ffffff'), marginLeft: 12 }}>Roll No {s.roll_no}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontWeight: '900', color: s.pct < 50 ? '#d32f2f' : '#f57c00' }}>{s.pct}%</Text>
                                    <Text style={{ fontSize: 10, color: t('#64748b', '#94a3b8') }}>{s.present}/{s.total} attended</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Surface style={[styles.goodNewsCard, { backgroundColor: t('#e8f5e9', '#1b2d20') }]} elevation={0}>
                        <MaterialCommunityIcons name="check-decagram" size={28} color="#4caf50" />
                        <View style={{ marginLeft: 12 }}>
                            <Text style={{ fontWeight: 'bold', color: '#2e7d32' }}>Looking Good!</Text>
                            <Text style={{ fontSize: 12, color: '#4caf50' }}>No students have severely low attendance yet.</Text>
                        </View>
                    </Surface>
                )}
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 12,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    sectionSub: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 16,
    },
    statCard: {
        width: '48%',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    subjectName: {
        fontSize: 14,
        fontWeight: 'bold',
        minHeight: 40, // Keeps cards same height if names are long
    },
    lowAttendeesContainer: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    lowAttendeeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    alertDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    goodNewsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
    }
});
