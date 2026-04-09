import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';

export default function AnimatedButton({ 
    onPress, 
    title, 
    style, 
    textStyle, 
    icon,
    disabled = false,
    color,
    textColor = '#fff'
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
        >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Surface 
                    elevation={2} 
                    style={[
                        styles.button, 
                        { backgroundColor: color || '#3d637e' },
                        disabled && { opacity: 0.6 },
                        style
                    ]}
                >
                    {icon && <View style={styles.iconContainer}>{icon}</View>}
                    <Text variant="labelLarge" style={[styles.text, { color: textColor }, textStyle]}>
                        {title}
                    </Text>
                </Surface>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    iconContainer: {
        marginRight: 8,
    }
});
