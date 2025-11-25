const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Visitor = require('../models/visitorModel');

describe('Visitor Tracking API', () => {
    let sessionId;

    beforeAll(async () => {
        // Connect to test database
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.DB_STRING || 'mongodb://localhost:27017/murmli-test');
        }
    });

    afterAll(async () => {
        // Clean up test data
        await Visitor.deleteMany({ sessionId: { $regex: /^test_/ } });
        await mongoose.connection.close();
    });

    describe('POST /api/v2/visitor/track', () => {
        it('should create a new visitor entry', async () => {
            sessionId = 'test_' + Date.now();

            const response = await request(app)
                .post('/api/v2/visitor/track')
                .send({
                    sessionId,
                    pageUrl: '/',
                    referrer: 'https://google.com'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('visitorId');
            expect(response.body.message).toBe('Visitor tracked');
        });

        it('should not create duplicate sessions', async () => {
            const response = await request(app)
                .post('/api/v2/visitor/track')
                .send({
                    sessionId,
                    pageUrl: '/',
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Session already tracked');
        });
    });

    describe('POST /api/v2/visitor/interaction', () => {
        it('should update interaction data', async () => {
            const response = await request(app)
                .post('/api/v2/visitor/interaction')
                .send({
                    sessionId,
                    scrollDepth: 500,
                    clicks: 3,
                    mouseMoves: 10,
                    timeSpent: 5
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Interaction updated');
        });

        it('should mark visitor as real user when thresholds are met', async () => {
            const response = await request(app)
                .post('/api/v2/visitor/interaction')
                .send({
                    sessionId,
                    scrollDepth: 150,
                    clicks: 2,
                    mouseMoves: 8,
                    timeSpent: 4
                });

            expect(response.status).toBe(200);
            expect(response.body.isRealUser).toBe(true);

            // Verify in database
            const visitor = await Visitor.findOne({ sessionId });
            expect(visitor.isRealUser).toBe(true);
            expect(visitor.confirmedAt).toBeDefined();
        });
    });

    describe('POST /api/v2/visitor/store-click', () => {
        it('should track Play Store clicks', async () => {
            const response = await request(app)
                .post('/api/v2/visitor/store-click')
                .send({
                    sessionId,
                    store: 'playStore'
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Store click tracked');

            // Verify in database
            const visitor = await Visitor.findOne({ sessionId });
            expect(visitor.storeClicks.playStore).toBe(true);
        });

        it('should track App Store clicks', async () => {
            const response = await request(app)
                .post('/api/v2/visitor/store-click')
                .send({
                    sessionId,
                    store: 'appStore'
                });

            expect(response.status).toBe(200);

            // Verify in database
            const visitor = await Visitor.findOne({ sessionId });
            expect(visitor.storeClicks.appStore).toBe(true);
        });
    });

    describe('GET /api/v2/visitor/stats', () => {
        it('should return visitor statistics', async () => {
            const response = await request(app)
                .get('/api/v2/visitor/stats?days=1');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('totalVisitors');
            expect(response.body).toHaveProperty('realUsers');
            expect(response.body).toHaveProperty('bots');
            expect(response.body).toHaveProperty('playStoreClicks');
            expect(response.body).toHaveProperty('appStoreClicks');
            expect(response.body).toHaveProperty('conversionRate');
            expect(response.body).toHaveProperty('dailyStats');
        });
    });
});
