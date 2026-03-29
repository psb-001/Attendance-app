# CONCERNS

## Bloat
- Leftover web bundles (`react-native-web`, `react-dom`) which increase app size without tangible iOS/Android benefit.
- Unused export packages (`react-native-view-shot`) if timetable export is inactive.
- Media permission modules (`expo-media-library`) inflating the binary footprint.
- Over-The-Air modules (`expo-updates`) present but possibly unnecessary if solely relying on raw binary compilation.

## Scalability
- The Teacher Dashboard flat file mapping logic may falter if Subject sets exceed typical memory capacities.
- Legacy local files located in `/data/` must be safely archived and purged to prevent accidental local data overriding Supabase.
