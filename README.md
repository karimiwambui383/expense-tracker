# expense-tracker
a website that helps track ones spending 

# Expense Tracker — JS-heavy (NomadX)

A JavaScript-first expense tracker with features:
- Add / edit / delete expenses
- Categories and notes
- LocalStorage persistence
- CSV export & JSON backup/import (merge or replace)
- Recurring expenses (daily/weekly/monthly)
- Monthly budget with visual progress & alerts
- Charts (Pie + Line) using Chart.js
- Search, filter, sort

## How to use
1. Create a folder `expense-tracker/` and save `index.html`, `style.css`, `app.js`, `README.md` inside.
2. Open `index.html` in your browser (no server required).
3. The app stores data in `localStorage` (key: `nomadx_expenses_v1`).
4. Use Export/Backup to download your data.

## Tech
- Plain HTML/CSS/Vanilla JS (ES6+)
- Chart.js (CDN)
- No build step required.

## Ideas to extend
- Add authentication + remote sync (Firebase, Supabase)
- Add categories editor
- Add currency conversion using exchangerate API
- Add mobile gestures & PWA support

## Authors
Built for Veronica / Star — adapt for your portfolio.
@vee
