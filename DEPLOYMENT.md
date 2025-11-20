# Publishing OTA Updates - Guide

This guide explains how to publish updates to your attendance app without requiring users to reinstall.

## Prerequisites

1. **Create an Expo account** at https://expo.dev
2. **Install EAS CLI**: `npm install -g eas-cli`
3. **Login**: `eas login`

## Initial Setup (One-time)

### 1. Configure EAS Updates

Run the following command in your project directory:
```bash
eas update:configure
```

This will:
- Create an `eas.json` file
- Link your project to Expo
- Configure update channels

### 2. Build Production App

For Android:
```bash
eas build --platform android --profile production
```

For iOS:
```bash
eas build --platform ios --profile production
```

This creates an APK/IPA file that you can distribute to users.

## Publishing Updates

After making changes to your code (JavaScript, styles, etc.):

```bash
eas update --branch production --message "Fixed attendance bug"
```

**That's it!** Users will get the update automatically next time they open the app.

## Update Workflow

1. **Make code changes** in your app
2. **Test locally** with `npx expo start`
3. **Publish update**: `eas update --branch production --message "Your update description"`
4. **Users receive update** automatically on next app open

## Important Notes

> **What updates via OTA:**
> - JavaScript code changes
> - React component updates
> - Image/asset changes
> - Configuration changes

> **What requires a new build:**
> - Native module changes
> - app.json native configuration
> - New dependencies with native code

## Monitoring Updates

View update status at: https://expo.dev/accounts/[your-account]/projects/attendance-app/updates

## Troubleshooting

**Updates not appearing?**
1. Make sure you're using a production build (not Expo Go)
2. Check the app was built with the correct update channel
3. Verify the update was published successfully at expo.dev

**How to test before deploying?**
1. Create a preview branch: `eas update --branch preview`
2. Build a test version that uses the preview channel
3. Test the update
4. If all good, publish to production
