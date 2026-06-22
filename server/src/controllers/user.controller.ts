import httpStatus from 'http-status';
import type { User } from '@prisma/client';
import pick from '../utils/pick';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';
import { userService } from '../services';
import { Request, Response } from 'express';

export class UserController {
  createUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const user = await userService.createUser(req.body);
    res.status(httpStatus.CREATED).send(user);
  });

  getUsers = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['name', 'role', 'status']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await userService.queryUsers(filter, options);
    res.send(result);
  });

  getUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const user = await userService.getUserById(req.params.userId as string);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    res.send(user);
  });

  updateUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const user = await userService.updateUserById(req.params.userId as string, req.body);
    res.send(user);
  });

  deleteUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
    await userService.deleteUserById(req.params.userId as string);
    res.status(httpStatus.NO_CONTENT).send();
  });

  // [Admin] Đổi trạng thái tài khoản (suspend/active/inactive)
  updateStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const user = await userService.setUserStatus(req.params.userId as string, req.body.status, req.user as User);
    res.send(user);
  });

  // [Admin, manageRoles] Đổi vai trò 1 user
  updateRole = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const user = await userService.setUserRole(req.params.userId as string, req.body.role, req.user as User);
    res.send(user);
  });
}

export const userController = new UserController();
