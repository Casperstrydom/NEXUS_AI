import bcrypt from "bcryptjs";
import User from "../models/User.js";

/*
  POST /api/auth/signup
  Create a new NexusAI account
*/

export const signup = async (req, res) => {
  try {
    const { name, email, password, age, country } = req.body;

    // Check required fields
    if (!name || !email || !password || !age || !country) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // Basic password requirement
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    // Check whether email already exists
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Calculate free-trial expiration
    const startedAt = new Date();

    const expiresAt = new Date(startedAt);
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create user
    const user = await User.create({
      name: name.trim(),

      email: email.toLowerCase().trim(),

      password: hashedPassword,

      age: Number(age),

      country: country.trim(),

      subscription: {
        plan: "free_trial",
        status: "active",
        startedAt,
        expiresAt,
      },

      usage: {
        messages: 0,
        images: 0,
        songs: 0,
        videos: 0,
      },
    });

    // Never send the password back to the frontend
    return res.status(201).json({
      success: true,

      message: "NexusAI account created successfully.",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        country: user.country,

        subscription: user.subscription,

        usage: user.usage,

        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create account.",
    });
  }
};

/*
  POST /api/auth/login
  Login to a NexusAI account
*/

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // password has select:false in User.js,
    // so explicitly request it here.
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check password
    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check account status
    if (user.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "This account is not active.",
      });
    }
    // Create authenticated session
    req.session.userId = user._id.toString();
    // Update last login
    user.lastLogin = new Date();

    await user.save();

    return res.status(200).json({
      success: true,

      message: "Login successful.",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        country: user.country,

        subscription: user.subscription,

        usage: user.usage,

        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login.",
    });
  }
};

/*
  GET /api/auth/me
  Return the currently authenticated user
*/

export const getCurrentUser = async (req, res) => {
  try {
    // Check whether the user has an active session
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated.",
      });
    }

    // Find the user connected to the session
    const user = await User.findById(req.session.userId);

    // Session exists but the user no longer exists
    if (!user) {
      req.session.destroy(() => {});

      return res.status(401).json({
        success: false,
        message: "User account no longer exists.",
      });
    }

    // Check whether the account is active
    if (user.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "This account is not active.",
      });
    }

    // Return the authenticated user
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        country: user.country,

        subscription: user.subscription,

        usage: user.usage,

        profileImage: user.profileImage,

        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve user.",
    });
  }
};

/*
  POST /api/auth/logout
  Destroy the authenticated user's session
*/

export const logout = async (req, res) => {
  try {
    req.session.destroy((error) => {
      if (error) {
        console.error("Logout error:", error);

        return res.status(500).json({
          success: false,
          message: "Unable to logout.",
        });
      }

      res.clearCookie("connect.sid", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });

      return res.status(200).json({
        success: true,
        message: "Logout successful.",
      });
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to logout.",
    });
  }
};
