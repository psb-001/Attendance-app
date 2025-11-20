import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, Text, SegmentedButtons, Surface } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function DivisionScreen() {
    const router = useRouter();
    const { subject } = useLocalSearchParams();
    const [date, setDate] = useState(new Date());
    const [division, setDivision] = useState('A');
    const [showDatePicker, setShowDatePicker] = useState(false);

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);
    };

    const handleNext = () => {
        router.push({
            pathname: '/attendance',
            params: {
                date: date.toISOString().split('T')[0],
                division,
                subject
            }
        });
    };

    return (
        <View style={styles.container}>
            <Surface style={styles.card} elevation={4}>
                <Text variant="headlineMedium" style={styles.title}>Details for {subject}</Text>

                <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.label}>Select Date</Text>
                    {Platform.OS === 'web' ? (
                        <input
                            type="date"
                            value={date.toISOString().split('T')[0]}
                            onChange={(e) => setDate(new Date(e.target.value))}
                            style={styles.webInput}
                        />
                    ) : (
                        <>
                            <Button mode="outlined" onPress={() => setShowDatePicker(true)} contentStyle={{ paddingVertical: 5 }}>
                                {date.toLocaleDateString('en-GB')}
                            </Button>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display="default"
                                    onChange={onDateChange}
                                />
                            )}
                        </>
                    )}
                </View>

                <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.label}>Select Division</Text>
                    <SegmentedButtons
                        value={division}
                        onValueChange={setDivision}
                        buttons={[
                            { value: 'A', label: 'Div A' },
                            { value: 'B', label: 'Div B' },
                            { value: 'C', label: 'Div C' },
                        ]}
                    />
                </View>

                <Button mode="contained" onPress={handleNext} style={styles.button}>
                    Next
                </Button>
            </Surface>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    card: {
        padding: 20,
        borderRadius: 10,
        backgroundColor: 'white',
    },
    title: {
        textAlign: 'center',
        marginBottom: 30,
        fontWeight: 'bold',
        color: '#003366',
    },
    section: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 10,
    },
    button: {
        marginTop: 10,
        paddingVertical: 5,
    },
    webInput: {
        padding: 12,
        fontSize: 16,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#79747e', // Material outline color
        width: '100%',
        backgroundColor: 'white',
        height: 50, // Match Paper input height
    },
});
