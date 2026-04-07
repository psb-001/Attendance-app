import { Stack, useRouter, useSegments } from 'expo-router';
import { PaperProvider, MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useContext, Component } from 'react';
import { View, ActivityIndicator, useColorScheme, Platform, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';

// Lock the splash screen until all fonts and auth states are perfectly resolved
SplashScreen.preventAutoHideAsync().catch(() => {
    // It's okay if this throws (e.g. on web)
});

import { supabase } from '../lib/supabase';
import { ThemeProvider, ThemeContext } from '../context/ThemeContext';

class ErrorBoundary extends Component {
    state = { hasError: false, error: null };
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        if (__DEV__) console.error("FATAL UI ERROR:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <View style={errorStyles.container}>
                    <Text variant="headlineMedium" style={errorStyles.title}>Presenly Encountered an Error</Text>
                    <Text style={errorStyles.errorText}>{this.state.error?.toString()}</Text>
                    <Button mode="contained" onPress={() => { /* Reload logic if possible */ }} style={errorStyles.button}>
                        Try Again
                    </Button>
                </View>
            );
        }
        return this.props.children;
    }
}

const errorStyles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 20 },
    title: { color: '#fff', fontWeight: 'bold', marginBottom: 12 },
    errorText: { color: '#aaa', textAlign: 'center', marginBottom: 24 },
    button: { backgroundColor: '#3d637e' }
});

const fontConfig = {
    fontFamily: 'PlusJakartaSans_400Regular',
};
const customFonts = configureFonts({config: fontConfig});

const lightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: '#3d637e',
        primaryContainer: '#b8dffe',
        secondary: '#426658',
        secondaryContainer: '#c4ebd9', 
        background: '#f9f9fe',
        surface: '#ffffff',
        surfaceVariant: '#f2f3fa',
        onSurface: '#2f333a',
        onSurfaceVariant: '#5b5f68',
        outline: '#aeb2bb',
    },
    fonts: customFonts,
    roundness: 12,
};

const amoledDarkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: '#3d637e',
        primaryContainer: '#1a2a36',
        secondary: '#426658',
        secondaryContainer: '#1c2d26',
        background: '#000000',
        surface: '#121212',
        surfaceVariant: '#1e1e1e',
        onSurface: '#ffffff',
        onSurfaceVariant: '#aeafb4',
        outline: '#383b42',
    },
    fonts: customFonts,
    roundness: 12,
};

export default function Layout() {
    const [fontsLoaded] = useFonts({
        PlusJakartaSans_400Regular,
        PlusJakartaSans_600SemiBold,
        PlusJakartaSans_700Bold,
        PlusJakartaSans_800ExtraBold,
    });

    if (!fontsLoaded) return null;

    return (
        <ErrorBoundary>
            <ThemeProvider>
                <RootLayoutNav />
            </ThemeProvider>
        </ErrorBoundary>
    );
}

function RootLayoutNav() {
    const { isDark } = useContext(ThemeContext);
    const activeTheme = isDark ? amoledDarkTheme : lightTheme;
    const router = useRouter();
    const segments = useSegments();
    const isLogin = segments[0] === 'login';
    const isAdminDashboard = segments[0] === 'admin-dashboard';
    const [session, setSession] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [initError, setInitError] = useState(null);

    useEffect(() => {
        const init = async () => {
            try {
                // 1. Initial sense of session
                const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError) throw sessionError;
                
                if (__DEV__) console.log("Layout: Initial session fetch:", initialSession?.user?.id || "Null");
                setSession(initialSession);
            } catch (err) {
                if (__DEV__) console.error("Initialization Error:", err);
                setInitError(err.message);
            } finally {
                setAuthReady(true);
                // Hide the splash screen only when everything is perfectly ready
                await SplashScreen.hideAsync();
            }
        };

        init();

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (__DEV__) console.log("Layout: Auth state change event:", _event, session?.user?.id || "Null");
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Keep the app blank behind the locked splash screen
    if (!authReady) {
        return null;
    }

    return (
        <SafeAreaProvider>
            <View style={{ flex: 1, backgroundColor: isLogin ? '#000000' : activeTheme.colors.background }}>
                <View style={{ flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? (isAdminDashboard ? 1200 : 500) : '100%', alignSelf: 'center', overflow: 'hidden', backgroundColor: isLogin ? '#000000' : 'transparent' }}>
                    <PaperProvider theme={activeTheme}>
                        <Stack
                            screenOptions={{
                                headerStyle: {
                                    backgroundColor: activeTheme.colors.primary,
                                },
                                headerTintColor: '#fff',
                                headerTitleStyle: {
                                    fontWeight: 'bold',
                                },
                                headerTitleAlign: 'center',
                            }}
                        >
                            <Stack.Screen name="index" options={{ headerShown: false }} />
                            <Stack.Screen name="login" options={{ headerShown: false }} />
                            <Stack.Screen name="admin-dashboard" options={{ headerShown: false }} />
                            <Stack.Screen name="student-dashboard" options={{ headerShown: false }} />
                            <Stack.Screen name="branch" options={{ headerShown: false }} />
                            <Stack.Screen name="batch" options={{ headerShown: false }} />
                            <Stack.Screen name="attendance" options={{ headerShown: false }} />
                            <Stack.Screen name="summary" options={{ title: 'Summary' }} />
                        </Stack>
                        <StatusBar style={isDark ? "light" : "dark"} />
                    </PaperProvider>
                </View>
            </View>
        </SafeAreaProvider>
    );
}
