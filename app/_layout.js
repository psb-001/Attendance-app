import { Stack, useRouter, useSegments } from 'expo-router';
import { PaperProvider, MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useContext } from 'react';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import UpdateChecker from '../components/UpdateChecker';
import { supabase } from '../lib/supabase';
import { ThemeProvider, ThemeContext } from '../context/ThemeContext';

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
        <ThemeProvider>
            <RootLayoutNav />
        </ThemeProvider>
    );
}

function RootLayoutNav() {
    const { isDark } = useContext(ThemeContext);
    const activeTheme = isDark ? amoledDarkTheme : lightTheme;
    const router = useRouter();
    const segments = useSegments();
    const [session, setSession] = useState(null);
    const [role, setRole] = useState(null);
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        // 1. Initial sense of session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log("Layout: Initial session fetch:", session?.user?.id || "Null");
            setSession(session);
            if (!session) setAuthReady(true);
        });

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log("Layout: Auth state change event:", _event, session?.user?.id || "Null");
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Fetch role when session changes
    useEffect(() => {
        if (!session) {
            setRole(null);
            return;
        }

        const fetchRole = async () => {
            console.log("Layout: Fetching role for:", session.user.id);
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();
            
            console.log("Layout: Profile role:", profile?.role || "Null");
            setRole(profile?.role || 'teacher'); // fallback to teacher
            setAuthReady(true);
        };

        fetchRole();
    }, [session]);

    // Role-based routing guard
    useEffect(() => {
        if (!authReady) return;

        const currentRoute = segments[0];
        console.log("Layout: Checking route guard. Current:", currentRoute, "Role:", role, "Session:", session?.user?.id ? "Exists" : "Null");

        if (!session) {
            if (currentRoute !== 'login') {
                console.log("Layout Guard: Not logged in. Redirecting to /login");
                router.replace('/login');
            }
            return;
        }

        if (role === 'student') {
            const allowedStudentRoutes = ['student-dashboard', 'profile'];
            if (!allowedStudentRoutes.includes(currentRoute)) {
                console.log("Layout Guard: Student on unauthorized route. Redirecting to /student-dashboard");
                router.replace('/student-dashboard');
            }
        } else {
            // Teacher / Admin
            const allowedTeacherRoutes = ['index', 'profile', 'branch', 'batch', 'attendance', 'summary', undefined];
            if (!allowedTeacherRoutes.includes(currentRoute)) {
                console.log("Layout Guard: Teacher on unauthorized route. Redirecting to /");
                router.replace('/');
            }
        }
    }, [session, role, authReady, segments]);

    // Show spinner while waiting for AsyncStorage to restore session
    if (!authReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#000000' : '#f9f9fe' }}>
                <ActivityIndicator size="large" color={isDark ? '#ffffff' : '#3d637e'} />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <PaperProvider theme={activeTheme}>
                <UpdateChecker />
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
                    <Stack.Screen name="student-dashboard" options={{ headerShown: false }} />
                    <Stack.Screen name="profile" options={{ headerShown: false }} />
                    <Stack.Screen name="branch" options={{ title: 'Select Details' }} />
                    <Stack.Screen name="batch" options={{ title: 'Select Batch' }} />
                    <Stack.Screen name="attendance" options={{ title: 'Mark Attendance' }} />
                    <Stack.Screen name="summary" options={{ title: 'Summary' }} />
                </Stack>
                <StatusBar style={isDark ? "light" : "dark"} />
            </PaperProvider>
        </SafeAreaProvider>
    );
}
