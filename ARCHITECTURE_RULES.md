# IPC Architecture Rules (Antigravity Protocol)

## 1. Core Principles
- **Modularity:** Every business vertical (HR, CRM, Finance) is a separate module in `src/modules/`.
- **Registry Pattern:** All modules must be registered in `src/registry_init.jsx` using the `registry.register()` pattern.
- **Schema-Driven UI:** UI should be generated or validated against schemas in `src/schemas/`.
- **Aesthetics:** Follow the "Pristine Architecture" defined in `DESIGN.md`. High-fidelity emerald-glass theme is non-negotiable.

## 2. Technical Stack
- **Frontend:** React 19 + Vite + Vanilla CSS.
- **Backend:** Firebase (Firestore, Auth, Functions, Storage).
- **State Management:** Zustand for global state, Registry for module orchestration.
- **AI:** Gemini 2.0 Flash (via `nexusChat` Cloud Function).

## 3. Data Flow
- All database interactions must use the `services/FirebaseService` or equivalent.
- Use `Zod` for runtime validation as defined in schemas.
- Record history must be tracked for all sensitive operations.

## 4. Antigravity Integration
- UI components should use the `--antigravity-*` CSS variables for elite styling.
- The `AIAssistant` component is the primary interface for AI-driven operations.
- AI actions (NAV, CREATE, AUDIT) must be supported in the UI shell.

## 5. Deployment
- Always run `npm run lint` and `npm run test` before deploying.
- Use `npm run deploy` for atomic build and firebase deployment.
