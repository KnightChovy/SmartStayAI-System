import express from 'express';
import { statsController } from '../../controllers';

const router = express.Router();

// Số liệu tổng của sàn cho trang chủ — public, không auth
router.get('/stats', statsController.getPublicStats);

export default router;
