# Design System: Jaheez Premium Moroccan Service Launcher
**Project ID:** Local Jaheez mobile app design system

## 1. Visual Theme & Atmosphere
Jaheez should feel warm, fast, local, and premium: a Moroccan-friendly assistant that can bring meals, groceries, pharmacy items, packages, gifts, and custom errands. The visual language is service-first rather than feed-first. The first screen should immediately answer, “What do you need Jaheez to do?” with large, obvious, tappable service cards.

The atmosphere is bright and optimistic, with a branded yellow hero area, warm white content surfaces, generous rounded cards, and small red accents used for action and urgency. Decorative motion should feel like a branded pulse or door-opening transition, never like a spinner or gimmick.

## 2. Color Palette & Roles
- **Ready Yellow (#F5CE2E):** Primary brand energy, hero zones, active navigation states, soft highlights, and celebratory accents.
- **Soft Moroccan Yellow (#FFF3B8):** Gentle selected states, service-card backgrounds, promo surfaces, and low-pressure emphasis.
- **Jaheez Red (#F03030):** Primary CTA color, notification badges, active action buttons, and food/service emphasis.
- **Pressed Red (#C42020):** Pressed or high-emphasis red states.
- **Warm White (#FEFDF8):** Main screen background and quiet content zones.
- **Cream Surface (#FFFBEE):** Secondary warm surfaces and bottom-sheet/card sections.
- **Card White (#FFFFFF):** Primary cards, search bars, headers, and floating controls.
- **Charcoal Ink (#1C1C1E):** Primary text and premium dark surfaces such as floating cart bars.
- **Soft Gray Text (#6F6F76):** Secondary labels, subtitles, metadata, placeholders, and helper text.
- **Warm Divider (#E8E6DF):** Borders, dividers, chip outlines, and card separators.
- **Success Green (#2DB87A):** Grocery freshness, successful states, free delivery, and pickup markers.
- **Info Blue (#3A8FE8):** Courier, package, tracking, and informational accents.
- **Warning Orange (#FF9F1C):** Time-sensitive notices and caution states.

## 3. Typography Rules
Latin typography should feel modern and rounded, using Plus Jakarta Sans where available and the project’s configured Readex/Cairo fallback where not. Arabic and Darija copy should use Cairo-style forms with generous line height.

Page titles use heavy 800-style weight, tight but readable letter spacing, and a 26–32px mobile scale. Section titles use 18–20px bold text. Card titles use 15–17px bold text. Body and helper text stay at 12–14px with medium weight for scanability.

Microcopy should be warm and local. Prefer short lines like “What can we bring you?” or Darija-friendly prompts over corporate explanations.

## 4. Component Stylings
* **Buttons:** Pill-shaped or generously rounded. Primary actions use Jaheez Red with white text; selected navigation and secondary emphasis use Ready Yellow. Press states scale gently to 0.96–0.98.
* **Cards/Containers:** Large service cards use 22–28px rounded corners, white or soft tinted backgrounds, and whisper-soft diffused shadows. Destination content cards are cleaner and image-led so restaurants, products, and shops remain the focus.
* **Inputs/Forms:** Search bars and form fields are high-contrast white or light warm gray, 48–56px tall, softly rounded, and include clear icon affordances. Focus states use red borders sparingly.
* **Service Cards:** Each service is a small “world” with an illustration, title, one-line subtitle, and optional badge. Restaurants may be larger than the rest; all cards must remain at least 44px tappable and readable on 360px screens.
* **Destination Headers:** Sticky, clean, and functional. Back buttons and action icons are circular white controls with warm borders and soft shadows.
* **Bottom Navigation:** White or translucent white, lightly elevated, with yellow active state and red badges for counts.

## 5. Layout Principles
Design mobile-first for 390×844 and adapt down to 360px and up to 430px. Use 20px horizontal page padding, an 8px spacing rhythm, and max-width centering for tablets or web previews.

The home screen uses two zones: a colorful branded top launcher and a warm white lower content area connected by a large curved wave. Destination screens use shared structure: sticky header, contextual search, horizontal categories, filters, promo banner, content feed, floating cart/request bar, and bottom navigation.

Do not introduce production mock stores, products, prices, users, or order states in frontend UI. Static service labels, empty/loading states, and routing affordances are allowed; business data must come from backend API contracts.
