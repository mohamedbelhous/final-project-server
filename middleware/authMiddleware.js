import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verify the user's identity using the JWT token
export const protect = async (req, res, next) => {
try {
const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return res.status(401).json({
    success: false,
    message: "Not authorized. Please log in.",
  });
}

const token = authHeader.split(" ")[1];

if (!token) {
  return res.status(401).json({
    success: false,
    message: "Authentication token is missing.",
  });
}

const decoded = jwt.verify(token, process.env.JWT_SECRET);

const user = await User.findById(decoded.id).select("-password");

if (!user) {
  return res.status(401).json({
    success: false,
    message: "User no longer exists.",
  });
}

req.user = user;
next();

} catch (error) {
if (error.name === "JsonWebTokenError" ||
error.name === "TokenExpiredError") {
return res.status(401).json({
success: false,
message: "Invalid or expired authentication token.",
});
}


console.error("Authentication middleware error:", error);

return res.status(500).json({
  success: false,
  message: "Authentication failed.",
});

}
};

// Restrict access to administrators
export const adminOnly = (req, res, next) => {
if (!req.user) {
return res.status(401).json({
success: false,
message: "Authentication required.",
});
}

if (req.user.role !== "admin") {
return res.status(403).json({
success: false,
message: "Access denied. Administrators only.",
});
}

next();
};
