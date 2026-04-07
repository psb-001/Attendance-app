import React, { useState, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, ScrollView } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpMode, setOtpMode] = useState(false);
    const { isDark } = useContext(ThemeContext);

    const t = (light, dark) => isDark ? dark : light;

    const handleLogin = async () => {
        if (!email) {
            alert('Please enter your email address.');
            return;
        }

        setLoading(true);

        if (!otpMode) {
            // Step 1: Send OTP
            const targetEmail = email.trim().toLowerCase();
            const { error } = await supabase.auth.signInWithOtp({
                email: targetEmail,
            });

            if (error) {
                alert(error.message);
            } else {
                setOtpMode(true);
                alert('Verification code sent to ' + targetEmail);
            }
        } else {
            // Step 2: Verify OTP
            if (!otp) {
                alert('Please enter the verification code.');
                setLoading(false);
                return;
            }

            const targetEmail = email.trim().toLowerCase();
            const { data, error } = await supabase.auth.verifyOtp({
                email: targetEmail,
                token: otp,
                type: 'email'
            });

            if (error) {
                alert(error.message);
            } else if (data.user) {
                if (__DEV__) console.log("Login Success: Redirecting to Home...");
                router.replace('/');
            }
        }
        setLoading(false);
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#000000' }}>
            <StatusBar style="light" />
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView 
                    contentContainerStyle={[styles.scrollContent, { backgroundColor: '#000000' }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                >
                    <View style={styles.topShapeWrap}>
                        <LinearGradient colors={['#3d637e', '#1a2a35']} style={styles.topShape} />
                    </View>

                    <View style={styles.content}>
                        <View style={styles.headerArea}>
                            <Surface style={[styles.logoSurface, { backgroundColor: '#1e1e1e' }]} elevation={4}>
                                <MaterialCommunityIcons name="book-open-variant" size={42} color="#3d637e" />
                            </Surface>
                            <Text variant="displaySmall" style={[styles.title, { color: '#ffffff' }]}>
                                PRESENLY
                            </Text>
                            <Text variant="bodyLarge" style={[styles.subtitle, { color: '#aeafb4' }]}>
                                Universal Staff & Student Portal
                            </Text>
                        </View>

                        <Surface style={[styles.card, { backgroundColor: '#121212', borderColor: 'rgba(255,255,255,0.06)' }]} elevation={1}>
                            {!otpMode ? (
                                <>
                                    <Text style={[styles.cardLabel, { color: '#ffffff' }]}>ACADEMIC EMAIL</Text>
                                    <TextInput
                                        mode="outlined"
                                        placeholder="your-email@university.com"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        style={styles.input}
                                        outlineStyle={{ borderRadius: 16, borderWidth: 1.5 }}
                                        outlineColor={'rgba(255,255,255,0.1)'}
                                        activeOutlineColor="#3d637e"
                                        textColor={'#ffffff'}
                                        placeholderTextColor={'#aeafb4'}
                                        left={<TextInput.Icon icon="email-outline" color="#3d637e" />}
                                    />
                                </>
                            ) : (
                                <>
                                    <TouchableOpacity onPress={() => setOtpMode(false)} style={styles.backButton}>
                                        <MaterialCommunityIcons name="arrow-left" size={20} color="#3d637e" />
                                        <Text style={styles.backText}>CHANGE EMAIL</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.cardLabel, { color: '#ffffff' }]}>VERIFICATION CODE</Text>
                                    <TextInput
                                        mode="outlined"
                                        placeholder="Enter 6-digit OTP"
                                        value={otp}
                                        onChangeText={setOtp}
                                        keyboardType="number-pad"
                                        style={styles.input}
                                        outlineStyle={{ borderRadius: 16, borderWidth: 1.5 }}
                                        outlineColor={'rgba(255,255,255,0.1)'}
                                        activeOutlineColor="#3d637e"
                                        textColor={'#ffffff'}
                                        placeholderTextColor={'#aeafb4'}
                                        left={<TextInput.Icon icon="key-outline" color="#3d637e" />}
                                    />
                                </>
                            )}

                            <Button
                                mode="contained"
                                onPress={handleLogin}
                                loading={loading}
                                disabled={loading}
                                style={styles.loginButton}
                                contentStyle={styles.loginButtonContent}
                                labelStyle={styles.loginButtonLabel}
                            >
                                {loading ? 'PROCESSING...' : (otpMode ? 'VERIFY & ENTER' : 'SEND ACCESS CODE')}
                            </Button>
                        </Surface>

                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: '#aeafb4' }]}>
                                MES MUKUNDDAS LOHIA COLLEGE OF ENGINEERING
                            </Text>
                            <Text style={[styles.footerText, { color: '#aeafb4', marginTop: 4, fontStyle: 'italic' }]}>
                                SECURE ACADEMIC ENVIRONMENT
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    topShapeWrap: {
        position: 'absolute',
        top: -100,
        left: -50,
        right: -50,
        height: 400,
        overflow: 'hidden',
    },
    topShape: {
        flex: 1,
        borderRadius: 200,
        transform: [{ scaleX: 1.5 }],
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 60,
        justifyContent: 'center',
    },
    headerArea: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoSurface: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#3d637e',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
    },
    title: {
        fontWeight: '900',
        letterSpacing: -1,
    },
    subtitle: {
        marginTop: 8,
        fontWeight: '600',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    card: {
        padding: 24,
        borderRadius: 32,
        borderWidth: 1,
    },
    cardLabel: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 12,
        opacity: 0.6,
    },
    input: {
        marginBottom: 24,
        backgroundColor: 'transparent',
    },
    loginButton: {
        borderRadius: 16,
        backgroundColor: '#3d637e',
        marginTop: 8,
    },
    loginButtonContent: {
        height: 56,
    },
    loginButtonLabel: {
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#3d637e',
        marginLeft: 8,
        letterSpacing: 0.5,
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 11,
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: 0.5,
    }
});
