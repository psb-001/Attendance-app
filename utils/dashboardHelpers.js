/**
 * Shared utility functions used by both Student and Teacher dashboards.
 * Centralised here to eliminate duplication.
 */

export const generateMonthDays = (currentDate) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    for (let i = 1; i <= daysInMonth; i++) {
        const dateObj = new Date(year, month, i);
        days.push({
            id: i,
            day: weekdays[dateObj.getDay()],       // used by teacher
            dayName: weekdays[dateObj.getDay()],    // used by student
            date: i.toString()
        });
    }
    return days;
};

export const getGreeting = (currentTime = new Date()) => {
    const hrs = currentTime.getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 17) return 'Good Afternoon';
    return 'Good Evening';
};

export const formatDate = (dateStr) => {
    if (!dateStr) return 'Today';
    try {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        return dateObj.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    } catch (e) {
        return dateStr;
    }
};

export const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
};

export const SUBJECT_META = {
    'Mathematics 2': { icon: 'calculator-variant', category: 'THEORY', accent: '#6C5CE7' },
    'Chemistry': { icon: 'flask-outline', category: 'THEORY', accent: '#00B894' },
    'Engineering mechanics': { icon: 'cog-outline', category: 'THEORY', accent: '#E17055' },
    'PPS': { icon: 'code-tags', category: 'THEORY', accent: '#0984E3' },
    'Communication skills': { icon: 'microphone-outline', category: 'THEORY', accent: '#FDCB6E' },
    'Engineering mechanics lab': { icon: 'cog-outline', category: 'PRACTICAL', accent: '#E17055' },
    'Communication skills lab': { icon: 'microphone-variant', category: 'PRACTICAL', accent: '#FDCB6E' },
    'Chemistry lab': { icon: 'flask', category: 'PRACTICAL', accent: '#00B894' },
    'Mathematics 2 lab': { icon: 'calculator-variant', category: 'PRACTICAL', accent: '#6C5CE7' },
    'PPS lab': { icon: 'code-tags-check', category: 'PRACTICAL', accent: '#0984E3' },
    'workshop lab': { icon: 'hammer-wrench', category: 'PRACTICAL', accent: '#E84393' },
};
