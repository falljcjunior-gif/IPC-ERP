# Design System: IPC (International Private Concierge)
**Project ID:** 11159266533357215326

## 1. Visual Theme & Atmosphere
The IPC project embodies **"Pristine Architecture"**—a design philosophy centered on clarity, high-end emerald accents, and structural depth. The mood is **Elite, Professional, and Fluid**, using glassmorphism and bento-grid layouts to create a premium concierge experience. It avoids visual clutter in favor of "breathable" white space and subtle micro-interactions.

## 2. Color Palette & Roles
* **Deep Forest Emerald (#064E3B):** Primary color, used for authority and brand identity.
* **Vibrant Mint (#10B981):** Accent color, used for primary actions, success states, and interactive glows.
* **Slate 900 (#0F172A):** Primary text color, providing strong contrast and professional tone.
* **Slate 500 (#64748B):** Muted text for secondary information and metadata.
* **Pristine White (#FFFFFF):** Base background and card color.
* **Subtle Slate (#F8FAFC):** Background for sectioning and subtle depth shifts.
* **Glass White (rgba(255, 255, 255, 0.9)):** Used for high-fidelity glassmorphism overlays.

## 3. Typography Rules
* **Font Family:** 'Outfit' for headings (Display/H1-H6) and 'Inter' for body text.
* **Heading Style:** Bold (800-900 weight), letter-spacing (-0.02em) for a modern, high-end editorial look.
* **Body Style:** Clear, readable (400-500 weight) with a 1.5 line height for maximum legibility.

## 4. Component Stylings
* **Buttons:** 
  * **Primary:** Deep Emerald background with white text. 0.85rem radius. Hover includes a subtle scale up and lift.
  * **Secondary:** Subtle slate background with a 1.5px border. Turns mint on hover.
  * **Glass:** Translucent with backdrop-blur (12px). Used for premium, layered actions.
* **Cards/Containers:** 
  * **Bento Cards:** 1.25rem radius (`--radius`). Uses `--shadow-md` by default, shifting to `--shadow-premium` on hover.
  * **Antigravity Cards:** Elite AI-themed containers with 2rem radius (`--radius-antigravity`) and deep diffused shadows.
* **Inputs/Forms:** Minimalist filled backgrounds (`--bg-subtle`) with soft mint focus rings.

## 5. Layout Principles
* **Bento Rhythm:** A 12-column dynamic grid with a 1.5rem gap. Elements should feel intentionally placed with varying sizes.
* **No-Line Sectioning:** Space is defined by tonal shifts (White to Subtle Slate) and elevation rather than hard 1px dividers.
* **White Space:** Generous padding (1.5rem+) between major sections to maintain a "Premium" editorial feel.

## 6. Antigravity Protocols
* **Aesthetics:** Every component must feel premium. Use `--transition-antigravity` for smooth state changes.
* **Micro-animations:** Use `framer-motion` for subtle entry and exit animations.
* **AI Integration:** The `AIAssistant` component follows the Antigravity design language with specialized glows and glass layers.
