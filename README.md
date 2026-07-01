# VehicleShield AI + EmergencyNet 4.0

An integrated smart safety platform demo featuring real-time GPS tracking, SMS OTP authentication, AI fraud detection, and multi-role emergency dispatch — all in a single-page front-end app.

## Features

- **Multi-role portal** — separate login flows for four roles:
  - 🛡️ **Admin**
  - 🚔 **Police**
  - 🏥 **Hospital**
  - 👤 **Citizen** (vehicle owner/user)
- **SMS OTP authentication** — phone-based login via [Fast2SMS](https://fast2sms.com); falls back to an on-screen **Demo Mode** OTP when no API key is configured
- **Live map & GPS tracking** — powered by [Leaflet](https://leafletjs.com/)
- **Charts & analytics** — powered by [Chart.js](https://www.chartjs.org/)
- **Emergency dispatch workflow** between citizens, police, and hospital dashboards

## Project structure

```
.
├── index.html    # Page markup, structure, and role/auth UI
├── styles.css    # All visual styling (theme, layout, animations)
└── script.js     # App logic: auth, OTP/SMS, map, tracking, dispatch, charts
```

All three files must stay in the same folder — `index.html` references `styles.css` and `script.js` by relative path. It also pulls in these external libraries via CDN, so an internet connection is required:

- Leaflet (map rendering)
- Chart.js (charts/analytics)
- Google Fonts (Orbitron, Share Tech Mono, Exo 2)

## Running locally

No build step is required. Options:

1. **Open directly** — double-click `index.html` to open it in a browser.
2. **Local server (recommended)** — some browsers restrict local file access for scripts, so serving it avoids issues:
   ```bash
   # from the project folder
   python3 -m http.server 8000
   ```
   Then visit `http://localhost:8000`.

## SMS OTP configuration

By default the app runs in **Demo Mode**: OTPs are generated and displayed on-screen instead of being sent by text.

To enable real SMS delivery:
1. Create a free account at [fast2sms.com](https://fast2sms.com).
2. Go to **Dev API** and copy your API key.
3. Paste the key into the SMS config bar at the top of the app and save.

The key is stored only in the browser's `localStorage` (key: `vs_sms_key`) — it is never hard-coded into the source files.

## Notes

- This is a front-end demo/prototype: there is no backend server included, and any "AI fraud detection" or dispatch logic runs client-side for demonstration purposes.
- Replace or extend the SMS/API integration before using this in any production or real emergency-response context.
