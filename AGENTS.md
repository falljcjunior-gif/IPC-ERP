# IPC Project Guide (Antigravity Protocol)

## Build and Development
- **Start Dev Server:** `npm run dev`
- **Build Project:** `npm run build`
- **Preview Build:** `npm run preview`
- **Deploy to Firebase:** `npm run deploy`

## Testing
- **Unit Tests (Vitest):** `npm run test`
- **E2E Tests (Playwright):** `npm run test:ui`

## Linting
- **Run ESLint:** `npm run lint`

## Project Structure
- `src/schemas/`: Firebase/Firestore data models and validation logic.
- `src/modules/`: Core business logic modules (HR, Accounting, History, etc.).
- `src/components/`: Reusable UI components following the Antigravity design system.
- `functions/`: Firebase Cloud Functions.

## Design System (Source of Truth)
Refer to [DESIGN.md](./DESIGN.md) for design tokens, typography, and component styling rules.

## Coding Standards
- **Aesthetics First:** All UI changes must be premium and follow the emerald-glass theme.
- **Strict Typing:** Ensure schemas are followed when interacting with the database.
- **Antigravity Protocol:** Use the specialized CSS variables (`--antigravity-*`) for AI-driven or elite components.
