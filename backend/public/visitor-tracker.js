/**
 * Intelligent Visitor Tracking System
 * Filters out bots by tracking real user interactions
 */
(function () {
    'use strict';

    // Configuration
    const CONFIG = {
        API_BASE: '/api/v2/visitor',
        INTERACTION_THRESHOLD: {
            minTimeSpent: 3, // seconds
            minScrollDepth: 100, // pixels
            minMouseMoves: 5,
        },
        UPDATE_INTERVAL: 5000, // Send updates every 5 seconds
    };

    // State
    let state = {
        sessionId: null,
        startTime: Date.now(),
        scrollDepth: 0,
        clicks: 0,
        mouseMoves: 0,
        isTracked: false,
        updateTimer: null,
    };

    /**
     * Generate a unique session ID
     */
    function generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    }

    /**
     * Get current time spent on page in seconds
     */
    function getTimeSpent() {
        return Math.floor((Date.now() - state.startTime) / 1000);
    }

    /**
     * Send data to API
     */
    async function sendToAPI(endpoint, data) {
        try {
            const response = await fetch(CONFIG.API_BASE + endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            return await response.json();
        } catch (error) {
            console.error('Tracking error:', error);
            return null;
        }
    }

    /**
     * Initialize tracking
     */
    async function initTracking() {
        state.sessionId = generateSessionId();

        const result = await sendToAPI('/track', {
            sessionId: state.sessionId,
            pageUrl: window.location.pathname,
            referrer: document.referrer,
        });

        if (result) {
            state.isTracked = true;
            startInteractionTracking();
        }
    }

    /**
     * Update interaction data
     */
    async function updateInteraction() {
        if (!state.isTracked) return;

        const timeSpent = getTimeSpent();

        await sendToAPI('/interaction', {
            sessionId: state.sessionId,
            scrollDepth: state.scrollDepth,
            clicks: state.clicks,
            mouseMoves: state.mouseMoves,
            timeSpent: timeSpent,
        });
    }

    /**
     * Track scroll depth
     */
    function trackScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        const scrollDepth = scrollTop + windowHeight;
        state.scrollDepth = Math.max(state.scrollDepth, scrollDepth);
    }

    /**
     * Track mouse movement (debounced)
     */
    let mouseMoveTimeout;
    function trackMouseMove() {
        clearTimeout(mouseMoveTimeout);
        mouseMoveTimeout = setTimeout(() => {
            state.mouseMoves++;
        }, 100);
    }

    /**
     * Track clicks
     */
    function trackClick() {
        state.clicks++;
    }

    /**
     * Track store link clicks
     */
    async function trackStoreClick(store) {
        if (!state.isTracked) return;

        await sendToAPI('/store-click', {
            sessionId: state.sessionId,
            store: store,
        });
    }

    /**
     * Start tracking user interactions
     */
    function startInteractionTracking() {
        // Scroll tracking
        window.addEventListener('scroll', trackScroll, { passive: true });

        // Mouse movement tracking
        document.addEventListener('mousemove', trackMouseMove, { passive: true });

        // Click tracking
        document.addEventListener('click', trackClick, { passive: true });

        // Store link tracking
        const playStoreLinks = document.querySelectorAll('a[href*="play.google.com"]');
        playStoreLinks.forEach(link => {
            link.addEventListener('click', () => trackStoreClick('playStore'));
        });

        const appStoreLinks = document.querySelectorAll('a[href*="apps.apple.com"]');
        appStoreLinks.forEach(link => {
            link.addEventListener('click', () => trackStoreClick('appStore'));
        });

        // Periodic updates
        state.updateTimer = setInterval(updateInteraction, CONFIG.UPDATE_INTERVAL);

        // Update on page unload
        window.addEventListener('beforeunload', () => {
            clearInterval(state.updateTimer);
            updateInteraction();
        });

        // Update on visibility change (tab switch)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                updateInteraction();
            }
        });
    }

    /**
     * Initialize on page load
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTracking);
    } else {
        initTracking();
    }

    // Expose tracking function for manual tracking if needed
    window.MurmliTracker = {
        trackStoreClick: trackStoreClick,
    };
})();
