import express from 'express';
import authRoute from './auth.route';
import userRoute from './user.route';
import uploadRoute from './upload.route';
import hotelPartnerRoute from './hotel-partner.route';
import hotelRoute from './hotel.route';
import bookingRoute from './booking.route';
import paymentRoute from './payment.route';
import conversationRoute from './conversation.route';
import reviewRoute from './review.route';
import amenityRoute from './amenity.route';
import internalRoute from './internal.route';
import adminRoute from './admin.route';
import platformManagerRoute from './platform-manager.route';
import notificationRoute from './notification.route';
import dealRoute from './deal.route';
import platformRoute from './platform.route';
import destinationRoute from './destination.route';
import docsRoute from './docs.route';

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
    path: '/reviews',
    route: reviewRoute,
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
  {
    // Analytics & hiệu suất toàn sàn cho Platform Manager (admin cũng truy cập được)
    path: '/platform-manager',
    route: platformManagerRoute,
  },
  {
    // Thông báo của người dùng đang đăng nhập (in-app notifications)
    path: '/notifications',
    route: notificationRoute,
  },
  {
    // Deal công khai cho trang /deals — không auth
    path: '/deals',
    route: dealRoute,
  },
  {
    // Số liệu tổng của sàn cho trang chủ — public
    path: '/platform',
    route: platformRoute,
  },
  {
    // Điểm đến (thành phố) + gợi ý autocomplete — public
    path: '/destinations',
    route: destinationRoute,
  },
  {
    // Swagger UI — bật ở MỌI môi trường (kể cả production) để FE/hội đồng xem tài liệu API khi deploy
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
