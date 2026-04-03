import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, FlatList, ActivityIndicator, TouchableOpacity, Image, Platform, RefreshControl } from 'react-native';
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
import { generateMonthDays, getInitials } from '../utils/dashboardHelpers';
import AppHeader from '../components/AppHeader';

export default function StudentDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [profile, setProfile] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().getDate().toString());
    const [attendancePct, setAttendancePct] = useState(0);
    const [attendanceStats, setAttendanceStats] = useState({ present: 0, total: 0 });
    const [subjectAttendance, setSubjectAttendance] = useState({});
    const [allLogs, setAllLogs] = useState([]);
    const [dbSubjects, setDbSubjects] = useState([]);
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

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            if (profileError) {
                console.error("Error fetching student profile:", profileError.message);
            }

            const currentProfile = profileData ? {
                ...profileData,
                email: profileData.email || session.user.email,
                full_name: profileData.full_name || profileData.name
            } : {
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || 'Academic Student',
                role: 'student' // fallback
            };

            // Safety check: Route out non-students
            if (currentProfile.role === 'teacher') {
                console.log("Student Dashboard: User is a teacher, redirecting...");
                router.replace('/');
                return;
            } else if (currentProfile.role === 'admin') {
                console.log("Student Dashboard: User is an admin, redirecting...");
                router.replace('/admin-dashboard');
                return;
            }

            setProfile(currentProfile);

            // Fetch global subjects for resource URLs, icons, and colors
            const { data: subData } = await supabase.from('subjects').select('name, resource_url, icon, accent_color, type');
            if (subData) {
                setDbSubjects(subData);
            }

            // 2. If student has roll_no and branch, fetch real attendance
            if (profileData?.roll_no && profileData?.branch) {
                const { data: logs } = await supabase
                    .from('attendance_logs')
                    .select('status, subject, date')
                    .eq('roll_no', profileData.roll_no)
                    .eq('branch', profileData.branch);

                if (logs && logs.length > 0) {
                    setAllLogs(logs);
                    const safeLogs = logs || [];
                    const total = safeLogs.length;
                    const present = safeLogs.filter(l => l.status === 1).length;
                    const pct = Math.round((present / total) * 100);
                    setAttendancePct(pct);
                    setAttendanceStats({ present, total });
                } else {
                    setAttendancePct(0);
                    setAttendanceStats({ present: 0, total: 0 });
                    setAllLogs([]);
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

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await init();
        setRefreshing(false);
    }, []);

    // getInitials imported from utils/dashboardHelpers

    useEffect(() => {
        if (!allLogs || allLogs.length === 0) {
            setSubjectAttendance({});
            return;
        }
        
        const year = calendarDate.getFullYear();
        const month = String(calendarDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate).padStart(2, '0');
        const targetDate = `${year}-${month}-${day}`;
        
        const dayMap = {};
        allLogs.filter(l => l.date === targetDate).forEach(l => {
            dayMap[l.subject] = l.status === 1;
        });
        setSubjectAttendance(dayMap);
    }, [allLogs, calendarDate, selectedDate]);

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

    // Build subject list from student's assigned subjects (set by admin)
    const studentSubjects = (profile?.subjects && profile.subjects.length > 0)
        ? profile.subjects
        : [];

    const renderSubjectItem = (subject, idx) => {
        const dbMeta = dbSubjects.find(d => d.name === subject) || {};
        const accent = dbMeta.accent_color || '#3d637e';
        const icon = dbMeta.icon || 'book-open-variant';
        const category = dbMeta.type || 'COURSE';
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
                <View style={[styles.scheduleIconWrap, { backgroundColor: `${accent}18` }]}>
                    <MaterialCommunityIcons name={icon} size={26} color={accent} />
                </View>
                <View style={styles.scheduleContent}>
                    <Text style={[styles.subjectName, { color: t('#1a1a2e', '#ffffff') }]}>{subject}</Text>
                    {category ? (
                        <View style={[styles.schedulePill, { backgroundColor: `${accent}15`, marginTop: 4 }]}>
                            <Text style={[styles.schedulePillText, { color: accent }]}>{category}</Text>
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
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        tintColor={isDark ? '#3d637e' : '#3d637e'} 
                        colors={['#3d637e']} 
                    />
                }
            >
                {activeTab === 'home' && (
                    <>
                        <View style={styles.greetingSection}>
                            <Text variant="displaySmall" style={[styles.greetingTitle, { color: t('#2f333a', '#ffffff') }]}>
                                {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Student'}!
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
                                <View style={[styles.meterCircle, { 
                                    borderColor: attendancePct >= 75 ? '#4caf50' : attendancePct > 0 ? '#fa746f' : t('#f2f3fa', '#2a2d35') 
                                }]}>
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
                        </View>

                        <View style={styles.scheduleHeader}>
                            <Text variant="titleLarge" style={[styles.scheduleTitle, { color: t('#2f333a', '#ffffff') }]}>Daily Lectures</Text>
                        </View>

                        <View style={styles.scheduleList}>
                            {Object.keys(subjectAttendance).length > 0 ? (
                                <View style={[styles.scheduleListContainer, { backgroundColor: t('#ffffff', '#1e1e1e') }]}>
                                    {Object.keys(subjectAttendance).map((sub, idx) => renderSubjectItem(sub, idx))}
                                </View>
                            ) : (
                                <EmptyState 
                                    icon="bed" 
                                    message="No Lectures Recorded" 
                                    subMessage="No attendance was marked for this date." 
                                    style={{ marginVertical: 20 }}
                                />
                            )}
                        </View>
                    </>
                )}

                {activeTab === 'attendance' && (
                    <View style={{ marginTop: 24 }}>
                        <Text variant="headlineSmall" style={[styles.sectionTitle, { color: t('#2f333a', '#ffffff') }]}>Attendance Breakdown</Text>
                        <Text style={[styles.sectionSub, { color: t('#91939c', '#aeafb4') }]}>Overall progress by subject</Text>
                        
                        <View style={{ marginTop: 24, paddingBottom: 100 }}>
                            {[...new Set(allLogs.map(l => l.subject))].map((sub, idx) => {
                                const subLogs = allLogs.filter(l => l.subject === sub);
                                if (subLogs.length === 0) return null;
                                const total = subLogs.length;
                                const present = subLogs.filter(l => l.status === 1).length;
                                const pct = Math.round((present / total) * 100);
                                return (
                                    <View key={idx} style={[styles.scheduleCard, { marginBottom: 12, backgroundColor: t('#ffffff', '#1e1e1e'), borderColor: t('rgba(0,0,0,0.04)', 'rgba(255,255,255,0.06)') }]}>
                                        <View style={[styles.scheduleContent, { paddingHorizontal: 0 }]}>
                                            <Text style={[styles.subjectName, { color: t('#1a1a2e', '#ffffff') }]}>{sub}</Text>
                                            <Text style={{ fontSize: 12, color: t('#91939c', '#aeafb4'), marginTop: 4 }}>{present} of {total} attended</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                                            <Text style={{ fontSize: 20, fontWeight: '900', color: pct >= 75 ? '#4caf50' : '#f44336' }}>{pct}%</Text>
                                        </View>
                                    </View>
                                );
                            })}
                            {allLogs.length === 0 && (
                                <EmptyState 
                                    icon="calendar-blank" 
                                    message="No Data Yet" 
                                    subMessage="Attendance history will appear here."
                                    style={{ marginVertical: 40 }}
                                />
                            )}
                        </View>
                    </View>
                )}

                {activeTab === 'resources' && (
                    <View style={{ marginTop: 24 }}>
                        <Text variant="headlineSmall" style={[styles.sectionTitle, { color: t('#2f333a', '#ffffff') }]}>Study Resources</Text>
                        <Text style={[styles.sectionSub, { color: t('#91939c', '#aeafb4') }]}>Access materials from Google Drive</Text>
                        
                        <View style={{ marginTop: 20 }}>
                            {dbSubjects
                                .filter(dbSub => dbSub.resource_url)
                                .map((dbSub, idx) => (
                                    <ResourceCard 
                                        key={idx} 
                                        subject={dbSub.name} 
                                        url={dbSub.resource_url} 
                                        isDark={isDark} 
                                        dbIcon={dbSub.icon} 
                                        dbAccent={dbSub.accent_color} 
                                    />
                                ))
                            }
                            {dbSubjects.filter(d => d.resource_url).length === 0 && (
                                <Text style={{ color: t('#91939c', '#aeafb4'), textAlign: 'center', marginTop: 20 }}>
                                    No resources available yet. Admin will add links soon!
                                </Text>
                            )}
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
