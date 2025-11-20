import { Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import UpdateChecker from '../components/UpdateChecker';

const theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: '#003366', // Dark Blue from user image
        secondary: '#03dac6',
        secondaryContainer: '#d1e4ff', // Light blue for selected state
        onSecondaryContainer: '#003366', // Dark blue text for selected state
    },
};

export default function Layout() {
    return (
        <SafeAreaProvider>
            <PaperProvider theme={theme}>
                <UpdateChecker />
                <Stack
                    screenOptions={{
                        headerStyle: {
                            backgroundColor: theme.colors.primary,
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                        headerTitleAlign: 'center',
                    }}
                >
                    <Stack.Screen name="index" options={{ title: 'Attendance App' }} />
                    <Stack.Screen name="division" options={{ title: 'Select Details' }} />
                    <Stack.Screen name="attendance" options={{ title: 'Mark Attendance' }} />
                    <Stack.Screen name="summary" options={{ title: 'Summary' }} />
                </Stack>
                <StatusBar style="light" />
            </PaperProvider>
        </SafeAreaProvider>
    );
}
