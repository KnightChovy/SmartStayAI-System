import express from 'express';
import validate from '../../middlewares/validate';
import { destinationValidation } from '../../validations';
import { destinationController } from '../../controllers';

const router = express.Router();

// '/suggest' (literal) đặt trước '/' cho rõ ràng — cả hai đều public, không auth
router.get('/suggest', validate(destinationValidation.suggestDestinations), destinationController.suggestDestinations);
router.get('/', destinationController.listDestinations);

export default router;
