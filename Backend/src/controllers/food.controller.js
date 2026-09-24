const mongoose = require("mongoose");
const foodModel = require("../models/food.model");
const userModel = require("../models/user.model");
const foodPartnerModel = require("../models/foodpartner.model");
const storageService = require("../services/storage.service");
const commentModel = require("../models/comment.model");
const { v4: uuid } = require("uuid");

// ── Create Food ───────────────────────────────────────────────────────────────
async function createFood(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Video file is required"
            });
        }

        const extension = req.file.originalname
            ? req.file.originalname.split(".").pop()
            : "";
        const safeFileName = extension ? `${uuid()}.${extension}` : `${uuid()}`;
        const fileUploadResult = await storageService.uploadFile(
            req.file.buffer,
            safeFileName
        );

        const foodItem = await foodModel.create({
            name: req.body.name,
            description: req.body.description,
            video: fileUploadResult.url,
            foodPartner: req.foodPartner._id
        });

        res.status(200).json({
            message: "Food created successfully",
            food: foodItem
        });
    } catch (error) {
        console.error("Error creating food:", error);
        res.status(500).json({
            message: "Server error while creating food"
        });
    }
}

// ── Get All Food Items ────────────────────────────────────────────────────────
async function getFoodItems(req, res) {
    try {
        const currentUserId = req.user?._id
            ? req.user._id.toString()
            : (req.foodPartner?._id ? req.foodPartner._id.toString() : null);

        const foodItems = await foodModel
            .find({})
            .populate("foodPartner", "name address")
            .lean();

        const formattedFoodItems = foodItems.map((item) => ({
            ...item,
            isLiked: currentUserId && Array.isArray(item.likes)
                ? item.likes.some((id) => id.toString() === currentUserId)
                : false,
            isSaved: currentUserId && Array.isArray(item.saves)
                ? item.saves.some((id) => id.toString() === currentUserId)
                : false,
        }));

        res.status(200).json({
            message: "Food items fetched successfully",
            foodItems: formattedFoodItems
        });
    } catch (error) {
        console.error("Error fetching food items:", error);
        res.status(500).json({
            message: "Server error while fetching food items"
        });
    }
}

// ── Get Food Partner Public Details ──────────────────────────────────────────
async function getFoodPartnerDetails(req, res) {
    try {
        const foodPartnerId = req.params.id;
        const currentUserId = req.user?._id
            ? req.user._id.toString()
            : (req.foodPartner?._id ? req.foodPartner._id.toString() : null);

        const foodPartner = await foodPartnerModel.findById(foodPartnerId);
        if (!foodPartner) {
            return res.status(404).json({
                message: "Food partner not found"
            });
        }

        const foodItems = await foodModel
            .find({ foodPartner: foodPartnerId })
            .populate("foodPartner", "name address")
            .lean();

        const formattedFoodItems = foodItems.map((item) => ({
            ...item,
            isLiked: currentUserId && Array.isArray(item.likes)
                ? item.likes.some((id) => id.toString() === currentUserId)
                : false,
            isSaved: currentUserId && Array.isArray(item.saves)
                ? item.saves.some((id) => id.toString() === currentUserId)
                : false,
        }));

        res.status(200).json({
            message: "Food partner details fetched successfully",
            foodPartner: {
                _id: foodPartner._id,
                name: foodPartner.name,
                contactName: foodPartner.contactName,
                phone: foodPartner.phone,
                email: foodPartner.email,
                address: foodPartner.address,
                foodItems: formattedFoodItems,
                totalMeals: formattedFoodItems.length
            }
        });
    } catch (error) {
        console.error("Error fetching food partner details:", error);
        res.status(500).json({
            message: "Server error"
        });
    }
}

// ── Get Own Food Partner Foods (protected) ────────────────────────────────────
async function getFoodPartnerFoods(req, res) {
    try {
        const foodPartnerId = req.foodPartner._id;
        const currentUserId = foodPartnerId.toString();

        const foodItems = await foodModel
            .find({ foodPartner: foodPartnerId })
            .populate("foodPartner", "name address")
            .lean();

        const formattedFoodItems = foodItems.map((item) => ({
            ...item,
            isLiked: currentUserId && Array.isArray(item.likes)
                ? item.likes.some((id) => id.toString() === currentUserId)
                : false,
            isSaved: currentUserId && Array.isArray(item.saves)
                ? item.saves.some((id) => id.toString() === currentUserId)
                : false,
        }));

        res.status(200).json({
            message: "Food partner foods fetched successfully",
            foodItems: formattedFoodItems,
            totalMeals: formattedFoodItems.length
        });
    } catch (error) {
        console.error("Error fetching food partner foods:", error);
        res.status(500).json({
            message: "Server error"
        });
    }
}

// ── Like / Unlike Food ────────────────────────────────────────────────────────
async function likeFood(req, res) {
    try {
        const { foodId } = req.body;
        const userId = req.user._id;

        const food = await foodModel.findById(foodId);
        if (!food) {
            return res.status(404).json({ message: "Food not found" });
        }

        const alreadyLiked = food.likes.some(
            (id) => id.toString() === userId.toString()
        );

        if (alreadyLiked) {
            food.likes = food.likes.filter(
                (id) => id.toString() !== userId.toString()
            );
            food.likeCount = Math.max(0, food.likeCount - 1);
        } else {
            food.likes.push(userId);
            food.likeCount += 1;
        }

        await food.save();

        res.status(200).json({
            message: alreadyLiked ? "Food unliked" : "Food liked",
            like: !alreadyLiked,
            likeCount: food.likeCount
        });
    } catch (error) {
        console.error("Error liking food:", error);
        res.status(500).json({ message: "Server error" });
    }
}

// ── Save / Unsave Food ────────────────────────────────────────────────────────
async function saveFood(req, res) {
    try {
        const { foodId } = req.body;
        const userId = req.user._id;

        const food = await foodModel.findById(foodId);
        if (!food) {
            return res.status(404).json({ message: "Food not found" });
        }

        const alreadySaved = food.saves.some(
            (id) => id.toString() === userId.toString()
        );

        if (alreadySaved) {
            food.saves = food.saves.filter(
                (id) => id.toString() !== userId.toString()
            );
            food.savesCount = Math.max(0, food.savesCount - 1);
        } else {
            food.saves.push(userId);
            food.savesCount += 1;
        }

        await food.save();

        res.status(200).json({
            message: alreadySaved ? "Food unsaved" : "Food saved",
            save: !alreadySaved,
            savesCount: food.savesCount
        });
    } catch (error) {
        console.error("Error saving food:", error);
        res.status(500).json({ message: "Server error" });
    }
}

// ── Get Saved Foods ───────────────────────────────────────────────────────────
async function getSavedFoods(req, res) {
    try {
        const userId = req.user._id;
        const currentUserId = userId.toString();

        const savedFoods = await foodModel
            .find({ saves: userId })
            .populate("foodPartner", "name address")
            .lean();

        res.status(200).json({
            message: "Saved foods fetched successfully",
            savedFoods: savedFoods.map((food) => ({
                food: {
                    _id: food._id,
                    name: food.name,
                    video: food.video,
                    description: food.description,
                    likeCount: food.likeCount,
                    savesCount: food.savesCount,
                    commentsCount: food.commentsCount,
                    foodPartner: food.foodPartner,
                    likes: food.likes,
                    saves: food.saves,
                    isLiked: currentUserId && Array.isArray(food.likes)
                        ? food.likes.some((id) => id.toString() === currentUserId)
                        : false,
                    isSaved: true
                }
            }))
        });
    } catch (error) {
        console.error("Error fetching saved foods:", error);
        res.status(500).json({ message: "Server error" });
    }
}

// ── Add Comment ───────────────────────────────────────────────────────────────
async function addComment(req, res) {
    try {
        const { foodId, text } = req.body;
        const userId = req.user._id;

        if (!foodId || !text || !text.trim()) {
            return res.status(400).json({
                message: "Food ID and comment text are required"
            });
        }

        const food = await foodModel.findById(foodId);
        if (!food) {
            return res.status(404).json({ message: "Food not found" });
        }

        const comment = await commentModel.create({
            text: text.trim(),
            user: userId,
            food: foodId
        });

        food.commentsCount = (food.commentsCount || 0) + 1;
        await food.save();

        const authorName = req.foodPartner
            ? (req.foodPartner.name || req.foodPartner.contactName || 'Food Partner')
            : (req.user?.fullName || 'User');

        const populatedComment = {
            ...comment.toObject(),
            user: {
                _id: userId,
                fullName: authorName
            }
        };

        res.status(201).json({
            message: "Comment added successfully",
            comment: populatedComment
        });
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: "Server error" });
    }
}

// ── Get Comments ──────────────────────────────────────────────────────────────
async function getComments(req, res) {
    try {
        const { foodId } = req.params;

        const comments = await commentModel
            .find({ food: foodId })
            .sort({ createdAt: -1 })
            .lean();

        // Get user IDs and partner IDs
        const userIds = comments.map(c => c.user).filter(Boolean);
        const [users, partners] = await Promise.all([
            userModel.find({ _id: { $in: userIds } }, 'fullName email').lean(),
            foodPartnerModel.find({ _id: { $in: userIds } }, 'name contactName email').lean()
        ]);

        const userMap = new Map(users.map(u => [u._id.toString(), { _id: u._id, fullName: u.fullName }]));
        const partnerMap = new Map(partners.map(p => [p._id.toString(), { _id: p._id, fullName: p.name || p.contactName || 'Food Partner' }]));

        const populated = comments.map(c => {
            const uid = c.user ? c.user.toString() : null;
            const author = (uid && (userMap.get(uid) || partnerMap.get(uid))) || { _id: c.user, fullName: 'User' };
            return {
                ...c,
                user: author
            };
        });

        res.status(200).json({
            message: "Comments fetched successfully",
            comments: populated
        });
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ message: "Server error" });
    }
}

// ── Delete Comment ────────────────────────────────────────────────────────────
async function deleteComment(req, res) {
    try {
        const { commentId } = req.params;
        const currentUserId = (req.user && req.user._id)
            ? req.user._id.toString()
            : (req.foodPartner && req.foodPartner._id ? req.foodPartner._id.toString() : '');

        if (!currentUserId) {
            return res.status(401).json({ message: "Please login first" });
        }

        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: "Invalid comment ID" });
        }

        const comment = await commentModel.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const commentAuthorId = comment.user?._id
            ? comment.user._id.toString()
            : (comment.user ? comment.user.toString() : '');

        // Only the comment author can delete (strictly enforce ownership)
        if (!commentAuthorId || commentAuthorId !== currentUserId) {
            return res.status(403).json({
                message: "Not authorized to delete this comment"
            });
        }

        await commentModel.findByIdAndDelete(commentId);

        // Decrement comment count on the food item
        const food = await foodModel.findById(comment.food);
        if (food) {
            await foodModel.findByIdAndUpdate(comment.food, {
                $set: { commentsCount: Math.max(0, (food.commentsCount || 1) - 1) }
            });
        }

        return res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.error("Error deleting comment:", error);
        return res.status(500).json({ message: "Server error" });
    }
}

// ── Delete Food Reel (partner only, own reels only) ───────────────────────────
async function deleteFood(req, res) {
    try {
        const foodId = req.params.id;
        const partnerId = req.foodPartner?._id ? req.foodPartner._id.toString() : '';

        if (!partnerId) {
            return res.status(401).json({ message: "Please login first" });
        }

        if (!mongoose.Types.ObjectId.isValid(foodId)) {
            return res.status(400).json({ message: "Invalid reel ID" });
        }

        const food = await foodModel.findById(foodId);
        if (!food) {
            return res.status(404).json({ message: "Food not found" });
        }

        const foodPartnerId = food.foodPartner?._id
            ? food.foodPartner._id.toString()
            : (food.foodPartner ? food.foodPartner.toString() : '');

        if (!foodPartnerId || foodPartnerId !== partnerId) {
            return res.status(403).json({
                message: "Not authorized to delete this reel"
            });
        }

        await foodModel.findByIdAndDelete(foodId);
        await commentModel.deleteMany({ food: foodId });

        return res.status(200).json({ message: "Reel deleted successfully" });
    } catch (error) {
        console.error("Error deleting food reel:", error);
        return res.status(500).json({ message: "Server error" });
    }
}

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
    createFood,
    getFoodItems,
    getFoodPartnerDetails,
    getFoodPartnerFoods,
    likeFood,
    saveFood,
    getSavedFoods,
    addComment,
    getComments,
    deleteComment,
    deleteFood
};
