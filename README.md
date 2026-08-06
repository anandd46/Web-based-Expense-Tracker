<<<<<<< HEAD
# SmartExpense Pro – AI Powered Personal Finance Management System

SmartExpense Pro is an enterprise-grade full-stack personal finance tracker and expense management platform. Built using vanilla web technologies, Node.js, MongoDB Atlas, and a local Python Flask AI microservice.

---

## Technical Stack
- **Frontend**: HTML5, CSS3 (Vanilla), Vanilla JavaScript, Chart.js (CDN), jsPDF + jsPDF-AutoTable (CDNs).
- **Backend**: Node.js, Express.js, Mongoose.
- **AI Microservice**: Python, Flask, Flask-CORS, scikit-learn, NumPy.
- **Authentication**: JSON Web Tokens (JWT), bcrypt hashing.
- **Database**: MongoDB Atlas / local MongoDB instances.
- **Security Features**: Helmet HTTP header protection, Rate Limiting, Custom XSS input filters, MongoDB NoSQL query sanitization.

---

## Key Features

1. **User Authentication & Authorization**: Registration, login, password hashing, and session persistence. Includes an Admin role with dashboard stats and user delete capabilities.
2. **Interactive Dashboard**: Quick metrics cards (Income, Expenses, Net Balance, Savings, Monthly Budget), recent transaction ledger grids, AI recommendations, and budget forecasts.
3. **Transaction Ledgers (CRUD)**:
   - **Expenses**: Title, Amount, Category, Date, Payment Method, Notes.
   - **Income**: Source, Amount, Date, Description.
   - Dynamic search parameters and filters (category, payment method, dates).
4. **Data Visualizations**: Category distribution pie charts, Income vs. Expense comparison bars, Savings growth line trends, and budget tracker doughnut gauges.
5. **AI Predictions & Suggestions**:
   - **Smart Category Prediction**: Autofills categories using a Naive Bayes classifier on transaction titles.
   - **Spending Analysis**: Multi-month comparisons with custom insights.
   - **Budget Prediction**: Linear regression forecast of expenditures.
   - **Financial Suggestions**: Behavioral guidelines based on budget allocation ratios.
6. **Downloadable Statements**: Filter transactions and download formatted CSV spreadsheets or customized PDF statements.

---

## Folder Structure
```
WB_expense/
├── frontend/             # Static UI Client
│   ├── css/              # Stylesheets (Glassmorphism design tokens)
│   ├── js/               # JavaScript files (Central API, Auth, Modules)
│   └── *.html            # UI pages
├── backend/              # Node.js / Express Backend
│   ├── config/           # DB Config
│   ├── controllers/      # Route Controllers
│   ├── middleware/       # JWT Auth & Security filters
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API endpoints
│   └── server.js         # Entrypoint
├── python-ai/            # Flask AI service
│   ├── app.py            # AI endpoints
│   └── requirements.txt  # Dependencies
├── docs/                 # Guides & docs
└── README.md
```

---

## Installation & Setup

Please refer to the comprehensive guide in **[docs/guide.md](file:///E:/ANTIGRAVITY/WB_expense/docs/guide.md)** for detailed installation, running, git pushing, and cloud deployment steps.

### Quick Start
1. **Database**: Start MongoDB locally on port `27017` or configure connection in `.env`.
2. **Backend**:
   ```bash
   cd backend
   npm install
   npm start
   ```
3. **Python AI**:
   ```bash
   cd python-ai
   pip install -r requirements.txt
   python app.py
   ```
4. Open `http://localhost:5000` in your web browser.

---

## License & Showcase
This project is built as a portfolio-ready demonstration for MCA reviews, resume portfolios, and interviews. Built under clean code practices.
=======
# Web-based-Expense-Tracker

Web-based-Expense-Tracker
>>>>>>> e8e0bf48794f40725912117185f878eb704243a2
