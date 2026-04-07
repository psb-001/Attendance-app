import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Platform, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Text, Surface, Portal, Modal, TextInput, Button, IconButton, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import AppSidebar from '../components/AppSidebar';
import ProfileTab from '../components/ProfileTab';
import AppHeader from '../components/AppHeader';

export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({ users: 0, teachers: 0, subjects: 0, logs: 0 });
    const { isDark } = useContext(ThemeContext);

    // Admin specific data
    const [allUsers, setAllUsers] = useState([]);
    const [dbSubjects, setDbSubjects] = useState([]);
    const [dbStudents, setDbStudents] = useState([]);
    const [recentLogs, setRecentLogs] = useState([]);
    const [systemLogs, setSystemLogs] = useState([]);
    const [dbLatency, setDbLatency] = useState(0);

    // Curriculum Engine State
    const [subjectModalVisible, setSubjectModalVisible] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [formData, setFormData] = useState({ name: '', resource_url: '', icon: 'book', accent_color: '#3d637e', type: 'THEORY' });
    const [saving, setSaving] = useState(false);

    // Faculty Director State
    const [facultyModalVisible, setFacultyModalVisible] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [savingFaculty, setSavingFaculty] = useState(false);
    const [isAddingTeacher, setIsAddingTeacher] = useState(false);
    const [teacherForm, setTeacherForm] = useState({ full_name: '', email: '', department: '' });
    const [newSubjectName, setNewSubjectName] = useState('');

    // Student Directory State
    const [studentModalVisible, setStudentModalVisible] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [savingStudent, setSavingStudent] = useState(false);
    const [studentForm, setStudentForm] = useState({ roll_no: '', name: '', branch: '', email: '' });
    const [studentSearch, setStudentSearch] = useState('');

    const ICONS = ['book-outline', 'flask-outline', 'cog-outline', 'calculator-variant', 'microphone-outline', 'hammer-wrench', 'code-tags', 'robot-outline', 'chart-bar', 'leaf'];
    const COLORS = ['#3d637e', '#6C5CE7', '#00B894', '#E17055', '#0984E3', '#FDCB6E', '#E84393', '#d63031', '#00cec9', '#fd79a8'];

    useEffect(() => {
        init();

        // 🚀 THE REALTIME MAGIC: Open a WebSocket tunnel to Supabase
        const channel = supabase
            .channel('admin-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'attendance_logs' },
                (payload) => {
                    if (__DEV__) console.log('Realtime log detected!', payload);
                    fetchAdminData(); // Instantly refresh the stats and live traffic!
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                (payload) => {
                    if (__DEV__) console.log('Realtime profile detected!', payload);
                    fetchAdminData(); // Instantly refresh user counts!
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'system_logs' },
                (payload) => {
                    fetchAdminData(); // Refresh the traffic graphs!
                }
            )
            .subscribe();

        // Cleanup the WebSocket when the admin leaves the dashboard
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const init = async () => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                await supabase.auth.signOut();
                router.replace('/login');
                return;
            }

            // 🛡️ THE UNIVERSAL BRIDGE: Get the profile prepared by the DB Trigger.
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            if (!profileData || profileData.role !== 'admin') {
                if (profileData && profileData.role !== 'admin') {
                    router.replace('/'); // Send to correct dashboard (Student/Teacher)
                    return;
                }
                if (__DEV__) console.warn("Access Denied: You are not authorized as an Admin.");
                router.replace('/login');
                return;
            }

            setProfile(profileData);
            await fetchAdminData();
        } catch (err) {
            if (__DEV__) console.error("Admin auth failed:", err);
            router.replace('/login');
        } finally {
            setLoading(false);
        }
    };

    const fetchAdminData = async () => {
        const startTime = Date.now();

        // 1. Fetch Faculty Registry
        const { data: teachers, error: teachersError } = await supabase
            .from('teachers')
            .select('*')
            .order('full_name');

        setAllUsers(teachers || []);

        // 2. Fetch Subjects (Curriculum)
        const { data: subjects } = await supabase.from('subjects').select('*').order('name');
        if (subjects) setDbSubjects(subjects);

        // 3. Fetch Student Registry (The Ironclad Source)
        const { data: students } = await supabase
            .from('students_registry')
            .select('*')
            .order('branch')
            .order('roll_no');

        if (students) setDbStudents(students);

        // 4. Analytics: Logs Count
        const { count: logCount } = await supabase.from('attendance_logs').select('*', { count: 'exact', head: true });

        // 5. Live Traffic: Recent 5 Logs
        const { data: recentActivity } = await supabase
            .from('attendance_logs')
            .select(`
                id, timestamp, status,
                profiles (full_name, role),
                subjects (name, accent_color, icon)
            `)
            .order('timestamp', { ascending: false })
            .limit(5);

        if (recentActivity) setRecentLogs(recentActivity);

        // 6. System Performance Logs
        const { data: sysLogs } = await supabase
            .from('system_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (sysLogs) setSystemLogs(sysLogs);

        setStats({
            users: logCount || 0,
            teachers: (teachers || []).length,
            subjects: subjects?.length || 0,
            logs: logCount || 0
        });

        setDbLatency(Date.now() - startTime);
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await init();
        setRefreshing(false);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/login');
    };

    const openSubjectModal = (subject = null) => {
        if (subject) {
            setEditingSubject(subject);
            setFormData({
                name: subject.name,
                resource_url: subject.resource_url || '',
                icon: subject.icon || 'book-outline',
                accent_color: subject.accent_color || '#3d637e',
                type: subject.type || 'THEORY'
            });
        } else {
            setEditingSubject(null);
            setFormData({ name: '', resource_url: '', icon: 'book-outline', accent_color: '#3d637e', type: 'THEORY' });
        }
        setSubjectModalVisible(true);
    };

    const saveSubject = async () => {
        if (!formData.name) return;
        setSaving(true);
        const payload = { ...formData };
        if (editingSubject?.id) payload.id = editingSubject.id;

        const { error } = await supabase.from('subjects').upsert(payload, { onConflict: 'id' });

        if (error) {
            alert("Error saving subject: " + error.message);
        } else {
            setSubjectModalVisible(false);
            fetchAdminData();
        }
        setSaving(false);
    };

    const saveTeacherSubjects = async () => {
        if (!selectedTeacher && !isAddingTeacher) return;
        setSavingFaculty(true);

        const teacherEmail = (teacherForm.email || selectedTeacher?.email || '').toLowerCase().trim();

        if (isAddingTeacher) {
            // INSERT into the REGISTRY table
            const { error } = await supabase.from('teachers').insert({
                full_name: teacherForm.full_name,
                email: teacherEmail,
                department: teacherForm.department,
                subjects: selectedSubjects,
            });
            if (error) alert('Error adding teacher: ' + error.message);
            else {
                // Also attempt to update the profile if it exists
                await supabase.from('profiles').update({
                    full_name: teacherForm.full_name,
                    department: teacherForm.department,
                    subjects: selectedSubjects,
                    role: 'teacher'
                }).ilike('email', teacherEmail);

                setFacultyModalVisible(false);
                fetchAdminData();
            }
        } else {
            // UPDATE the REGISTRY table
            const { error } = await supabase
                .from('teachers')
                .update({
                    full_name: teacherForm.full_name || selectedTeacher.full_name,
                    email: teacherForm.email || selectedTeacher.email,
                    department: teacherForm.department || selectedTeacher.department,
                    subjects: selectedSubjects
                })
                .eq('id', selectedTeacher.id);

            if (error) alert('Error saving: ' + error.message);
            else {
                // 🔄 Sync profile table
                const oldEmail = (selectedTeacher.email || '').toLowerCase().trim();
                const newEmail = (teacherForm.email || selectedTeacher.email || '').toLowerCase().trim();

                if (newEmail && newEmail !== oldEmail) {
                    // 🔒 Downgrade old profile so they lose access (don't delete to preserve logs)
                    await supabase.from('profiles').update({ role: 'not_enrolled' }).ilike('email', oldEmail);
                    
                    // 🆕 Upgrade new profile if they already signed in with the new email
                    await supabase.from('profiles').update({
                        role: 'teacher',
                        full_name: teacherForm.full_name || selectedTeacher.full_name,
                        department: teacherForm.department || selectedTeacher.department,
                        subjects: selectedSubjects
                    }).ilike('email', newEmail);
                } else if (newEmail) {
                    // Just sync other details if email didn't change
                    const { error: syncErr } = await supabase.from('profiles').update({
                        full_name: teacherForm.full_name || selectedTeacher.full_name,
                        department: teacherForm.department || selectedTeacher.department,
                        subjects: selectedSubjects,
                        role: 'teacher'
                    }).ilike('email', newEmail);
                    if (syncErr) alert("Warning: Could not sync profile details. " + syncErr.message);
                }

                setFacultyModalVisible(false);
                fetchAdminData();
            }
        }
        setSavingFaculty(false);
    };

    const deleteTeacher = (teacher) => {
        const confirmMsg = `Remove "${teacher.full_name || teacher.email || 'Unnamed Teacher'}" from the system? This cannot be undone.`;
        const executeDelete = async () => {
            const { error } = await supabase.from('teachers').delete().eq('id', teacher.id);
            if (error) alert('Error: ' + error.message);
            else {
                await supabase.from('profiles').update({ role: 'not_enrolled', subjects: [], department: null }).ilike('email', teacher.email);
                setFacultyModalVisible(false);
                fetchAdminData();
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Delete Teacher\n\n${confirmMsg}`)) {
                executeDelete();
            }
        } else {
            Alert.alert(
                'Delete Teacher',
                confirmMsg,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: executeDelete }
                ]
            );
        }
    };

    const deleteSubject = (sub) => {
        const confirmMsg = `Remove "${sub.name}" from the curriculum? This cannot be undone.`;
        const executeDelete = async () => {
            const { error } = await supabase.from('subjects').delete().eq('id', sub.id);
            if (error) alert('Error: ' + error.message);
            else fetchAdminData();
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Delete Subject\n\n${confirmMsg}`)) {
                executeDelete();
            }
        } else {
            Alert.alert(
                'Delete Subject',
                confirmMsg,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: executeDelete }
                ]
            );
        }
    };

    const toggleSubjectVisibility = async (sub) => {
        const newStatus = !sub.is_hidden;
        const { error } = await supabase.from('subjects').update({ is_hidden: newStatus }).eq('id', sub.id);
        if (error) alert('Error updating subject visibility: ' + error.message);
        else fetchAdminData();
    };

    const saveStudentProfile = async () => {
        if (!studentForm.name || !studentForm.roll_no) return;

        const rollNum = parseInt(studentForm.roll_no);
        if (isNaN(rollNum)) {
            alert('Roll Number must be a valid number.');
            return;
        }

        setSavingStudent(true);

        const studentEmail = (studentForm.email || '').toLowerCase().trim();

        const payload = {
            roll_no: rollNum,
            full_name: studentForm.name,
            branch: studentForm.branch,
            batch: studentForm.batch || 'B1',
            is_active: true
        };

        // Only include email in payload if it's provided
        if (studentEmail) payload.email = studentEmail;

        if (isAddingStudent) {
            // 🛡️ ENROLL: Add to the Ironclad Registry
            const { error } = await supabase.from('students_registry').insert(payload);
            if (error) alert('Error enrolling student: ' + error.message);
            else { setStudentModalVisible(false); fetchAdminData(); }
        } else {
            // 🛡️ UPDATE: Modify Registry entry
            const { error } = await supabase
                .from('students_registry')
                .update(payload)
                .eq('id', selectedStudent.id);
            if (error) alert('Error updating student: ' + error.message);
            else {
                // 🔄 Sync profile table
                const oldEmail = (selectedStudent.email || '').toLowerCase().trim();
                const newEmail = (studentEmail || selectedStudent.email || '').toLowerCase().trim();

                if (newEmail && newEmail !== oldEmail) {
                    // 🔒 Downgrade old profile so they lose access (don't delete to preserve logs)
                    await supabase.from('profiles').update({ role: 'not_enrolled' }).ilike('email', oldEmail);
                    
                    // 🆕 Upgrade new profile if they already signed in with the new email
                    await supabase.from('profiles').update({
                        role: 'student',
                        full_name: studentForm.name,
                        branch: studentForm.branch,
                        roll_no: rollNum
                    }).ilike('email', newEmail);
                } else if (newEmail) {
                    // Same email - just sync name/branch/roll changes
                    const { error: syncErr } = await supabase.from('profiles').update({
                        full_name: studentForm.name,
                        branch: studentForm.branch,
                        roll_no: rollNum,
                        role: 'student'
                    }).ilike('email', newEmail);
                    if (syncErr) alert("Warning: Could not sync profile details. " + syncErr.message);
                }
                setStudentModalVisible(false); fetchAdminData();
            }
        }
        setSavingStudent(false);
    };

    const [diagnosticResults, setDiagnosticResults] = useState(null);

    const runDiagnostics = async () => {
        try {
            // 1. Get ALL stuck profiles (not_enrolled)
            const { data: stuckProfiles, error: pErr } = await supabase
                .from('profiles').select('id, email').eq('role', 'not_enrolled');
            if (pErr) return alert("Error fetching profiles: " + pErr.message);

            // 2. Get ALL registry emails for comparison
            const { data: allRegistry } = await supabase
                .from('students_registry').select('id, email, full_name, roll_no, branch');
            const { data: allTeachers } = await supabase
                .from('teachers').select('id, email, full_name');

            const results = {
                stuck: stuckProfiles || [],
                registryEmails: (allRegistry || []).filter(r => r.email).map(r => r.email.toLowerCase().trim()),
                registry: allRegistry || [],
                teachers: allTeachers || [],
            };

            // Cross-reference
            results.analyzed = (stuckProfiles || []).map(p => {
                const stuckEmail = (p.email || '').toLowerCase().trim();
                const exactStudent = (allRegistry || []).find(r => r.email && r.email.toLowerCase().trim() === stuckEmail);
                const exactTeacher = (allTeachers || []).find(t => t.email && t.email.toLowerCase().trim() === stuckEmail);
                return { ...p, exactStudent, exactTeacher };
            });

            setDiagnosticResults(results);

            // Also show a quick summary alert
            let msg = `TRAPPED: ${results.stuck.length} user(s)\nREGISTRY: ${results.registryEmails.length} emails\n\n`;
            for (let item of results.analyzed) {
                msg += `• ${item.email}\n`;
                if (item.exactStudent) msg += `  ✅ MATCH: ${item.exactStudent.full_name} (Roll ${item.exactStudent.roll_no})\n`;
                else if (item.exactTeacher) msg += `  ✅ MATCH: ${item.exactTeacher.full_name} (Teacher)\n`;
                else msg += `  ❌ NOT in registry\n`;
            }
            msg += `\n--- ALL REGISTRY EMAILS ---\n`;
            for (let email of results.registryEmails.slice(0, 20)) {
                msg += `  ${email}\n`;
            }
            if (results.registryEmails.length > 20) msg += `  ... and ${results.registryEmails.length - 20} more\n`;

            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert("Diagnostic Results", msg);
        } catch (err) {
            alert(err.message);
        }
    };

    const forceFixProfile = async (stuckProfile, registryEntry, roleType) => {
        try {
            const updatePayload = roleType === 'student'
                ? { role: 'student', full_name: registryEntry.full_name, branch: registryEntry.branch, roll_no: registryEntry.roll_no }
                : { role: 'teacher', full_name: registryEntry.full_name, department: registryEntry.department, subjects: registryEntry.subjects };

            const { error } = await supabase.from('profiles').update(updatePayload).eq('id', stuckProfile.id);
            if (error) return alert("Force fix FAILED: " + error.message);
            alert(`✅ Fixed! ${stuckProfile.email} is now a ${roleType}.`);
            runDiagnostics(); // Refresh
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    const deleteStudentProfile = (student) => {
        const confirmMsg = `Remove "${student.full_name}" (Roll No: ${student.roll_no}) from the system? This cannot be undone.`;
        const executeDelete = async () => {
            const { error } = await supabase.from('students_registry').delete().eq('id', student.id);
            if (error) alert('Error: ' + error.message);
            else { setStudentModalVisible(false); fetchAdminData(); }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Delete Student\n\n${confirmMsg}`)) executeDelete();
        } else {
            Alert.alert('Delete Student', confirmMsg, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: executeDelete }
            ]);
        }
    };

    const t = (light, dark) => isDark ? dark : light;

    if (loading) return null;

    return (
        <View style={[styles.root, { backgroundColor: t('#f9f9fe', '#000000') }]}>
            <AppHeader
                activeTab={activeTab}
                profile={profile}
                onOpenMenu={() => setIsSidebarOpen(true)}
                onAvatarPress={() => setActiveTab('profile')}
                roleTitle="PRESENLY"
            />
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#3d637e' : '#3d637e'} />
                }
            >
                {activeTab === 'home' && (
                    <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
                            <Text variant="headlineSmall" style={[styles.sectionTitle, { color: t('#2f333a', '#ffffff'), marginBottom: 0 }]}>Command Center</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#00B894', marginRight: 6 }} />
                                <Text style={{ color: t('#5b5f68', '#aeafb4'), fontSize: 12, fontWeight: '700' }}>API: {dbLatency}ms</Text>
                            </View>
                        </View>

                        <View style={styles.statsGrid}>
                            <Surface style={[styles.gridCard, { backgroundColor: t('#ffffff', '#181818'), borderColor: t('rgba(0,0,0,0.04)', 'rgba(255,255,255,0.06)') }]} elevation={0}>
                                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(9, 132, 227, 0.1)' }]}>
                                    <MaterialCommunityIcons name="account-group" size={24} color="#0984E3" />
                                </View>
                                <Text style={styles.gridValue}>{stats.users}</Text>
                                <Text style={[styles.gridLabel, { color: t('#91939c', '#aeafb4') }]}>Total Users</Text>
                            </Surface>

                            <Surface style={[styles.gridCard, { backgroundColor: t('#ffffff', '#181818'), borderColor: t('rgba(0,0,0,0.04)', 'rgba(255,255,255,0.06)') }]} elevation={0}>
                                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(108, 92, 231, 0.1)' }]}>
                                    <MaterialCommunityIcons name="account-tie" size={24} color="#6C5CE7" />
                                </View>
                                <Text style={styles.gridValue}>{stats.teachers}</Text>
                                <Text style={[styles.gridLabel, { color: t('#91939c', '#aeafb4') }]}>Faculty Data</Text>
                            </Surface>

                            <Surface style={[styles.gridCard, { backgroundColor: t('#ffffff', '#181818'), borderColor: t('rgba(0,0,0,0.04)', 'rgba(255,255,255,0.06)') }]} elevation={0}>
                                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(0, 184, 148, 0.1)' }]}>
                                    <MaterialCommunityIcons name="book-open-variant" size={24} color="#00B894" />
                                </View>
                                <Text style={styles.gridValue}>{stats.subjects}</Text>
                                <Text style={[styles.gridLabel, { color: t('#91939c', '#aeafb4') }]}>Curriculum</Text>
                            </Surface>

                            <Surface style={[styles.gridCard, { backgroundColor: t('#ffffff', '#181818'), borderColor: t('rgba(0,0,0,0.04)', 'rgba(255,255,255,0.06)') }]} elevation={0}>
                                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(225, 112, 85, 0.1)' }]}>
                                    <MaterialCommunityIcons name="server-network" size={24} color="#E17055" />
                                </View>
                                <Text style={styles.gridValue}>{stats.logs}</Text>
                                <Text style={[styles.gridLabel, { color: t('#91939c', '#aeafb4') }]}>Synched Logs</Text>
                            </Surface>
                        </View>

                        <Text variant="titleLarge" style={[styles.sectionTitle, { color: t('#2f333a', '#ffffff'), marginTop: 30 }]}>API Latency & Health</Text>

                        {systemLogs.length > 0 ? (
                            <Surface style={[styles.chartCard, { backgroundColor: t('#ffffff', '#181818'), borderColor: t('rgba(0,0,0,0.04)', 'rgba(255,255,255,0.06)') }]} elevation={0}>
                                <LineChart
                                    data={{
                                        labels: systemLogs.slice(0, 5).reverse().map(log => {
                                            const d = new Date(log.created_at);
                                            return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
                                        }),
                                        datasets: [{ data: systemLogs.slice(0, 5).reverse().map(log => log.latency_ms || 0) }]
                                    }}
                                    width={Dimensions.get('window').width > 500 ? Math.min(Dimensions.get('window').width - 80, 1100) : Dimensions.get('window').width - 80}
                                    height={220}
                                    yAxisSuffix="ms"
                                    yAxisInterval={1}
                                    chartConfig={{
                                        backgroundColor: t('#ffffff', '#181818'),
                                        backgroundGradientFrom: t('#ffffff', '#181818'),
                                        backgroundGradientTo: t('#ffffff', '#181818'),
                                        decimalPlaces: 0,
                                        color: (opacity = 1) => `rgba(0, 184, 148, ${opacity})`,
                                        labelColor: (opacity = 1) => t(`rgba(47, 51, 58, ${opacity})`, `rgba(255, 255, 255, ${opacity})`),
                                        style: { borderRadius: 16 },
                                        propsForDots: { r: "4", strokeWidth: "2", stroke: "#00B894" }
                                    }}
                                    bezier
                                    style={{ marginVertical: 8, borderRadius: 16 }}
                                />
                            </Surface>
                        ) : (
                            <Text style={{ color: t('#91939c', '#aeafb4'), marginBottom: 20 }}>Not enough data for performance graphs yet.</Text>
                        )}

                        <Text variant="titleLarge" style={[styles.sectionTitle, { color: t('#2f333a', '#ffffff'), marginTop: 20 }]}>Live Traffic</Text>

                        <View style={{ gap: 12 }}>
                            {recentLogs.length > 0 ? recentLogs.map((log, index) => (
                                <Surface key={log.id || index} style={[styles.logCard, { backgroundColor: t('#ffffff', '#181818'), borderColor: t('rgba(0,0,0,0.04)', 'rgba(255,255,255,0.06)') }]} elevation={0}>
                                    <View style={[styles.logIndicator, { backgroundColor: log.subjects?.accent_color || '#3d637e' }]} />
                                    <View style={{ flex: 1, paddingLeft: 16 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: t('#2f333a', '#ffffff') }}>
                                            {log.profiles?.full_name || 'Unknown User'}
                                        </Text>
                                        <Text style={{ fontSize: 13, fontWeight: '600', color: t('#91939c', '#aeafb4'), marginTop: 2 }}>
                                            {log.status} • {log.subjects?.name || 'Unknown Class'}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: t('#91939c', '#aeafb4') }}>
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                        <MaterialCommunityIcons name={log.subjects?.icon || "book"} size={16} color={t('#91939c', '#555')} style={{ marginTop: 4 }} />
                                    </View>
                                </Surface>
                            )) : (
                                <Text style={{ color: t('#91939c', '#aeafb4') }}>No recent network traffic.</Text>
                            )}
                        </View>
                    </View>
                )}

                {activeTab === 'users' && (
                    <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text variant="headlineSmall" style={[styles.sectionTitle, { color: t('#2f333a', '#ffffff'), marginBottom: 0 }]}>Faculty Director</Text>
                            <Button mode="contained" buttonColor="#6C5CE7" icon="plus" labelStyle={{ fontWeight: '800' }} onPress={() => {
                                setIsAddingTeacher(true);
                                setSelectedTeacher(null);
                                setTeacherForm({ full_name: '', email: '', department: '' });
                                setSelectedSubjects([]);
                                setFacultyModalVisible(true);
                            }}>Add</Button>
                        </View>
                        <Text style={{ color: t('#91939c', '#aeafb4'), marginBottom: 20, fontWeight: '600' }}>Tap a teacher to edit their profile and assign subjects.</Text>
                        <View style={{ gap: 12 }}>
                            {allUsers.map((teacher, idx) => (
                                <TouchableOpacity key={teacher.id || idx} onPress={() => {
                                    setIsAddingTeacher(false);
                                    setSelectedTeacher(teacher);
                                    setTeacherForm({
                                        full_name: teacher.full_name || '',
                                        email: teacher.email || '',
                                        department: teacher.department || ''
                                    });
                                    setSelectedSubjects(teacher.subjects || []);
                                    setFacultyModalVisible(true);
                                }} activeOpacity={0.7}>
                                    <Surface style={[styles.subjectCard, { backgroundColor: t('#ffffff', '#181818'), borderColor: t('rgba(0,0,0,0.04)', 'rgba(255,255,255,0.06)') }]} elevation={0}>
                                        <View style={[styles.subjectIconWrap, { backgroundColor: 'rgba(108,92,231,0.1)' }]}>
                                            <MaterialCommunityIcons name="account-tie" size={24} color="#6C5CE7" />
                                        </View>
                                        <View style={{ flex: 1, paddingHorizontal: 16 }}>
                                            <Text style={{ fontSize: 16, fontWeight: '800', color: t('#2f333a', '#ffffff') }}>{teacher.full_name || teacher.name || 'Unnamed Teacher'}</Text>
                                            <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '600', color: '#6C5CE7', marginTop: 1 }}>
                                                {teacher.email || 'No email set'}
                                            </Text>
                                            <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '600', color: t('#91939c', '#aeafb4'), marginTop: 1 }}>
                                                {teacher.department ? `${teacher.department} • ` : ''}{teacher.subjects?.length > 0 ? `${teacher.subjects.length} subject(s)` : 'No subjects assigned'}
                                            </Text>
                                        </View>
                                        <MaterialCommunityIcons name="chevron-right" size={24} color={t('#cbd5e1', '#334155')} />
                                    </Surface>
                                </TouchableOpacity>
                            ))}
                            {allUsers.length === 0 && (
                                <Text style={{ color: t('#91939c', '#aeafb4'), textAlign: 'center', marginTop: 20 }}>No teachers registered yet.</Text>
                            )}
                        </View>
                    </View>
                )}

                {activeTab === 'students' && (
                    <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <Text variant="headlineSmall" style={[styles.sectionTitle, { color: t('#2f333a', '#ffffff'), marginBottom: 0, marginRight: 10 }]}>Student Directory</Text>
                                <IconButton icon="stethoscope" iconColor="#00B894" size={24} mode="outlined" onPress={runDiagnostics} />
                            </View>
                            <Button mode="contained" buttonColor="#00B894" icon="plus" labelStyle={{ fontWeight: '800' }} onPress={() => {
                                setIsAddingStudent(true);
                                setSelectedStudent(null);
                                setStudentForm({ roll_no: '', name: '', branch: '', email: '' });
                                setStudentModalVisible(true);
                            }}>Enlist</Button>
                        </View>

                        <Searchbar
                            placeholder="Search by name, roll no, or branch"
                            onChangeText={setStudentSearch}
                            value={studentSearch}
                            style={{ marginBottom: 16, backgroundColor: t('#ffffff', '#1e1e1e'), borderRadius: 12, borderColor: t('rgba(0,0,0,0.04)', 'rgba(255,255,255,0.06)'), borderWidth: 1 }}
                            inputStyle={{ color: t('#2f333a', '#ffffff'), minHeight: 44 }}
                            iconColor={t('#91939c', '#aeafb4')}
                            placeholderTextColor={t('#91939c', '#aeafb4')}
                            elevation={0}
                        />

                        {/* 🩺 DIAGNOSTIC RESULTS PANEL */}
                        {diagnosticResults && diagnosticResults.stuck.length > 0 && (
                            <Surface style={{ backgroundColor: t('#fff8e1', '#1a1200'), borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: t('#ffe082', '#554400') }} elevation={0}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                    <MaterialCommunityIcons name="alert-circle" size={20} color="#ff9800" />
                                    <Text style={{ color: '#ff9800', fontWeight: '900', fontSize: 14, marginLeft: 8 }}>
                                        {diagnosticResults.stuck.length} TRAPPED ACCOUNT(S)
                                    </Text>
                                    <TouchableOpacity onPress={() => setDiagnosticResults(null)} style={{ marginLeft: 'auto' }}>
                                        <MaterialCommunityIcons name="close" size={20} color={t('#999', '#666')} />
                                    </TouchableOpacity>
                                </View>
                                {diagnosticResults.analyzed.map((item, idx) => (
                                    <View key={idx} style={{ backgroundColor: t('#ffffff', '#111'), borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: t('#eee', '#333') }}>
                                        <Text style={{ color: t('#333', '#fff'), fontWeight: '700', fontSize: 13 }}>{item.email}</Text>
                                        {item.exactStudent ? (
                                            <View>
                                                <Text style={{ color: '#00B894', fontSize: 12, marginTop: 4 }}>
                                                    ✅ MATCH: {item.exactStudent.full_name} (Roll {item.exactStudent.roll_no}, {item.exactStudent.branch})
                                                </Text>
                                                <Button
                                                    mode="contained" buttonColor="#00B894" icon="wrench"
                                                    style={{ marginTop: 8, alignSelf: 'flex-start' }}
                                                    labelStyle={{ fontSize: 12, fontWeight: '800' }}
                                                    onPress={() => forceFixProfile(item, item.exactStudent, 'student')}
                                                >
                                                    Force Fix → Student
                                                </Button>
                                            </View>
                                        ) : item.exactTeacher ? (
                                            <View>
                                                <Text style={{ color: '#6C5CE7', fontSize: 12, marginTop: 4 }}>
                                                    ✅ MATCH: {item.exactTeacher.full_name} (Teacher)
                                                </Text>
                                                <Button
                                                    mode="contained" buttonColor="#6C5CE7" icon="wrench"
                                                    style={{ marginTop: 8, alignSelf: 'flex-start' }}
                                                    labelStyle={{ fontSize: 12, fontWeight: '800' }}
                                                    onPress={() => forceFixProfile(item, item.exactTeacher, 'teacher')}
                                                >
                                                    Force Fix → Teacher
                                                </Button>
                                            </View>
                                        ) : (
                                            <Text style={{ color: '#f44336', fontSize: 12, marginTop: 4 }}>
                                                ❌ Email NOT in any registry. Add it first, then re-scan.
                                            </Text>
                                        )}
                                    </View>
                                ))}
                            </Surface>
                        )}

                        <View style={{ gap: 12 }}>
                            {dbStudents.filter(student =>
                                (student.full_name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
                                (student.roll_no || '').toString().includes(studentSearch) ||
                                (student.branch || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
                                (student.batch || '').toLowerCase().includes(studentSearch.toLowerCase())
                            ).map((student, idx) => (
                                <TouchableOpacity key={student.id || idx} onPress={() => {
                                    setIsAddingStudent(false);
                                    setSelectedStudent(student);
                                    setStudentForm({
                                        roll_no: student.roll_no?.toString() || '',
                                        name: student.full_name || '',
                                        branch: student.branch || '',
                                        batch: student.batch || 'B1',
                                        email: student.email || ''
                                    });
                                    setStudentModalVisible(true);
                                }} activeOpacity={0.7}>
                                    <Surface style={[styles.subjectCard, { backgroundColor: t('#ffffff', '#181818'), borderColor: t('rgba(0,0,0,0.04)', 'rgba(255,255,255,0.06)') }]} elevation={0}>
                                        <View style={[styles.subjectIconWrap, { backgroundColor: 'rgba(0, 184, 148, 0.1)' }]}>
                                            <MaterialCommunityIcons name="account-school" size={24} color="#00B894" />
                                        </View>
                                        <View style={{ flex: 1, paddingHorizontal: 16 }}>
                                            <Text style={{ fontSize: 16, fontWeight: '800', color: t('#2f333a', '#ffffff') }}>{student.full_name}</Text>
                                            <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '600', color: '#00B894', marginTop: 1 }}>
                                                {student.email || 'No email set'}
                                            </Text>
                                            <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '600', color: t('#91939c', '#aeafb4'), marginTop: 1 }}>
                                                Roll No: {student.roll_no} • {student.branch} {student.batch ? `• ${student.batch}` : ''}
                                            </Text>
                                        </View>
                                        <MaterialCommunityIcons name="chevron-right" size={24} color={t('#cbd5e1', '#334155')} />
                                    </Surface>
                                </TouchableOpacity>
                            ))}
                            {dbStudents.filter(student =>
                                (student.full_name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
                                (student.roll_no || '').toString().includes(studentSearch) ||
                                (student.branch || '').toLowerCase().includes(studentSearch.toLowerCase())
                            ).length === 0 && (
                                    <Text style={{ color: t('#91939c', '#aeafb4'), textAlign: 'center', marginTop: 20 }}>No students match your search.</Text>
                                )}
                        </View>
                    </View>
                )}

                {activeTab === 'subjects' && (
                    <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text variant="headlineSmall" style={[styles.sectionTitle, { color: t('#2f333a', '#ffffff'), marginBottom: 0 }]}>Manage Curriculum</Text>
                            <Button mode="contained" onPress={() => openSubjectModal()} buttonColor="#00B894" icon="plus" labelStyle={{ fontWeight: '800' }}>
                                Add
                            </Button>
                        </View>

                        <View style={{ gap: 12 }}>
                            {dbSubjects.map((sub, idx) => (
                                <TouchableOpacity key={sub.id || idx} onPress={() => openSubjectModal(sub)} activeOpacity={0.7}>
                                    <Surface style={[styles.subjectCard, { backgroundColor: t('#ffffff', '#181818'), borderColor: t('rgba(0,0,0,0.04)', 'rgba(255,255,255,0.06)') }]} elevation={0}>
                                        <View style={[styles.subjectIconWrap, { backgroundColor: sub.accent_color + '20' }]}>
                                            <MaterialCommunityIcons name={sub.icon || "book"} size={24} color={sub.accent_color || "#3d637e"} />
                                        </View>
                                        <View style={{ flex: 1, paddingHorizontal: 16 }}>
                                            <Text style={{ fontSize: 16, fontWeight: '800', color: t('#2f333a', '#ffffff') }}>{sub.name}</Text>
                                            <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '600', color: t('#91939c', '#aeafb4'), marginTop: 2 }}>
                                                {sub.resource_url || "No resource link assigned"}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <TouchableOpacity
                                                onPress={(e) => { e.stopPropagation?.(); toggleSubjectVisibility(sub); }}
                                                style={{ padding: 8 }}
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            >
                                                <MaterialCommunityIcons
                                                    name={sub.is_hidden ? "eye-off-outline" : "eye-outline"}
                                                    size={22}
                                                    color={sub.is_hidden ? t('#cbd5e1', '#475569') : "#00B894"}
                                                />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={(e) => { e.stopPropagation?.(); deleteSubject(sub); }}
                                                style={{ padding: 8 }}
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            >
                                                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#f44336" />
                                            </TouchableOpacity>
                                        </View>
                                    </Surface>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {activeTab === 'profile' && (
                    <ProfileTab profile={profile} onLogout={handleLogout} roleLabel="System Administrator" />
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={[styles.bottomNav, { backgroundColor: t('#ffffff', '#121212'), borderTopColor: t('rgba(0,0,0,0.05)', 'rgba(255,255,255,0.05)'), borderTopWidth: 1 }]}>
                {[
                    { key: 'home', icon: 'home-outline', label: 'Monitor' },
                    { key: 'users', icon: 'account-group-outline', label: 'Faculty' },
                    { key: 'students', icon: 'card-account-details-outline', label: 'Students' },
                    { key: 'subjects', icon: 'book-open-outline', label: 'Curriculum' },
                    { key: 'profile', icon: 'account-outline', label: 'Profile' }
                ].map((item) => (
                    <TouchableOpacity key={item.key} style={styles.navItem} onPress={() => setActiveTab(item.key)}>
                        <View style={[styles.navIconContainer, activeTab === item.key && { backgroundColor: t('#f0f4f8', '#1a2228') }]}>
                            <MaterialCommunityIcons name={item.icon} size={24} color={activeTab === item.key ? '#3d637e' : t('#91939c', '#aeafb4')} />
                        </View>
                        <Text style={[styles.navLabel, { color: activeTab === item.key ? '#3d637e' : t('#91939c', '#aeafb4'), fontWeight: activeTab === item.key ? '800' : '600' }]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <AppSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                profile={profile}
                activeTab={activeTab}
                onNavigate={setActiveTab}
                onLogout={handleLogout}
                fallbackName="SysAdmin"
            />

            <Portal>
                <Modal visible={subjectModalVisible} onDismiss={() => setSubjectModalVisible(false)} contentContainerStyle={[styles.modalCard, { backgroundColor: t('#ffffff', '#1e1e1e') }]}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text variant="titleLarge" style={{ fontWeight: '900', color: t('#2f333a', '#ffffff'), marginBottom: 20 }}>
                            {editingSubject ? "Edit Subject Configuration" : "Deploy New Subject"}
                        </Text>

                        <TextInput
                            label="Subject Full Name"
                            value={formData.name}
                            onChangeText={text => setFormData({ ...formData, name: text })}
                            mode="outlined"
                            style={styles.modalInput}
                            outlineColor={t('#e2e8f0', '#333')}
                            activeOutlineColor="#3d637e"
                            textColor={t('black', 'white')}
                        />

                        <TextInput
                            label="Google Drive Resource URL"
                            value={formData.resource_url}
                            onChangeText={text => setFormData({ ...formData, resource_url: text })}
                            mode="outlined"
                            style={styles.modalInput}
                            outlineColor={t('#e2e8f0', '#333')}
                            activeOutlineColor="#3d637e"
                            textColor={t('black', 'white')}
                            placeholder="https://drive.google.com/..."
                        />

                        <Text style={[styles.labelSection, { color: t('#5b5f68', '#aeafb4') }]}>VISUAL BRANDING</Text>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20, paddingBottom: 10 }}>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                {COLORS.map(color => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[styles.colorChip, { backgroundColor: color, borderWidth: formData.accent_color === color ? 3 : 0, borderColor: t('#2f333a', '#ffffff') }]}
                                        onPress={() => setFormData({ ...formData, accent_color: color })}
                                    >
                                        {formData.accent_color === color && <MaterialCommunityIcons name="check" size={16} color="white" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 30 }}>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                {ICONS.map(icon => (
                                    <TouchableOpacity
                                        key={icon}
                                        style={[styles.iconChip, { backgroundColor: formData.icon === icon ? formData.accent_color + '20' : 'transparent', borderColor: formData.icon === icon ? formData.accent_color : t('#e2e8f0', '#333') }]}
                                        onPress={() => setFormData({ ...formData, icon: icon })}
                                    >
                                        <MaterialCommunityIcons name={icon} size={24} color={formData.icon === icon ? formData.accent_color : t('#94a3b8', '#64748b')} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <Button mode="outlined" style={{ flex: 1 }} onPress={() => setSubjectModalVisible(false)} textColor={t('#5b5f68', '#aeafb4')}>Cancel</Button>
                            <Button mode="contained" style={{ flex: 1 }} buttonColor={formData.accent_color} onPress={saveSubject} loading={saving} disabled={saving || !formData.name}>Save & Deploy</Button>
                        </View>
                    </ScrollView>
                </Modal>

                <Modal visible={facultyModalVisible} onDismiss={() => setFacultyModalVisible(false)} contentContainerStyle={[styles.modalCard, { backgroundColor: t('#ffffff', '#1e1e1e') }]}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text variant="titleLarge" style={{ fontWeight: '900', color: t('#2f333a', '#ffffff'), marginBottom: 20 }}>
                            {isAddingTeacher ? 'Add New Teacher' : 'Edit Teacher Profile'}
                        </Text>

                        {/* Teacher Info Fields */}
                        <TextInput
                            mode="outlined" label="Full Name"
                            value={teacherForm.full_name}
                            onChangeText={v => setTeacherForm(p => ({ ...p, full_name: v }))}
                            style={{ marginBottom: 12, backgroundColor: t('#ffffff', '#1e1e1e') }}
                            outlineColor={t('#e2e8f0', '#333')} activeOutlineColor="#6C5CE7"
                            textColor={t('black', 'white')}
                        />
                        <TextInput
                            mode="outlined" label="Email Address"
                            value={teacherForm.email}
                            onChangeText={v => setTeacherForm(p => ({ ...p, email: v }))}
                            keyboardType="email-address" autoCapitalize="none"
                            style={{ marginBottom: 12, backgroundColor: t('#ffffff', '#1e1e1e') }}
                            outlineColor={t('#e2e8f0', '#333')} activeOutlineColor="#6C5CE7"
                            textColor={t('black', 'white')}
                        />
                        <TextInput
                            mode="outlined" label="Department"
                            value={teacherForm.department}
                            onChangeText={v => setTeacherForm(p => ({ ...p, department: v }))}
                            placeholder="e.g. Computer Engineering"
                            style={{ marginBottom: 20, backgroundColor: t('#ffffff', '#1e1e1e') }}
                            outlineColor={t('#e2e8f0', '#333')} activeOutlineColor="#6C5CE7"
                            textColor={t('black', 'white')}
                        />

                        {/* Subject Checkboxes */}
                        <Text style={{ fontSize: 13, fontWeight: '800', color: t('#91939c', '#aeafb4'), letterSpacing: 0.5, marginBottom: 12 }}>ASSIGN SUBJECTS</Text>
                        <View style={{ gap: 10, marginBottom: 16 }}>
                            {dbSubjects.map((sub, idx) => {
                                const isChecked = selectedSubjects.includes(sub.name);
                                return (
                                    <TouchableOpacity
                                        key={sub.id || idx}
                                        onPress={() => {
                                            setSelectedSubjects(prev =>
                                                isChecked
                                                    ? prev.filter(s => s !== sub.name)
                                                    : [...prev, sub.name]
                                            );
                                        }}
                                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 14 }}
                                    >
                                        <View style={[styles.checkbox, { borderColor: isChecked ? sub.accent_color || '#3d637e' : t('#cbd5e1', '#334155'), backgroundColor: isChecked ? (sub.accent_color || '#3d637e') + '20' : 'transparent' }]}>
                                            {isChecked && <MaterialCommunityIcons name="check" size={16} color={sub.accent_color || '#3d637e'} />}
                                        </View>
                                        <View style={[styles.subjectIconWrap, { backgroundColor: (sub.accent_color || '#3d637e') + '20', width: 36, height: 36, borderRadius: 10 }]}>
                                            <MaterialCommunityIcons name={sub.icon || 'book'} size={18} color={sub.accent_color || '#3d637e'} />
                                        </View>
                                        <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: t('#2f333a', '#ffffff') }}>{sub.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Quick Add New Subject */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                            <TextInput
                                mode="outlined"
                                label="Add new subject..."
                                value={newSubjectName}
                                onChangeText={setNewSubjectName}
                                style={{ flex: 1, backgroundColor: t('#ffffff', '#1e1e1e') }}
                                outlineColor={t('#e2e8f0', '#333')}
                                activeOutlineColor="#00B894"
                                textColor={t('black', 'white')}
                                dense
                            />
                            <IconButton
                                icon="plus-circle"
                                iconColor="#00B894"
                                size={32}
                                disabled={!newSubjectName.trim()}
                                onPress={async () => {
                                    const name = newSubjectName.trim();
                                    if (!name) return;
                                    const { error } = await supabase.from('subjects').insert({ name, icon: 'book-outline', accent_color: '#3d637e', type: 'THEORY' });
                                    if (error) {
                                        alert('Error adding subject: ' + error.message);
                                    } else {
                                        setNewSubjectName('');
                                        setSelectedSubjects(prev => [...prev, name]);
                                        await fetchAdminData();
                                    }
                                }}
                            />
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <Button mode="outlined" style={{ flex: 1 }} onPress={() => setFacultyModalVisible(false)} textColor={t('#5b5f68', '#aeafb4')}>Cancel</Button>
                            <Button mode="contained" style={{ flex: 1 }} buttonColor="#6C5CE7" onPress={saveTeacherSubjects} loading={savingFaculty} disabled={savingFaculty}>
                                {isAddingTeacher ? 'Add Teacher' : 'Save Changes'}
                            </Button>
                        </View>
                        {!isAddingTeacher && selectedTeacher && (
                            <Button
                                mode="outlined"
                                style={{ marginTop: 12, borderColor: '#f44336' }}
                                textColor="#f44336"
                                icon="trash-can-outline"
                                onPress={() => deleteTeacher(selectedTeacher)}
                            >
                                Delete Teacher Profile
                            </Button>
                        )}
                    </ScrollView>
                </Modal>

                <Modal visible={studentModalVisible} onDismiss={() => setStudentModalVisible(false)} contentContainerStyle={[styles.modalCard, { backgroundColor: t('#ffffff', '#1e1e1e') }]}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text variant="titleLarge" style={{ fontWeight: '900', color: t('#2f333a', '#ffffff'), marginBottom: 20 }}>
                            {isAddingStudent ? 'Enroll New Student' : 'Edit Student Profile'}
                        </Text>

                        <TextInput mode="outlined" label="Roll Number" value={studentForm.roll_no} onChangeText={v => setStudentForm(p => ({ ...p, roll_no: v }))} keyboardType="numeric" style={{ marginBottom: 12, backgroundColor: t('#ffffff', '#1e1e1e') }} outlineColor={t('#e2e8f0', '#333')} activeOutlineColor="#00B894" textColor={t('black', 'white')} />
                        <TextInput mode="outlined" label="Full Name" value={studentForm.name} onChangeText={v => setStudentForm(p => ({ ...p, name: v }))} style={{ marginBottom: 12, backgroundColor: t('#ffffff', '#1e1e1e') }} outlineColor={t('#e2e8f0', '#333')} activeOutlineColor="#00B894" textColor={t('black', 'white')} />
                        <TextInput mode="outlined" label="Email Address" value={studentForm.email} onChangeText={v => setStudentForm(p => ({ ...p, email: v }))} keyboardType="email-address" autoCapitalize="none" style={{ marginBottom: 12, backgroundColor: t('#ffffff', '#1e1e1e') }} outlineColor={t('#e2e8f0', '#333')} activeOutlineColor="#00B894" textColor={t('black', 'white')} />
                        <TextInput mode="outlined" label="Branch / Division" value={studentForm.branch} placeholder="e.g. COMP-A" onChangeText={v => setStudentForm(p => ({ ...p, branch: v }))} style={{ marginBottom: 20, backgroundColor: t('#ffffff', '#1e1e1e') }} outlineColor={t('#e2e8f0', '#333')} activeOutlineColor="#00B894" textColor={t('black', 'white')} />

                        <Text style={{ fontSize: 13, fontWeight: '800', color: t('#91939c', '#aeafb4'), letterSpacing: 0.5, marginBottom: 12 }}>ASSIGN BATCH (FOR LABS)</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 30 }}>
                            {['B1', 'B2', 'B3'].map(b => (
                                <TouchableOpacity
                                    key={b}
                                    onPress={() => setStudentForm(p => ({ ...p, batch: b }))}
                                    style={[
                                        styles.batchChip,
                                        { backgroundColor: studentForm.batch === b ? '#00B894' : t('#f1f5f9', '#1e1e1e'), borderColor: studentForm.batch === b ? '#00B894' : t('#e2e8f0', '#333') }
                                    ]}
                                >
                                    <Text style={{ color: studentForm.batch === b ? 'white' : t('#5b5f68', '#aeafb4'), fontWeight: '800' }}>{b}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <Button mode="outlined" style={{ flex: 1 }} onPress={() => setStudentModalVisible(false)} textColor={t('#5b5f68', '#aeafb4')}>Cancel</Button>
                            <Button mode="contained" style={{ flex: 1 }} buttonColor="#00B894" onPress={saveStudentProfile} loading={savingStudent} disabled={savingStudent || !studentForm.name || !studentForm.roll_no}>
                                {isAddingStudent ? 'Enroll' : 'Save Changes'}
                            </Button>
                        </View>
                        {!isAddingStudent && selectedStudent && (
                            <Button mode="outlined" style={{ marginTop: 12, borderColor: '#f44336' }} textColor="#f44336" icon="trash-can-outline" onPress={() => deleteStudentProfile(selectedStudent)}>
                                Delete Student
                            </Button>
                        )}
                    </ScrollView>
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    container: { flexGrow: 1, padding: 24 },
    sectionTitle: { fontWeight: '900', marginBottom: 20 },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 30,
    },
    gridCard: {
        flex: 1,
        flexBasis: 160,
        minWidth: 160,
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        alignItems: 'flex-start',
    },
    chartCard: {
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    iconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    gridValue: {
        fontSize: 28,
        fontWeight: '900',
        color: '#ffffff',
        marginBottom: 4,
    },
    gridLabel: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    logCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingLeft: 0,
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
    logIndicator: {
        width: 6,
        height: '100%',
        marginRight: 10,
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
    },
    navItem: { alignItems: 'center', justifyContent: 'center' },
    navIconContainer: {
        width: 48,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    navLabel: { fontSize: 11 },
    subjectCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    subjectIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        padding: 24,
        margin: 20,
        borderRadius: 24,
        maxHeight: '90%',
    },
    modalInput: {
        marginBottom: 16,
        backgroundColor: 'transparent',
    },
    labelSection: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 12,
        marginTop: 8,
    },
    colorChip: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconChip: {
        width: 50,
        height: 50,
        borderRadius: 16,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    batchChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 70,
    }
});
