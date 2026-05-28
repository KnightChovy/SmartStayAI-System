"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const config_1 = __importDefault(require("./config"));
const pool = new pg_1.Pool({ connectionString: config_1.default.prisma.url });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({
    adapter,
    log: config_1.default.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});
exports.default = prisma;
