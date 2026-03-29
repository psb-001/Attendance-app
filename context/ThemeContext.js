import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

export const ThemeContext = createContext({
    isDark: false,
    toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

    // Automatically sync with system theme initially and when it changes
    useEffect(() => {
        if (systemColorScheme) {
            setIsDark(systemColorScheme === 'dark');
        }
    }, [systemColorScheme]);

    const toggleTheme = () => setIsDark(prev => !prev);

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
