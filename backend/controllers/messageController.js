const Message = require("../models/messageModel.js");
const User = require("../models/userModel.js");
const { correctGrammar } = require("../utils/llm.js");

exports.createMessage = async (req, res) => {
  try {
    const { type, title, message, data } = req.body;
    const userId = req.user._id;

    if (!type || !title || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newMessage = await Message.create({
      userId,
      type,
      title,
      message,
      data: data || {},
    });

    return res.status(201).json(newMessage);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.createSystemMessage = async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required" });
    }

    const users = await User.find({}, "_id");
    const messagePromises = users.map((user) =>
      Message.create({
        userId: user._id,
        type: "system_message",
        title,
        message,
      })
    );

    await Promise.all(messagePromises);

    return res.status(201).json({ success: true, count: users.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.correctGrammar = async (req, res) => {
  try {
    const { text } = req.body;
    const language = req.user.language || "de";

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const correctedText = await correctGrammar(text, language);

    if (!correctedText) {
      return res.status(500).json({ error: "LLM Error during grammar correction" });
    }

    return res.status(200).json({ correctedText });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20, offset = 0, unreadOnly = false } = req.body;

    const query = { userId };
    if (unreadOnly) {
      query.read = false;
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const total = await Message.countDocuments(query);

    return res.status(200).json({ messages, total });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await Message.countDocuments({ userId, read: false });

    return res.status(200).json({ count });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ error: "messageIds array is required" });
    }

    await Message.updateMany(
      { _id: { $in: messageIds }, userId },
      { $set: { read: true } }
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};
