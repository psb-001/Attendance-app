export const submitAttendance = async (url, data) => {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                // Use text/plain to bypass CORS preflight restrictions on Google Apps Script
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ ...data, action: data.action || 'submit' }),
        });

        const text = await response.text();
        if (__DEV__) console.log('API Response:', text);

        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
        }

        if (result.status !== 'success') {
            throw new Error(result.message || 'Script returned error status');
        }

        return result;
    } catch (error) {
        if (__DEV__) console.warn('Background sync warning:', error.message);
        throw error;
    }
};
