"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Optimize Prisma Client with connection pooling settings
exports.prisma = globalThis.__prisma ?? new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});
if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = exports.prisma;
}
//# sourceMappingURL=prisma.js.map