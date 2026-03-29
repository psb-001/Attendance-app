import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, FlatList, ActivityIndicator, TouchableOpacity, Image, Platform } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import EmptyState from '../components/EmptyState';
import DateTimePicker from '@react-native-community/datetimepicker';

const generateMonthDays = (currentDate) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    for (let i = 1; i <= daysInMonth; i++) {
        const dateObj = new Date(year, month, i);
        days.push({
            id: i,
            dayName: weekdays[dateObj.getDay()],
            date: i.toString()
        });
    }
    return days;
};

export default function StudentDashboard() {
    const router = useRouter();
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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // 1. Fetch profile (includes roll_no and branch for students)
        const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, branch, avatar_url, roll_no')
            .eq('id', session.user.id)
            .single();

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

        setLoading(false);
    };

    const getInitials = (name) => {
        if (!name) return 'ST';
        const parts = name.split(' ');
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const t = (light, dark) => isDark ? dark : light;

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

    const renderCalendarItem = ({ item }) => (
        <TouchableOpacity
            onPress={() => setSelectedDate(item.date)}
            style={[
                styles.calendarDay,
                { backgroundColor: t('#ffffff', '#121212') },
                item.date === selectedDate && styles.activeDay
            ]}
        >
            <Text style={[styles.dayText, item.date === selectedDate && styles.activeDayText]}>{item.dayName}</Text>
            <Text style={[styles.dateText, { color: t('#2f333a', '#ffffff') }, item.date === selectedDate && styles.activeDayText]}>{item.date}</Text>
            {item.date === selectedDate && <View style={styles.activeDot} />}
        </TouchableOpacity>
    );

    const studentSubjects = profile?.subjects && profile.subjects.length > 0 
        ? profile.subjects 
        : ['M2', 'Chemistry', 'Engineering Mechanics', 'PPS', 'Communication Skill', 'Workshop'];

    const SUBJECT_META = {
        'M2': { icon: 'calculator-variant', category: 'THEORY', accent: '#6C5CE7' },
        'Chemistry': { icon: 'flask-outline', category: 'THEORY', accent: '#00B894' },
        'Engineering Mechanics': { icon: 'cog-outline', category: 'THEORY', accent: '#E17055' },
        'PPS': { icon: 'code-tags', category: 'THEORY', accent: '#0984E3' },
        'Communication Skill': { icon: 'microphone-outline', category: 'THEORY', accent: '#FDCB6E' },
        'Workshop': { icon: 'hammer-wrench', category: 'LAB', accent: '#E84393' },
        'Practical': { icon: 'test-tube', category: 'LAB', accent: '#00CEC9' },
        'NSS': { icon: 'account-group-outline', category: 'ACTIVITY', accent: '#A29BFE' },
        'Skill Development': { icon: 'lightbulb-on-outline', category: 'ELECTIVE', accent: '#FD79A8' },
        'Sport Activity': { icon: 'basketball', category: 'ACTIVITY', accent: '#FF7675' },
        'Cultural Activity': { icon: 'music-note', category: 'ACTIVITY', accent: '#DFE6E9' },
        'Mentor Meeting': { icon: 'account-tie', category: 'MEETING', accent: '#74B9FF' },
        'Tutorial': { icon: 'school-outline', category: 'THEORY', accent: '#636E72' },
        'Remedial Lecture': { icon: 'book-education-outline', category: 'THEORY', accent: '#FFEAA7' },
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/profile')} style={styles.headerUser}>
                    {profile?.avatar_url ? (
                        <Image source={{ uri: profile.avatar_url }} style={styles.headerAvatar} />
                    ) : (
                        <Surface style={[styles.headerAvatar, { backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center' }]} elevation={0}>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: '#3d637e' }}>{getInitials(profile?.full_name)}</Text>
                        </Surface>
                    )}
                    <Text variant="titleMedium" style={[styles.headerTitle, { color: t('#3d637e', '#ffffff') }]}>My Dashboard</Text>
                </TouchableOpacity>
                <IconButton 
                    icon={isDark ? 'weather-sunny' : 'weather-night'} 
                    size={24} 
                    onPress={toggleTheme} 
                    iconColor={t('#454950', '#ffffff')}
                />
            </View>

            <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
                <View style={styles.greetingSection}>
                    <Text variant="displaySmall" style={[styles.greetingTitle, { color: t('#2f333a', '#ffffff') }]}>
                        {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Alex'}!
                    </Text>
                    <Text variant="bodyLarge" style={[styles.greetingDate, { color: t('#91939c', '#aeafb4') }]}>{formattedDate}</Text>
                </View>

                <View style={[styles.calendarContainer, { backgroundColor: t('#ffffff', '#1e1e1e'), padding: 16, borderRadius: 24 }]}>
                    <View style={styles.calendarControls}>
                        <TouchableOpacity style={styles.calendarMonthSelector} onPress={() => setShowDatePicker(true)}>
                            <MaterialCommunityIcons name="calendar-month-outline" size={20} color={t('#2f333a', '#ffffff')} style={{ marginRight: 8 }} />
                            <Text style={[styles.calendarMonthText, { color: t('#2f333a', '#ffffff') }]}>
                                {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={t('#2f333a', '#ffffff')} style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                        
                        <View style={styles.calendarArrows}>
                            <TouchableOpacity onPress={handlePrevMonth} style={styles.calendarArrowBtn}>
                                <MaterialCommunityIcons name="chevron-left" size={24} color={t('#2f333a', '#ffffff')} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleNextMonth} style={[styles.calendarArrowBtn, { marginLeft: 16 }]}>
                                <MaterialCommunityIcons name="chevron-right" size={24} color={t('#2f333a', '#ffffff')} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={calendarDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(event, date) => {
                                setShowDatePicker(false);
                                if (date) {
                                    setCalendarDate(date);
                                    setSelectedDate(date.getDate().toString());
                                }
                            }}
                        />
                    )}

                    <FlatList
                        horizontal
                        data={monthDays}
                        renderItem={renderCalendarItem}
                        keyExtractor={item => item.id.toString()}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.calendarList}
                        initialScrollIndex={Math.max(0, parseInt(selectedDate) - 3)}
                        getItemLayout={(data, index) => ({ length: 76, offset: 76 * index, index })}
                    />
                </View>

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

                <View style={{ height: 100 }} />
            </ScrollView>

            <Surface style={[styles.bottomNav, { backgroundColor: t('#ffffff', '#1e1e1e') }]} elevation={4}>
                <TouchableOpacity style={styles.navItem}>
                    <View style={[styles.navIconActive, { backgroundColor: t('#e3f2fd', 'rgba(61, 99, 126, 0.2)') }]}>
                        <MaterialCommunityIcons name="home" size={24} color="#3d637e" />
                    </View>
                    <Text style={styles.navLabelActive}>HOME</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialCommunityIcons name="calendar-check-outline" size={24} color={t('#aeafb4', '#aeafb4')} />
                    <Text style={[styles.navLabel, { color: t('#aeafb4', '#aeafb4') }]}>ATTENDANCE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialCommunityIcons name="book-open-variant" size={24} color={t('#aeafb4', '#aeafb4')} />
                    <Text style={[styles.navLabel, { color: t('#aeafb4', '#aeafb4') }]}>COURSES</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
                    <MaterialCommunityIcons name="account-outline" size={24} color={t('#aeafb4', '#aeafb4')} />
                    <Text style={[styles.navLabel, { color: t('#aeafb4', '#aeafb4') }]}>PROFILE</Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    headerUser: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f2f3fa',
        overflow: 'hidden',
    },
    headerTitle: {
        fontWeight: '700',
    },
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
    calendarContainer: {
        marginBottom: 40,
        shadowColor: '#3d637e',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 8,
        minHeight: 180, // Ensure enough height for the calendar content
    },
    calendarControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    calendarMonthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    calendarMonthText: {
        fontSize: 16,
        fontWeight: '800',
    },
    calendarArrows: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    calendarArrowBtn: {
        padding: 4,
    },
    calendarList: {
        gap: 12,
    },
    calendarDay: {
        width: 64,
        height: 84,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeDay: {
        backgroundColor: '#3d637e',
        shadowColor: '#3d637e',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    dayText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#91939c',
        marginBottom: 4,
    },
    dateText: {
        fontSize: 18,
        fontWeight: '900',
    },
    activeDayText: {
        color: '#ffffff',
    },
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
    subjectSub: {
        fontSize: 12,
        fontWeight: '600',
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
    }
});
