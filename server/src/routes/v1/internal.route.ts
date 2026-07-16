import express from 'express';
import cronAuth from '../../middlewares/cronAuth';
import { jobController } from '../../controllers';

const router = express.Router();

// Nút KÍCH TAY các job nền — KHÔNG dùng JWT user, bảo vệ bằng header x-cron-secret (cronAuth).
// Dùng POST để crawler/prefetch không vô tình kích job.
// Lưu ý: các job này ĐÃ tự chạy theo lịch trong config/scheduler.ts; đây chỉ để chạy ngay khi cần
// (mọi job đều idempotent nên gọi chồng với scheduler cũng vô hại).
router.post('/jobs/release-holds', cronAuth, jobController.releaseHolds);
router.post('/jobs/sweep-no-shows', cronAuth, jobController.sweepNoShows);
router.post('/jobs/settle-commissions', cronAuth, jobController.settleCommissions);
router.post('/jobs/auto-approve-refunds', cronAuth, jobController.autoApproveRefunds);

export default router;
