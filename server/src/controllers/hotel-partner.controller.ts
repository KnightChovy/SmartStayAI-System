import httpStatus from 'http-status';
import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import pick from '../utils/pick';
import catchAsync from '../utils/catchAsync';
import { hotelPartnerService } from '../services';

export class HotelPartnerController {
  submitRegistration = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const userId = (req.user as User).id;
    const request = await hotelPartnerService.registerHotel(userId, req.body);
    res.status(httpStatus.CREATED).send(request);
  });

  getMyRequests = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const userId = (req.user as User).id;
    const requests = await hotelPartnerService.getMyRequests(userId);
    res.send(requests);
  });

  getRequest = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const request = await hotelPartnerService.getRequestById(req.params.requestId as string, req.user as User);
    res.send(request);
  });

  listRequests = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['status']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await hotelPartnerService.listRequests(filter, options);
    res.send(result);
  });

  reviewRequest = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const reviewerId = (req.user as User).id;
    const request = await hotelPartnerService.reviewRequest(req.params.requestId as string, reviewerId, req.body);
    res.send(request);
  });

  reviewDocument = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const reviewerId = (req.user as User).id;
    const document = await hotelPartnerService.reviewDocument(req.params.documentId as string, reviewerId, req.body);
    res.send(document);
  });

  replaceDocument = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const document = await hotelPartnerService.replaceDocument(
      req.params.documentId as string,
      req.user as User,
      req.body.fileUrl
    );
    res.status(httpStatus.CREATED).send(document);
  });
}

export const hotelPartnerController = new HotelPartnerController();
