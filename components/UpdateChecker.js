import React, { useEffect, useState } from 'react';
import * as Updates from 'expo-updates';
import { View, StyleSheet, Modal, Animated, Easing } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';

export default function UpdateChecker() {
    const [checking, setChecking] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [opacity] = useState(new Animated.Value(0));

    useEffect(() => {
        if (!__DEV__) {
            checkForUpdates();
        }
    }, []);

    useEffect(() => {
        if (checking || downloading) {
            Animated.timing(opacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
                easing: Easing.out(Easing.quad),
            }).start();
        } else {
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [checking, downloading]);

    const checkForUpdates = async () => {
        try {
            // Check if updates are actually enabled in this build
            if (!Updates.isEnabled) return;
            
            setChecking(true);
            const update = await Updates.checkForUpdateAsync();

            if (update.isAvailable) {
                await downloadAndApplyUpdate();
            }
        } catch (error) {
            console.log('Update Check (Silent):', error.message);
        } finally {
            // Short delay for smooth transition if checking was very fast
            setTimeout(() => setChecking(false), 800);
        }
    };

    const downloadAndApplyUpdate = async () => {
        try {
            setDownloading(true);
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
        } catch (error) {
            console.error('Update Download Error:', error);
            setDownloading(false);
        }
    };

    if (!checking && !downloading) return null;

    return (
        <Modal transparent visible animationType="none">
            <View style={styles.overlay}>
                <Animated.View style={[styles.container, { opacity }]}>
                    <View style={styles.glassCard}>
                        <View style={styles.accentBar} />
                        <ActivityIndicator 
                            animating={true} 
                            color="#3d637e" 
                            size={40} 
                            style={styles.spinner} 
                        />
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>
                                {downloading ? 'Refreshing Orion' : 'Initializing'}
                            </Text>
                            <Text style={styles.subtitle}>
                                {downloading 
                                    ? 'Installing the latest premium features...' 
                                    : 'Optimizing your academic experience...'}
                            </Text>
                        </View>
                        
                        <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBar, { width: downloading ? '70%' : '30%' }]} />
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '85%',
        maxWidth: 340,
    },
    glassCard: {
        backgroundColor: '#121212',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        overflow: 'hidden',
        elevation: 10,
    },
    accentBar: {
        position: 'absolute',
        top: 0,
        height: 4,
        width: '100%',
        backgroundColor: '#3d637e',
    },
    spinner: {
        marginBottom: 25,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        color: '#aaaaaa',
        textAlign: 'center',
        lineHeight: 20,
    },
    progressBarContainer: {
        height: 6,
        width: '100%',
        backgroundColor: '#222',
        borderRadius: 3,
        marginTop: 10,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#3d637e',
        borderRadius: 3,
    }
});
