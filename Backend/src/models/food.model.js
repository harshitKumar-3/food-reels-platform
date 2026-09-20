const mongoose = require("mongoose")

const foodSchema = new mongoose.Schema({
    name: {
        type: String,
        required : true
    },

    video: {
        type : String,
        required : true,
    },

    description: {
        type : String,
    },

    foodPartner: {
        type : mongoose.Schema.Types.ObjectId,
        ref: "foodPartner"
    },

    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],

    saves: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],

    likeCount: {
        type: Number,
        default: 0
    },

    savesCount: {
        type: Number,
        default: 0
    },

    commentsCount: {
        type: Number,
        default: 0
    }
})

const foodModel = mongoose.model("food", foodSchema);

module.exports = foodModel;