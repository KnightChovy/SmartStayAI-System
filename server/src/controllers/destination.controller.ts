import { Request, Response } from 'express';
import pick from '../utils/pick';
import catchAsync from '../utils/catchAsync';
import { destinationService } from '../services';
import type { DestinationSuggestFilter } from '../dto/destination.dto';

export class DestinationController {
  // [Public] Danh sách điểm đến (thành phố + số khách sạn)
  listDestinations = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const result = await destinationService.listDestinations();
    res.send(result);
  });

  // [Public] Gợi ý điểm đến khi gõ
  suggestDestinations = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['q', 'limit']) as DestinationSuggestFilter;
    const result = await destinationService.suggestDestinations(filter);
    res.send(result);
  });
}

export const destinationController = new DestinationController();
