# Technology Stack

**Analysis Date:** 2026-04-09

## Languages

**Primary:**
- JavaScript (ES modules) - App logic and UI in `app/*.js`, `components/*.js`, `services/*.js`, `lib/*.js`

**Secondary:**
- SQL - Operational and migration scripts in `*.sql`
- JSON - App/build configuration in `app.json`, `eas.json`, `package.json`

## Runtime

**Environment:**
- Node.js + Expo CLI toolchain (version not pinned in repo; constrained by `expo` package in `package.json`)
- React Native runtime (`react-native` `0.81.5`) on mobile targets

**Package Manager:**
- npm (lockfile-based installs)
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- Expo (`expo` `~54.0.33`) - mobile runtime, packaging, native module orchestration (`package.json`)
- React (`19.1.0`) + React Native (`0.81.5`) - rendering/runtime (`package.json`)
- Expo Router (`~6.0.23`) - file-based app navigation (`package.json`, `app/_layout.js`)

**Testing:**
- Not detected as an app-level test framework dependency (no Jest/Vitest config files; ad-hoc scripts present in `test_db.js`, `test_identity.js`)

**Build/Dev:**
- EAS Build profiles in `eas.json` (development/preview/production/prod-apk channels)
- Expo Updates (`expo-updates` `~29.0.16`) for OTA update mechanism (`package.json`, `app.json`)

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` (`^2.100.0`) - primary backend client for auth, data, and logging (`lib/supabase.js`, `app/*.js`, `services/*.js`)
- `@react-native-async-storage/async-storage` (`2.2.0`) - persistent local cache/session/offline behavior (`lib/supabase.js`, `services/storage.js`)
- `expo-router` (`~6.0.23`) - route entrypoint (`package.json` main) and guarded navigation (`app/_layout.js`)

**Infrastructure:**
- `expo-updates` (`~29.0.16`) - OTA channel runtime (`app.json`, `eas.json`)
- `expo-media-library`, `expo-print`, `expo-sharing` - report generation and export path on-device (`app.json`, `app/summary.js`, `components/TeacherReportsTab.js`)
- `react-native-url-polyfill` (`^3.0.0`) - networking compatibility required by Supabase (`lib/supabase.js`)

## Configuration

**Environment:**
- App metadata, permissions, runtime policy, and updates URL configured in `app.json`
- Build channels, autoIncrement behavior, and CLI requirement configured in `eas.json`
- Supabase endpoint/key currently hardcoded in `lib/supabase.js` (not environment-driven in runtime app path)
- Optional runtime config read from Supabase table `app_config` via `services/config.js` (e.g. `google_script_url` requested by `app/summary.js`)

**Build:**
- `app.json` controls native app config, Android package id, permissions, and updates behavior
- `eas.json` controls build profile behavior and production channel
- `package.json` scripts: `expo start`, `expo run:android`, `expo run:ios`, `expo start --web`

## Platform Requirements

**Development:**
- Expo-compatible Node/npm environment
- EAS CLI compatibility with `>= 16.27.0` (`eas.json`)
- Android/iOS toolchains for local native runs via `expo run:*`

**Production:**
- EAS-hosted updates endpoint configured (`app.json` `updates.url`)
- OTA effectiveness constrained by `app.json` (`checkAutomatically: "NEVER"`), requiring explicit update strategy in app/release operations
- Backend availability dependency on Supabase project referenced in `lib/supabase.js`

---

*Stack analysis: 2026-04-09*
