const dotenv = require('dotenv');
const errorHandler = require('./src/middleware/errorHandler'); // Import the errorHandler middleware

dotenv.config();

const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 5000;
app.use(errorHandler);

// Start the server after DB connection
const startServer = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
