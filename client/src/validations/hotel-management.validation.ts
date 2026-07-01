import { z } from 'zod';

/**
 * Các field số được giữ ở dạng **string** (HTML input trả về string) và chỉ
 * convert sang number ở tầng submit. Cách này tránh lỗi typing input/output của
 * zod v4 `coerce`/`preprocess` khi dùng với @hookform/resolvers.
 */

const isInt = (v: string) => /^-?\d+$/.test(v.trim());
const isNum = (v: string) => v.trim() !== '' && !Number.isNaN(Number(v));

const requiredInt = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, 'Required')
    .refine(isInt, 'Must be a whole number')
    .refine(v => Number(v) >= min && Number(v) <= max, `Must be between ${min}–${max}`);

const requiredDecimal = (min: number) =>
  z
    .string()
    .trim()
    .min(1, 'Required')
    .refine(isNum, 'Must be a number')
    .refine(v => Number(v) >= min, min === 0 ? 'Cannot be negative' : `Minimum ${min}`);

const signedNumber = () =>
  z.string().trim().min(1, 'Required').refine(isNum, 'Must be a number');

const optionalInt = (min: number, max: number) =>
  z
    .string()
    .trim()
    .optional()
    .refine(v => !v || isInt(v), 'Must be a whole number')
    .refine(v => !v || (Number(v) >= min && Number(v) <= max), `Must be between ${min}–${max}`);

const optionalDecimal = (min: number) =>
  z
    .string()
    .trim()
    .optional()
    .refine(v => !v || isNum(v), 'Must be a number')
    .refine(v => !v || Number(v) >= min, min === 0 ? 'Cannot be negative' : `Minimum ${min}`);

// ─── Hotel profile ────────────────────────────────────────────────────────────

/** HH:mm 24h — khớp pattern của backend. */
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const optionalTime = () =>
  z
    .string()
    .trim()
    .optional()
    .refine(v => !v || timePattern.test(v), 'Use 24h format, e.g. 14:00');

export const hotelProfileFormSchema = z.object({
  name: z.string().trim().min(1, 'Hotel name is required').max(255, 'Max 255 characters'),
  description: z.string().max(5000, 'Max 5000 characters').optional(),
  address: z.string().trim().min(1, 'Address is required').max(500, 'Max 500 characters'),
  city: z.string().trim().min(1, 'City is required').max(255, 'Max 255 characters'),
  country: z.string().trim().min(1, 'Country is required').max(255, 'Max 255 characters'),
  district: z.string().max(255, 'Max 255 characters').optional(),
  ward: z.string().max(255, 'Max 255 characters').optional(),
  /** '' = giữ nguyên/không chọn; nếu chọn thì là '1'..'5'. */
  starRating: z.string().optional(),
  /** '' = giữ nguyên/không chọn; nếu chọn thì là enum hợp lệ. */
  businessType: z.string().optional(),
  checkInTime: optionalTime(),
  checkOutTime: optionalTime(),
});

export type HotelProfileFormValues = z.infer<typeof hotelProfileFormSchema>;

// ─── Amenity (catalog) ────────────────────────────────────────────────────────

export const amenityFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255, 'Max 255 characters'),
  icon: z.string().max(100, 'Max 100 characters').optional(),
  category: z.enum(['room', 'hotel', 'service']),
});

export type AmenityFormValues = z.infer<typeof amenityFormSchema>;

// ─── Room type ────────────────────────────────────────────────────────────────

export const roomTypeFormSchema = z.object({
  name: z.string().trim().min(1, 'Room type name is required').max(255, 'Max 255 characters'),
  maxOccupancy: requiredInt(1, 20),
  basePrice: requiredDecimal(0),
  description: z.string().max(2000, 'Max 2000 characters').optional(),
  areaSqm: optionalDecimal(0),
  bedType: z.string().max(100, 'Max 100 characters').optional(),
  viewType: z.string().max(100, 'Max 100 characters').optional(),
  isActive: z.boolean(),
});

export type RoomTypeFormValues = z.infer<typeof roomTypeFormSchema>;

// ─── Physical room ────────────────────────────────────────────────────────────

const roomStatusEnum = z.enum(['available', 'occupied', 'maintenance', 'cleaning']);

export const roomFormSchema = z.object({
  roomTypeId: z.string().uuid('Please select a room type'),
  roomNumber: z.string().trim().min(1, 'Room number is required').max(20, 'Max 20 characters'),
  floor: optionalInt(0, 200),
  status: roomStatusEnum,
  notes: z.string().max(1000, 'Max 1000 characters').optional(),
});

export type RoomFormValues = z.infer<typeof roomFormSchema>;

// ─── Pricing rule ─────────────────────────────────────────────────────────────

const ruleTypeEnum = z.enum(['seasonal', 'weekend', 'occupancy', 'early_bird']);
const adjustmentTypeEnum = z.enum(['percentage', 'fixed']);

export const pricingRuleFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Rule name is required').max(255, 'Max 255 characters'),
    ruleType: ruleTypeEnum,
    startDate: z.string().min(1, 'Required'),
    endDate: z.string().min(1, 'Required'),
    adjustmentType: adjustmentTypeEnum,
    adjustmentValue: signedNumber(),
    /** '' / sentinel = applies to the whole hotel. */
    roomTypeId: z.string().optional(),
    dayOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    occupancyThreshold: optionalInt(1, 100),
    priority: optionalInt(0, 1000),
    isActive: z.boolean(),
  })
  .refine(d => new Date(d.endDate) >= new Date(d.startDate), {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  })
  .refine(d => d.ruleType !== 'occupancy' || !!d.occupancyThreshold?.trim(), {
    message: 'Required when rule type is occupancy',
    path: ['occupancyThreshold'],
  })
  .refine(d => d.adjustmentType !== 'percentage' || Math.abs(Number(d.adjustmentValue)) <= 100, {
    message: 'Percentage is capped at ±100%',
    path: ['adjustmentValue'],
  });

export type PricingRuleFormValues = z.infer<typeof pricingRuleFormSchema>;
