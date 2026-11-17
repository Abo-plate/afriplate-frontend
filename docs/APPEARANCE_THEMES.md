# Appearance themes - local implementation

Open Dashboard -> Settings -> Appearance. Both buyer and seller Settings tabs use
this same control. Choose Light, Dark or System. There is no new navbar control,
floating switch or extra mobile bottom-navigation tab.

System is the default. Light/Dark preferences are saved under afriplate:theme in
browser localStorage. System removes the explicit choice and follows the device.
The setting is browser-specific, not an account setting and not synced across
devices. It survives navigation, refresh and logout. Storage events keep other
tabs in sync; changes to device colour preference update System mode. Invalid
stored values fall back to System. If storage is blocked, the current choice still
applies in memory and the Settings feedback explains that it cannot be saved.

A small constant bootstrap script in the root head applies the saved/device theme
before page content. Root HTML suppresses hydration warnings for its theme/style
attributes. The client provider and server-safe bootstrap constant are separate
modules, so the server layout never reads an export through a client boundary.

Dark mode uses semantic page/surface/text/accent/status/border tokens in theme.css.
Existing literal colours have CSS-variable fallbacks that preserve their original
light appearance. Backgrounds, text, borders, native forms and mobile navigation
are theme-aware across marketplace listings, authentication, seller profiles,
portfolios/reviews, dashboards, applications, orders, jobs, cart, checkout, wallet
and private messaging. Green filled buttons and brand gradients keep their original
colour; contrast text, tints and outlines adapt. Photos/assets are not filtered or
inverted. Badge tint expressions use color-mix so CSS variable colours do not get
invalid hexadecimal alpha suffixes appended.

New files:
- src/app/lib/ThemeProvider.js
- src/app/lib/themeBootstrap.js
- src/components/ThemeSettings.js
- src/app/theme.css
- this handoff

Root layout imports the shared theme stylesheet/provider/bootstrap. The dashboard
adds only the Appearance component/import plus colour substitutions; its existing
unfinished layout, data loading and actions are preserved. Other edited frontend
files contain theme colour substitutions rather than new API workflows. Existing
unfinished dashboard CSS receives the same colour substitutions without changing
its layout. No packages, environment variables, backend endpoints or database
migrations are required. Payment guards, stock/cart behaviour, messaging requests,
job application/hiring logic and authentication remain unchanged.

Validation: source/diff review, static JavaScript/JSX and CSS parsing, import review
and whitespace checks only. No automated tests, local production build, browser
checks or live API actions were run. No records were created. Device rendering,
hydration/first-paint appearance, cross-tab behaviour, persistence and interactive
behaviour remain runtime-UNVERIFIED. This handoff was prepared before publication;
publication is now authorized separately. A push alone is not deployment evidence.

Before a later release, keep the pre-existing unfinished dashboard redesign out of
selective staging unless separately approved; include only the theme insertion and
colour changes against the deployed dashboard. Do not commit the mixed file whole.

Release packaging: the dashboard is staged from deployed HEAD with only theme
colours and the Appearance import/control. Its earlier quick-action tint expressions
are made compatible with CSS variables. The unfinished dashboard layout/CSS,
screenshots, check script and unrelated Marketplace bell icon remain local.
No backend release, migration, new package or environment setup is required.
