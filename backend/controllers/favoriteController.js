const FavoriteFood = require("../models/favoriteFoodModel.js");
const { findMdiIconForFood } = require("../utils/llm.js");

exports.getFavorites = async (req, res) => {
  try {
    const favorites = await FavoriteFood.find({ user: req.user._id }).sort({ "item.name": 1 });
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addFavorite = async (req, res) => {
  try {
    const { item } = req.body;
    
    // If no icon is provided, use LLM to find one
    if (!item.icon || item.icon === "mdi-food") {
      item.icon = await findMdiIconForFood(item.name);
    }

    const favorite = new FavoriteFood({
      user: req.user._id,
      item: item
    });

    await favorite.save();
    res.status(201).json(favorite);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Item is already in favorites." });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.updateFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const { item } = req.body;

    // Optional: Recalculate icon if name changed and icon was default
    const existing = await FavoriteFood.findOne({ _id: id, user: req.user._id });
    if (!existing) return res.status(404).json({ message: "Favorite not found" });

    if (item.name !== existing.item.name && (!item.icon || item.icon === existing.item.icon)) {
       item.icon = await findMdiIconForFood(item.name);
    }

    const updatedFavorite = await FavoriteFood.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { item: item },
      { new: true }
    );

    res.json(updatedFavorite);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    await FavoriteFood.findOneAndDelete({ _id: id, user: req.user._id });
    res.json({ message: "Favorite removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getIconForName = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ message: "Name is required" });
    const icon = await findMdiIconForFood(name);
    res.json({ icon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
