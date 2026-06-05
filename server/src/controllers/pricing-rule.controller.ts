import httpStatus from 'http-status';
import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import pick from '../utils/pick';
import catchAsync from '../utils/catchAsync';
import { pricingRuleService } from '../services';

export class PricingRuleController {
  createRule = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const rule = await pricingRuleService.createRule(req.params.hotelId as string, req.user as User, req.body);
    res.status(httpStatus.CREATED).send(rule);
  });

  listRules = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const filter = pick(req.query, ['roomTypeId', 'isActive']);
    const rules = await pricingRuleService.listRules(req.params.hotelId as string, req.user as User, filter);
    res.send(rules);
  });

  updateRule = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const rule = await pricingRuleService.updateRule(
      req.params.hotelId as string,
      req.params.ruleId as string,
      req.user as User,
      req.body
    );
    res.send(rule);
  });

  deleteRule = catchAsync(async (req: Request, res: Response): Promise<void> => {
    await pricingRuleService.deleteRule(req.params.hotelId as string, req.params.ruleId as string, req.user as User);
    res.status(httpStatus.NO_CONTENT).send();
  });
}

export const pricingRuleController = new PricingRuleController();
