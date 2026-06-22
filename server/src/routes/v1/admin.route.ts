import express from 'express';
import auth from '../../middlewares/auth';
import { adminController } from '../../controllers';

const router = express.Router();

// Tổng quan toàn sàn — chỉ admin / platform_manager (quyền viewPlatformStats)
router.get('/overview', auth('viewPlatformStats'), adminController.getOverview);

export default router;
