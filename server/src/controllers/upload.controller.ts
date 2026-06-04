import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import { uploadService } from '../services';

export class UploadController {
  uploadFile = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded (field "file" is required)');
    }
    const folder = (req.query.folder as string) || 'misc';
    const result = await uploadService.uploadBuffer(req.file, folder);
    res.status(httpStatus.CREATED).send(result);
  });
}

export const uploadController = new UploadController();
