import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SUBJECT_META = {
    'Mathematical 2': { icon: 'calculator-variant', category: 'THEORY', accent: '#6C5CE7' },
    'Chemistry': { icon: 'flask-outline', category: 'THEORY', accent: '#00B894' },
    'Engineering mechanics': { icon: 'cog-outline', category: 'THEORY', accent: '#E17055' },
    'PPS': { icon: 'code-tags', category: 'THEORY', accent: '#0984E3' },
    'Communication skills': { icon: 'microphone-outline', category: 'THEORY', accent: '#FDCB6E' },
    'Engineering mechanics lab': { icon: 'cog-outline', category: 'PRACTICAL', accent: '#E17055' },
    'Communication skills lab': { icon: 'microphone-variant', category: 'PRACTICAL', accent: '#FDCB6E' },
    'Chemistry lab': { icon: 'flask', category: 'PRACTICAL', accent: '#00B894' },
    'Mathematical 2 lab': { icon: 'calculator-variant', category: 'PRACTICAL', accent: '#6C5CE7' },
    'PPS lab': { icon: 'code-tags-check', category: 'PRACTICAL', accent: '#0984E3' },
    'workshop lab': { icon: 'hammer-wrench', category: 'PRACTICAL', accent: '#E84393' },
};

const SubjectCard = ({ subject, onAttendance, isDark = false, dbIcon = null, dbAccent = null }) => {
    const staticMeta = SUBJECT_META[subject] || {};
    const meta = useMemo(() => ({
        icon: dbIcon || staticMeta.icon || 'book-open-variant',
        category: staticMeta.category || 'COURSE',
        accent: dbAccent || staticMeta.accent || '#3d637e'
    }), [subject, dbIcon, dbAccent]);

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
