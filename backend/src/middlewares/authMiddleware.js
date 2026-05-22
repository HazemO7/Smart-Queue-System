// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

// Middleware to verify JWT token 
const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ msg: "No token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = decoded; 
        next();
    } catch (error) {
        return res.status(401).json({ msg: "Invalid or expired token" });
    }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    // يجب أن تكون هذه الدالة بعد verifyToken في الـ Routes
    // لذا نحن متأكدون أن req.user موجود هنا
    if (req.user && req.user.role === "admin") {
        next();
    } else {

        return res.status(403).json({
             msg: "Access denied, admins only"
             });
    }
};
    

module.exports = { verifyToken, isAdmin };