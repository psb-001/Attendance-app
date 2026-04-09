import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SUBJECT_META } from '../utils/dashboardHelpers';

const ResourceCard = ({ subject, url, isDark = false, dbIcon = null, dbAccent = null }) => {
    const staticMeta = SUBJECT_META[subject] || {};
    const meta = useMemo(() => ({
        icon: dbIcon || staticMeta.icon || 'folder-open-outline',
        category: staticMeta.category || 'RESOURCE',
        accent: dbAccent || staticMeta.accent || '#3d637e'
    }), [subject, dbIcon, dbAccent]);

    const handleOpenResources = async () => {
        const finalUrl = url;
        if (finalUrl) {
            const canOpen = await Linking.canOpenURL(finalUrl);
            if (canOpen) {
                await Linking.openURL(finalUrl);
            }
        }
    };

    const t = (light, dark) => isDark ? dark : light;

    return (
        <TouchableOpacity
            style={[styles.card, {
                backgroundColor: t('#ffffff', '#181818'),
                borderColor: t('rgba(0,0,0,0.04)', 'rgba(255,255,255,0.06)'),
            }]}
            onPress={handleOpenResources}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: `${meta.accent}18` }]}>
                <MaterialCommunityIcons
                    name={meta.icon}
                    size={26}
                    color={meta.accent}
                />
            </View>

            <View style={styles.titleBlock}>
                <Text style={[styles.subjectTitle, { color: t('#1a1a2e', '#ffffff') }]}>
                    {subject}
                </Text>
                <Text style={[styles.subjectSub, { color: meta.accent }]}>
                    View Materials
                </Text>
            </View>

            <View style={[styles.actionCircle, { backgroundColor: t('#f2f3fa', '#2a2d35') }]}>
                <MaterialCommunityIcons
                    name="arrow-top-right"
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
        borderRadius: 24,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    titleBlock: {
        flex: 1,
        gap: 4,
    },
    subjectTitle: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    subjectSub: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    actionCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});

export default ResourceCard;
