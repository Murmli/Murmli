const Message = require("../models/messageModel.js");

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
