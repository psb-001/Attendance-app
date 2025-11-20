import React, { useEffect, useState } from 'react';
import * as Updates from 'expo-updates';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator, Portal, Dialog, Button } from 'react-native-paper';

export default function UpdateChecker() {
    const [checking, setChecking] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [updateAvailable, setUpdateAvailable] = useState(false);

    useEffect(() => {
        checkForUpdates();
    }, []);

    const checkForUpdates = async () => {
        try {
            // Only check for updates in production builds
            if (!__DEV__) {
                setChecking(true);
                const update = await Updates.checkForUpdateAsync();

                if (update.isAvailable) {
                    setUpdateAvailable(true);
                    await downloadAndApplyUpdate();
                }
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
        } finally {
            setChecking(false);
        }
    };

    const downloadAndApplyUpdate = async () => {
        try {
            setDownloading(true);
            await Updates.fetchUpdateAsync();
            // Update will be applied on next app restart
            await Updates.reloadAsync();
        } catch (error) {
            console.error('Error downloading update:', error);
            setDownloading(false);
        }
    };

    if (!checking && !downloading) {
        return null;
    }

    return (
        <Portal>
            <Dialog visible={checking || downloading} dismissable={false}>
                <Dialog.Title>
                    {checking ? 'Checking for Updates...' : 'Downloading Update...'}
                </Dialog.Title>
                <Dialog.Content>
                    <View style={styles.content}>
                        <ActivityIndicator size="large" />
                        <Text style={styles.text}>
                            {checking
                                ? 'Please wait while we check for updates'
                                : 'Downloading the latest version...'}
                        </Text>
                    </View>
                </Dialog.Content>
            </Dialog>
        </Portal>
    );
}

const styles = StyleSheet.create({
    content: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    text: {
        marginTop: 15,
        textAlign: 'center',
    },
});
