const mongoose = require("mongoose");
const baseSchema = require("./Base");
const { ROLE, LANGUAGE } = require("#enum/Fields.js");

const userSchema = new mongoose.Schema({
  identifier: {
    username: {
      type: String,
      required: true,
      unique: false,
      default: null,
    },
    tag: {
      type: String,
      required: true,
      default: "",
    },
  },
  auth: {
    role: {
      type: String,
      enum: ROLE,
      default: ROLE[0],
    },
    email: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: null,
    },
    hash: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
      required: true,
    },
    twoFactor: {
      secret: {
        type: String,
        default: null,
      },
      enabled: {
        type: Boolean,
        default: false,
      },
    },
    verified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    banned: {
      type: Date,
      default: null,
    },
  },
  profile: {
    firstName: {
      type: String,
      default: null,
    },
    lastName: {
      type: String,
      default: null,
    },
    dob: {
      type: Date,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
    preferredLanguage: {
      type: String,
      enum: LANGUAGE,
      default: "ENGLISH",
    },
  },
});

// lowercase email before saving
userSchema.pre("save", function (next) {
  if (this.auth && this.auth.email) {
    this.auth.email = this.auth.email.toLowerCase();
  }
  next();
});

userSchema.virtual("fullName").get(function () {
  const firstName = this.profile?.firstName || "";
  const lastName = this.profile?.lastName || "";
  return firstName || lastName ? `${firstName} ${lastName}`.trim() : "";
});

userSchema.virtual("reversedName").get(function () {
  const firstName = this.profile?.firstName || "";
  const lastName = this.profile?.lastName || "";
  return firstName || lastName ? `${lastName} ${firstName}`.trim() : "";
});

userSchema.virtual("enable2FA").get(function () {
  return this.auth?.twoFactor?.enabled || false;
});

userSchema.virtual("verified").get(function () {
  return this.auth?.verified || false;
});

userSchema.add(baseSchema);

const User = mongoose.model("User", userSchema);
module.exports = User;
