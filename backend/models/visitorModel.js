const mongoose = require("mongoose");
const { Schema } = mongoose;

const visitorSchema = new Schema(
    {
        sessionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        ipHash: {
            type: String,
            required: true,
        },
        userAgent: {
            type: String,
        },
        referrer: {
            type: String,
        },
        pageUrl: {
            type: String,
        },
        // Interaction metrics to filter out bots
        interactions: {
            scrollDepth: {
                type: Number,
                default: 0,
            },
            clicks: {
                type: Number,
                default: 0,
            },
            mouseMoves: {
                type: Number,
                default: 0,
            },
            timeSpent: {
                type: Number, // in seconds
                default: 0,
            },
        },
        // Store link tracking
        storeClicks: {
            playStore: {
                type: Boolean,
                default: false,
            },
            appStore: {
                type: Boolean,
                default: false,
            },
        },
        // Flag to indicate if this was a real user (not a bot)
        isRealUser: {
            type: Boolean,
            default: false,
        },
        // Timestamp when the visitor was marked as real
        confirmedAt: {
            type: Date,
        },
        visitedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Index for querying statistics
visitorSchema.index({ visitedAt: -1 });
visitorSchema.index({ isRealUser: 1 });

const Visitor = mongoose.model("visitors", visitorSchema);
module.exports = Visitor;
