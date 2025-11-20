import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';

const SUBJECTS = ['BEEE', 'M1', 'BCME', 'EG', 'PHY', 'DT', 'IKS', 'PD'];

export default function HomeScreen() {
    const router = useRouter();

    const handleSubjectSelect = (subject) => {
        router.push({
            pathname: '/division',
            params: { subject }
        });
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Image
                source={require('../assets/college-header.png')}
                style={styles.headerImage}
                resizeMode="contain"
            />

            <View style={styles.grid}>
                {SUBJECTS.map((sub) => (
                    <Surface key={sub} style={styles.card} elevation={2} onTouchEnd={() => handleSubjectSelect(sub)}>
                        <Text variant="titleLarge" style={styles.cardText}>{sub}</Text>
                    </Surface>
                ))}
            </View>

            <View style={styles.footer}>
                <Text variant="bodySmall" style={styles.footerText}>
                    MES Mukunddas Lohia College of Engineering
                </Text>
                <Text variant="bodySmall" style={styles.footerText}>
                    Attendance Management System
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        minHeight: '100%',
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: 'white',
    },
    headerImage: {
        width: '100%',
        height: 100,
        marginBottom: 20,
        alignSelf: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    card: {
        width: '47%',
        aspectRatio: 1.3,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: 'white',
        marginBottom: 12,
    },
    cardText: {
        fontWeight: 'bold',
        color: '#333',
    },
    footer: {
        marginTop: 20,
        paddingTop: 15,
        paddingBottom: 5,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    footerText: {
        color: '#666',
        textAlign: 'center',
        fontSize: 11,
        marginVertical: 1,
    }
});
