# SmartExpense Pro - Comprehensive Project Guide

SmartExpense Pro is an enterprise-grade, full-stack personal finance management system. This guide contains complete technical details, folder structural breakdowns, local execution steps, and instructions to upload, publish, and deploy the application on GitHub and Render.

---

## 1. Project Directory Structure & Architecture
The project is split cleanly into three main sub-directories:
1. **`frontend/`**: Vanilla HTML5, CSS3, and JavaScript logic. Employs CSS Variables for Light/Dark themes and glassmorphic aesthetics. Communicates with Node.js backend using a centralized API layer (`frontend/js/api.js`). Integrates Chart.js for data visualization and jsPDF/AutoTable for document generation.
2. **`backend/`**: Node.js and Express.js server. Incorporates MongoDB Mongoose database connection, controllers for user auth and transactions, routes, security headers (Helmet), input sanitizers (mongo sanitize, XSS cleaner), and rate limiters.
3. **`python-ai/`**: Python Flask microservice. Contains Naive Bayes text vectorization pipelines to predict transaction categories, linear regression equations to forecast monthly spending budgets, and conditional heuristics to calculate smart financial suggestions.

---

## 2. Step-by-Step Installation & Execution Guide

Follow these steps to run the application immediately on your local machine:

### Prerequisites
- Install **Node.js** (v18 or higher)
- Install **Python** (v3.8 or higher) and `pip`
- Install and start **MongoDB** locally (default `mongodb://localhost:27017/smartexpense`), or have a **MongoDB Atlas** cluster URI.

### Step 2.1: Database Configuration
1. Open the project root.
2. Create or inspect the `.env` file. By default, it connects to a local database:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/smartexpense
   JWT_SECRET=supersecretkeyforexpenseapp2026
   PYTHON_AI_URL=http://localhost:5001
   PORT_AI=5001
   ```
3. If using MongoDB Atlas, replace `MONGODB_URI` with your connection string.

### Step 2.2: Running the Node.js Backend
1. Open a command prompt or terminal in the **`backend`** directory:
   ```bash
   cd backend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Express server:
   ```bash
   npm start
   ```
4. The backend server will start on `http://localhost:5000`. It will also serve the static frontend client locally.

### Step 2.3: Running the Python AI Microservice
1. Open another command prompt or terminal in the **`python-ai`** directory:
   ```bash
   cd python-ai
   ```
2. Install Python dependencies listed in `requirements.txt`:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the Flask application:
   ```bash
   python app.py
   ```
4. The microservice will start on port `5001` (`http://localhost:5001`).

### Step 2.4: Testing Locally
- Open your browser and navigate to `http://localhost:5000`.
- Click **Register** to create an account. (The first registered user is automatically granted the `admin` role for convenience).
- Log in, add expenses/incomes, trigger the "AI Autofill" buttons to classify transactions, and explore the Admin Panel or reports exports.

---

## 3. Uploading the Project to GitHub

Follow these steps to publish your code to GitHub:

### Step 3.1: Initialize Git Repository
In the root directory (`WB_expense`), run:
```bash
# Initialize git repository
git init

# Add all files to staging
git add .

# Create the initial commit
git commit -m "feat: Initial commit for SmartExpense Pro full-stack app"
```

### Step 3.2: Create Repository on GitHub
1. Go to [github.com](https://github.com) and log in.
2. Click **New** (or "+" in top-right) to create a new repository.
3. Name it `smartexpense-pro` (or similar).
4. Leave "Add a README file", "Add .gitignore", and "Choose a license" unchecked (since we already created them).
5. Click **Create repository**.

### Step 3.3: Link Local Git Repository to GitHub
Copy the commands from the GitHub repository page and run them in your terminal:
```bash
# Rename default branch to main
git branch -M main

# Add remote origin link (Replace with your actual GitHub repository URL)
git remote add origin https://github.com/your-username/smartexpense-pro.git

# Push changes to GitHub
git push -u origin main
```

---

## 4. Deploying the Application

### 4.1: Deploying Backend & Database

We will host the Node.js API and MongoDB database in the cloud:
1. **Database**: Create a free shared cluster on **MongoDB Atlas** (cloud.mongodb.com). Whitelist connection IPs (set `0.0.0.0/0` to allow connections from Render), and copy the MongoDB connection string.
2. **Backend**: Host the Express.js backend on **Render** (render.com) or Heroku:
   - Create a new **Web Service** on Render linked to your GitHub repository.
   - Set **Build Command** to `cd backend && npm install`.
   - Set **Start Command** to `cd backend && npm start`.
   - Under **Environment Variables**, define:
     - `NODE_ENV=production`
     - `MONGODB_URI=your_mongodb_atlas_connection_string`
     - `JWT_SECRET=your_custom_secure_secret_key`
     - `PYTHON_AI_URL=your_deployed_python_ai_url`
3. Click **Deploy Web Service**. Render will assign a public HTTPS URL (e.g. `https://smartexpense-backend.onrender.com`).

### 4.2: Deploying the Python AI Microservice on Render
Render supports Python services out-of-the-box:
1. Create another **Web Service** on Render linked to the same GitHub repository.
2. Set **Build Command** to `cd python-ai && pip install -r requirements.txt`.
3. Set **Start Command** to `cd python-ai && gunicorn app:app`.
4. Under **Environment Variables**, set `PORT_AI=10000` (Render's default port) or allow Flask to resolve it.
5. Deploy. Render will assign a public URL (e.g., `https://smartexpense-ai.onrender.com`). Update the backend's `PYTHON_AI_URL` environment variable with this URL.

### 4.3: Deploying Frontend on GitHub Pages
To serve the frontend statically on GitHub Pages:
1. Open `frontend/js/api.js`.
2. Update `localStorage.setItem('smartexpense_backend_url', 'https://your-deployed-backend-onrender.com/api')` or ensure `smartexpense_backend_url` is stored in the browser `localStorage` on load, allowing the static frontend to point to the remote server.
3. Push changes to GitHub.
4. Go to your GitHub Repository -> **Settings** -> **Pages**.
5. Under **Build and deployment**, select **Deploy from a branch**.
6. Choose the `main` branch, select the folder `/frontend`, and click **Save**.
7. In a few minutes, your static app will be live at `https://your-username.github.io/smartexpense-pro/`.
