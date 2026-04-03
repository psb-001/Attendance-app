import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Text, Surface, Portal, Modal, TextInput, Button, IconButton } from 'react-native-paper';
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
    const [recentLogs, setRecentLogs] = useState([]);
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
                    console.log('Realtime log detected!', payload);
                    fetchAdminData(); // Instantly refresh the stats and live traffic!
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                (payload) => {
                    console.log('Realtime profile detected!', payload);
                    fetchAdminData(); // Instantly refresh user counts!
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

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            if (profileError || profileData?.role !== 'admin') {
                console.log("Admin Dashboard: User is not an admin, redirecting...", profileError?.message);
                router.replace('/');
                return;
            }

            setProfile(profileData);
            await fetchAdminData();
        } catch (err) {
            console.error("Admin auth failed:", err);
            router.replace('/login');
        } finally {
            setLoading(false);
        }
    };

    const fetchAdminData = async () => {
        const startTime = Date.now();
        
        // Fetch Users (profiles table has no created_at — order by role instead)
        const { data: users, error: usersError } = await supabase.from('profiles').select('*').order('role');
        console.log('Admin users fetch:', users?.length, 'rows. Error:', usersError?.message);
        if (users) setAllUsers(users);

        // Fetch Subjects
        const { data: subjects } = await supabase.from('subjects').select('*').order('name');
        if (subjects) setDbSubjects(subjects);

        // Fetch Logs Count (for analytics)
        const { count: logCount } = await supabase.from('attendance_logs').select('*', { count: 'exact', head: true });

        // Fetch Recent 5 Logs
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

        setStats({
            users: users?.length || 0,
            teachers: users?.filter(u => u.role === 'teacher').length || 0,
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

        if (isAddingTeacher) {
            // INSERT a new teacher profile row
            const { error } = await supabase.from('profiles').insert({
                id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
                full_name: teacherForm.full_name,
                email: teacherForm.email,
                department: teacherForm.department,
                role: 'teacher',
                subjects: selectedSubjects,
            });
            if (error) alert('Error adding teacher: ' + error.message);
            else { setFacultyModalVisible(false); fetchAdminData(); }
        } else {
            // UPDATE existing teacher profile
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: teacherForm.full_name || selectedTeacher.full_name,
                    email: teacherForm.email || selectedTeacher.email,
                    department: teacherForm.department || selectedTeacher.department,
                    subjects: selectedSubjects
                })
                .eq('id', selectedTeacher.id);
            if (error) alert('Error saving: ' + error.message);
            else { setFacultyModalVisible(false); fetchAdminData(); }
        }
        setSavingFaculty(false);
    };

    const deleteTeacher = (teacher) => {
        Alert.alert(
            'Delete Teacher',
            `Remove "${teacher.full_name || teacher.email || 'Unnamed Teacher'}" from the system? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: async () => {
                    const { error } = await supabase.from('profiles').delete().eq('id', teacher.id);
                    if (error) alert('Error: ' + error.message);
                    else { setFacultyModalVisible(false); fetchAdminData(); }
                }}
            ]
        );
    };

    const deleteSubject = (sub) => {
        Alert.alert(
            'Delete Subject',
            `Remove "${sub.name}" from the curriculum? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: async () => {
                    const { error } = await supabase.from('subjects').delete().eq('id', sub.id);
                    if (error) alert('Error: ' + error.message);
                    else fetchAdminData();
                }}
            ]
        );
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
                roleTitle="ADMIN DASHBOARD"
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

                        <Text variant="titleLarge" style={[styles.sectionTitle, { color: t('#2f333a', '#ffffff'), marginTop: 30 }]}>Live Traffic</Text>
                        
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
                            {allUsers.filter(u => u.role === 'teacher').map((teacher, idx) => (
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
                                            <Text style={{ fontSize: 16, fontWeight: '800', color: t('#2f333a', '#ffffff') }}>{teacher.full_name || 'Unnamed Teacher'}</Text>
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
                            {allUsers.filter(u => u.role === 'teacher').length === 0 && (
                                <Text style={{ color: t('#91939c', '#aeafb4'), textAlign: 'center', marginTop: 20 }}>No teachers registered yet.</Text>
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
                                        <TouchableOpacity
                                            onPress={(e) => { e.stopPropagation?.(); deleteSubject(sub); }}
                                            style={{ padding: 8 }}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        >
                                            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#f44336" />
                                        </TouchableOpacity>
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
                    { key: 'users', icon: 'account-group-outline', label: 'Users' },
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
                            onChangeText={text => setFormData({...formData, name: text})}
                            mode="outlined"
                            style={styles.modalInput}
                            outlineColor={t('#e2e8f0', '#333')}
                            activeOutlineColor="#3d637e"
                            textColor={t('black', 'white')}
                        />

                        <TextInput
                            label="Google Drive Resource URL"
                            value={formData.resource_url}
                            onChangeText={text => setFormData({...formData, resource_url: text})}
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
                                        onPress={() => setFormData({...formData, accent_color: color})}
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
                                        onPress={() => setFormData({...formData, icon: icon})}
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
                            onChangeText={v => setTeacherForm(p => ({...p, full_name: v}))}
                            style={{ marginBottom: 12, backgroundColor: t('#ffffff', '#1e1e1e') }}
                            outlineColor={t('#e2e8f0', '#333')} activeOutlineColor="#6C5CE7"
                        />
                        <TextInput
                            mode="outlined" label="Email Address"
                            value={teacherForm.email}
                            onChangeText={v => setTeacherForm(p => ({...p, email: v}))}
                            keyboardType="email-address" autoCapitalize="none"
                            style={{ marginBottom: 12, backgroundColor: t('#ffffff', '#1e1e1e') }}
                            outlineColor={t('#e2e8f0', '#333')} activeOutlineColor="#6C5CE7"
                        />
                        <TextInput
                            mode="outlined" label="Department"
                            value={teacherForm.department}
                            onChangeText={v => setTeacherForm(p => ({...p, department: v}))}
                            placeholder="e.g. Computer Engineering"
                            style={{ marginBottom: 20, backgroundColor: t('#ffffff', '#1e1e1e') }}
                            outlineColor={t('#e2e8f0', '#333')} activeOutlineColor="#6C5CE7"
                        />

                        {/* Subject Checkboxes */}
                        <Text style={{ fontSize: 13, fontWeight: '800', color: t('#91939c', '#aeafb4'), letterSpacing: 0.5, marginBottom: 12 }}>ASSIGN SUBJECTS</Text>
                        <View style={{ gap: 10, marginBottom: 24 }}>
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
        justifyContent: 'space-between',
        gap: 16,
    },
    gridCard: {
        width: '47%',
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        alignItems: 'flex-start',
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
    }
});
