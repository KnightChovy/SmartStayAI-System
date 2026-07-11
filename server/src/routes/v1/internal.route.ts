import express from 'express';
import cronAuth from '../../middlewares/cronAuth';
import { jobController } from '../../controllers';

const router = express.Router();

// Endpoint cho CRON NGOÀI (cron-job.org / crontab) gọi theo lịch — KHÔNG dùng JWT user,
// bảo vệ bằng header x-cron-secret (cronAuth). Dùng POST để crawler/prefetch không vô tình kích job.
router.post('/jobs/release-holds', cronAuth, jobController.releaseHolds);
router.post('/jobs/sweep-no-shows', cronAuth, jobController.sweepNoShows);
router.post('/jobs/settle-commissions', cronAuth, jobController.settleCommissions);

export default router;
