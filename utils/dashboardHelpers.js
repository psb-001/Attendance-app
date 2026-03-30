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

export const getGreeting = (currentTime) => {
    const hrs = currentTime.getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 17) return 'Good Afternoon';
    return 'Good Evening';
};

export const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
};
