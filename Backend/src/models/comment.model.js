const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true
        },

        food: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "food",
            required: true
        }
    },
    {
        timestamps: true
    }
);

const commentModel = mongoose.model("comment", commentSchema);

module.exports = commentModel;