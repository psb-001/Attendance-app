import React, { useState, useEffect, useContext, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Surface, Button, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { ThemeContext } from '../context/ThemeContext';
import EmptyState from './EmptyState';
import CalendarStrip from './CalendarStrip';
import { generateMonthDays } from '../utils/dashboardHelpers';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';

export default function TeacherReportsTab({ profile }) {
    const router = useRouter();
    const { isDark } = useContext(ThemeContext);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [logs, setLogs] = useState([]);
    const [selectedDateStr, setSelectedDateStr] = useState(new Date().getDate().toString());
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [classDetails, setClassDetails] = useState([]);
    
    const monthDays = useMemo(() => generateMonthDays(calendarDate), [calendarDate.getMonth(), calendarDate.getFullYear()]);
    const t = (light, dark) => isDark ? dark : light;

    const fetchLogsForDate = async () => {
        setLoading(true);
        setError(null);
        setSelectedClass(null);
        
        const year = calendarDate.getFullYear();
        const month = String(calendarDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDateStr).padStart(2, '0');
        const queryDate = `${year}-${month}-${day}`;

        try {
            // Fetch logs. If teacher has a branch assigned, filter by it.
            let query = supabase
                .from('attendance_logs')
                .select('subject, branch, roll_no, status')
                .eq('date', queryDate);
            
            if (profile?.branch) {
                query = query.eq('branch', profile.branch);
            }
            
            // NOTE: A more secure query would filter by classes THIS teacher actually teaches,
            // but for now we'll fetch logs for the branch they are associated with.

            const { data, error: sbError } = await query;
            if (sbError) throw sbError;
            
            // Group the logs by subject/branch/batch
            const grouped = {};
            data.forEach(log => {
                const key = `${log.branch}_${log.subject}${log.batch ? '_' + log.batch : ''}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        id: key,
                        branch: log.branch,
                        subject: log.subject,
                        batch: log.batch,
                        present: 0,
                        total: 0,
                        students: []
                    };
                }
                grouped[key].total += 1;
                if (log.status === 1) grouped[key].present += 1;
                grouped[key].students.push(log);
            });
            
            setLogs(Object.values(grouped));
        } catch (err) {
            console.error("Fetch reports error:", err);
            setError("Failed to load attendance records.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogsForDate();
    }, [selectedDateStr, calendarDate]);

    const handleNextMonth = () => {
        const newDate = new Date(calendarDate);
        newDate.setMonth(newDate.getMonth() + 1);
        newDate.setDate(1);
        setCalendarDate(newDate);
        setSelectedDateStr('1');
    };

    const handlePrevMonth = () => {
        const newDate = new Date(calendarDate);
        newDate.setMonth(newDate.getMonth() - 1);
        newDate.setDate(1);
        setCalendarDate(newDate);
        setSelectedDateStr('1');
    };
    


    const generatePDF = async (classData) => {
        try {
            const year = calendarDate.getFullYear();
            const month = String(calendarDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDateStr).padStart(2, '0');
            const date = `${year}-${month}-${day}`;
            
            const htmlContent = `
                <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
                        h1 { color: #3d637e; text-align: center; }
                        .info { margin-bottom: 20px; font-size: 14px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                        th { background-color: #f2f3fa; color: #3d637e; }
                        .present { color: #4caf50; font-weight: bold; }
                        .absent { color: #f44336; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h1>Attendance Report</h1>
                    <div class="info">
                        <p><strong>Date:</strong> ${date}</p>
                        <p><strong>Subject:</strong> ${classData.subject}</p>
                        <p><strong>Branch:</strong> ${classData.branch}</p>
                        ${classData.batch ? `<p><strong>Batch:</strong> ${classData.batch}</p>` : ''}
                        <p><strong>Summary:</strong> ${classData.present} / ${classData.total} Present</p>
                    </div>
                    <table>
                        <tr>
                            <th>Roll Number</th>
                            <th>Status</th>
                        </tr>
                        ${classData.students.sort((a,b) => parseInt(a.roll_no) - parseInt(b.roll_no)).map(s => `
                            <tr>
                                <td>${s.roll_no}</td>
                                <td class="${s.status === 1 ? 'present' : 'absent'}">${s.status === 1 ? 'Present' : 'Absent'}</td>
                            </tr>
                        `).join('')}
                    </table>
                </body>
                </html>
            `;
            
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error("PDF generation error: ", error);
        }
    };

    const renderClassItem = ({ item }) => {
        const pct = Math.round((item.present / item.total) * 100);
        return (
            <TouchableOpacity 
                style={[styles.classCard, { backgroundColor: t('#ffffff', '#1e1e1e'), borderColor: t('#e2e8f0', '#333') }]}
                onPress={() => setSelectedClass(item)}
            >
                <View style={styles.classInfo}>
                    <Text style={[styles.classSubject, { color: t('#1a1a2e', '#ffffff') }]}>{item.subject}</Text>
                    <Text style={{ color: t('#64748b', '#94a3b8'), fontSize: 12, marginTop: 4 }}>
                        {item.branch} {item.batch ? `• Batch ${item.batch}` : ''}
                    </Text>
                </View>
                <View style={styles.classMetrics}>
                    <Text style={[styles.pctText, { color: pct >= 75 ? '#4caf50' : '#f44336' }]}>{pct}%</Text>
                    <Text style={{ fontSize: 10, color: t('#94a3b8', '#64748b') }}>{item.present}/{item.total} P</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={t('#94a3b8', '#64748b')} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
        );
    };

    const handleEditClass = () => {
        const year = calendarDate.getFullYear();
        const month = String(calendarDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDateStr).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        
        router.push({
            pathname: '/attendance',
            params: {
                subject: selectedClass.subject,
                date: formattedDate,
                branch: selectedClass.branch,
                batch: selectedClass.batch || ''
            }
        });
    };

    if (selectedClass) {
        return (
            <View style={{ flex: 1, paddingBottom: 20 }}>
                <TouchableOpacity style={styles.backButton} onPress={() => setSelectedClass(null)}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={t('#3d637e', '#ffffff')} />
                    <Text style={{ marginLeft: 8, color: t('#3d637e', '#ffffff'), fontWeight: 'bold' }}>Back to Reports</Text>
                </TouchableOpacity>

                <View style={[styles.detailHeader, { backgroundColor: t('#ffffff', '#1e1e1e') }]}>
                    <Text variant="titleLarge" style={{ fontWeight: 'bold', color: t('#1a1a2e', '#ffffff') }}>{selectedClass.subject}</Text>
                    <Text style={{ color: t('#64748b', '#94a3b8'), marginTop: 4 }}>{selectedClass.branch} {selectedClass.batch ? `• Batch ${selectedClass.batch}` : ''}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                        <Text style={{ fontWeight: 'bold', color: t('#1a1a2e', '#ffffff') }}>
                            {selectedClass.present} of {selectedClass.total} Present
                        </Text>
                    </View>
                    <View style={{ gap: 10, marginTop: 16 }}>
                        <Button mode="outlined" icon="pencil" onPress={handleEditClass} style={{ width: '100%' }} textColor="#3d637e">Edit Past Data</Button>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Button mode="contained" icon="file-pdf-box" onPress={() => generatePDF(selectedClass)} style={{ flex: 1 }} buttonColor="#e53935">Export PDF Report</Button>
                        </View>
                    </View>
                </View>

                {error && <Text style={{ color: 'red', marginBottom: 16 }}>{error}</Text>}

                <Text style={{ fontWeight: 'bold', marginBottom: 12, color: t('#1a1a2e', '#ffffff') }}>Student Roll Call List (Read Only)</Text>
                <View style={[styles.studentList, { backgroundColor: t('#ffffff', '#1e1e1e') }]}>
                    {selectedClass.students.sort((a,b) => parseInt(a.roll_no) - parseInt(b.roll_no)).map((s, idx) => (
                        <View key={idx} style={[styles.studentRow, { borderBottomColor: t('#f1f5f9', '#333'), borderBottomWidth: idx < selectedClass.students.length - 1 ? 1 : 0 }]}>
                            <Text style={{ fontWeight: '600', color: t('#1a1a2e', '#ffffff') }}>Roll No {s.roll_no}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: s.status === 1 ? t('#e8f5e9', 'rgba(76,175,80,0.1)') : t('#ffebee', 'rgba(244,67,54,0.1)') }]}>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: s.status === 1 ? '#4caf50' : '#f44336' }}>
                                    {s.status === 1 ? 'Present' : 'Absent'}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text variant="headlineSmall" style={[styles.sectionTitle, { color: t('#2f333a', '#ffffff') }]}>Daily Reports</Text>
            <Text style={[styles.sectionSub, { color: t('#91939c', '#aeafb4'), marginBottom: 20 }]}>Review logs and export attendance data</Text>
            
            <CalendarStrip
                monthDays={monthDays}
                selectedDate={selectedDateStr}
                onSelectDate={setSelectedDateStr}
                calendarDate={calendarDate}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                showDatePicker={showDatePicker}
                onOpenDatePicker={() => setShowDatePicker(true)}
                onDatePickerChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) {
                        setCalendarDate(date);
                        setSelectedDateStr(date.getDate().toString());
                    }
                }}
            />

            <View style={{ marginTop: 20 }}>
                {loading ? (
                    <ActivityIndicator size="large" color="#3d637e" style={{ marginTop: 40 }} />
                ) : logs.length > 0 ? (
                    <View style={styles.listContainer}>
                        {logs.map((item, index) => (
                            <React.Fragment key={item.id}>
                                {renderClassItem({ item })}
                            </React.Fragment>
                        ))}
                    </View>
                ) : (
                    <EmptyState 
                        icon="file-document-outline" 
                        message="No Reports for this Date" 
                        subMessage="Attendance was not marked on this day." 
                        style={{ marginTop: 40 }}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 12,
        paddingBottom: 40,
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
    listContainer: {
        gap: 12,
    },
    classCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    classInfo: {
        flex: 1,
    },
    classSubject: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    classMetrics: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    pctText: {
        fontSize: 18,
        fontWeight: '900',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        marginTop: 10,
    },
    detailHeader: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    studentList: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 100,
    },
    studentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    }
});
