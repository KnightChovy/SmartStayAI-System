declare module 'xss-clean';
declare module 'express-rate-limit';
declare module 'swagger-jsdoc';
declare module 'swagger-ui-express';

declare namespace Express {
  // Passport attaches the authenticated Prisma user to req.user
  interface User extends import('@prisma/client').User {}
}
