"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../config/config"));
const package_json_1 = __importDefault(require("../../package.json"));
const { version } = package_json_1.default;
const swaggerDef = {
    openapi: '3.0.0',
    info: {
        title: 'SmartStayAI Platform API Documentation',
        version,
        license: {
            name: 'MIT',
            url: 'https://github.com/KnightChovy/SmartStayAI-System/blob/main/LICENSE',
        },
    },
    servers: [
        {
            url: `http://localhost:${config_1.default.port}/v1`,
        },
    ],
};
exports.default = swaggerDef;
