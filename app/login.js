import React, { useState, useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Text, Surface, TextInput, Button, IconButton, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { ThemeContext } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loginRole, setLoginRole] = useState('student');
    const [otpMode, setOtpMode] = useState(false);
    const [otp, setOtp] = useState('');
    const { isDark } = useContext(ThemeContext);
    const t = (light, dark) => isDark ? dark : light;

    const getGreeting = () => {
        const hrs = new Date().getHours();
        if (hrs < 12) return 'Good Morning';
        if (hrs < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const handleLogin = async () => {
        if (!email) return;
        setLoading(true);

        if (loginRole === 'teacher') {
            if (!password) {
                setLoading(false);
                return;
            }
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                alert(error.message);
            } else {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();
                
                if (profile?.role === 'student') {
                    router.replace('/student-dashboard');
                } else if (profile?.role === 'admin') {
                    router.replace('/admin-dashboard');
                } else {
                    router.replace('/');
                }
            }
        } else {
            // Student OTP Flow
            if (!otpMode) {
                const { error } = await supabase.auth.signInWithOtp({
                    email,
                });
                
                if (error) {
                    alert(error.message);
                } else {
                    setOtpMode(true);
                    alert('OTP has been sent to your email.');
                }
            } else {
                if (!otp) {
                    setLoading(false);
                    return;
                }
                const { data, error } = await supabase.auth.verifyOtp({
                    email,
                    token: otp,
                    type: 'email'
                });

                if (error) {
                    alert(error.message);
                } else {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', data.user.id)
                        .single();
                    
                    if (!profile || profile?.role === 'student') {
                        router.replace('/student-dashboard');
                    } else if (profile?.role === 'admin') {
                        router.replace('/admin-dashboard');
                    } else {
                        router.replace('/');
                    }
                }
            }
        }
        setLoading(false);
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.container, { backgroundColor: t('#f9f9fe', '#000000') }]}
        >
            <ScrollView 
                style={{ backgroundColor: t('#f9f9fe', '#000000') }}
                contentContainerStyle={[styles.scrollContent, { backgroundColor: t('#f9f9fe', '#000000') }]} 
                showsVerticalScrollIndicator={false}
            >
                <Surface style={[styles.card, { backgroundColor: t('#ffffff', '#121212') }]} elevation={0}>
                    <View style={styles.titleArea}>
                        <Text variant="headlineSmall" style={[styles.greeting, { color: t('#1e293b', '#ffffff') }]}>
                            {getGreeting()}
                        </Text>
                        <Text variant="titleMedium" style={[styles.portalName, { color: t('#64748b', '#aeb2bb') }]}>
                            MLCOE Attendance Portal
                        </Text>
                        <Text variant="bodySmall" style={[styles.subtitle, { color: t('#94a3b8', '#64748b') }]}>
                            Sign in to your academic account
                        </Text>
                    </View>
                    
                    <SegmentedButtons
                        value={loginRole}
                        onValueChange={(val) => {
                            setLoginRole(val);
                            setOtpMode(false);
                            setOtp('');
                        }}
                        buttons={[
                            { value: 'student', label: 'Student' },
                            { value: 'teacher', label: 'Teacher' }
                        ]}
                        style={styles.segmentedButtons}
                        theme={{ colors: { secondaryContainer: '#3d637e', onSecondaryContainer: '#ffffff' } }}
                    />

                    <TextInput
                        placeholder="Email Address"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={styles.input}
                        mode="outlined"
                        outlineColor="transparent"
                        activeOutlineColor="transparent"
                        textColor={t('#1e293b', '#ffffff')}
                        placeholderTextColor={t('#94a3b8', '#64748b')}
                        outlineStyle={{ borderRadius: 12 }}
                        theme={{ colors: { background: t('#f1f5f9', '#1a1a1a') }}}
                    />
                    
                    {loginRole === 'teacher' ? (
                        <TextInput
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            style={styles.input}
                            mode="outlined"
                            outlineColor="transparent"
                            activeOutlineColor="transparent"
                            textColor={t('#1e293b', '#ffffff')}
                            placeholderTextColor={t('#94a3b8', '#64748b')}
                            outlineStyle={{ borderRadius: 12 }}
                            theme={{ colors: { background: t('#f1f5f9', '#1a1a1a') }}}
                            right={<TextInput.Icon 
                                icon={showPassword ? "eye-off" : "eye"} 
                                color={t('#94a3b8', '#64748b')} 
                                onPress={() => setShowPassword(!showPassword)}
                            />}
                        />
                    ) : otpMode ? (
                        <TextInput
                            placeholder="6-Digit OTP"
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="number-pad"
                            style={styles.input}
                            mode="outlined"
                            outlineColor="transparent"
                            activeOutlineColor="transparent"
                            textColor={t('#1e293b', '#ffffff')}
                            placeholderTextColor={t('#94a3b8', '#64748b')}
                            outlineStyle={{ borderRadius: 12 }}
                            theme={{ colors: { background: t('#f1f5f9', '#1a1a1a') }}}
                        />
                    ) : null}

                    <Button 
                        mode="contained" 
                        onPress={handleLogin} 
                        loading={loading}
                        disabled={loading}
                        style={styles.button}
                        contentStyle={styles.buttonContent}
                        labelStyle={styles.buttonLabel}
                        buttonColor="#3d637e"
                    >
                        {loginRole === 'teacher' ? 'Sign In' : (otpMode ? 'Verify OTP' : 'Send OTP')}
                    </Button>

                    {loginRole === 'student' && otpMode && (
                        <TouchableOpacity style={{ marginTop: 16 }} onPress={() => setOtpMode(false)}>
                            <Text variant="labelLarge" style={{ color: '#3d637e', fontWeight: 'bold' }}>
                                Change Email / Resend OTP
                            </Text>
                        </TouchableOpacity>
                    )}
                </Surface>

                <View style={styles.footer}>
                    <Text variant="labelSmall" style={[styles.footerText, { color: t('#94a3b8', '#64748b') }]}>
                        © 2026 MES MUKUNDDAS LOHIA COLLEGE OF ENGINEERING
                    </Text>
                    <View style={[styles.footerDivider, { backgroundColor: t('#e2e8f0', '#334155') }]} />
                    <Text variant="labelSmall" style={[styles.footerText, { color: t('#94a3b8', '#64748b') }]}>
                        SECURE STUDENT ENVIRONMENT
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
        padding: 32,
        borderRadius: 40,
        alignItems: 'center',
    },
    titleArea: {
        alignItems: 'center',
        marginBottom: 32,
    },
    greeting: {
        fontWeight: '800',
        fontSize: 28,
        letterSpacing: -0.5,
    },
    portalName: {
        fontWeight: '600',
        marginTop: 4,
    },
    subtitle: {
        marginTop: 4,
        fontWeight: '600',
    },
    segmentedButtons: {
        marginBottom: 24,
        width: '100%',
    },
    input: {
        width: '100%',
        height: 60,
        marginBottom: 16,
    },
    button: {
        width: '100%',
        marginTop: 16,
        borderRadius: 16,
    },
    buttonContent: {
        height: 56,
    },
    buttonLabel: {
        fontSize: 18,
        fontWeight: '800',
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    footerText: {
        fontWeight: '800',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    footerDivider: {
        height: 1,
        width: 40,
        marginVertical: 12,
    }
});
