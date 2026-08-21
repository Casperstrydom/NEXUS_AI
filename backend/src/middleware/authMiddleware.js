import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    // Check whether a session exists
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated.",
      });
    }

    // Find the user connected to the session
    const user = await User.findById(req.session.userId);

    // Session exists but user doesn't
    if (!user) {
      req.session.destroy(() => {});

      return res.status(401).json({
        success: false,
        message: "User account no longer exists.",
      });
    }

    // Check account status
    if (user.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "This account is not active.",
      });
    }

    // Make the authenticated user available
    // to controllers through req.user
    req.user = user;

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication check failed.",
    });
  }
};

export default authMiddleware;
