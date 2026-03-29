import React, { useContext } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';

export default function EmptyState({ icon, message, subMessage, style }) {
    const { isDark } = useContext(ThemeContext);
    const t = (light, dark) => isDark ? dark : light;

    return (
        <View style={[styles.container, style]}>
            <MaterialCommunityIcons 
                name={icon || "sleep"} 
                size={80} 
                color={t('rgba(174, 178, 187, 0.3)', 'rgba(174, 175, 180, 0.15)')} 
            />
            <Text style={[styles.message, { color: t('#91939c', '#aeafb4') }]}>
                {message || "Nothing to see here."}
            </Text>
            {subMessage && (
                <Text style={[styles.subMessage, { color: t('#aeb2bb', '#5b5f68') }]}>
                    {subMessage}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        gap: 16,
    },
    message: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    subMessage: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    }
});
