import React, { useEffect, useState, useMemo, useRef, useContext } from 'react';
import { View, StyleSheet, ScrollView, Image, ActivityIndicator, FlatList, TouchableOpacity, Platform } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { Text, Surface, IconButton, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SubjectCard from '../components/SubjectCard';
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
            day: weekdays[dateObj.getDay()],
            date: i.toString()
        });
    }
    return days;
};

export default function HomeScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date().getDate().toString());
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, subjects, avatar_url')
            .eq('id', session.user.id)
            .single();

        setProfile(profileData);
        setSubjects(profileData?.subjects && profileData.subjects.length > 0
            ? profileData.subjects
            : [
                'M2', 'Chemistry', 'Engineering Mechanics', 'PPS', 
                'Communication Skill', 'Workshop', 'Practical', 'NSS', 
                'Skill Development', 'Institutional Innovation Council', 
                'Sport Activity', 'Cultural Activity', 'Mentor Meeting', 
                'Industrial Connect', 'Tutorial', 'Remedial Lecture'
            ]
        );
        setLoading(false);
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

    const getInitials = (name) => {
        if (!name) return 'JS';
        const parts = name.split(' ');
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

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

    const renderCalendarItem = ({ item }) => (
        <TouchableOpacity 
            style={[
                styles.calendarDay, 
                { backgroundColor: t('#f2f3fa', '#1e1e1e') },
                item.date === selectedDate && styles.activeDay
            ]}
            onPress={() => setSelectedDate(item.date)}
        >
            <Text style={[styles.dayText, item.date === selectedDate && styles.activeDayText]}>{item.day}</Text>
            <Text style={[styles.dateText, { color: t('#2f333a', '#ffffff') }, item.date === selectedDate && styles.activeDayText]}>{item.date}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.root, { backgroundColor: t('#f9f9fe', '#000000') }]}>
            <View style={[styles.header, { backgroundColor: t('#f9f9fe', '#000000') }]}>
                <IconButton icon="menu" size={24} onPress={() => {}} iconColor={t('#2f333a', '#ffffff')} />
                <Text variant="titleLarge" style={[styles.headerTitle, { color: t('#2f333a', '#ffffff') }]}>Attendance</Text>
                <View style={styles.headerRight}>
                    <IconButton 
                        icon={isDark ? 'weather-sunny' : 'weather-night'} 
                        size={24} 
                        onPress={toggleTheme} 
                        iconColor={t('#2f333a', '#ffffff')}
                    />
                    <TouchableOpacity onPress={() => router.push('/profile')}>
                        <Surface style={[styles.avatar, { backgroundColor: t('#f2f3fa', '#1e1e1e'), borderColor: t('rgba(174, 178, 187, 0.2)', 'rgba(255, 255, 255, 0.1)') }]} elevation={0}>
                            {profile?.avatar_url ? (
                                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarText}>{getInitials(profile?.full_name)}</Text>
                            )}
                        </Surface>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.greetingSection}>
                    <Text variant="displaySmall" style={[styles.greetingText, { color: t('#2f333a', '#ffffff') }]}>
                        {getGreeting()}, {profile?.full_name || 'Faculty Member'}
                    </Text>
                    <Text variant="bodyMedium" style={[styles.subGreeting, { color: t('#5b5f68', '#aeafb4') }]}>
                        {formattedDate}
                    </Text>
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
                        ref={flatListRef}
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

                <Text variant="titleLarge" style={[styles.sectionTitle, { color: t('#2f333a', '#ffffff') }]}>Today's Schedule</Text>
                
                <View style={styles.scheduleList}>
                    {subjects.length > 0 ? subjects.map((sub, index) => (
                        <SubjectCard 
                            key={index}
                            subject={sub}
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

                <View style={{ height: 100 }} />
            </ScrollView>

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => {}}
                color="white"
            />

            <Surface style={[styles.bottomNav, { backgroundColor: t('#ffffff', '#1e1e1e') }]} elevation={4}>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialCommunityIcons name="view-grid" size={28} color="#3d637e" />
                    <Text style={styles.navLabelActive}>DASHBOARD</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialCommunityIcons name="book-outline" size={28} color={t('#9c9da1', '#aeafb4')} />
                    <Text style={[styles.navLabel, { color: t('#9c9da1', '#aeafb4') }]}>SUBJECTS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialCommunityIcons name="chart-bar" size={28} color={t('#9c9da1', '#aeafb4')} />
                    <Text style={[styles.navLabel, { color: t('#9c9da1', '#aeafb4') }]}>REPORTS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
                    <MaterialCommunityIcons name="account-outline" size={28} color={t('#9c9da1', '#aeafb4')} />
                    <Text style={[styles.navLabel, { color: t('#9c9da1', '#aeafb4') }]}>PROFILE</Text>
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
        paddingHorizontal: 8,
        paddingBottom: 10,
    },
    headerTitle: {
        fontWeight: '700',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#3d637e',
    },
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
        height: 80,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeDay: {
        backgroundColor: '#3d637e',
    },
    dayText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#9c9da1',
        marginBottom: 4,
    },
    dateText: {
        fontSize: 18,
        fontWeight: '900',
    },
    activeDayText: {
        color: '#ffffff',
    },
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
        borderRadius: 16,
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
    }
});
