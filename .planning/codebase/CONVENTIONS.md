# CONVENTIONS

- **Component Creation:** Functional components using Hooks. No class components.
- **Styling:** `StyleSheet.create` accompanied by dynamic theming parameters passing inline array logic: `style={[styles.root, { backgroundColor: t(light, dark) }]}`
- **Data Flow:** Supabase fetches on `useEffect` mounts relying on asynchronous patterns.
- **Naming:** Camel case for utilities and Pascal case for UI Components.
