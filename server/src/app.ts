import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
// @ts-ignore
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import cors from 'cors';
import passport from 'passport';
import httpStatus from 'http-status';
import config from './config/config';
import * as morgan from './config/morgan';
import { jwtStrategy } from './config/passport';
import { authLimiter } from './middlewares/rateLimiter';
import routes from './routes/v1';
import { errorConverter, errorHandler } from './middlewares/error';
import ApiError from './utils/ApiError';

const app = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression.
// SSE phải chừa ra: `compressible()` coi mọi 'text/*' là nén được (khớp regex ^text/), nên
// text/event-stream bị gom vào buffer nén và chỉ xả khi res.end() — chatbot stream mất sạch hiệu ứng
// gõ dần (đo thật: 7 lần đẩy còn 1 lần, tới ở đúng mốc cuối). Response khác vẫn nén như cũ.
app.use(
  compression({
    filter: (req: Request, res: Response) => {
      if (String(res.getHeader('Content-Type') ?? '').includes('text/event-stream')) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

// enable cors
app.use(cors());
app.options('*', cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints (skip only in tests)
if (config.env !== 'test') {
  app.use('/v1/auth', authLimiter);
}

// Health-check: Render ping '/' để xác định service sống — trả 200 (tránh spam log 404 ở root)
app.get('/', (_req: Request, res: Response) => {
  res.send({ status: 'ok', service: 'SmartStay AI API', docs: '/v1/docs' });
});
app.get('/health', (_req: Request, res: Response) => {
  res.send({ status: 'ok' });
});

// v1 api routes
app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
