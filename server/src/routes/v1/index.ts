import express from 'express';
import authRoute from './auth.route';
import userRoute from './user.route';
import uploadRoute from './upload.route';
import hotelPartnerRoute from './hotel-partner.route';
import hotelRoute from './hotel.route';
import bookingRoute from './booking.route';
import paymentRoute from './payment.route';
import conversationRoute from './conversation.route';
import amenityRoute from './amenity.route';
import internalRoute from './internal.route';
import adminRoute from './admin.route';
import docsRoute from './docs.route';
import config from '../../config/config';

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/uploads',
    route: uploadRoute,
  },
  {
    path: '/hotel-partners',
    route: hotelPartnerRoute,
  },
  {
    path: '/hotels',
    route: hotelRoute,
  },
  {
    path: '/bookings',
    route: bookingRoute,
  },
  {
    path: '/payments',
    route: paymentRoute,
  },
  {
    path: '/conversations',
    route: conversationRoute,
  },
  {
    path: '/amenities',
    route: amenityRoute,
  },
  {
    // Endpoint nội bộ cho cron ngoài (bảo vệ bằng x-cron-secret, không phải JWT user)
    path: '/internal',
    route: internalRoute,
  },
  {
    // Khu quản trị toàn sàn (admin / platform_manager)
    path: '/admin',
    route: adminRoute,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

export default router;
