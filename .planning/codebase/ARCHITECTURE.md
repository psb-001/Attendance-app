# ARCHITECTURE

This application relies on a **Client-First Model** bridged with **Backend-as-a-Service (BaaS)** utilizing Supabase.
- Expo handles the native rendering envelope.
- Global Theme architecture revolves around a custom `ThemeContext.js`.
- File-based routing via `expo-router` eliminates stack-navigator boilerplate.
- The state logic heavily prioritizes localized Component state (`useState` and `useMemo`) combined with singular Contexts for broad features like Theming.
