import { autoAcceptExpiredRequests } from '../controllers/endRentalController';

// Create mock request and response for the controller
const mockReq = {} as any;
const mockRes = {
  json: (data: any) => {
    console.log('Auto-accept results:', data);
    return mockRes;
  },
  status: (code: number) => {
    console.log('Status:', code);
    return mockRes;
  }
} as any;

// Run the auto-accept function
console.log('🔄 Running auto-accept for expired end requests...');
autoAcceptExpiredRequests(mockReq, mockRes)
  .then(() => {
    console.log('✅ Auto-accept job completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Auto-accept job failed:', error);
    process.exit(1);
  });