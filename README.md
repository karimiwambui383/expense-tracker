# Expense Tracker

A modern, browser-based expense tracking application built with vanilla JavaScript, HTML, and CSS. Track your spending, manage budgets, and visualize your financial data with ease.

## Table of Contents

- [Features](#features)
- [Technologies](#technologies)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Future Enhancements](#future-enhancements)
- [Contact](#contact)

## Features

- ✅ **Add, Edit & Delete Expenses** — Manage your expenses with a simple interface
- 📊 **Visual Analytics** — Pie and line charts powered by Chart.js
- 🏷️ **Categories & Notes** — Organize expenses with custom categories and detailed notes
- 🔄 **Recurring Expenses** — Automate daily, weekly, or monthly recurring expenses
- 💰 **Budget Management** — Set monthly budgets with visual progress indicators and alerts
- 🔍 **Search & Filter** — Easily find and filter expenses by date, category, or amount
- 📈 **Sort Capabilities** — Organize your data by date, amount, or category
- 💾 **Data Persistence** — All data is securely stored in browser localStorage
- 📤 **Export & Backup** — Download your data as CSV or JSON for backup and portability
- 📥 **Import Data** — Restore data from JSON backups with merge or replace options

## Technologies

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Charting:** Chart.js (via CDN)
- **Storage:** Browser LocalStorage
- **Architecture:** Vanilla JavaScript (no frameworks required)

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server or build tools required

### Installation

1. Clone or download this repository:
   ```bash
   git clone https://github.com/karimiwambui383/expense-tracker.git
   cd expense-tracker
   ```

2. Open the application:
   - Simply open `index.html` in your web browser
   - No installation or build process needed

### File Structure

```
expense-tracker/
├── index.html       # Main HTML file
├── style.css        # Styling
├── app.js           # Application logic
└── README.md        # This file
```

## Usage

1. **Add an Expense** — Click "Add Expense" and fill in the details (amount, category, date, notes)
2. **View Dashboard** — See your expense summary, charts, and budget progress
3. **Manage Expenses** — Edit or delete expenses as needed
4. **Export Data** — Download your expenses as CSV or JSON for external analysis
5. **Backup & Restore** — Create backups of your data or import previously saved data
6. **Budget Tracking** — Set a monthly budget and monitor your spending against it

### Data Storage

All your expense data is stored locally in your browser's localStorage under the key `nomadx_expenses_v1`. No data is sent to any server.

## Future Enhancements

- 🔐 Cloud synchronization with authentication (Firebase, Supabase)
- 💱 Multi-currency support with real-time exchange rates
- 📱 Progressive Web App (PWA) capabilities
- 📲 Mobile gesture support and optimization
- 🎨 Customizable categories and themes

## Contact

For questions, feedback, or support, please reach out via email:

📧 **Email:** [vwambui108@gmail.com](mailto:vwambui108@gmail.com)

---

**Expense Tracker** © 2026 — Built with ❤️
