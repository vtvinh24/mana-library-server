const { isEmail } = require("#common/Validator.js");
const { TagNotGeneratedError, EmailInvalidError } = require("#enum/Error.js");
const User = require("#models/User.js");

/**
 * This function filters the user object to remove the auth field
 * @param {User} user The User object to filter
 * @returns {object} The filtered user object
 */
function filteredUser(user) {
  if (!(user instanceof User)) {
    throw new Error("Invalid user object");
  }

  const userObj = user.toObject();

  // Create a new object with only the fields we want to expose
  return {
    _id: userObj._id,
    identifier: userObj.identifier,
    auth: {
      email: userObj.auth.email,
      verified: userObj.auth.verified,
      role: userObj.auth.role,
      // Explicitly exclude sensitive fields like hash, salt, etc.
    },
    profile: {
      firstName: userObj.profile?.firstName,
      lastName: userObj.profile?.lastName,
      preferredLanguage: userObj.profile?.preferredLanguage,
      phone: userObj.profile?.phone,
      dob: userObj.profile?.dob,
      avatar: userObj.profile?.avatar,
      address: userObj.profile?.address,
    },
    library: {
      cardNumber: userObj.library?.cardNumber,
      membershipStatus: userObj.library?.membershipStatus,
      membershipType: userObj.library?.membershipType,
      expirationDate: userObj.library?.expirationDate,
      accountBalance: userObj.library?.accountBalance,
      // Exclude borrowedBooks details for basic profile view
      // Just return counts if needed
      borrowedBooksCount: userObj.library?.borrowedBooks?.length || 0,
      reservedBooksCount: userObj.library?.reservedBooks?.length || 0,
    },
    // Include these fields from the base schema
    createdAt: userObj.createdAt,
    updatedAt: userObj.updatedAt,

    // Add recent activity if needed - this depends on how you're storing activity
    recentActivity: userObj.recentActivity || [],

    // Include virtuals that might be useful
    fullName: userObj.fullName,
  };
}

/**
 * This function returns the full name of the user
 * @param {User} user An instance of User
 * @param {boolean} reverse Value to determine the order of first name and last name
 * @returns {string} The full name of the user
 */
function getFullName(user, reverse = false) {
  if (!(user instanceof User)) {
    throw new Error("Invalid user object");
  }
  const { firstName, lastName } = user;
  if (!firstName && !lastName) {
    return "";
  }
  if (!firstName) {
    return lastName;
  }
  if (!lastName) {
    return firstName;
  }
  return reverse ? `${lastName} ${firstName}` : `${firstName} ${lastName}`;
}

/**
 * This function generates a username and tag for a user based on email
 *
 * @async
 * @param {string} email The email of the user
 *
 * @returns {object} An object containing the generated username and tag
 *
 * @throws {Error} If the email is invalid
 *
 * @example
 * const user = new User({ email: "abc123@mail.com" });
 * const { username, tag } = await generateUsername(user.email);
 * log(username, tag); // "abc123", "0001" if no other user has the similar email/username
 */
async function generateIdentifier(email) {
  if (!email || !isEmail(email)) {
    throw EmailInvalidError;
  }

  let username = email.split("@")[0];

  // const matchedUsers = await User.find({ "identifier.username": new RegExp(`^${username}`, "i") }).countDocuments();
  // username += matchedUsers ? `-${matchedUsers}` : "";

  const MAX_ATTEMPTS = 10;
  let attempts = 0;
  let tag;
  let isUnique = false;

  while (!isUnique && attempts < MAX_ATTEMPTS) {
    const highestTagUser = await User.findOne({ "identifier.username": username }).sort({ "identifier.tag": -1 });
    tag = highestTagUser ? (parseInt(highestTagUser.identifier.tag) + 1).toString() : 1;

    const existingUser = await User.findOne({ "identifier.username": username, "identifier.tag": tag });
    if (!existingUser) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw TagNotGeneratedError;
  }

  return { username, tag };
}

module.exports = {
  filteredUser,
  getFullName,
  generateIdentifier,
};
