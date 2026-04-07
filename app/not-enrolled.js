import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function NotEnrolled() {
    const router = useRouter();
    const [userEmail, setUserEmail] = React.useState('Loading your email...');

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.replace('/login');
    };

    React.useEffect(() => {
        // 🕒 ENROLLMENT HEARTBEAT: Automatically detect when Admin fixes the registry
        const checkEnrollment = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session || !session.user || !session.user.email) return;

                const currentEmail = session.user.email.toLowerCase().trim();
                setUserEmail(currentEmail); // 🟢 Store email to show on screen

                const { data: profile, error: profileErr } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (profileErr) throw new Error("Profile error: " + profileErr.message);

                if (profile && profile.role && profile.role !== 'not_enrolled') {
                    router.replace('/');
                    return;
                }

                // 🛠️ SELF-HEALING: If stuck as 'not_enrolled', let's check the registry ourselves
                const { data: studentMatch, error: strErr } = await supabase.from('students_registry').select('*').ilike('email', currentEmail).maybeSingle();
                if (strErr) throw new Error("Registry error: " + strErr.message);
                
                if (studentMatch) {
                    const { error: updErr } = await supabase.from('profiles').update({
                        role: 'student', full_name: studentMatch.full_name, branch: studentMatch.branch, roll_no: studentMatch.roll_no
                    }).eq('id', session.user.id);
                    if (updErr) throw new Error("Update error: " + updErr.message);
                    router.replace('/');
                    return;
                }

                const { data: teacherMatch } = await supabase.from('teachers').select('*').ilike('email', currentEmail).maybeSingle();
                if (teacherMatch) {
                    await supabase.from('profiles').update({
                        role: 'teacher', full_name: teacherMatch.full_name, department: teacherMatch.department, subjects: teacherMatch.subjects
                    }).eq('id', session.user.id);
                    router.replace('/');
                    return;
                }
                
                setUserEmail(currentEmail + '\n(No match found in Registry yet)');

            } catch (err) {
                setUserEmail(prev => prev + '\nError: ' + err.message);
            }
        };

        const interval = setInterval(checkEnrollment, 5000); // Check every 5 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            
            <View style={styles.content}>
                <Surface style={styles.iconCircle} elevation={4}>
                    <MaterialCommunityIcons name="shield-lock-outline" size={80} color="#ff9800" />
                </Surface>

                <Text variant="headlineMedium" style={styles.title}>
                    ACCESS RESTRICTED
                </Text>

                <Surface style={styles.alertCard} elevation={1}>
                    <Text style={[styles.description, { fontWeight: 'bold', color: '#ff9800', marginBottom: 20 }]}>
                        Logged in as: {"\n"}{userEmail}
                    </Text>
                    <Text style={styles.description}>
                        This email is authenticated, but it is not registered in the PRESENLY staff or student registry.
                    </Text>
                    <Text style={styles.instruction}>
                        Please ask the Administrator to add this exact email to the registry.
                    </Text>
                </Surface>

                <Button
                    mode="contained"
                    onPress={handleSignOut}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                >
                    SIGN OUT & TRY AGAIN
                </Button>

                <Text style={styles.footer}>
                    MES MUKUNDDAS LOHIA COLLEGE OF ENGINEERING
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        padding: 24,
    },
    content: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 152, 0, 0.3)',
    },
    title: {
        color: '#ffffff',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
        letterSpacing: 2,
    },
    alertCard: {
        backgroundColor: '#121212',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    description: {
        color: '#ffffff',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 16,
    },
    instruction: {
        color: '#aeafb4',
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    button: {
        width: '100%',
        borderRadius: 16,
        backgroundColor: '#3d637e',
    },
    buttonContent: {
        height: 56,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 60,
        color: '#444',
        fontSize: 10,
        textAlign: 'center',
        letterSpacing: 1,
    }
});
