import React, { useEffect, useState, useMemo, useRef, useContext } from 'react';
import { View, StyleSheet, ScrollView, Image, ActivityIndicator, FlatList, TouchableOpacity, Platform } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { Text, Surface, IconButton, FAB, Portal, Modal, TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SubjectCard from '../components/SubjectCard';
import AppSidebar from '../components/AppSidebar';
import InfoSections from '../components/InfoSections';
import ProfileTab from '../components/ProfileTab';
import CalendarStrip from '../components/CalendarStrip';
import TeacherReportsTab from '../components/TeacherReportsTab';
import TeacherSubjectsTab from '../components/TeacherSubjectsTab';
import { generateMonthDays, getInitials } from '../utils/dashboardHelpers';
import AppHeader from '../components/AppHeader';

export default function HomeScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [activeTab, setActiveTab] = useState('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date().getDate().toString());
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isFabModalVisible, setIsFabModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');


    const { isDark, toggleTheme } = useContext(ThemeContext);
    const monthDays = useMemo(() => generateMonthDays(calendarDate), [calendarDate.getMonth(), calendarDate.getFullYear()]);
    const flatListRef = useRef(null);

    useEffect(() => {
        loadProfile();
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hrs = currentTime.getHours();
        if (hrs < 12) return 'Good Morning';
        if (hrs < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const formattedDate = currentTime.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });

    const loadProfile = async () => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session) {
                console.log("Teacher session invalid, redirecting to login:", sessionError?.message);
                await supabase.auth.signOut();
                router.replace('/login');
                return;
            }

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            if (profileError) {
                console.error("Error fetching teacher profile:", profileError.message);
            }

            const profile = profileData ? {
                ...profileData,
                email: profileData.email || session.user.email,
                full_name: profileData.full_name || profileData.name
            } : {
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || 'Faculty Member',
                role: 'teacher' // fallback
            };

            // Safety check: If a student lands here, send them to their dashboard
            if (profile.role === 'student') {
                console.log("Teacher Dashboard: User is a student, redirecting...");
                router.replace('/student-dashboard');
                return;
            }

            setProfile(profile);

            // Define the 11 "Actual" base subjects
            const baseSubjects = [
                { name: 'Engineering mechanics', type: 'THEORY' },
                { name: 'Communication skills', type: 'THEORY' },
                { name: 'Chemistry', type: 'THEORY' },
                { name: 'Mathematical 2', type: 'THEORY' },
                { name: 'PPS', type: 'THEORY' },
                { name: 'Engineering mechanics lab', type: 'PRACTICAL' },
                { name: 'Communication skills lab', type: 'PRACTICAL' },
                { name: 'Chemistry lab', type: 'PRACTICAL' },
                { name: 'Mathematical 2 lab', type: 'PRACTICAL' },
                { name: 'PPS lab', type: 'PRACTICAL' },
                { name: 'workshop lab', type: 'PRACTICAL' }
            ];

            // Fetch all subjects from the global subjects table
            const { data: dbSubjects, error: dbSubjectsError } = await supabase
                .from('subjects')
                .select('*')
                .order('name');
            
            if (dbSubjectsError) {
                console.warn("Supabase fetch failed, using internal fallback:", dbSubjectsError.message);
            }

            const safeDbSubjects = dbSubjects || [];
            
            // Merge base subjects with DB subjects to get IDs if they exist
            let finalSubjects = baseSubjects.map(base => {
                const dbMatch = safeDbSubjects.find(s => s.name === base.name);
                return dbMatch ? { ...base, ...dbMatch } : base;
            });

            // If teacher has specific subjects assigned, filter the list
            const assignedSubjects = profileData?.subjects || [];
            if (assignedSubjects.length > 0) {
                // Map old/short codes to the new full names for filtering
                const nameNormalization = (n) => {
                    if (!n) return '';
                    const low = n.toLowerCase();
                    if (low === 'm2') return 'Mathematical 2';
                    if (low === 'em') return 'Engineering mechanics';
                    if (low === 'cs') return 'Communication skills';
                    if (low === 'workshop') return 'workshop lab';
                    return n;
                };

                const normalizedAssignments = assignedSubjects.map(nameNormalization);
                finalSubjects = finalSubjects.filter(s => normalizedAssignments.includes(s.name));
            }

            // Safety: if filtering leaves nothing, show all 11
            if (finalSubjects.length === 0) finalSubjects = baseSubjects;
            
            setSubjects(finalSubjects);
            
            setSubjects(finalSubjects);
        } catch (err) {
            console.error("Teacher auth check failed:", err);
            await supabase.auth.signOut();
            router.replace('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleAttendance = (subject) => {
        // Build correctly formatted YYYY-MM-DD string without timezone shifts
        const year = calendarDate.getFullYear();
        const month = String(calendarDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        router.push({
            pathname: '/branch',
            params: { subject, date: dateStr }
        });
    };

    // getInitials imported from utils/dashboardHelpers

    const t = (light, dark) => isDark ? dark : light;

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: t('#f9f9fe', '#121212') }]}>
                <ActivityIndicator size="large" color="#3d637e" />
            </View>
        );
    }

    const handlePrevMonth = () => {
        const newDate = new Date(calendarDate);
        newDate.setMonth(newDate.getMonth() - 1);
        newDate.setDate(1);
        setCalendarDate(newDate);
        setSelectedDate('1');
    };

    const handleNextMonth = () => {
        const newDate = new Date(calendarDate);
        newDate.setMonth(newDate.getMonth() + 1);
        newDate.setDate(1);
        setCalendarDate(newDate);
        setSelectedDate('1');
    };

    return (
        <View style={[styles.root, { backgroundColor: t('#f9f9fe', '#000000') }]}>
            <AppHeader 
                activeTab={activeTab}
                profile={profile}
                onOpenMenu={() => setIsSidebarOpen(true)}
                onAvatarPress={() => setActiveTab('profile')}
                roleTitle="TEACHER DASHBOARD"
            />
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {activeTab === 'home' && (
                    <>
                        <View style={styles.greetingSection}>
                    <Text variant="displaySmall" style={[styles.greetingText, { color: t('#2f333a', '#ffffff') }]}>
                        {getGreeting()}, {profile?.full_name || 'Faculty Member'}
                    </Text>
                    <Text variant="bodyMedium" style={[styles.subGreeting, { color: t('#5b5f68', '#aeafb4') }]}>
                        {formattedDate}
                    </Text>
                </View>

                <CalendarStrip
                    monthDays={monthDays}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    calendarDate={calendarDate}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    showDatePicker={showDatePicker}
                    onOpenDatePicker={() => setShowDatePicker(true)}
                    onDatePickerChange={(event, date) => {
                        setShowDatePicker(false);
                        if (date) {
                            setCalendarDate(date);
                            setSelectedDate(date.getDate().toString());
                        }
                    }}
                />

                <Text variant="titleLarge" style={[styles.sectionTitle, { color: t('#2f333a', '#ffffff') }]}>Today's Schedule</Text>
                
                <View style={styles.scheduleList}>
                    {subjects.length > 0 ? subjects.map((sub, index) => (
                        <SubjectCard 
                            key={index}
                            subject={sub.name}
                            isDark={isDark}
                            onAttendance={handleAttendance}
                        />
                    )) : (
                        <EmptyState 
                            icon="calendar-remove" 
                            message="No Subjects Scheduled" 
                            subMessage="Enjoy your free time!" 
                            style={{ marginVertical: 20 }}
                        />
                    )}
                </View>

                    </>
                )}

                {activeTab === 'subjects' && (
                    <TeacherSubjectsTab profile={profile} />
                )}

                {activeTab === 'reports' && (
                    <TeacherReportsTab profile={profile} />
                )}

                <InfoSections activeTab={activeTab} />

                {activeTab === 'profile' && (
                    <ProfileTab
                        profile={profile}
                        onLogout={() => { supabase.auth.signOut(); router.replace('/login'); }}
                        roleLabel={profile?.role || "Faculty Member"}
                    />
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            <AppSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                profile={profile}
                activeTab={activeTab}
                onNavigate={setActiveTab}
                onLogout={() => { supabase.auth.signOut(); router.replace('/login'); }}
                fallbackName="Faculty Member"
            />

            <Portal>
                <Modal visible={isFabModalVisible} onDismiss={() => setIsFabModalVisible(false)} contentContainerStyle={{ padding: 24, margin: 24, backgroundColor: t('white', '#1e1e1e'), borderRadius: 16 }}>
                    <Text variant="titleLarge" style={{ marginBottom: 8, color: t('black', 'white'), fontWeight: 'bold' }}>Start Custom Class</Text>
                    <Text style={{ marginBottom: 20, color: t('#666', '#aaa') }}>Enter a new subject name to take attendance for a non-scheduled or ad-hoc class.</Text>
                    
                    <TextInput
                        mode="outlined"
                        label="Subject Name"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={{ marginBottom: 24, backgroundColor: t('#ffffff', '#1e1e1e') }}
                        outlineColor={t('#e2e8f0', '#333')}
                        activeOutlineColor="#3d637e"
                        textColor={t('black', 'white')}
                        autoFocus
                    />
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                        <Button mode="text" onPress={() => setIsFabModalVisible(false)} textColor={t('#64748b', '#94a3b8')}>
                            Cancel
                        </Button>
                        <Button 
                            mode="contained" 
                            disabled={searchQuery.trim().length === 0}
                            onPress={() => { setIsFabModalVisible(false); handleAttendance(searchQuery.trim()); setSearchQuery(''); }} 
                            buttonColor="#3d637e"
                            style={{ borderRadius: 8 }}
                        >
                            Start Class
                        </Button>
                    </View>
                </Modal>
            </Portal>

            {activeTab === 'home' && (
                <FAB
                    icon="plus"
                    label="New Class"
                    style={styles.fab}
                    onPress={() => setIsFabModalVisible(true)}
                    color="white"
                    customSize={56}
                />
            )}

            <Surface style={[styles.bottomNav, { backgroundColor: t('#ffffff', '#1e1e1e') }]} elevation={4}>
                <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
                    <MaterialCommunityIcons name="view-grid" size={28} color={activeTab === 'home' ? "#3d637e" : t('#9c9da1', '#aeafb4')} />
                    <Text style={activeTab === 'home' ? styles.navLabelActive : [styles.navLabel, { color: t('#9c9da1', '#aeafb4') }]}>DASHBOARD</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('subjects')}>
                    <MaterialCommunityIcons name="book-outline" size={28} color={activeTab === 'subjects' ? "#3d637e" : t('#9c9da1', '#aeafb4')} />
                    <Text style={activeTab === 'subjects' ? styles.navLabelActive : [styles.navLabel, { color: t('#9c9da1', '#aeafb4') }]}>SUBJECTS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('reports')}>
                    <MaterialCommunityIcons name="chart-bar" size={28} color={activeTab === 'reports' ? "#3d637e" : t('#9c9da1', '#aeafb4')} />
                    <Text style={activeTab === 'reports' ? styles.navLabelActive : [styles.navLabel, { color: t('#9c9da1', '#aeafb4') }]}>REPORTS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('profile')}>
                    <MaterialCommunityIcons name="account-outline" size={28} color={activeTab === 'profile' ? "#3d637e" : t('#9c9da1', '#aeafb4')} />
                    <Text style={activeTab === 'profile' ? styles.navLabelActive : [styles.navLabel, { color: t('#9c9da1', '#aeafb4') }]}>PROFILE</Text>
                </TouchableOpacity>
            </Surface>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Header styles moved to AppHeader
    container: {
        paddingHorizontal: 24,
    },
    greetingSection: {
        marginTop: 20,
        marginBottom: 32,
    },
    greetingText: {
        fontWeight: '900',
        letterSpacing: -1,
    },
    subGreeting: {
        marginTop: 4,
        fontWeight: '600',
    },
    calendarContainer: {
        marginBottom: 40,
        shadowColor: '#3d637e',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 8,
    },
    // Calendar styles moved to CalendarStrip component

    sectionTitle: {
        fontWeight: '900',
        marginBottom: 20,
    },
    scheduleList: {
        gap: 12,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 16,
        bottom: 100,
        backgroundColor: '#3d637e',
        borderRadius: 20,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 20,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    navLabel: {
        fontSize: 8,
        fontWeight: '900',
        marginTop: 4,
        letterSpacing: 0.5,
    },
    navLabelActive: {
        fontSize: 8,
        fontWeight: '900',
        color: '#3d637e',
        marginTop: 4,
        letterSpacing: 0.5,
    },
    // Sidebar & Info styles now in shared components (AppSidebar.js, InfoSections.js)
});
