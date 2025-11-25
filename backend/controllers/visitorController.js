const Visitor = require("../models/visitorModel");
const crypto = require("crypto");

/**
 * Hash an IP address for privacy
 */
function hashIP(ip) {
    return crypto.createHash("sha256").update(ip + process.env.IP_SALT || "murmli-salt").digest("hex");
}

/**
 * Check if visitor meets real user criteria
 */
function isRealUserInteraction(interactions) {
    const { scrollDepth, clicks, mouseMoves, timeSpent } = interactions;

    // Criteria for real user:
    // - At least 3 seconds on page
    // - AND (scrolled OR clicked OR moved mouse significantly)
    const hasTimeSpent = timeSpent >= 3;
    const hasInteraction = scrollDepth > 100 || clicks > 0 || mouseMoves > 5;

    return hasTimeSpent && hasInteraction;
}

/**
 * @swagger
 * /api/v2/visitor/track:
 *   post:
 *     summary: Track a new visitor
 *     tags: [Visitor]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *               pageUrl:
 *                 type: string
 *               referrer:
 *                 type: string
 *     responses:
 *       201:
 *         description: Visitor tracked successfully
 *       400:
 *         description: Invalid request
 */
exports.trackVisitor = async (req, res) => {
    try {
        const { sessionId, pageUrl, referrer } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: "Session ID is required" });
        }

        // Get IP address from request
        const ip = req.ip || req.connection.remoteAddress || "unknown";
        const ipHash = hashIP(ip);

        // Get user agent
        const userAgent = req.get("user-agent") || "unknown";

        // Check if session already exists
        const existingVisitor = await Visitor.findOne({ sessionId });
        if (existingVisitor) {
            return res.status(200).json({ message: "Session already tracked", visitorId: existingVisitor._id });
        }

        // Create new visitor entry
        const visitor = new Visitor({
            sessionId,
            ipHash,
            userAgent,
            referrer: referrer || req.get("referer") || "direct",
            pageUrl: pageUrl || "/",
        });

        await visitor.save();

        res.status(201).json({ message: "Visitor tracked", visitorId: visitor._id });
    } catch (error) {
        console.error("Error tracking visitor:", error);
        res.status(500).json({ error: "Failed to track visitor" });
    }
};

/**
 * @swagger
 * /api/v2/visitor/interaction:
 *   post:
 *     summary: Update visitor interaction data
 *     tags: [Visitor]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *               scrollDepth:
 *                 type: number
 *               clicks:
 *                 type: number
 *               mouseMoves:
 *                 type: number
 *               timeSpent:
 *                 type: number
 *     responses:
 *       200:
 *         description: Interaction updated successfully
 *       404:
 *         description: Visitor not found
 */
exports.updateInteraction = async (req, res) => {
    try {
        const { sessionId, scrollDepth, clicks, mouseMoves, timeSpent } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: "Session ID is required" });
        }

        const visitor = await Visitor.findOne({ sessionId });
        if (!visitor) {
            return res.status(404).json({ error: "Visitor not found" });
        }

        // Update interaction data
        if (scrollDepth !== undefined) visitor.interactions.scrollDepth = Math.max(visitor.interactions.scrollDepth, scrollDepth);
        if (clicks !== undefined) visitor.interactions.clicks = clicks;
        if (mouseMoves !== undefined) visitor.interactions.mouseMoves = mouseMoves;
        if (timeSpent !== undefined) visitor.interactions.timeSpent = timeSpent;

        // Check if visitor should be marked as real user
        if (!visitor.isRealUser && isRealUserInteraction(visitor.interactions)) {
            visitor.isRealUser = true;
            visitor.confirmedAt = new Date();
        }

        await visitor.save();

        res.status(200).json({
            message: "Interaction updated",
            isRealUser: visitor.isRealUser
        });
    } catch (error) {
        console.error("Error updating interaction:", error);
        res.status(500).json({ error: "Failed to update interaction" });
    }
};

/**
 * @swagger
 * /api/v2/visitor/store-click:
 *   post:
 *     summary: Track store link clicks
 *     tags: [Visitor]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - store
 *             properties:
 *               sessionId:
 *                 type: string
 *               store:
 *                 type: string
 *                 enum: [playStore, appStore]
 *     responses:
 *       200:
 *         description: Store click tracked successfully
 *       404:
 *         description: Visitor not found
 */
exports.trackStoreClick = async (req, res) => {
    try {
        const { sessionId, store } = req.body;

        if (!sessionId || !store) {
            return res.status(400).json({ error: "Session ID and store are required" });
        }

        const visitor = await Visitor.findOne({ sessionId });
        if (!visitor) {
            return res.status(404).json({ error: "Visitor not found" });
        }

        // Update store click
        if (store === "playStore") {
            visitor.storeClicks.playStore = true;
        } else if (store === "appStore") {
            visitor.storeClicks.appStore = true;
        }

        // Increment clicks counter
        visitor.interactions.clicks += 1;

        await visitor.save();

        res.status(200).json({ message: "Store click tracked" });
    } catch (error) {
        console.error("Error tracking store click:", error);
        res.status(500).json({ error: "Failed to track store click" });
    }
};

/**
 * @swagger
 * /api/v2/visitor/stats:
 *   get:
 *     summary: Get visitor statistics (admin only)
 *     tags: [Visitor]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to include in statistics
 *     responses:
 *       200:
 *         description: Visitor statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalVisitors:
 *                   type: number
 *                 realUsers:
 *                   type: number
 *                 bots:
 *                   type: number
 *                 playStoreClicks:
 *                   type: number
 *                 appStoreClicks:
 *                   type: number
 *                 conversionRate:
 *                   type: number
 */
exports.getStats = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get all visitors in the date range
        const visitors = await Visitor.find({
            visitedAt: { $gte: startDate }
        });

        const totalVisitors = visitors.length;
        const realUsers = visitors.filter(v => v.isRealUser).length;
        const bots = totalVisitors - realUsers;
        const playStoreClicks = visitors.filter(v => v.storeClicks.playStore).length;
        const appStoreClicks = visitors.filter(v => v.storeClicks.appStore).length;
        const totalStoreClicks = playStoreClicks + appStoreClicks;
        const conversionRate = realUsers > 0 ? (totalStoreClicks / realUsers * 100).toFixed(2) : 0;

        // Get daily stats for the last 7 days
        const dailyStats = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const dayVisitors = visitors.filter(v => {
                const visitDate = new Date(v.visitedAt);
                return visitDate >= date && visitDate < nextDate;
            });

            dailyStats.push({
                date: date.toISOString().split('T')[0],
                total: dayVisitors.length,
                realUsers: dayVisitors.filter(v => v.isRealUser).length,
                playStoreClicks: dayVisitors.filter(v => v.storeClicks.playStore).length,
                appStoreClicks: dayVisitors.filter(v => v.storeClicks.appStore).length,
            });
        }

        res.status(200).json({
            period: `Last ${days} days`,
            totalVisitors,
            realUsers,
            bots,
            playStoreClicks,
            appStoreClicks,
            totalStoreClicks,
            conversionRate: parseFloat(conversionRate),
            dailyStats,
        });
    } catch (error) {
        console.error("Error getting visitor stats:", error);
        res.status(500).json({ error: "Failed to get visitor statistics" });
    }
};
