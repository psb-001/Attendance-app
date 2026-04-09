-- 🚨 ZOMBIE TRIGGER ASSASSIN 🚨
-- This script hunts down and destroys any old, broken triggers 
-- attached to your Authentication system that are causing crashes.

DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' 
        AND event_object_table = 'users'
        AND trigger_name != 'on_auth_user_created'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users;', trigger_record.trigger_name);
    END LOOP;
END $$;
