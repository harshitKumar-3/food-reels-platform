const foodModel = require("../models/food.model")
const foodPartnerModel = require("../models/foodpartner.model")
const storageService = require("../services/storage.service")
const {v4: uuid} = require("uuid")

async function createFood(req,res){
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Video file is required"
            });
        }

        const extension = req.file.originalname ? req.file.originalname.split('.').pop() : '';
        const safeFileName = extension ? `${uuid()}.${extension}` : `${uuid()}`;
        const fileUploadResult = await storageService.uploadFile(req.file.buffer, safeFileName)

        const foodItem = await foodModel.create({
            name: req.body.name,
            description: req.body.description,
            video: fileUploadResult.url,
            foodPartner: req.foodPartner._id
        })

        res.status(200).json({
            message : "Food created successfully",
            food: foodItem
        })
    } catch (error) {
        console.error("Error creating food:", error);
        res.status(500).json({
            message: "Server error while creating food"
        });
    }
}

async function getFoodItems(req, res) {
    try {
        const foodItems = await foodModel
            .find({})
            .populate("foodPartner", "name address");

        res.status(200).json({
            message: "Food items fetched successfully",
            foodItems
        });
    } catch (error) {
        console.error("Error fetching food items:", error);

        res.status(500).json({
            message: "Server error while fetching food items"
        });
    }
}

async function getFoodPartnerDetails(req, res) {
    try {
        const foodPartnerId = req.params.id;

        const foodPartner = await foodPartnerModel.findById(foodPartnerId);
        if (!foodPartner) {
            return res.status(404).json({
                message: "Food partner not found"
            });
        }

        const foodItems = await foodModel.find({ foodPartner: foodPartnerId });

        res.status(200).json({
            message: "Food partner details fetched successfully",
            foodPartner: {
                _id: foodPartner._id,
                name: foodPartner.name,
                contactName: foodPartner.contactName,
                phone: foodPartner.phone,
                email: foodPartner.email,
                address: foodPartner.address,
                foodItems: foodItems,
                totalMeals: foodItems.length
            }
        });
    } catch (error) {
        console.error("Error fetching food partner details:", error);
        res.status(500).json({
            message: "Server error"
        });
    }
}

async function getFoodPartnerFoods(req, res) {
    try {
        const foodPartnerId = req.foodPartner._id; // Set by authFoodPartnerMiddleware

        const foodItems = await foodModel.find({ foodPartner: foodPartnerId });

        res.status(200).json({
            message: "Food partner foods fetched successfully",
            foodItems: foodItems,
            totalMeals: foodItems.length
        });
    } catch (error) {
        console.error("Error fetching food partner foods:", error);
        res.status(500).json({
            message: "Server error"
        });
    }
}

async function likeFood(req, res) {
    try {
        const { foodId } = req.body;
        const userId = req.user._id;

        const food = await foodModel.findById(foodId);
        if (!food) {
            return res.status(404).json({ message: "Food not found" });
        }

        const alreadyLiked = food.likes.includes(userId);
        
        if (alreadyLiked) {
            food.likes = food.likes.filter(id => id.toString() !== userId.toString());
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

async function saveFood(req, res) {
    try {
        const { foodId } = req.body;
        const userId = req.user._id;

        const food = await foodModel.findById(foodId);
        if (!food) {
            return res.status(404).json({ message: "Food not found" });
        }

        const alreadySaved = food.saves.includes(userId);
        
        if (alreadySaved) {
            food.saves = food.saves.filter(id => id.toString() !== userId.toString());
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

async function getSavedFoods(req, res) {
    try {
        const userId = req.user._id;

        const savedFoods = await foodModel.find({ saves: userId });

        res.status(200).json({
            message: "Saved foods fetched successfully",
            savedFoods: savedFoods.map(food => ({
                food: {
                    _id: food._id,
                    name: food.name,
                    video: food.video,
                    description: food.description,
                    likeCount: food.likeCount,
                    savesCount: food.savesCount,
                    commentsCount: food.commentsCount,
                    foodPartner: food.foodPartner
                }
            }))
        });
    } catch (error) {
        console.error("Error fetching saved foods:", error);
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    createFood,
    getFoodItems,
    getFoodPartnerDetails,
    getFoodPartnerFoods,
    likeFood,
    saveFood,
    getSavedFoods
}