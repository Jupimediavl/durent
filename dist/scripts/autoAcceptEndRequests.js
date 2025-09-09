"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const endRentalController_1 = require("../controllers/endRentalController");
// Create mock request and response for the controller
const mockReq = {};
const mockRes = {
    json: (data) => {
        console.log('Auto-accept results:', data);
        return mockRes;
    },
    status: (code) => {
        console.log('Status:', code);
        return mockRes;
    }
};
// Run the auto-accept function
console.log('🔄 Running auto-accept for expired end requests...');
(0, endRentalController_1.autoAcceptExpiredRequests)(mockReq, mockRes)
    .then(() => {
    console.log('✅ Auto-accept job completed');
    process.exit(0);
})
    .catch((error) => {
    console.error('❌ Auto-accept job failed:', error);
    process.exit(1);
});
//# sourceMappingURL=autoAcceptEndRequests.js.map