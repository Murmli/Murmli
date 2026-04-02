// routes/shoppingListRoute.js
// loaded from app.js with prefix api/v2/shoppingList
// authMiddleware.js is pre-applied and creates req.user object
// readAccessMiddleware checks if has access to list and preload req.shoppingList object
// listOwnerMiddleware doeas the same as readAccessMiddleware but u have to be the list owner

const express = require("express");
const multer = require("multer");
const router = express.Router();
const shoppingListController = require("../controllers/shoppingListController.js");
const { secretKeyMiddleware, sessionMiddleware } = require("./../middlewares/authMiddleware.js");
const { readAccessMiddleware, listOwnerMiddleware, readAccessParamsMiddleware } = require("../middlewares/shoppingListMiddleware.js");
const streamAuthMiddleware = require("../middlewares/streamAuthMiddleware.js");
const upload = multer({
  dest: "uploads/",
  limits: {
    fieldSize: 5 * 1024 * 1024, // 5MB für Formularfelder
    fileSize: 25 * 1024 * 1024 // 25MB für Dateien
  }
});

/**
 * @swagger
 * /api/v2/shoppingList/create:
 *   get:
 *     title: Create Shopping List
 *     summary: Create a new shopping list
 *     description: Creates a new empty shopping list for the authenticated user and returns the list details.
 *     tags:
 *       - Shopping List
 *     responses:
 *       200:
 *         description: Shopping list created successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Invalid secret key
 *       500:
 *         description: Server error
 */
router.get("/create", secretKeyMiddleware, sessionMiddleware, shoppingListController.create);

// Stream shopping list updates using Server-Sent Events
router.get(
  "/stream/:listId",
  streamAuthMiddleware,
  readAccessParamsMiddleware,
  shoppingListController.stream
);
/**
 * @swagger
 * /api/v2/shoppingList/read:
 *   post:
 *     title: Get Shopping List
 *     summary: Get a shopping list
 *     description: Retrieves a shopping list by ID if the user has access (owner or shared).
 *     tags:
 *       - Shopping List
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Get Shopping List Request
 *             properties:
 *               listId:
 *                 type: string
 *                 description: Shopping list ID (MongoDB ObjectId)
 *             required:
 *               - listId
 *     responses:
 *       200:
 *         description: Shopping list retrieved successfully
 *       400:
 *         description: Invalid or missing list ID
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Forbidden - Invalid secret key
 *       404:
 *         description: List not found
 *       500:
 *         description: Server error
 */
router.post("/read", secretKeyMiddleware, sessionMiddleware, readAccessMiddleware, shoppingListController.read);
/**
 * @swagger
 * /api/v2/shoppingList/delete:
 *   delete:
 *     title: Delete Shopping List
 *     summary: Delete a shopping list
 *     description: Deletes a shopping list by ID. Only the owner can delete the list.
 *     tags:
 *       - Shopping List
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Delete Shopping List Request
 *             properties:
 *               listId:
 *                 type: string
 *                 description: Shopping list ID (MongoDB ObjectId)
 *             required:
 *               - listId
 *     responses:
 *       200:
 *         description: Shopping list deleted successfully
 *       400:
 *         description: Invalid or missing list ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only owner can delete
 *       404:
 *         description: List not found
 *       500:
 *         description: Server error
 */
router.delete("/delete", secretKeyMiddleware, sessionMiddleware, listOwnerMiddleware, shoppingListController.delete);
/**
 * @swagger
 * /api/v2/shoppingList/item/create/text:
 *   post:
 *     title: Add Items Via Text
 *     summary: Add items to shopping list via text
 *     description: Adds one or multiple items to the shopping list by parsing a text input.
 *     tags:
 *       - Shopping List
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Add Items Via Text Request
 *             properties:
 *               listId:
 *                 type: string
 *                 description: Shopping list ID
 *               text:
 *                 type: string
 *                 description: Text containing items to add
 *             required:
 *               - listId
 *               - text
 *     responses:
 *       200:
 *         description: Items added successfully, returns updated shopping list
 *       400:
 *         description: Invalid input or cannot parse items
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shopping list not found
 *       500:
 *         description: Server error
 */
router.post("/item/create/text", secretKeyMiddleware, sessionMiddleware, readAccessMiddleware, shoppingListController.createItemText);
/**
 * @swagger
 * /api/v2/shoppingList/item/create/audio:
 *   post:
 *     title: Add Items Via Audio
 *     summary: Add items to shopping list via audio file
 *     description: Uploads an audio file, transcribes it to text, and adds parsed items to the shopping list.
 *     tags:
 *       - Shopping List
 *     consumes:
 *       - multipart/form-data
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: Audio file containing shopping list items
 *       - in: formData
 *         name: listId
 *         type: string
 *         required: true
 *         description: Shopping list ID
 *     responses:
 *       200:
 *         description: Items added successfully, returns updated shopping list
 *       400:
 *         description: Invalid input or cannot transcribe audio
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shopping list not found
 *       500:
 *         description: Server error
 */
router.post("/item/create/audio", secretKeyMiddleware, sessionMiddleware, upload.single("file"), readAccessMiddleware, shoppingListController.createItemAudio);
/**
 * @swagger
 * /api/v2/shoppingList/item/sorting:
 *   post:
 *     title: Get Item Sorting Preferences
 *     summary: Get user's shopping list item sorting preferences
 *     description: Retrieves the user's preferred sorting order for shopping list items.
 *     tags:
 *       - Shopping List
 *     responses:
 *       200:
 *         description: Sorting preferences retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post("/item/sorting", secretKeyMiddleware, sessionMiddleware, shoppingListController.readItemSorting);
/**
 * @swagger
 * /api/v2/shoppingList/item/delete:
 *   delete:
 *     title: Delete Shopping List Item
 *     summary: Delete an item from the shopping list
 *     description: Deletes a specific item from the shopping list by item ID.
 *     tags:
 *       - Shopping List
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Delete Shopping List Item Request
 *             properties:
 *               listId:
 *                 type: string
 *                 description: Shopping list ID
 *               itemId:
 *                 type: string
 *                 description: Item ID to delete
 *             required:
 *               - listId
 *               - itemId
 *     responses:
 *       200:
 *         description: Item deleted successfully, returns updated shopping list
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Item or list not found
 *       500:
 *         description: Server error
 */
router.delete("/item/delete", secretKeyMiddleware, sessionMiddleware, readAccessMiddleware, shoppingListController.deleteItem);
/**
 * @swagger
 * /api/v2/shoppingList/item/delete/all:
 *   delete:
 *     title: Delete All Items
 *     summary: Delete all items from the shopping list
 *     description: Removes all items from the specified shopping list.
 *     tags:
 *       - Shopping List
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Delete All Items Request
 *             properties:
 *               listId:
 *                 type: string
 *                 description: Shopping list ID
 *             required:
 *               - listId
 *     responses:
 *       200:
 *         description: All items deleted successfully, returns updated shopping list
 *       400:
 *         description: Invalid or missing list ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shopping list not found
 *       500:
 *         description: Server error
 */
router.delete("/item/delete/all", secretKeyMiddleware, sessionMiddleware, readAccessMiddleware, shoppingListController.deleteAllItems);
/**
 * @swagger
 * /api/v2/shoppingList/item/delete/checked:
 *   delete:
 *     title: Delete Checked Items
 *     summary: Delete all checked (inactive) items from the shopping list
 *     description: Removes all items marked as checked (inactive) from the specified shopping list.
 *     tags:
 *       - Shopping List
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               listId:
 *                 type: string
 *                 description: Shopping list ID
 *             required:
 *               - listId
 *     responses:
 *       200:
 *         description: Checked items deleted successfully, returns updated shopping list
 *       400:
 *         description: Invalid or missing list ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: No checked items found or list not found
 *       500:
 *         description: Server error
 */
router.delete("/item/delete/checked", secretKeyMiddleware, sessionMiddleware, readAccessMiddleware, shoppingListController.deleteCheckedItems);
/**
 * @swagger
 * /api/v2/shoppingList/item/update:
 *   put:
 *     title: Update Shopping List Item
 *     summary: Update an item in the shopping list
 *     description: Updates the details of a specific item in the shopping list.
 *     tags:
 *       - Shopping List
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               listId:
 *                 type: string
 *                 description: Shopping list ID
 *               itemId:
 *                 type: string
 *                 description: Item ID to update
 *               name:
 *                 type: string
 *                 description: New item name
 *               quantity:
 *                 type: number
 *                 description: New quantity
 *               unit:
 *                 type: string
 *                 description: New unit
 *               category:
 *                 type: number
 *                 description: New category id
 *               active:
 *                 type: boolean
 *                 description: Item active status (true=unchecked, false=checked)
 *             required:
 *               - listId
 *               - itemId
 *     responses:
 *       200:
 *         description: Item updated successfully, returns updated shopping list
 *       400:
 *         description: Invalid input or no update data provided
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Item or list not found
 *       500:
 *         description: Server error
 */
router.put("/item/update", secretKeyMiddleware, sessionMiddleware, readAccessMiddleware, shoppingListController.updateItem);
/**
 * @swagger
 * /api/v2/shoppingList/item/alternative:
 *   post:
 *     title: Find Item Alternatives
 *     summary: Find alternative items
 *     description: Suggests alternative items for a given shopping list item.
 *     tags:
 *       - Shopping List
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               listId:
 *                 type: string
 *                 description: Shopping list ID
 *               itemId:
 *                 type: string
 *                 description: Item ID to find alternatives for
 *             required:
 *               - listId
 *               - itemId
 *     responses:
 *       200:
 *         description: Alternative items found
 *       400:
 *         description: Invalid input or item not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shopping list not found
 *       500:
 *         description: Server error
 */
router.post("/item/alternative", secretKeyMiddleware, sessionMiddleware, readAccessMiddleware, shoppingListController.findItemAlternative);
/**
 * @swagger
 * /api/v2/shoppingList/invite/create:
 *   post:
 *     title: Create Invite Code
 *     summary: Create an invite code for a shopping list
 *     description: Generates an invite code to share the shopping list with other users. Only the owner can create invites.
 *     tags:
 *       - Shopping List
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               listId:
 *                 type: string
 *                 description: Shopping list ID
 *             required:
 *               - listId
 *     responses:
 *       200:
 *         description: Invite code created successfully
 *       400:
 *         description: Invalid or missing list ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only owner can create invites or invite already exists
 *       404:
 *         description: Shopping list not found
 *       500:
 *         description: Server error
 */
router.post("/invite/create", secretKeyMiddleware, sessionMiddleware, listOwnerMiddleware, shoppingListController.createInvite);
/**
 * @swagger
 * /api/v2/shoppingList/invite/read:
 *   post:
 *     title: Get Invite Code
 *     summary: Get active invite code for a shopping list
 *     description: Retrieves the current active invite code and its remaining validity time.
 *     tags:
 *       - Shopping List
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               listId:
 *                 type: string
 *                 description: Shopping list ID
 *             required:
 *               - listId
 *     responses:
 *       200:
 *         description: Invite code retrieved successfully
 *       400:
 *         description: Invalid or missing list ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shopping list not found
 *       500:
 *         description: Server error
 */
router.post("/invite/read", secretKeyMiddleware, sessionMiddleware, readAccessMiddleware, shoppingListController.readInvite);
/**
 * @swagger
 * /api/v2/shoppingList/invite/join:
 *   post:
 *     title: Join Via Invite Code
 *     summary: Join a shopping list using an invite code
 *     description: Allows a user to join a shopping list by providing a valid invite code.
 *     tags:
 *       - Shopping List
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inviteCode:
 *                 type: string
 *                 description: Invite code to join the shopping list
 *             required:
 *               - inviteCode
 *     responses:
 *       200:
 *         description: Successfully joined the shopping list
 *       400:
 *         description: Invalid or missing invite code
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Already joined or owner cannot join own list
 *       404:
 *         description: Invite code or shopping list not found
 *       500:
 *         description: Server error
 */
router.post("/invite/join", secretKeyMiddleware, sessionMiddleware, shoppingListController.joinInvite);
/**
 * @swagger
 * /api/v2/shoppingList/invite/leave:
 *   post:
 *     title: Leave Shopping List
 *     summary: Leave a shared shopping list
 *     description: Removes the current user from the shared shopping list's access list.
 *     tags:
 *       - Shopping List
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               listId:
 *                 type: string
 *                 description: Shopping list ID
 *             required:
 *               - listId
 *     responses:
 *       200:
 *         description: Successfully left the shopping list
 *       400:
 *         description: Invalid or missing list ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shopping list not found
 *       500:
 *         description: Server error
 */
router.post("/invite/leave", secretKeyMiddleware, sessionMiddleware, readAccessMiddleware, shoppingListController.leaveInvite);
/**
 * @swagger
 * /api/v2/shoppingList/invite/clear:
 *   post:
 *     title: Clear Invites
 *     summary: Clear invites for a shopping list
 *     description: Removes all or specific user invites from the shopping list. Only the owner can clear invites.
 *     tags:
 *       - Shopping List
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               listId:
 *                 type: string
 *                 description: Shopping list ID
 *               id:
 *                 type: string
 *                 description: User ID to remove from shared list (optional, clears all if omitted)
 *             required:
 *               - listId
 *     responses:
 *       200:
 *         description: Invites cleared successfully
 *       400:
 *         description: Invalid or missing list ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only owner can clear invites
 *       404:
 *         description: Shopping list not found
 *       500:
 *         description: Server error
 */
router.post("/invite/clear", secretKeyMiddleware, sessionMiddleware, listOwnerMiddleware, shoppingListController.clearInvites);
/**
 * @swagger
 * /api/v2/shoppingList/recipe/add:
 *   post:
 *     title: Add Recipe To List
 *     summary: Add a recipe to the shopping list
 *     description: Adds a recipe and its ingredients to the shopping list.
 *     tags:
 *       - Shopping List
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               listId:
 *                 type: string
 *                 description: Shopping list ID
 *               recipeId:
 *                 type: string
 *                 description: Recipe ID to add
 *               servings:
 *                 type: number
 *                 description: Number of servings
 *             required:
 *               - listId
 *               - recipeId
 *               - servings
 *     responses:
 *       200:
 *         description: Recipe added successfully, returns updated shopping list
 *       400:
 *         description: Invalid input or recipe not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shopping list not found
 *       500:
 *         description: Server error
 */
router.post("/recipe/add", secretKeyMiddleware, sessionMiddleware, readAccessMiddleware, shoppingListController.addRecipe);
/**
 * @swagger
 * /api/v2/shoppingList/recipe/remove:
 *   delete:
 *     title: Remove Recipe From List
 *     summary: Remove a recipe from the shopping list
 *     description: Removes a specific recipe and its ingredients from the shopping list.
 *     tags:
 *       - Shopping List
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               listId:
 *                 type: string
 *                 description: Shopping list ID
 *               recipeId:
 *                 type: string
 *                 description: Recipe ID to remove
 *             required:
 *               - listId
 *               - recipeId
 *     responses:
 *       200:
 *         description: Recipe removed successfully, returns updated shopping list
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Recipe or shopping list not found
 *       500:
 *         description: Server error
 */
router.delete("/recipe/remove", secretKeyMiddleware, sessionMiddleware, readAccessMiddleware, shoppingListController.removeRecipeFixed);
/**
 * @swagger
 * /api/v2/shoppingList/recipe/remove/all:
 *   delete:
 *     title: Remove All Recipes
 *     summary: Remove all recipes from the shopping list
 *     description: Removes all recipes and their ingredients from the shopping list.
 *     tags:
 *       - Shopping List
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               listId:
 *                 type: string
 *                 description: Shopping list ID
 *             required:
 *               - listId
 *     responses:
 *       200:
 *         description: All recipes removed successfully, returns updated shopping list
 *       400:
 *         description: Invalid or missing list ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shopping list not found
 *       500:
 *         description: Server error
 */
router.delete("/recipe/remove/all", secretKeyMiddleware, sessionMiddleware, readAccessMiddleware, shoppingListController.removeAllRecipesFixed);
/**
 * @swagger
 * /api/v2/shoppingList/item/delete/ingredients:
 *   delete:
 *     title: Remove All Ingredients
 *     summary: Remove all ingredients from the shopping list
 *     description: Removes all ingredients (not linked to recipes) from the shopping list.
 *     tags:
 *       - Shopping List
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               listId:
 *                 type: string
 *                 description: Shopping list ID
 *             required:
 *               - listId
 *     responses:
 *       200:
 *         description: Ingredients removed successfully, returns updated shopping list
 *       400:
 *         description: Invalid or missing list ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shopping list not found
 *       500:
 *         description: Server error
 */
router.delete("/item/delete/ingredients", secretKeyMiddleware, sessionMiddleware, readAccessMiddleware, shoppingListController.removeAllIngredients);
/**
 * @swagger
 * /api/v2/shoppingList/suggestions/compile:
 *   post:
 *     title: Compile Suggested Recipes
 *     summary: Compile suggested recipes into the shopping list
 *     description: Adds all suggested recipes and their ingredients to the shopping list.
 *     tags:
 *       - Shopping List
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               listId:
 *                 type: string
 *                 description: Shopping list ID
 *             required:
 *               - listId
 *     responses:
 *       200:
 *         description: Suggested recipes compiled successfully, returns updated shopping list
 *       400:
 *         description: Invalid or missing list ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shopping list not found
 *       500:
 *         description: Server error
 */
router.post("/suggestions/compile", secretKeyMiddleware, sessionMiddleware, readAccessMiddleware, shoppingListController.compileSuggestedRecipes);
/**
 * @swagger
 * /api/v2/shoppingList/lastUpdate:
 *   post:
 *     title: Get Last Update
 *     summary: Get last update timestamp of the shopping list
 *     description: Retrieves the Unix timestamp of the last update made to the shopping list.
 *     tags:
 *       - Shopping List
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               listId:
 *                 type: string
 *                 description: Shopping list ID
 *             required:
 *               - listId
 *     responses:
 *       200:
 *         description: Last update timestamp retrieved successfully
 *       400:
 *         description: Invalid or missing list ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shopping list not found
 *       500:
 *         description: Server error
 */
router.post("/lastUpdate", secretKeyMiddleware, sessionMiddleware, readAccessMiddleware, shoppingListController.getLastUpdate);
/**
 * @swagger
 * /api/v2/shoppingList/myShoppingList:
 *   get:
 *     title: Get My Shopping List
 *     summary: Get the user's latest shopping list ID
 *     description: Retrieves the ID of the most recently created shopping list for the authenticated user.
 *     tags:
 *       - Shopping List
 *     responses:
 *       200:
 *         description: Latest shopping list ID retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get("/myShoppingList", secretKeyMiddleware, sessionMiddleware, shoppingListController.getUserShoppingList);

module.exports = router;
