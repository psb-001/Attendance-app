export const submitAttendance = async (url, data) => {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...data, action: data.action || 'submit' }),
        });

        const text = await response.text();
        console.log('API Response:', text);

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
        console.error('Error submitting attendance:', error);
        throw error;
    }
};
