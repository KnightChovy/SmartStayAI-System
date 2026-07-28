import { Request, Response } from 'express';
import pick from '../utils/pick';
import catchAsync from '../utils/catchAsync';
import { promotionService } from '../services';

export class PromotionController {
  // [Public] Danh sách deal cho trang /deals
  listDeals = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['limit', 'city']);
    const deals = await promotionService.listPublicDeals(filter);
    res.send(deals);
  });
}

export const promotionController = new PromotionController();
