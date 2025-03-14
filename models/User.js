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
      street: { type: String, default: null },
      city: { type: String, default: null },
      state: { type: String, default: null },
      zipCode: { type: String, default: null },
      country: { type: String, default: null },
    },
    preferredLanguage: {
      type: String,
      enum: LANGUAGE,
      default: "ENGLISH",
    },
  },
  library: {
    cardNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    membershipStatus: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "SUSPENDED"],
      default: "ACTIVE",
    },
    membershipType: {
      type: String,
      enum: ["STANDARD", "PREMIUM", "STUDENT", "SENIOR"],
      default: "STANDARD",
    },
    expirationDate: {
      type: Date,
      default: () => new Date(+new Date() + 365 * 24 * 60 * 60 * 1000),
    },
    accountBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    fines: {
      type: Number,
      default: 0,
      min: 0,
    },
    borrowedBooks: {
      type: [
        {
          book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
          },
          borrowDate: {
            type: Date,
            default: Date.now,
          },
          dueDate: {
            type: Date,
            required: true,
          },
          returnedDate: {
            type: Date,
            default: null,
          },
          status: {
            type: String,
            enum: ["BORROWED", "RETURNED", "OVERDUE"],
            default: "BORROWED",
          },
        },
      ],
      default: [],
    },
    reservedBooks: {
      type: [
        {
          book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
          },
          reservationDate: {
            type: Date,
            default: Date.now,
          },
          expirationDate: {
            type: Date,
            required: true,
          },
          status: {
            type: String,
            enum: ["ACTIVE", "FULFILLED", "EXPIRED"],
            default: "ACTIVE",
          },
        },
      ],
      default: [],
    },
    readingPreferences: {
      favoriteGenres: {
        type: [String],
        default: [],
      },
      preferredAuthors: {
        type: [String],
        default: [],
      },
    },
    notificationPreferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: false,
      },
      notifyBeforeDueDate: {
        type: Boolean,
        default: true,
      },
      notifyOnOverdue: {
        type: Boolean,
        default: true,
      },
      notifyOnHoldAvailable: {
        type: Boolean,
        default: true,
      },
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
