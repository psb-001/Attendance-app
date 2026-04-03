# Debug: Email Change Fails

## Objective
Investigate issue: email-change-fails
**Summary:** User inputs a new email, receives a verification link at the new email, clicks it, but the email doesn't change in the app.

## Symptoms
**Expected:** The account email updates successfully after clicking the verification link.
**Actual:** Nothing happens after clicking the verification link; the profile email does not update.
**Errors:** No errors thrown (API call silently returns success, but the change remains "pending").
**Reproduction:** Enter new email -> receive verification -> click link -> email remains unchanged.

## Investigation & Root Cause
After reviewing `app/profile.js`:
```javascript
const { error } = await supabase.auth.updateUser({ email: newEmail });
```

This is proper usage of the Supabase API. However, the exact behavior described ("gets the msg of the change email like verification, but after clicking it, nothing happens") is the classic hallmark of Supabase's **Secure Email Change** policy.

By default, Supabase requires **Double Confirmation** for email changes. This means:
1. It sends a confirmation link to the **NEW** email address.
2. It ALSO sends a confirmation link to the **OLD** (current) email address.

**The email will NOT actually change in the database until BOTH links have been clicked.** Since you are only checking and clicking the link sent to the *new* email address, the change remains stuck in a "pending" state.

## Resolution
You have two ways to fix this:

### Option 1: Disable Double Confirmation (Recommended if this is annoying)
1. Go to your **Supabase Dashboard**.
2. Navigate to **Authentication > Providers > Email**.
3. Scroll down and look for **Secure email change** (or "Double confirm email changes").
4. **Turn it OFF**. 
When this is turned off, the user will only need to click the link in their *new* email address, and the update will happen instantly.

### Option 2: Inform the User
If you want to keep the security feature on, you must update the UI alert in `app/profile.js` to tell the user to check BOTH inboxes:
```javascript
Alert.alert(
    "Verification Sent",
    "Please check BOTH your old and new email inboxes. You must click the confirmation links in both emails to authorize the change.",
    [{ text: "OK", onPress: () => setIsEditingEmail(false) }]
);
```
