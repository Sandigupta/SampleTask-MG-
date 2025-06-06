const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');
const {loginMiddleware} = require('./middleware/auth');
const { rateLimit } = require('express-rate-limit')


// Route files
const chapters = require('./routes/chapters');
const chapter = require('./routes/chapter');
const app = express();

// Trust proxy (IMPORTANT: Set this early for rate limiting with correct IP)
app.set('trust proxy', 1);


// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 30, // 30 requests per minute
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

// Apply the rate limiting middleware to all requests.
app.use(limiter);

// Mount routers
app.use('/api/v1/chapters', chapters);     
app.use('/api/v1/chapter', chapter);      

// Auth routes for admin login
app.post('/api/v1/auth/login', loginMiddleware);

// 404 handler
app.all('/{*any}', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
