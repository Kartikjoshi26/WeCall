const Users = require("../models/user");
const mongoose = require("mongoose");

const getusers = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    // Fetch the current user by ID and populate their contacts
    const currentUser = await Users.findById(req.user._id).populate(
      "contacts",
      "name email"
    );

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userName = {
      name: currentUser.name,
      email: currentUser.email,
    };

    const contactList = currentUser.contacts.map((contact) => ({
      name: contact.name,
      email: contact.email,
    }));

    return res.status(200).json({
      success: true,
      message_data: {
        userName: userName,
        contacts: contactList,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const addcontact = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Contact email is required.",
      });
    }

    // Find the contact user by email
    const contactUser = await Users.findOne({ email });

    if (!contactUser) {
      return res.status(404).json({
        success: false,
        message: "User with this email not found.",
      });
    }

    // Prevent adding self as contact
    if (contactUser._id.equals(currentUserId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot add yourself as a contact.",
      });
    }

    // Get the current user
    const currentUser = await Users.findById(currentUserId);

    // Check if contact already exists
    const alreadyAdded = currentUser.contacts.includes(contactUser._id);

    if (alreadyAdded) {
      return res.status(200).json({
        success: true,
        message: "Contact already added.",
      });
    }

    // Add contact
    currentUser.contacts.push(contactUser._id);
    await currentUser.save();

    return res.status(200).json({
      success: true,
      message: "Contact added successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const searchUser = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required.",
      });
    }

    const currentUserId = req.user._id;
    const currentUser = await Users.findById(currentUserId).select("contacts");
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Current user not found.",
      });
    }

    const contactIds = currentUser.contacts.map((id) => id.toString());

    // Find matching users (excluding self)
    const users = await Users.find({
      _id: { $ne: currentUserId },
      $or: [
        { name: { $regex: `^${query}`, $options: "i" } },
        { email: { $regex: `^${query}`, $options: "i" } },
      ],
    }).select("name email _id");

    // Mark which ones are already in contact list
    const enriched = users.map((user) => ({
      name: user.name,
      email: user.email,
      alreadyAdded: contactIds.includes(user._id.toString()),
    }));

    if (enriched.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found.",
      });
    }

    return res.status(200).json({
      success: true,
      users: enriched,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const removeUser = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const userToRemove = await Users.findOne({ email });

    if (!userToRemove) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentUserId = req.user._id;

    const updatedUser = await Users.findByIdAndUpdate(
      currentUserId,
      {
        $pull: { contacts: userToRemove._id },
      },
      { new: true } // return the updated user
    );

    return res.status(200).json({
      success: true,
      message: "User removed from contacts successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = { getusers, addcontact, searchUser, removeUser };
