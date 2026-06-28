const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const { apiLimiter, sanitizeInput } = require('./middleware/security');
const { errorHandler } = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Connect to Database
connectDB();

const app = express();

// Security Middlewares
// Customize Helmet content security policy to allow Chart.js, styles, and jsPDF fonts
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://*"],
        connectSrc: ["'self'", "http://localhost:5000", "http://127.0.0.1:5000", "http://localhost:5001", "http://127.0.0.1:5001"],
      },
    },
  })
);

app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Body parser

// Input Sanitization (against NoSQL query injection & script tags)
app.use(mongoSanitize());
app.use(sanitizeInput);

// Rate Limiter applied to all API endpoints
app.use('/api', apiLimiter);

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'Healthy',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Hook up API routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// Serve Static Frontend Assets locally
app.use(express.static(path.join(__dirname, '../frontend')));

// Fallback route to serve frontend index.html for undefined requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
