import express from 'express';
import validate from '../../middlewares/validate';
import { promotionValidation } from '../../validations';
import { promotionController } from '../../controllers';

const router = express.Router();

// Danh sách deal đang hiệu lực — public, không auth. Trang /deals của guest.
router.get('/', validate(promotionValidation.listDeals), promotionController.listDeals);

export default router;
