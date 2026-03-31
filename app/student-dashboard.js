import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, FlatList, ActivityIndicator, TouchableOpacity, Image, Platform } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import EmptyState from '../components/EmptyState';
import ResourceCard from '../components/ResourceCard';
import AppSidebar from '../components/AppSidebar';
import InfoSections from '../components/InfoSections';
import ProfileTab from '../components/ProfileTab';
import CalendarStrip from '../components/CalendarStrip';
import AppHeader from '../components/AppHeader';
import { generateMonthDays, getInitials } from '../utils/dashboardHelpers';

export default function StudentDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().getDate().toString());
    const [attendancePct, setAttendancePct] = useState(0);
    const [attendanceStats, setAttendanceStats] = useState({ present: 0, total: 0 });
    const [subjectAttendance, setSubjectAttendance] = useState({});
    const [currentTime, setCurrentTime] = useState(new Date());
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const { isDark, toggleTheme } = useContext(ThemeContext);
    
    const monthDays = React.useMemo(() => generateMonthDays(calendarDate), [calendarDate.getMonth(), calendarDate.getFullYear()]);

    useEffect(() => {
        init();
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hrs = currentTime.getHours();
        if (hrs < 12) return 'Hello'; // Morning
        if (hrs < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const formattedDate = currentTime.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    const init = async () => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session) {
                console.log("Session invalid, redirecting to login:", sessionError?.message);
                await supabase.auth.signOut();
                router.replace('/login');
                return;
            }

            // 1. Fetch profile using wildcard to avoid "column not found" errors
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (profileError) {
                console.error("Error fetching profile:", profileError.message);
            }

            setProfile(profileData);

            // 2. If student has roll_no and branch, fetch real attendance
            if (profileData?.roll_no && profileData?.branch) {
                const { data: logs } = await supabase
                    .from('attendance_logs')
                    .select('status, subject, date')
                    .eq('roll_no', profileData.roll_no)
                    .eq('branch', profileData.branch);

                if (logs && logs.length > 0) {
                    const total = logs.length;
                    const present = logs.filter(l => l.status === 1).length;
                    const pct = Math.round((present / total) * 100);
                    setAttendancePct(pct);
                    setAttendanceStats({ present, total });

                    // Build per-subject attendance map for today
                    const now = new Date();
                    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                    const todayMap = {};
                    logs.filter(l => l.date === today).forEach(l => {
                        todayMap[l.subject] = l.status === 1;
                    });
                    setSubjectAttendance(todayMap);
                } else {
                    setAttendancePct(0);
                    setAttendanceStats({ present: 0, total: 0 });
                }
            }
        } catch (err) {
            console.error("Auth initialization failed:", err);
            await supabase.auth.signOut();
            router.replace('/login');
        } finally {
            setLoading(false);
        }
    };

    // getInitials imported from utils/dashboardHelpers

    const t = (light, dark) => isDark ? dark : light;

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            router.replace('/login');
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: t('#f9f9fe', '#000000') }]}>
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

    const rawSubjects = profile?.subjects && profile.subjects.length > 0 
        ? profile.subjects 
        : ['Mathematics 2', 'Chemistry', 'Engineering Mechanics', 'PPS', 'Communication Skill', 'Workshop', 'PPS Lab', 'Communication Skill Lab', 'Workshop Lab', 'Engineering Mechanics Lab', 'Chemistry Lab'];

    const normalizeSubject = (s) => {
        if (!s) return s;
        const n = s.trim();
        if (n.toUpperCase() === 'M2' || n === 'Mathematics 2') return 'Mathematics 2';
        if (n.toLowerCase().includes('communication skill lab')) return 'Communication Skill Lab';
        if (n.toLowerCase().includes('engineering mechanics lab') || n.toLowerCase().includes('mechanics lab (em)')) return 'Engineering Mechanics Lab';
        if (n.toLowerCase().includes('pps lab')) return 'PPS Lab';
        if (n.toLowerCase().includes('chemistry lab')) return 'Chemistry Lab';
        if (n.toLowerCase().includes('workshop lab')) return 'Workshop Lab';
        return n;
    };

    let studentSubjects = rawSubjects.map(normalizeSubject);
    
    // Force inject the new practical subjects if they aren't saved in the user's Supabase profile yet
    const requiredLabs = ['PPS Lab', 'Communication Skill Lab', 'Workshop Lab', 'Engineering Mechanics Lab', 'Chemistry Lab'];
    requiredLabs.forEach(lab => {
        if (!studentSubjects.includes(lab)) {
            studentSubjects.push(lab);
        }
    });

    const SUBJECT_META = {
        'Mathematics 2': { icon: 'calculator-variant', category: 'THEORY', accent: '#6C5CE7' },
        'Chemistry': { icon: 'flask-outline', category: 'THEORY', accent: '#00B894' },
        'Engineering Mechanics': { icon: 'cog-outline', category: 'THEORY', accent: '#E17055' },
        'PPS': { icon: 'code-tags', category: 'THEORY', accent: '#0984E3' },
        'Communication Skill': { icon: 'microphone-outline', category: 'THEORY', accent: '#FDCB6E' },
        'Workshop': { icon: 'hammer-wrench', category: 'PRACTICAL', accent: '#E84393' },
        'Practical': { icon: 'test-tube', category: 'PRACTICAL', accent: '#00CEC9' },
        'NSS': { icon: 'account-group-outline', category: '', accent: '#A29BFE' },
        'Skill Development': { icon: 'lightbulb-on-outline', category: '', accent: '#FD79A8' },
        'Sport Activity': { icon: 'basketball', category: '', accent: '#FF7675' },
        'Cultural Activity': { icon: 'music-note', category: '', accent: '#DFE6E9' },
        'Mentor Meeting': { icon: 'account-tie', category: '', accent: '#74B9FF' },
        'Tutorial': { icon: 'school-outline', category: 'THEORY', accent: '#636E72' },
        'Remedial Lecture': { icon: 'book-education-outline', category: 'THEORY', accent: '#FFEAA7' },
        'PPS Lab': { icon: 'code-tags-check', category: 'PRACTICAL', accent: '#0984E3' },
        'Communication Skill Lab': { icon: 'microphone-variant', category: 'PRACTICAL', accent: '#FDCB6E' },
        'Workshop Lab': { icon: 'hammer-wrench', category: 'PRACTICAL', accent: '#E84393' },
        'Engineering Mechanics Lab': { icon: 'cog-outline', category: 'PRACTICAL', accent: '#E17055' },
        'Chemistry Lab': { icon: 'flask', category: 'PRACTICAL', accent: '#00B894' },
    };

    const renderSubjectItem = (subject, idx) => {
        const meta = SUBJECT_META[subject] || { icon: 'book', accent: '#3d637e' };
        const status = subjectAttendance[subject];
        let cardBg, borderCol, statusIcon, statusColor;

        if (status === true) {
            cardBg = t('#f0f4f0', '#1a221b');
            borderCol = '#4caf50';
            statusIcon = 'check-circle';
            statusColor = '#4caf50';
        } else if (status === false) {
            cardBg = t('#fdf2f2', '#2d1a1a');
            borderCol = '#f44336';
            statusIcon = 'close-circle';
            statusColor = '#f44336';
        } else {
            cardBg = t('#ffffff', '#181818');
            borderCol = t('rgba(0,0,0,0.04)', 'rgba(255,255,255,0.06)');
            statusIcon = null;
            statusColor = null;
        }

        return (
            <View key={idx} style={[styles.scheduleCard, {
                backgroundColor: cardBg,
                borderColor: borderCol,
            }]}>
                <View style={[styles.scheduleIconWrap, { backgroundColor: `${meta.accent}18` }]}>
                    <MaterialCommunityIcons name={meta.icon} size={26} color={meta.accent} />
                </View>
                <View style={styles.scheduleContent}>
                    <Text style={[styles.subjectName, { color: t('#1a1a2e', '#ffffff') }]}>{subject}</Text>
                    {meta.category ? (
                        <View style={[styles.schedulePill, { backgroundColor: `${meta.accent}15`, marginTop: 4 }]}>
                            <Text style={[styles.schedulePillText, { color: meta.accent }]}>{meta.category}</Text>
                        </View>
                    ) : null}
                </View>
                {statusIcon ? (
                    <MaterialCommunityIcons name={statusIcon} size={28} color={statusColor} />
                ) : (
                    <View style={[styles.scheduleChevron, { backgroundColor: t('#f2f3fa', '#2a2d35') }]}>
                        <MaterialCommunityIcons name="minus" size={16} color={t('#91939c', '#aeafb4')} />
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.root, { backgroundColor: t('#f9f9fe', '#000000') }]}>
            <AppHeader
                activeTab={activeTab}
                profile={profile}
                onOpenMenu={() => setIsSidebarOpen(true)}
                onAvatarPress={() => setActiveTab('profile')}
                roleTitle="STUDENT DASHBOARD"
            />

            <ScrollView 
                contentContainerStyle={[styles.container, { paddingBottom: 120 }]} 
                showsVerticalScrollIndicator={false}
            >
                {activeTab === 'home' && (
                    <>
                        <View style={styles.greetingSection}>
                            <Text variant="displaySmall" style={[styles.greetingTitle, { color: t('#2f333a', '#ffffff') }]}>
                                {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Alex'}!
                            </Text>
                            <Text variant="bodyLarge" style={[styles.greetingDate, { color: t('#91939c', '#aeafb4') }]}>{formattedDate}</Text>
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

                        <View style={[styles.metricCard, { backgroundColor: t('#ffffff', '#1e1e1e'), borderColor: t('rgba(174, 178, 187, 0.1)', 'rgba(255, 255, 255, 0.05)') }]}>
                            <Text style={styles.metricLabel}>PERFORMANCE METRIC</Text>
                            <Text variant="titleLarge" style={[styles.metricTitle, { color: t('#2f333a', '#ffffff') }]}>Overall Attendance</Text>
                            
                            <View style={styles.meterContainer}>
                                <View style={[styles.meterCircle, { borderColor: t('#f2f3fa', '#2a2d35') }]}>
                                    <View style={[styles.meterProgress, { transform: [{ rotate: '45deg' }] }]} />
                                    <View style={styles.meterInner}>
                                        <Text style={[styles.meterValue, { color: t('#2f333a', '#ffffff') }]}>{attendancePct}%</Text>
                                        <Text style={styles.meterStatus}>
                                            {attendancePct >= 85 ? 'EXCELLENT' : attendancePct >= 75 ? 'GOOD' : attendancePct > 0 ? 'LOW' : 'NO DATA'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.attendanceRow}>
                                <View style={styles.attendanceStat}>
                                    <Text style={[styles.attendanceStatNum, { color: '#426658' }]}>{attendanceStats.present}</Text>
                                    <Text style={styles.attendanceStatLabel}>PRESENT</Text>
                                </View>
                                <View style={styles.attendanceStatDivider} />
                                <View style={styles.attendanceStat}>
                                    <Text style={[styles.attendanceStatNum, { color: t('#2f333a', '#ffffff') }]}>{attendanceStats.total}</Text>
                                    <Text style={styles.attendanceStatLabel}>TOTAL</Text>
                                </View>
                                <View style={styles.attendanceStatDivider} />
                                <View style={styles.attendanceStat}>
                                    <Text style={[styles.attendanceStatNum, { color: '#fa746f' }]}>{attendanceStats.total - attendanceStats.present}</Text>
                                    <Text style={styles.attendanceStatLabel}>ABSENT</Text>
                                </View>
                            </View>

                            <View style={styles.metricFooter}>
                                <MaterialCommunityIcons name="trending-up" size={16} color="#426658" />
                                <Text style={styles.metricFooterText}>3% increase from last semester</Text>
                            </View>
                        </View>

                        <View style={styles.scheduleHeader}>
                            <Text variant="titleLarge" style={[styles.scheduleTitle, { color: t('#2f333a', '#ffffff') }]}>My Subjects</Text>
                        </View>

                        <View style={styles.scheduleList}>
                            {studentSubjects.length > 0 ? (
                                <View style={[styles.scheduleListContainer, { backgroundColor: t('#ffffff', '#1e1e1e') }]}>
                                    {studentSubjects.map((sub, idx) => renderSubjectItem(sub, idx))}
                                </View>
                            ) : (
                                <EmptyState 
                                    icon="book-open-variant" 
                                    message="No Subjects Scheduled" 
                                    subMessage="Enjoy your free time!" 
                                    style={{ marginVertical: 20 }}
                                />
                            )}
                        </View>
                    </>
                )}

                {activeTab === 'attendance' && (
                    <View style={{ marginTop: 24 }}>
                        <Text variant="headlineSmall" style={[styles.sectionTitle, { color: t('#2f333a', '#ffffff') }]}>Attendance History</Text>
                        <Text style={[styles.sectionSub, { color: t('#91939c', '#aeafb4') }]}>Track your progress over time</Text>
                        
                        <View style={[styles.historyPlaceholder, { backgroundColor: t('#ffffff', '#1e1e1e') }]}>
                            <EmptyState 
                                icon="calendar-clock" 
                                message="No Detailed History" 
                                subMessage="Attendance history logging starts soon."
                                style={{ marginVertical: 40 }}
                            />
                        </View>
                    </View>
                )}

                {activeTab === 'resources' && (
                    <View style={{ marginTop: 24 }}>
                        <Text variant="headlineSmall" style={[styles.sectionTitle, { color: t('#2f333a', '#ffffff') }]}>Study Resources</Text>
                        <Text style={[styles.sectionSub, { color: t('#91939c', '#aeafb4') }]}>Access materials from Google Drive</Text>
                        
                        <View style={{ marginTop: 20 }}>
                            {studentSubjects.map((sub, idx) => (
                                <ResourceCard key={idx} subject={sub} isDark={isDark} />
                            ))}
                        </View>
                    </View>
                )}

                {activeTab === 'profile' && (
                    <ProfileTab profile={profile} onLogout={handleLogout} roleLabel="Academic Student" />
                )}

                <InfoSections activeTab={activeTab} />

                <View style={{ height: 100 }} />
            </ScrollView>

            <AppSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                profile={profile}
                activeTab={activeTab}
                onNavigate={setActiveTab}
                onLogout={handleLogout}
                fallbackName="Academic User"
            />

            <Surface style={[styles.bottomNav, { backgroundColor: t('#ffffff', '#1e1e1e') }]} elevation={4}>
                <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
                    <View style={[activeTab === 'home' && styles.navIconActive, { backgroundColor: activeTab === 'home' ? t('#e3f2fd', 'rgba(61, 99, 126, 0.2)') : 'transparent' }]}>
                        <MaterialCommunityIcons name="home" size={24} color={activeTab === 'home' ? "#3d637e" : t('#aeafb4', '#aeafb4')} />
                    </View>
                    <Text style={[activeTab === 'home' ? styles.navLabelActive : styles.navLabel, { color: activeTab === 'home' ? "#3d637e" : t('#aeafb4', '#aeafb4') }]}>HOME</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('attendance')}>
                    <View style={[activeTab === 'attendance' && styles.navIconActive, { backgroundColor: activeTab === 'attendance' ? t('#e3f2fd', 'rgba(61, 99, 126, 0.2)') : 'transparent' }]}>
                        <MaterialCommunityIcons name="calendar-check-outline" size={24} color={activeTab === 'attendance' ? "#3d637e" : t('#aeafb4', '#aeafb4')} />
                    </View>
                    <Text style={[activeTab === 'attendance' ? styles.navLabelActive : styles.navLabel, { color: activeTab === 'attendance' ? "#3d637e" : t('#aeafb4', '#aeafb4') }]}>ATTENDANCE</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('resources')}>
                    <View style={[activeTab === 'resources' && styles.navIconActive, { backgroundColor: activeTab === 'resources' ? t('#e3f2fd', 'rgba(61, 99, 126, 0.2)') : 'transparent' }]}>
                        <MaterialCommunityIcons name="folder-open-outline" size={24} color={activeTab === 'resources' ? "#3d637e" : t('#aeafb4', '#aeafb4')} />
                    </View>
                    <Text style={[activeTab === 'resources' ? styles.navLabelActive : styles.navLabel, { color: activeTab === 'resources' ? "#3d637e" : t('#aeafb4', '#aeafb4') }]}>RESOURCES</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('profile')}>
                    <View style={[activeTab === 'profile' && styles.navIconActive, { backgroundColor: activeTab === 'profile' ? t('#e3f2fd', 'rgba(61, 99, 126, 0.2)') : 'transparent' }]}>
                        <MaterialCommunityIcons name="account-outline" size={24} color={activeTab === 'profile' ? "#3d637e" : t('#aeafb4', '#aeafb4')} />
                    </View>
                    <Text style={[activeTab === 'profile' ? styles.navLabelActive : styles.navLabel, { color: activeTab === 'profile' ? "#3d637e" : t('#aeafb4', '#aeafb4') }]}>PROFILE</Text>
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
        marginTop: 24,
        marginBottom: 32,
    },
    greetingTitle: {
        fontWeight: '900',
        letterSpacing: -1,
    },
    greetingDate: {
        marginTop: 4,
        fontWeight: '600',
    },
    // Calendar styles moved to CalendarStrip component
    metricCard: {
        borderRadius: 32,
        padding: 24,
        marginBottom: 32,
        borderWidth: 1,
        shadowColor: '#3d637e',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 8,
    },
    metricLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#91939c',
        letterSpacing: 1,
        marginBottom: 8,
    },
    metricTitle: {
        fontWeight: '900',
    },
    meterContainer: {
        alignItems: 'center',
        marginVertical: 32,
    },
    meterCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 12,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    meterProgress: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 12,
        borderColor: '#3d637e',
        borderBottomColor: 'transparent',
        borderLeftColor: 'transparent',
    },
    meterInner: {
        alignItems: 'center',
    },
    meterValue: {
        fontSize: 36,
        fontWeight: '900',
    },
    meterStatus: {
        fontSize: 10,
        fontWeight: '900',
        color: '#91939c',
        letterSpacing: 2,
        marginTop: 4,
    },
    attendanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(174, 178, 187, 0.15)',
    },
    attendanceStat: {
        alignItems: 'center',
        flex: 1,
    },
    attendanceStatNum: {
        fontSize: 24,
        fontWeight: '900',
    },
    attendanceStatLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#91939c',
        letterSpacing: 1,
        marginTop: 4,
    },
    attendanceStatDivider: {
        width: 1,
        height: 32,
        backgroundColor: 'rgba(174, 178, 187, 0.2)',
    },
    metricFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    metricFooterText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#426658',
    },
    scheduleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    scheduleTitle: {
        fontWeight: '900',
    },

    scheduleListContainer: {
        borderRadius: 32,
        padding: 16,
        gap: 12,
        // Premium Grouped Shadow
        shadowColor: '#3d637e',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 8,
    },
    scheduleCard: {
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
    },
    scheduleTimeContainer: {
        alignItems: 'center',
        paddingRight: 16,
        borderRightWidth: 1,
        minWidth: 60,
    },
    scheduleTimeText: {
        fontSize: 16,
        fontWeight: '900',
    },
    scheduleTimePeriod: {
        fontSize: 10,
        fontWeight: '900',
        color: '#91939c',
    },
    scheduleContent: {
        flex: 1,
        paddingHorizontal: 16,
    },
    subjectName: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: -0.3,
        marginBottom: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        flex: 1,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarTouch: {
        marginLeft: 4,
    },
    subjectSub: {
        fontSize: 12,
        fontWeight: '600',
    },
    headerAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
    },
    headerAvatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 19,
    },
    headerAvatarText: {
        fontSize: 13,
        fontWeight: '900',
        textAlign: 'center',
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    scheduleIconWrap: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    schedulePill: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
    },
    schedulePillText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    scheduleChevron: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 96,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 24,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    navIconActive: {
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 16,
        marginBottom: 4,
    },
    navLabel: {
        fontSize: 10,
        fontWeight: '900',
    },
    navLabelActive: {
        fontSize: 10,
        fontWeight: '900',
        color: '#3d637e',
    },
    sectionTitle: {
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    sectionSub: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    historyPlaceholder: {
        marginTop: 24,
        borderRadius: 32,
        padding: 24,
    },
    // Internal Profile Tab Styles
    // Profile, Sidebar & Info styles now in shared components
});
