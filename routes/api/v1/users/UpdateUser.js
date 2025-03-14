const User = require("#models/User.js");
const { filteredUser } = require("#models/utils/UserUtils.js");
const { log } = require("#common/Logger.js");
const { ROLE } = require("#enum/Role.js");
const { getHash, generateSalt } = require("#common/Hasher.js");
const { getComplexity } = require("#common/Password.js");

const updateUser = async (req, res) => {
  try {
    // Check if user is updating their own profile or if admin is updating someone else
    const isAdmin = req.role === ROLE.ADMIN;
    const isLibrarian = req.role === ROLE.LIBRARIAN;
    const isSelf = req.userId === req.params.userId;

    // Only allow admins, librarians, or the user themselves to update profiles
    if (!isAdmin && !isLibrarian && !isSelf) {
      return res.status(403).json({ message: "Unauthorized to update this user" });
    }

    const userId = req.params.userId || req.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Track what's being updated for logging
    const updatedFields = [];

    // Extract update fields from request body
    const { profile, library, auth, password } = req.body;

    // Handle password update if provided (only allowed for self or admin)
    if (password && (isSelf || isAdmin)) {
      const complexity = getComplexity(password);
      if (complexity < 3) {
        return res.status(400).json({ message: "Password is too weak" });
      }

      const salt = await generateSalt();
      const hash = await getHash(password, salt);

      user.auth.salt = salt;
      user.auth.hash = hash;
      updatedFields.push("password");
    }

    // Update profile fields if provided
    if (profile) {
      // Basic profile details
      if (profile.firstName !== undefined) {
        user.profile.firstName = profile.firstName;
        updatedFields.push("profile.firstName");
      }
      if (profile.lastName !== undefined) {
        user.profile.lastName = profile.lastName;
        updatedFields.push("profile.lastName");
      }
      if (profile.dob !== undefined) {
        user.profile.dob = profile.dob;
        updatedFields.push("profile.dob");
      }
      if (profile.avatar !== undefined) {
        user.profile.avatar = profile.avatar;
        updatedFields.push("profile.avatar");
      }
      if (profile.preferredLanguage !== undefined) {
        user.profile.preferredLanguage = profile.preferredLanguage;
        updatedFields.push("profile.preferredLanguage");
      }

      // Address details
      if (profile.address) {
        if (profile.address.street !== undefined) {
          user.profile.address.street = profile.address.street;
          updatedFields.push("profile.address.street");
        }
        if (profile.address.city !== undefined) {
          user.profile.address.city = profile.address.city;
          updatedFields.push("profile.address.city");
        }
        if (profile.address.state !== undefined) {
          user.profile.address.state = profile.address.state;
          updatedFields.push("profile.address.state");
        }
        if (profile.address.zipCode !== undefined) {
          user.profile.address.zipCode = profile.address.zipCode;
          updatedFields.push("profile.address.zipCode");
        }
        if (profile.address.country !== undefined) {
          user.profile.address.country = profile.address.country;
          updatedFields.push("profile.address.country");
        }
      }
    }

    // Update library preferences if provided (only certain fields for regular users)
    if (library) {
      // Regular users can only update certain library preferences
      if (library.readingPreferences && (isSelf || isAdmin || isLibrarian)) {
        if (library.readingPreferences.favoriteGenres !== undefined) {
          user.library.readingPreferences.favoriteGenres = library.readingPreferences.favoriteGenres;
          updatedFields.push("library.readingPreferences.favoriteGenres");
        }
        if (library.readingPreferences.preferredAuthors !== undefined) {
          user.library.readingPreferences.preferredAuthors = library.readingPreferences.preferredAuthors;
          updatedFields.push("library.readingPreferences.preferredAuthors");
        }
      }

      if (library.notificationPreferences && (isSelf || isAdmin || isLibrarian)) {
        if (library.notificationPreferences.emailNotifications !== undefined) {
          user.library.notificationPreferences.emailNotifications = library.notificationPreferences.emailNotifications;
          updatedFields.push("library.notificationPreferences.emailNotifications");
        }
        if (library.notificationPreferences.smsNotifications !== undefined) {
          user.library.notificationPreferences.smsNotifications = library.notificationPreferences.smsNotifications;
          updatedFields.push("library.notificationPreferences.smsNotifications");
        }
        if (library.notificationPreferences.notifyBeforeDueDate !== undefined) {
          user.library.notificationPreferences.notifyBeforeDueDate = library.notificationPreferences.notifyBeforeDueDate;
          updatedFields.push("library.notificationPreferences.notifyBeforeDueDate");
        }
        if (library.notificationPreferences.notifyOnOverdue !== undefined) {
          user.library.notificationPreferences.notifyOnOverdue = library.notificationPreferences.notifyOnOverdue;
          updatedFields.push("library.notificationPreferences.notifyOnOverdue");
        }
        if (library.notificationPreferences.notifyOnHoldAvailable !== undefined) {
          user.library.notificationPreferences.notifyOnHoldAvailable = library.notificationPreferences.notifyOnHoldAvailable;
          updatedFields.push("library.notificationPreferences.notifyOnHoldAvailable");
        }
      }

      // Admin/Librarian only fields
      if (isAdmin || isLibrarian) {
        if (library.cardNumber !== undefined) {
          user.library.cardNumber = library.cardNumber;
          updatedFields.push("library.cardNumber");
        }
        if (library.membershipStatus !== undefined) {
          user.library.membershipStatus = library.membershipStatus;
          updatedFields.push("library.membershipStatus");
        }
        if (library.membershipType !== undefined) {
          user.library.membershipType = library.membershipType;
          updatedFields.push("library.membershipType");
        }
        if (library.expirationDate !== undefined) {
          user.library.expirationDate = library.expirationDate;
          updatedFields.push("library.expirationDate");
        }
        if (library.accountBalance !== undefined) {
          user.library.accountBalance = library.accountBalance;
          updatedFields.push("library.accountBalance");
        }
        if (library.fines !== undefined) {
          user.library.fines = library.fines;
          updatedFields.push("library.fines");
        }
      }
    }

    // Admin-only user role updates
    if (auth && isAdmin) {
      if (auth.role !== undefined) {
        user.auth.role = auth.role;
        updatedFields.push("auth.role");
      }
      if (auth.verified !== undefined) {
        user.auth.verified = auth.verified;
        updatedFields.push("auth.verified");
      }
      if (auth.phone !== undefined) {
        user.auth.phone = auth.phone;
        updatedFields.push("auth.phone");
      }
      if (auth.email !== undefined) {
        // Ensure email is stored in lowercase
        user.auth.email = auth.email.toLowerCase();
        updatedFields.push("auth.email");
      }
    }

    // If no fields were updated, return early
    if (updatedFields.length === 0) {
      return res.status(200).json({
        message: "No fields updated",
        user: filteredUser(user),
      });
    }

    await user.save();

    // Log the updates
    log(`User ${userId} updated: ${updatedFields.join(", ")}`, "INFO", "UpdateUser");

    const filtered = filteredUser(user);
    return res.status(200).json({
      message: "User updated successfully",
      user: filtered,
    });
  } catch (err) {
    log(`Error updating user: ${err.message}`, "ERROR", "routes PATCH /users/:userId");
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { updateUser };
