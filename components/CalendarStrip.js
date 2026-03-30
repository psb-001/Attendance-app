import React, { useContext, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';

/**
 * Shared Calendar Strip used by both Teacher and Student dashboards.
 * Props:
 *   - monthDays: array of { id, day/dayName, date }
 *   - selectedDate: string
 *   - onSelectDate: (dateStr) => void
 *   - calendarDate: Date
 *   - onPrevMonth: () => void
 *   - onNextMonth: () => void
 *   - showDatePicker: boolean
 *   - onOpenDatePicker: () => void
 *   - onDatePickerChange: (event, date) => void
 */
export default function CalendarStrip({
    monthDays,
    selectedDate,
    onSelectDate,
    calendarDate,
    onPrevMonth,
    onNextMonth,
    showDatePicker,
    onOpenDatePicker,
    onDatePickerChange,
}) {
    const { isDark } = useContext(ThemeContext);
    const t = (light, dark) => isDark ? dark : light;
    const flatListRef = useRef(null);

    const renderCalendarItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.calendarDay,
                { backgroundColor: t('#f2f3fa', '#1e1e1e') },
                item.date === selectedDate && styles.activeDay
            ]}
            onPress={() => onSelectDate(item.date)}
        >
            <Text style={[styles.dayText, item.date === selectedDate && styles.activeDayText]}>
                {item.day || item.dayName}
            </Text>
            <Text style={[styles.dateText, { color: t('#2f333a', '#ffffff') }, item.date === selectedDate && styles.activeDayText]}>
                {item.date}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.calendarContainer, { backgroundColor: t('#ffffff', '#1e1e1e') }]}>
            <View style={styles.calendarControls}>
                <TouchableOpacity style={styles.calendarMonthSelector} onPress={onOpenDatePicker}>
                    <MaterialCommunityIcons name="calendar-month-outline" size={20} color={t('#2f333a', '#ffffff')} style={{ marginRight: 8 }} />
                    <Text style={[styles.calendarMonthText, { color: t('#2f333a', '#ffffff') }]}>
                        {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={t('#2f333a', '#ffffff')} style={{ marginLeft: 4 }} />
                </TouchableOpacity>

                <View style={styles.calendarArrows}>
                    <TouchableOpacity onPress={onPrevMonth} style={styles.calendarArrowBtn}>
                        <MaterialCommunityIcons name="chevron-left" size={24} color={t('#2f333a', '#ffffff')} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onNextMonth} style={[styles.calendarArrowBtn, { marginLeft: 16 }]}>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={t('#2f333a', '#ffffff')} />
                    </TouchableOpacity>
                </View>
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={calendarDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDatePickerChange}
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
    );
}

const styles = StyleSheet.create({
    calendarContainer: {
        marginBottom: 40,
        padding: 16,
        borderRadius: 24,
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
});
