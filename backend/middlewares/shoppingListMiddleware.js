const ShoppingList = require("../models/shoppingListModel.js");
const mongoose = require("mongoose");

/**
 * Middleware to check if the user is the owner of the shopping list.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @description If the user is the owner, the shopping list is assigned to req.shoppingList and next() is called.
 */
exports.listOwnerMiddleware = async (req, res, next) => {
  try {
    const listId = req.body.listId;
    const user = req.user;

    if (!listId || !mongoose.Types.ObjectId.isValid(listId)) {
      return res.status(400).json({ error: "Invalid or missing List ID" });
    }

    const shoppingList = await ShoppingList.findOne({ _id: listId });

    if (!shoppingList || shoppingList.length === 0) {
      return res.status(404).json({ error: "List not found" });
    }

    const isSharedWithUser = shoppingList.sharedWith.includes(user._id);
    const isOwner = shoppingList.user.toString() === user._id.toString();

    if (isOwner) {
      req.shoppingList = shoppingList;
      next();
    } else if (isSharedWithUser) {
      return res.status(403).json({ error: "Forbidden Access, only the owner got access" });
    } else {
      return res.status(403).json({ error: "Forbidden Access, only the owner got access" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Middleware to check if the user has read access to the shopping list.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @description If the user has access, the shopping list is assigned to req.shoppingList and next() is called.
 */
exports.readAccessMiddleware = async (req, res, next) => {
  try {
    const listId = req.body.listId;
    const user = req.user;

    if (!listId || !mongoose.Types.ObjectId.isValid(listId)) {
      return res.status(400).json({ error: "Invalid or missing List ID" });
    }

    const shoppingList = await ShoppingList.findOne({ _id: listId });

    if (!shoppingList || shoppingList.length === 0) {
      return res.status(404).json({ error: "List not found" });
    }

    const isOwner = shoppingList.user.toString() === user._id.toString();
    const isSharedWithUser = shoppingList.sharedWith.includes(user._id);

    if (isOwner || isSharedWithUser) {
      req.shoppingList = shoppingList;
      next();
    } else {
      return res.status(401).json({ error: "Unauthorized List access" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.readAccessParamsMiddleware = async (req, res, next) => {
  try {
    const listId = req.params.listId;
    const user = req.user;

    if (!listId || !mongoose.Types.ObjectId.isValid(listId)) {
      return res.status(400).json({ error: "Invalid or missing List ID" });
    }

    const shoppingList = await ShoppingList.findOne({ _id: listId });

    if (!shoppingList) {
      return res.status(404).json({ error: "List not found" });
    }

    const isOwner = shoppingList.user.toString() === user._id.toString();
    const isSharedWithUser = shoppingList.sharedWith.includes(user._id);

    if (isOwner || isSharedWithUser) {
      req.shoppingList = shoppingList;
      next();
    } else {
      return res.status(401).json({ error: "Unauthorized List access" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};
