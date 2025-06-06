const jwt = require('jsonwebtoken');
const User = require('../models/User');

const loginMiddleware = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password',
      });
    }
    console.log("Login request received");

    // Simple admin check (in production, use proper user model)
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      console.log("Admin credentials match");

      let adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL });
      console.log("Admin user lookup complete:", adminUser);

      if (!adminUser) {
        console.log("Creating new admin user...");
        adminUser = await User.create({
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
          role: 'admin',
        });
        console.log("Admin user created");
      }

      const token = adminUser.getSignedJwtToken();
      console.log("Token generated");

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: adminUser._id,
          email: adminUser.email,
          role: adminUser.role,
        },
      });
    } else {
      console.log("Invalid credentials");
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }
  } catch (error) {
    console.error("Error in loginMiddleware:", error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};





// Protect routes - authentication required
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization) {
    token = req.headers.authorization;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
      });
    }
    console.log("Sign up")
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route',
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = {
  loginMiddleware,
  protect,
  authorize
};