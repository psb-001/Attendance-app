import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, Alert, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Text, TextInput, Button, Surface, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { ThemeContext } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const router = useRouter();
    const { isDark, toggleTheme } = useContext(ThemeContext);

    const t = (light, dark) => isDark ? dark : light;

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hrs = currentTime.getHours();
        if (hrs < 12) return 'Good Morning';
        if (hrs < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            Alert.alert('Login Failed', error.message);
            setLoading(false);
            return;
        }

        setLoading(false);
    };

    return (
        <View style={[styles.container, { backgroundColor: t('#f9f9fe', '#000000') }]}>
            {/* Dark Mode Toggle */}
            <View style={styles.themeToggleArea}>
                <IconButton 
                    icon={isDark ? 'weather-sunny' : 'weather-night'} 
                    size={24} 
                    onPress={toggleTheme} 
                    iconColor={t('#454950', '#ffffff')}
                />
            </View>

            <View style={styles.headerArea}>
                <Image
                    source={require('../assets/college-header.png')}
                    style={[styles.headerImage, { tintColor: t(undefined, '#ffffff') }]}
                    resizeMode="contain"
                />
            </View>

            <Surface style={[styles.card, { backgroundColor: t('#ffffff', '#121212') }]} elevation={2}>
                <Text variant="headlineSmall" style={[styles.title, { color: t('#2f333a', '#ffffff') }]}>
                    {getGreeting()}
                </Text>
                <Text variant="titleMedium" style={[styles.welcomeTitle, { color: t('#3d637e', '#aeb2bb') }]}>
                    University Portal
                </Text>
                <Text variant="bodySmall" style={[styles.subtitle, { color: t('#9c9da1', '#aeafb4') }]}>
                    Sign in to your academic account
                </Text>
                
                <TextInput
                    label="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.input}
                    mode="flat"
                    underlineColor="transparent"
                    activeUnderlineColor="#3d637e"
                    textColor={t('#2f333a', '#ffffff')}
                    theme={{ 
                        roundness: 16, 
                        colors: { 
                            background: t('#f2f3fa', '#1e1e1e'),
                            onSurfaceVariant: t('#9c9da1', '#aeafb4')
                        } 
                    }}
                />
                
                <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.input}
                    mode="flat"
                    underlineColor="transparent"
                    activeUnderlineColor="#3d637e"
                    textColor={t('#2f333a', '#ffffff')}
                    theme={{ 
                        roundness: 16, 
                        colors: { 
                            background: t('#f2f3fa', '#1e1e1e'),
                            onSurfaceVariant: t('#9c9da1', '#aeafb4')
                        } 
                    }}
                    right={<TextInput.Icon icon="eye" color={t('#9c9da1', '#aeafb4')} />}
                />

                <Button 
                    mode="contained" 
                    onPress={handleLogin} 
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                >
                    Sign In
                </Button>
            </Surface>

            <View style={styles.footer}>
                <Text variant="labelSmall" style={[styles.copyright, { color: t('#9c9da1', '#aeafb4') }]}>
                    © 2024 University Academic Portal
                </Text>
                <View style={styles.footerDivider} />
                <Text variant="labelSmall" style={[styles.copyright, { color: t('#9c9da1', '#aeafb4') }]}>
                    Secure Student Environment
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    themeToggleArea: {
        position: 'absolute',
        top: 60,
        right: 20,
    },
    headerArea: {
        alignItems: 'center',
        marginBottom: 40,
    },
    headerImage: {
        width: width * 0.8,
        height: 80,
    },
    card: {
        padding: 32,
        borderRadius: 32,
        shadowColor: '#3d637e',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.1,
        shadowRadius: 32,
    },
    title: {
        textAlign: 'center',
        fontWeight: '900',
        letterSpacing: -1,
        marginBottom: 4,
    },
    welcomeTitle: {
        textAlign: 'center',
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 32,
        letterSpacing: 0.5,
    },
    input: {
        marginBottom: 16,
        height: 60,
    },
    button: {
        marginTop: 16,
        borderRadius: 16,
        backgroundColor: '#3d637e',
    },
    buttonContent: {
        height: 60,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
        color: '#ffffff',
    },
    footer: {
        marginTop: 48,
        alignItems: 'center',
    },
    footerDivider: {
        width: 40,
        height: 1,
        backgroundColor: 'rgba(174, 182, 191, 0.2)',
        marginVertical: 8,
    },
    copyright: {
        fontSize: 10,
        letterSpacing: 1,
        fontWeight: '700',
        textTransform: 'uppercase',
    }
});
