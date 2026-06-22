import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { userValidation } from '../../validations';
import { userController } from '../../controllers';

const router = express.Router();

router
  .route('/')
  .post(auth('manageUsers'), validate(userValidation.createUser), userController.createUser)
  .get(auth('getUsers'), validate(userValidation.getUsers), userController.getUsers);

router
  .route('/:userId')
  .get(auth('getUsers'), validate(userValidation.getUser), userController.getUser)
  .patch(auth('manageUsers'), validate(userValidation.updateUser), userController.updateUser)
  .delete(auth('manageUsers'), validate(userValidation.deleteUser), userController.deleteUser);

// [Admin] Đổi trạng thái tài khoản (suspend/active/inactive) — quyền manageUsers
router.patch(
  '/:userId/status',
  auth('manageUsers'),
  validate(userValidation.updateUserStatus),
  userController.updateStatus
);

// [Admin] Đổi vai trò — quyền manageRoles (chỉ admin, platform_manager KHÔNG có)
router.patch('/:userId/role', auth('manageRoles'), validate(userValidation.updateUserRole), userController.updateRole);

export default router;

