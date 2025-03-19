import jwt from "jsonwebtoken";
import pkg from "pg";

const { Pool } = pkg; // ✅ Fix for ES6

export const auth = (req, res, next) => {
  const userToken = req.header("Authorization")?.split(" ")[1];
  if (!userToken) return res.status(401).json({ message: "Access Denied" });

  try {
    const decodedToken = jwt.verify(userToken, process.env.JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
  }
};

// Middleware to check user roles
export const checkRole = (role) => {
  return (req, res, next) => {
    if (req.user.roles && req.user.roles.includes(role)) {
      next(); // Allow access
    } else {
      res.status(403).json({ message: "Access Denied" });
    }
  };
};

