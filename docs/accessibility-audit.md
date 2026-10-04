# California DMV portal accessibility and architecture audit

## Scope and method

- **Target:** [California DMV portal](https://www.dmv.ca.gov/portal/), initial
  page load.
- **Date:** 2026-10-04.
- **Automated:** Google PageSpeed Insights / Lighthouse 13.5.0, mobile
  emulation (Moto G Power, slow 4G), single-page initial-load run.
- **Keyboard:** keyboard-only Tab and Enter pass on the live page. The first
  Tab focused “Skip to content”; Enter changed the URL fragment to `#main` and
  scrolled the main content into view; the next Tab reached “Renew Today”.
- **Limitations:** Lighthouse checks only a subset of accessibility concerns.
  No screen-reader, high-zoom, or full transaction-flow testing was performed.

## Lighthouse summary

| Category | Score |
| --- | ---: |
| Accessibility | 97 |
| Performance | 63 |
| Best Practices | 77 |
| SEO | 85 |

The mobile run reported FCP 2.0 s, LCP 4.1 s, Total Blocking Time 500 ms, and
Speed Index 9.8 s. The report also estimated 304 KiB image-delivery savings,
542 KiB cache-lifetime savings, and 1,900 ms render-blocking savings. The
captured Lighthouse report and exact audit details are in
[the evidence screenshot](../screenshots/california-dmv-lighthouse-findings.png).
The keyboard focus state is in
[the keyboard screenshot](../screenshots/california-dmv-keyboard.png).

## Prioritized findings

| ID | Priority | WCAG / area | Evidence and user impact | Recommended remediation |
| --- | --- | --- | --- | --- |
| DMV-001 | P1 - High | WCAG 1.4.1, Use of Color | Lighthouse flagged “Links rely on color to be distinguishable.” One failing element is the “Learn More” link in the fraud-alert notice (`/portal/dmv-scam-alert/`). Users who cannot distinguish the link color from surrounding text may miss the action. | Add a persistent non-color cue such as an underline, and verify the link text and surrounding text contrast. |
| DMV-002 | P1 - High | WCAG 2.4.4, Link Purpose; link-content quality | Lighthouse found two “Learn More” links with different destinations: `/portal/mydmv-account/` and `/portal/dmv-scam-alert/`. The report also flags two links without descriptive text. In a screen-reader links list or out of context, the labels do not identify the destination. | Use contextual names such as “Learn about your MyDMV account” and “Read the DMV fraud alert”; retain distinct destinations and test the links list. |
| DMV-003 | P2 - Moderate | Front-end compatibility | Lighthouse’s deprecated-API audit reports that `<source src>` inside a `<picture>` is invalid and ignored; it recommends `srcset`. The source is the portal’s `frontend-content-slider-scripts.js` plugin. This can prevent the intended responsive image source from being selected. | Correct the generated markup to use `<source srcset="…">`; test the slider at narrow and wide breakpoints and with images disabled. |
| DMV-004 | P1 - High | Client-side runtime reliability | Direct page loading logged `HierarchyRequestError: Failed to execute 'appendChild' on 'Node': Only one element on document allowed.` The stack points to the portal’s `frontend-content-slider-scripts.js`. A runtime exception in shared slider code can leave its content or controls incomplete. | Reproduce in a clean browser, fix the invalid append target, and add a browser-level regression test for slider initialization and keyboard operation. |
| DMV-005 | P2 - Moderate | Mobile performance architecture | Lighthouse scored mobile performance 63; LCP was 4.1 s and Total Blocking Time 500 ms on the emulated slow-4G run. The report estimates 304 KiB of image savings and 1,900 ms of render-blocking savings. Slow or blocked users wait longer for the service entry point. | Resize/compress and defer below-the-fold images, set effective cache lifetimes, and defer or split non-critical scripts/styles. Re-run Lighthouse on the same mobile profile. |

The priority labels are remediation order, not a claim that every finding is a
confirmed WCAG failure. DMV-002 includes Lighthouse’s unscored identical-link
best-practice check; DMV-003 through DMV-005 are architecture/performance
findings. The automated Accessibility score does not include the keyboard and
screen-reader checks Lighthouse asks teams to perform manually.

## Reproduction links

- [PageSpeed Insights mobile report](https://pagespeed.web.dev/analysis/https-www-dmv-ca-gov-portal/pa1pl5eoar?form_factor=mobile)
- [California DMV portal](https://www.dmv.ca.gov/portal/)
