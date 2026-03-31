import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SUBJECT_META = {
    'Mathematics 2': { icon: 'calculator-variant', category: 'THEORY', accent: '#6C5CE7' },
    'Chemistry': { icon: 'flask-outline', category: 'THEORY', accent: '#00B894' },
    'Engineering Mechanics': { icon: 'cog-outline', category: 'THEORY', accent: '#E17055' },
    'PPS': { icon: 'code-tags', category: 'THEORY', accent: '#0984E3' },
    'Communication Skill': { icon: 'microphone-outline', category: 'THEORY', accent: '#FDCB6E' },
    'Workshop': { icon: 'hammer-wrench', category: 'PRACTICAL', accent: '#E84393' },
    'Practical': { icon: 'test-tube', category: 'PRACTICAL', accent: '#00CEC9' },
    'NSS': { icon: 'account-group-outline', category: '', accent: '#A29BFE' },
    'Skill Development': { icon: 'lightbulb-on-outline', category: '', accent: '#FD79A8' },
    'Institutional Innovation Council': { icon: 'rocket-launch-outline', category: '', accent: '#55EFC4' },
    'Sport Activity': { icon: 'basketball', category: '', accent: '#FF7675' },
    'Cultural Activity': { icon: 'music-note', category: '', accent: '#DFE6E9' },
    'Mentor Meeting': { icon: 'account-tie', category: '', accent: '#74B9FF' },
    'Industrial Connect': { icon: 'factory', category: '', accent: '#B2BEC3' },
    'Tutorial': { icon: 'school-outline', category: 'THEORY', accent: '#636E72' },
    'Remedial Lecture': { icon: 'book-education-outline', category: 'THEORY', accent: '#FFEAA7' },
    'PPS Lab': { icon: 'code-tags-check', category: 'PRACTICAL', accent: '#0984E3' },
    'Communication Skill Lab': { icon: 'microphone-variant', category: 'PRACTICAL', accent: '#FDCB6E' },
    'Workshop Lab': { icon: 'hammer-wrench', category: 'PRACTICAL', accent: '#E84393' },
    'Engineering Mechanics Lab': { icon: 'cog-outline', category: 'PRACTICAL', accent: '#E17055' },
    'Chemistry Lab': { icon: 'flask', category: 'PRACTICAL', accent: '#00B894' },
};

const SubjectCard = ({ subject, onAttendance, isDark = false }) => {
    const meta = useMemo(() => SUBJECT_META[subject] || {
        icon: 'book-open-variant',
        category: 'COURSE',
        accent: '#3d637e'
    }, [subject]);

    const t = (light, dark) => isDark ? dark : light;

    return (
        <TouchableOpacity
            style={[styles.card, {
                backgroundColor: t('#ffffff', '#181818'),
                borderColor: t('rgba(0,0,0,0.04)', 'rgba(255,255,255,0.06)'),
            }]}
            onPress={() => onAttendance(subject)}
            activeOpacity={0.7}
        >
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: `${meta.accent}18` }]}>
                <MaterialCommunityIcons
                    name={meta.icon}
                    size={26}
                    color={meta.accent}
                />
            </View>

            {/* Title + Subtitle */}
            <View style={styles.titleBlock}>
                <Text style={[styles.subjectTitle, { color: t('#1a1a2e', '#ffffff') }]}>
                    {subject}
                </Text>
                <View style={styles.tagsRow}>
                    {meta.category ? (
                        <View style={[styles.categoryTag, { backgroundColor: `${meta.accent}20` }]}>
                            <Text style={[styles.categoryText, { color: meta.accent }]}>
                                {meta.category}
                            </Text>
                        </View>
                    ) : null}
                    <Text style={[styles.subjectSub, { color: '#3d637e' }]}>
                        {meta.category ? '• ' : ''}Take Attendance
                    </Text>
                </View>
            </View>

            {/* Chevron Circle */}
            <View style={[styles.chevronCircle, { backgroundColor: t('#f2f3fa', '#2a2d35') }]}>
                <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={t('#91939c', '#aeafb4')}
                />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    titleBlock: {
        flex: 1,
        gap: 2,
    },
    subjectTitle: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    tagsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        gap: 6,
    },
    categoryTag: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    categoryText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    subjectSub: {
        fontSize: 12,
        fontWeight: '700',
    },
    chevronCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});

export default SubjectCard;
