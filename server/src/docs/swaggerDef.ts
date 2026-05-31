import config from '../config/config';
import packageInfo from '../../package.json';

const { version } = packageInfo;

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

export default swaggerDef;
