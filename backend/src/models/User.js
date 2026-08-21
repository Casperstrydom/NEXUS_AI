import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      select: false,
    },

    age: {
      type: Number,
      required: true,
      min: 13,
      max: 120,
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    profileImage: {
      type: String,
      default: null,
    },

    subscription: {
      plan: {
        type: String,
        enum: ["free_trial", "creator", "pro"],
        default: "free_trial",
      },

      status: {
        type: String,
        enum: ["active", "expired", "cancelled"],
        default: "active",
      },

      startedAt: {
        type: Date,
        default: Date.now,
      },

      expiresAt: {
        type: Date,
        default: null,
      },
    },

    usage: {
      messages: {
        type: Number,
        default: 0,
      },

      images: {
        type: Number,
        default: 0,
      },

      songs: {
        type: Number,
        default: 0,
      },

      videos: {
        type: Number,
        default: 0,
      },
    },

    accountStatus: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
