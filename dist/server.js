"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes"));
const zoneDigestCron_1 = require("./scripts/zoneDigestCron");
const paymentRemindersCron_1 = require("./scripts/paymentRemindersCron");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '4000', 10);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'duRent API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 4000,
        deployment_test: 'zone-notifications-v2'
    });
});
// Root endpoint for Railway health checks
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'duRent API is running',
        version: '1.0.0'
    });
});
app.use('/api', routes_1.default);
// Enhanced error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📱 Mobile access: http://192.168.1.135:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    // Start cron jobs
    (0, zoneDigestCron_1.startZoneDigestCron)();
    (0, paymentRemindersCron_1.startPaymentRemindersCron)();
});
// Graceful shutdown for Railway
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});
//# sourceMappingURL=server.js.map