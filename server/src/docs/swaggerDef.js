const { version } = require('../../package.json');
const config = require('../config/config');

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
      url: `http://localhost:${config.port}/v1`,
    },
  ],
};

module.exports = swaggerDef;
