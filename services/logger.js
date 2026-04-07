import { supabase } from '../lib/supabase';

/**
 * Wraps an async database invocation to measure latency and log the outcome.
 * 
 * @param {string} actionName - The description of the action (e.g. 'Submit Attendance').
 * @param {Function} asyncFunction - The async database call to measure and execute.
 * @returns {Promise<any>} - Returns the result of the async function.
 */
export const withLogging = async (actionName, asyncFunction) => {
    const startTime = Date.now();
    let result = null;
    let eventType = 'SUCCESS';
    let logMessage = 'Completed successfully';

    try {
        result = await asyncFunction();
    } catch (error) {
        eventType = 'ERROR';
        logMessage = error.message || 'Unknown error occurred';
        throw error; // Re-throw so the app can still handle the error
    } finally {
        const latencyMs = Date.now() - startTime;
        
        // Log to Supabase in the background (don't block the UI thread)
        supabase.auth.getSession().then(({ data: { session } }) => {
            supabase.from('system_logs').insert([{
                event_type: eventType,
                action_name: actionName,
                message: logMessage,
                user_id: session?.user?.id || null,
                latency_ms: latencyMs
            }]).then(({ error }) => {
                if (error && __DEV__) {
                    console.error('Failed to write system log:', error);
                }
            });
        });
    }

    return result;
};

/**
 * Utility to manually log an event (e.g. Navigation warnings, auth events)
 * @param {'SUCCESS'|'ERROR'|'WARN'|'INFO'} eventType 
 * @param {string} actionName 
 * @param {string} message 
 */
export const logEvent = async (eventType, actionName, message) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        await supabase.from('system_logs').insert([{
            event_type: eventType,
            action_name: actionName,
            message: message,
            user_id: session?.user?.id || null,
            latency_ms: 0
        }]);
    } catch (error) {
        if (__DEV__) console.error('Failed to log event:', error);
    }
};
