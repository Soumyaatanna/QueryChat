# 🗣️ QueryChat AI - Text-to-SQL SaaS Platform

QueryChat AI is a premium, modern full-stack SaaS interface that enables developers, data analysts, and non-technical business users to chat with databases in natural language. The system translates questions into SQL using Google Gemini (`gemini-2.0-flash`), executes them, visualizes datasets into interactive charts, and summarizes key insights in plain English.

---

## ⚡ Features

- **Natural Language to SQL**: Converse with your database using plain English. QueryChat AI handles generating optimized SQL automatically.
- **Interactive SVG Charts**: Dynamic conversion of tabular datasets into Bar, Line, Pie, and Area charts with custom gradients and micro-interactions.
- **Tabular Data Explorer**: Full results table equipped with search filtering, column sorting, and custom pagination.
- **Database Connection Manager**: Supports simple cards to configure and test credentials for local or remote SQLite and MySQL instances.
- **CSV / Excel / Database Uploader**: Drag-and-drop file uploader to parse SQLite databases, CSV tables, Excel spreadsheets, or raw SQL dumps.
- **Interactive Analytics Viewport**: Visual telemetry cards displaying total tables, row capacities, query frequencies, and latency trace loggers.
- **Adaptive Light Theme**: A beautifully configured, modern light theme using a white and blue color scheme, toggleable directly from the sidebar.
- **Robust Quota Fallbacks**: If the Gemini API rate limit is exceeded (HTTP 429), the backend automatically triggers local keyword heuristic SQL generators and summaries to keep the application interactive.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React (JavaScript / JSX)
- **Bundler**: Vite
- **Icons**: Lucide React
- **Styling**: Vanilla CSS (CSS variables, modern spacing, glassmorphic layout)

### Backend
- **Framework**: FastAPI (Python)
- **Web Server**: Uvicorn
- **AI Chain**: LangChain + Google Gemini (`langchain-google-genai` / `gemini-2.0-flash`)
- **ORM/DB Connection**: SQLAlchemy, PyMySQL, SQLite3
- **Data Processor**: Pandas, OpenPyXL

---

## 🚀 Setup & Launch Instructions

### Prerequisites
Make sure you have Python (>= 3.10) and Node.js (>= 18) installed.

### 1. API Configuration
Create a `.env` file in the root workspace folder to store your API credentials:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Alternatively, you can input and update your API Key dynamically on the Settings tab in the frontend dashboard, which persists it in LocalStorage).*

---

### 2. Run the Backend FastAPI Server
Navigate to the root directory and start the server:
```bash
# Start FastAPI backend with automatic reloader on port 8000
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
The server automatically does two things on startup:
1. Detects and hooks into your running MySQL instance (configured to port `3306` on database `restro` using the credentials in `.env`).
2. Reads the CSV files inside the `Data_CSV` directory and seeds a local SQLite database (`querychat_demo.db`) for instant testing via the **Try Demo** button on the landing page.

---

### 3. Run the Frontend Dashboard
Navigate to the `frontend/` directory, install dependencies, and start the development server:
```bash
# Navigate to frontend folder
cd frontend

# Install package dependencies
npm install

# Start Vite dev server
npm run dev
```
The client dashboard will launch at [http://localhost:5173/](http://localhost:5173/). Vite is configured with an API proxy, automatically forwarding any `/api/*` requests directly to the FastAPI server running on port `8000`.

---

## 🔑 Database Credentials

### Local MySQL (Active)
- **Host**: `127.0.0.1` (or `localhost`)
- **Port**: `3306`
- **Username**: `root`
- **Password**: Your local MySQL password (loaded from `.env`)
- **Database**: `restro` (Contains tables: `users`, `bookings`, `book`, `bookflight`)

### SQLite Demo (Auto-seeded)
- **Filepath**: `querychat_demo.db` (Contains seeded CSV datasets: `regions`, `products`, `customers`, `budgets_2017`, `sales_order`)

---

## 🌐 Production Deployment Guide

You can deploy QueryChat AI using two main approaches:

### Option 1: Monolithic Deployment (FastAPI + React Combined - Recommended)
By serving the React production static files directly from the FastAPI server, you only need to host **one** service.

1. **Build the Frontend**:
   Navigate to the `frontend/` folder, install dependencies, and build the static assets:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
   This compiles your React app into `frontend/dist/`.
2. **Deploy to Render, Railway, or Heroku**:
   Create a new web service pointing to your GitHub repository and set the start command:
   ```bash
   python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT
   ```
   *FastAPI automatically detects `frontend/dist` and serves both the API endpoints and the React dashboard UI on the exact same port!*

### Option 2: Decoupled Deployment (FastAPI on Render + React on Vercel)
Ideal if you want to scale the frontend and backend independently.

1. **Deploy the FastAPI Backend**:
   - Host the Python backend on **Render**, **Railway**, or **AWS ECS/EC2**.
   - Configure the environment variable `GEMINI_API_KEY` in your hosting dashboard.
2. **Deploy the React Frontend**:
   - Host the React app on **Vercel**, **Netlify**, or **GitHub Pages**.
   - Set up the environment variable `VITE_API_URL` pointing to your deployed backend URL.