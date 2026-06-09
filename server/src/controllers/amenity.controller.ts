import httpStatus from 'http-status';
import { Request, Response } from 'express';
import pick from '../utils/pick';
import catchAsync from '../utils/catchAsync';
import { amenityService } from '../services';

export class AmenityController {
  listAmenities = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['category']);
    const amenities = await amenityService.listAmenities(filter);
    res.send(amenities);
  });

  createAmenity = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const amenity = await amenityService.createAmenity(req.body);
    res.status(httpStatus.CREATED).send(amenity);
  });
}

export const amenityController = new AmenityController();
