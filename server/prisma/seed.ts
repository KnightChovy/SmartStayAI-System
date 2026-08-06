import { PrismaClient, UserRole } from '@prisma/client';
import type {
  AmenityCategory,
  BedType,
  HotelImageCategory,
  NearbyPlaceCategory,
  NearbyTransportType,
  PricingRuleType,
  AdjustmentType,
  RepresentativeRole,
  VerificationDocumentType,
  LicenseType,
  ChargeType,
  ChargeFrequency,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { toUtcDate, eachNightOfStay } from '../src/utils/dates';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/** Ngày (UTC-midnight) cách hôm nay `days` ngày. */
const daysFromNow = (days: number): Date => {
  const d = toUtcDate(new Date());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

/**
 * Mức hoa hồng nền của sàn (%). MỘT nguồn duy nhất cho cả bản ghi `commission_rates`, cột
 * `hotel_partners.commission_rate` và hoa hồng của các booking mẫu — ba chỗ này mà lệch nhau thì
 * dữ liệu seed tự mâu thuẫn.
 *
 * Khách sạn seed đều dùng mức nền, KHÔNG khách sạn nào có ưu đãi riêng: ưu đãi phải đi qua luồng
 * đối tác nộp đơn → Platform Manager duyệt, seed sẵn sẽ che mất chính luồng cần demo.
 */
const PLATFORM_BASE_COMMISSION_RATE = 15;

// ---------------------------------------------------------------------------
// Ảnh: dùng ảnh THẬT đã upload sẵn trên Cloudinary (thư mục smartstay/seed).
// URL không kèm version → không phải sửa seed mỗi lần ảnh được thay.
// cloud name lấy từ env, không hardcode, để đổi tài khoản Cloudinary là chạy được ngay.
// ---------------------------------------------------------------------------
const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
if (!CLOUD) {
  throw new Error('Thiếu CLOUDINARY_CLOUD_NAME trong .env — seed cần nó để dựng URL ảnh');
}
const img = (name: string): string => `https://res.cloudinary.com/${CLOUD}/image/upload/smartstay/seed/${name}.jpg`;
// Ảnh giấy tờ: chỉ có một bản scan mẫu trên Cloudinary nên mọi giấy tờ dùng chung — đủ để demo
// luồng duyệt hồ sơ, KHÔNG phải giấy tờ thật của khách sạn nào.
const DOC_URL = `https://res.cloudinary.com/${CLOUD}/image/upload/smartstay/licenses/ajeqwfgq4tojqzk89wzc.png`;

// ---------------------------------------------------------------------------
// Tài khoản mẫu — quy ước: <role>@gmail.com / <role>123
// (mật khẩu phải ≥8 ký tự + có chữ và số, xem validations/custom.validation.ts)
// ---------------------------------------------------------------------------
interface SeedAccount {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  phone: string;
}

const ACCOUNTS: SeedAccount[] = [
  { email: 'admin@gmail.com', password: 'admin123', fullName: 'System Administrator', role: 'admin', phone: '0900000001' },
  { email: 'manager@gmail.com', password: 'manager123', fullName: 'Platform Manager', role: 'platform_manager', phone: '0900000002' },

  // 4 partner — mỗi người sở hữu một khách sạn
  { email: 'partner@gmail.com', password: 'partner123', fullName: 'Tran Minh Duc', role: 'hotel_partner', phone: '0901000001' },
  { email: 'partner2@gmail.com', password: 'partner123', fullName: 'Nguyen Thu Ha', role: 'hotel_partner', phone: '0901000002' },
  { email: 'partner3@gmail.com', password: 'partner123', fullName: 'Le Quoc Bao', role: 'hotel_partner', phone: '0901000003' },
  { email: 'partner4@gmail.com', password: 'partner123', fullName: 'Pham Hai Yen', role: 'hotel_partner', phone: '0901000004' },

  // 4 staff — mỗi người trực một khách sạn
  { email: 'staff@gmail.com', password: 'staff123', fullName: 'Da Nang Front Desk', role: 'staff', phone: '0902000001' },
  { email: 'staff2@gmail.com', password: 'staff123', fullName: 'Saigon Front Desk', role: 'staff', phone: '0902000002' },
  { email: 'staff3@gmail.com', password: 'staff123', fullName: 'Ha Noi Front Desk', role: 'staff', phone: '0902000003' },
  { email: 'staff4@gmail.com', password: 'staff123', fullName: 'Nha Trang Front Desk', role: 'staff', phone: '0902000004' },

  // Khách — nhiều người để có đủ đánh giá cho điểm trung bình hiển thị đẹp
  { email: 'customer@gmail.com', password: 'customer123', fullName: 'Nguyen Van An', role: 'customer', phone: '0903000001' },
  { email: 'customer2@gmail.com', password: 'customer123', fullName: 'Tran Thi Binh', role: 'customer', phone: '0903000002' },
  { email: 'customer3@gmail.com', password: 'customer123', fullName: 'Vo Hoang Long', role: 'customer', phone: '0903000003' },

  { email: 'guest@gmail.com', password: 'guest123', fullName: 'Walk-in Guest', role: 'guest', phone: '0904000001' },
];

// ---------------------------------------------------------------------------
// Tiện nghi dùng chung
// ---------------------------------------------------------------------------
const AMENITIES: { name: string; icon: string; category: AmenityCategory }[] = [
  { name: 'Free WiFi', icon: 'wifi', category: 'connectivity' },
  { name: 'Swimming pool', icon: 'pool', category: 'wellness' },
  { name: 'Fitness center', icon: 'gym', category: 'wellness' },
  { name: 'Spa', icon: 'spa', category: 'wellness' },
  { name: 'Parking', icon: 'parking', category: 'parking' },
  { name: 'Restaurant', icon: 'restaurant', category: 'restaurant' },
  { name: 'Bar', icon: 'bar', category: 'food_drink' },
  { name: 'Buffet breakfast', icon: 'breakfast', category: 'food_drink' },
  { name: '24/7 front desk', icon: 'reception', category: 'service' },
  { name: 'Laundry service', icon: 'laundry', category: 'service' },
  { name: 'Airport shuttle', icon: 'shuttle', category: 'service' },
  { name: 'Air conditioning', icon: 'air-conditioner', category: 'room' },
  { name: 'Flat-screen TV', icon: 'tv', category: 'room' },
  { name: 'Minibar', icon: 'minibar', category: 'room' },
  { name: 'Balcony', icon: 'balcony', category: 'room' },
  { name: 'In-room safe', icon: 'safe', category: 'room' },
  { name: 'Coffee maker', icon: 'coffee', category: 'room' },
  { name: 'Bathtub', icon: 'bathtub', category: 'room' },
];

// FAQ chung — nhiều câu để trợ lý AI có cái mà chọn lọc
const GENERIC_FAQS: { category: string; question: string; answer: string }[] = [
  { category: 'Policies', question: 'Are pets allowed at the hotel?', answer: 'Sorry, pets are not allowed, except for guide dogs assisting guests with disabilities.' },
  { category: 'Policies', question: 'What is the cancellation policy?', answer: 'Free cancellation up to 48 hours before check-in time; within 48 hours the first night is charged.' },
  { category: 'Policies', question: 'Is smoking allowed in the rooms?', answer: 'All rooms are non-smoking. A dedicated outdoor smoking area is available.' },
  { category: 'Policies', question: 'Are children charged when staying with parents?', answer: 'Children under 6 sharing an existing bed stay free; from 6 years old they are charged as adults or an extra-bed fee applies.' },
  { category: 'Policies', question: 'What documents are required at check-in?', answer: 'Please present a valid national ID card or passport at check-in.' },
  { category: 'Policies', question: 'What are the check-in and check-out times?', answer: 'Check-in from 14:00, check-out before 12:00.' },
  { category: 'Policies', question: 'Is early check-in or late check-out possible?', answer: 'Subject to room availability. Late check-out after 12:00 may incur a surcharge; please ask the front desk.' },
  { category: 'Facilities', question: 'Does the hotel have free WiFi?', answer: 'Yes, high-speed WiFi is free in all areas and in the rooms.' },
  { category: 'Facilities', question: 'What are the swimming pool opening hours?', answer: 'The pool is open from 6:00 to 21:00 daily (at properties with a pool).' },
  { category: 'Facilities', question: 'What time is breakfast served?', answer: 'Buffet breakfast is served from 6:30 to 9:30.' },
  { category: 'Facilities', question: 'Is parking available?', answer: 'Yes, parking is available for in-house guests on a first-come, first-served basis.' },
  { category: 'Facilities', question: 'Can I store luggage before check-in or after check-out?', answer: 'Yes, the front desk stores luggage free of charge before check-in and after check-out.' },
  { category: 'Payment', question: 'Which payment methods does the hotel accept?', answer: 'Online payment via VNPay, QR bank transfer via SePay, and cash at the front desk.' },
  { category: 'Payment', question: 'Does the hotel issue VAT invoices?', answer: 'Yes, an invoice with tax stated separately is issued at check-out.' },
  { category: 'Payment', question: 'Can I get a refund if I cancel a paid booking?', answer: 'Yes. A full refund if cancelled more than 48 hours in advance; within 48 hours the first night is retained. Refund requests must be approved by the hotel before the transfer is made.' },
];

// ---------------------------------------------------------------------------
// 4 partner + 4 khách sạn
// ---------------------------------------------------------------------------
interface SeedRoomType {
  name: string;
  description: string;
  maxOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  basePrice: number;
  areaSqm: number;
  bedType: string;
  viewType: string;
  floor: number;
  roomCount: number;
  hasBalcony: boolean;
  beds: { bedType: BedType; quantity: number }[];
  amenities: string[];
  images: string[];
}

interface SeedHotel {
  // --- tài khoản & pháp nhân ---
  ownerEmail: string;
  staffEmail: string;
  businessName: string;
  businessRegistrationNumber: string;
  taxCode: string;
  representative: { fullName: string; role: RepresentativeRole; idNumber: string; phone: string; address: string };
  payout: { accountHolder: string; bankName: string; accountNumber: string; bankBranch: string };
  // --- khách sạn ---
  name: string;
  description: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  postalCode: string;
  phone: string;
  email: string;
  businessType: 'hotel' | 'resort' | 'villa' | 'apartment';
  starRating: number;
  latitude: number;
  longitude: number;
  totalFloors: number;
  builtYear: number;
  renovationYear: number;
  cancellation: { freeUntilHours: number; latePenalty: 'first_night' | 'full' };
  amenities: string[];
  images: { name: string; category: HotelImageCategory; caption: string }[];
  roomTypes: SeedRoomType[];
  charges: { chargeType: ChargeType; name: string; amount: number; isPercentage: boolean; chargeFrequency?: ChargeFrequency }[];
  policies: { title: string; description: string; important?: boolean }[];
  nearby: { name: string; category: NearbyPlaceCategory; distance: number; transportType: NearbyTransportType; journeyMinutes: number }[];
}

const HOTELS: SeedHotel[] = [
  {
    ownerEmail: 'partner@gmail.com',
    staffEmail: 'staff@gmail.com',
    businessName: 'Blue Ocean Hospitality Co., Ltd',
    businessRegistrationNumber: '0401234567',
    taxCode: '0401234567-001',
    representative: { fullName: 'Tran Minh Duc', role: 'owner', idNumber: '048201001234', phone: '0901000001', address: '12 Vo Nguyen Giap, Son Tra, Da Nang' },
    payout: { accountHolder: 'TRAN MINH DUC', bankName: 'Vietcombank', accountNumber: '0071000123456', bankBranch: 'Da Nang Branch' },
    name: 'SmartStay Da Nang Beach Resort',
    description:
      'A 5-star beachfront resort right on My Khe Beach, a 15-minute drive from Da Nang airport. Every room has a private ocean-view balcony, complemented by an infinity pool, a spa and a seafood restaurant.',
    address: '128 Vo Nguyen Giap',
    city: 'Da Nang',
    district: 'Son Tra',
    ward: 'Phuoc My',
    postalCode: '550000',
    phone: '0236 3888 999',
    email: 'danang@smartstay.ai',
    businessType: 'resort',
    starRating: 5,
    latitude: 16.0605,
    longitude: 108.2456,
    totalFloors: 12,
    builtYear: 2018,
    renovationYear: 2023,
    cancellation: { freeUntilHours: 48, latePenalty: 'first_night' },
    amenities: ['Free WiFi', 'Swimming pool', 'Spa', 'Fitness center', 'Restaurant', 'Bar', 'Buffet breakfast', '24/7 front desk', 'Parking', 'Airport shuttle'],
    images: [
      { name: 'resort-01', category: 'cover', caption: 'Panoramic view of the resort from the sea' },
      { name: 'resort-02', category: 'exterior', caption: 'Grounds and main entrance' },
      { name: 'resort-03', category: 'exterior', caption: 'Tropical garden' },
      { name: 'hotel-pool-01', category: 'exterior', caption: 'Ocean-facing infinity pool' },
      { name: 'resort-04', category: 'exterior', caption: 'Private beach' },
    ],
    roomTypes: [
      {
        name: 'Ocean View Deluxe', description: 'A 32m² room with a private balcony facing My Khe Beach, a king bed and a bathtub.',
        maxOccupancy: 2, maxAdults: 2, maxChildren: 1, basePrice: 1_500_000, areaSqm: 32, bedType: 'king', viewType: 'ocean', floor: 5, roomCount: 8, hasBalcony: true,
        beds: [{ bedType: 'king', quantity: 1 }],
        amenities: ['Air conditioning', 'Flat-screen TV', 'Minibar', 'Balcony', 'In-room safe', 'Bathtub'],
        images: ['room-01', 'room-02'],
      },
      {
        name: 'Family Suite', description: 'A 55m² suite with two separate bedrooms, ideal for a family of four, with a kitchenette and a living room.',
        maxOccupancy: 4, maxAdults: 2, maxChildren: 2, basePrice: 2_600_000, areaSqm: 55, bedType: 'king', viewType: 'ocean', floor: 8, roomCount: 4, hasBalcony: true,
        beds: [{ bedType: 'king', quantity: 1 }, { bedType: 'single', quantity: 2 }],
        amenities: ['Air conditioning', 'Flat-screen TV', 'Minibar', 'Balcony', 'In-room safe', 'Coffee maker', 'Bathtub'],
        images: ['suite-01', 'suite-02'],
      },
      {
        name: 'Garden View Standard', description: 'A quiet 26m² room overlooking the tropical garden, with a queen bed.',
        maxOccupancy: 2, maxAdults: 2, maxChildren: 0, basePrice: 900_000, areaSqm: 26, bedType: 'queen', viewType: 'garden', floor: 3, roomCount: 10, hasBalcony: false,
        beds: [{ bedType: 'queen', quantity: 1 }],
        amenities: ['Air conditioning', 'Flat-screen TV', 'In-room safe'],
        images: ['room-03', 'room-04'],
      },
    ],
    charges: [
      { chargeType: 'tax', name: 'VAT', amount: 8, isPercentage: true },
      { chargeType: 'fee', name: 'Service fee', amount: 50_000, isPercentage: false, chargeFrequency: 'per_night' },
    ],
    policies: [
      { title: 'Cancellation policy', description: 'Free cancellation up to 48 hours before check-in time. Later cancellations are charged the first night.', important: true },
      { title: 'Check-in / check-out', description: 'Check-in from 14:00, check-out before 12:00. Late check-out may incur a surcharge.' },
      { title: 'Deposit', description: 'A 200,000 VND minibar deposit is collected at check-in and refunded in full at check-out if nothing is consumed.' },
      { title: 'Pets', description: 'Pets are not allowed, except for guide dogs assisting guests with disabilities.' },
    ],
    nearby: [
      { name: 'My Khe Beach', category: 'beach', distance: 0.1, transportType: 'walk', journeyMinutes: 2 },
      { name: 'Da Nang International Airport', category: 'airport', distance: 6, transportType: 'car', journeyMinutes: 15 },
      { name: 'Dragon Bridge', category: 'landmark', distance: 3.2, transportType: 'car', journeyMinutes: 10 },
      { name: 'Son Tra Peninsula', category: 'nature', distance: 8, transportType: 'car', journeyMinutes: 20 },
    ],
  },

  {
    ownerEmail: 'partner2@gmail.com',
    staffEmail: 'staff2@gmail.com',
    businessName: 'Saigon Central Group JSC',
    businessRegistrationNumber: '0312345678',
    taxCode: '0312345678-001',
    representative: { fullName: 'Nguyen Thu Ha', role: 'general_manager', idNumber: '079198002345', phone: '0901000002', address: '45 Le Loi, District 1, Ho Chi Minh City' },
    payout: { accountHolder: 'NGUYEN THU HA', bankName: 'Techcombank', accountNumber: '19036789012345', bankBranch: 'Saigon Branch' },
    name: 'SmartStay Saigon Central',
    description:
      'A 4-star hotel in the heart of District 1, a 5-minute walk from Ben Thanh Market and Nguyen Hue Walking Street. A familiar choice for business travellers thanks to its meeting rooms and high-speed WiFi.',
    address: '45 Le Loi',
    city: 'Ho Chi Minh City',
    district: 'District 1',
    ward: 'Ben Nghe',
    postalCode: '700000',
    phone: '028 3822 1234',
    email: 'saigon@smartstay.ai',
    businessType: 'hotel',
    starRating: 4,
    latitude: 10.7731,
    longitude: 106.7009,
    totalFloors: 18,
    builtYear: 2015,
    renovationYear: 2022,
    cancellation: { freeUntilHours: 24, latePenalty: 'first_night' },
    amenities: ['Free WiFi', 'Fitness center', 'Restaurant', 'Bar', 'Buffet breakfast', '24/7 front desk', 'Parking', 'Laundry service'],
    images: [
      { name: 'hotel-exterior-01', category: 'cover', caption: 'Hotel facade on Le Loi street' },
      { name: 'hotel-exterior-02', category: 'exterior', caption: 'The building seen from the walking street' },
      { name: 'hotel-lobby-01', category: 'exterior', caption: 'Reception lobby' },
      { name: 'hotel-restaurant-01', category: 'exterior', caption: 'Ground-floor restaurant' },
    ],
    roomTypes: [
      {
        name: 'Superior', description: 'A 24m² city-view room with a large work desk, ideal for business travellers.',
        maxOccupancy: 2, maxAdults: 2, maxChildren: 0, basePrice: 850_000, areaSqm: 24, bedType: 'queen', viewType: 'city', floor: 4, roomCount: 12, hasBalcony: false,
        beds: [{ bedType: 'queen', quantity: 1 }],
        amenities: ['Air conditioning', 'Flat-screen TV', 'In-room safe', 'Coffee maker'],
        images: ['room-05', 'room-06'],
      },
      {
        name: 'City View Deluxe', description: 'A 30m² high-floor room with floor-to-ceiling windows overlooking downtown District 1.',
        maxOccupancy: 3, maxAdults: 2, maxChildren: 1, basePrice: 1_200_000, areaSqm: 30, bedType: 'king', viewType: 'city', floor: 10, roomCount: 8, hasBalcony: false,
        beds: [{ bedType: 'king', quantity: 1 }, { bedType: 'sofa_bed', quantity: 1 }],
        amenities: ['Air conditioning', 'Flat-screen TV', 'Minibar', 'In-room safe', 'Coffee maker'],
        images: ['room-07', 'room-08'],
      },
      {
        name: 'Executive Suite', description: 'A 48m² suite on the 16th floor with a separate living room and Executive Lounge access.',
        maxOccupancy: 3, maxAdults: 3, maxChildren: 0, basePrice: 2_200_000, areaSqm: 48, bedType: 'king', viewType: 'city', floor: 16, roomCount: 4, hasBalcony: true,
        beds: [{ bedType: 'king', quantity: 1 }],
        amenities: ['Air conditioning', 'Flat-screen TV', 'Minibar', 'In-room safe', 'Coffee maker', 'Bathtub', 'Balcony'],
        images: ['suite-03', 'suite-04'],
      },
    ],
    charges: [{ chargeType: 'tax', name: 'VAT', amount: 8, isPercentage: true }],
    policies: [
      { title: 'Cancellation policy', description: 'Free cancellation up to 24 hours before check-in time. Later cancellations are charged the first night.', important: true },
      { title: 'Check-in / check-out', description: 'Check-in from 14:00, check-out before 12:00.' },
      { title: 'Children', description: 'Children under 6 sharing an existing bed with their parents stay free.' },
    ],
    nearby: [
      { name: 'Ben Thanh Market', category: 'attraction', distance: 0.6, transportType: 'walk', journeyMinutes: 8 },
      { name: 'Nguyen Hue Walking Street', category: 'attraction', distance: 0.4, transportType: 'walk', journeyMinutes: 5 },
      { name: 'Tan Son Nhat Airport', category: 'airport', distance: 7.5, transportType: 'car', journeyMinutes: 25 },
      { name: 'Ben Thanh Metro Station', category: 'public_transport', distance: 0.7, transportType: 'walk', journeyMinutes: 9 },
    ],
  },

  {
    ownerEmail: 'partner3@gmail.com',
    staffEmail: 'staff3@gmail.com',
    businessName: 'Ha Noi Heritage Co., Ltd',
    businessRegistrationNumber: '0101234567',
    taxCode: '0101234567-001',
    representative: { fullName: 'Le Quoc Bao', role: 'legal_representative', idNumber: '001199003456', phone: '0901000003', address: '22 Hang Bac, Hoan Kiem, Ha Noi' },
    payout: { accountHolder: 'LE QUOC BAO', bankName: 'BIDV', accountNumber: '21010001234567', bankBranch: 'Hoan Kiem Branch' },
    name: 'SmartStay Ha Noi Old Quarter',
    description:
      'A 3-star boutique hotel in the heart of the Ha Noi Old Quarter, a 5-minute walk from Hoan Kiem Lake. A restored shophouse that keeps its original character, ideal for guests who want to stay right in the old town.',
    address: '22 Hang Bac',
    city: 'Ha Noi',
    district: 'Hoan Kiem',
    ward: 'Hang Buom',
    postalCode: '100000',
    phone: '024 3926 5678',
    email: 'hanoi@smartstay.ai',
    businessType: 'hotel',
    starRating: 3,
    latitude: 21.0341,
    longitude: 105.8524,
    totalFloors: 6,
    builtYear: 2010,
    renovationYear: 2021,
    cancellation: { freeUntilHours: 24, latePenalty: 'first_night' },
    amenities: ['Free WiFi', 'Restaurant', '24/7 front desk', 'Laundry service', 'Airport shuttle'],
    images: [
      { name: 'hotel-exterior-03', category: 'cover', caption: 'Restored old-quarter shophouse facade' },
      { name: 'hotel-exterior-04', category: 'exterior', caption: 'The corner of Hang Bac street' },
      { name: 'hotel-lobby-02', category: 'exterior', caption: 'Cosy little lobby' },
    ],
    roomTypes: [
      {
        name: 'Old Quarter Standard', description: 'A neat 20m² room with a window onto the bustling Hang Bac street.',
        maxOccupancy: 2, maxAdults: 2, maxChildren: 0, basePrice: 650_000, areaSqm: 20, bedType: 'double', viewType: 'city', floor: 2, roomCount: 10, hasBalcony: false,
        beds: [{ bedType: 'double', quantity: 1 }],
        amenities: ['Air conditioning', 'Flat-screen TV'],
        images: ['room-09', 'room-10'],
      },
      {
        name: 'Balcony Superior', description: 'A bright, airy 26m² room with a small balcony overlooking the old quarter.',
        maxOccupancy: 2, maxAdults: 2, maxChildren: 1, basePrice: 950_000, areaSqm: 26, bedType: 'queen', viewType: 'city', floor: 4, roomCount: 6, hasBalcony: true,
        beds: [{ bedType: 'queen', quantity: 1 }],
        amenities: ['Air conditioning', 'Flat-screen TV', 'Minibar', 'Balcony'],
        images: ['room-11', 'room-12'],
      },
    ],
    charges: [
      { chargeType: 'tax', name: 'VAT', amount: 8, isPercentage: true },
      { chargeType: 'fee', name: 'Service charge', amount: 30_000, isPercentage: false, chargeFrequency: 'per_stay' },
    ],
    policies: [
      { title: 'Cancellation policy', description: 'Free cancellation up to 24 hours before check-in time.', important: true },
      { title: 'Old Quarter noise', description: 'The hotel sits inside the weekend walking-street area and can be noisy until late on Friday and Saturday nights.', important: true },
      { title: 'Check-in / check-out', description: 'Check-in from 14:00, check-out before 12:00.' },
    ],
    nearby: [
      { name: 'Hoan Kiem Lake', category: 'landmark', distance: 0.4, transportType: 'walk', journeyMinutes: 5 },
      { name: 'Dong Xuan Market', category: 'attraction', distance: 0.8, transportType: 'walk', journeyMinutes: 10 },
      { name: 'Noi Bai Airport', category: 'airport', distance: 27, transportType: 'car', journeyMinutes: 45 },
      { name: 'Ha Noi Opera House', category: 'landmark', distance: 1.2, transportType: 'walk', journeyMinutes: 15 },
    ],
  },

  {
    ownerEmail: 'partner4@gmail.com',
    staffEmail: 'staff4@gmail.com',
    businessName: 'Nha Trang Bay Resorts JSC',
    businessRegistrationNumber: '4201234567',
    taxCode: '4201234567-001',
    representative: { fullName: 'Pham Hai Yen', role: 'director', idNumber: '056200004567', phone: '0901000004', address: '90 Tran Phu, Nha Trang, Khanh Hoa' },
    payout: { accountHolder: 'PHAM HAI YEN', bankName: 'ACB', accountNumber: '18790001234567', bankBranch: 'Nha Trang Branch' },
    name: 'SmartStay Nha Trang Bay',
    description:
      'A 4-star resort on Nha Trang Bay with a private beach, an outdoor pool and a spa. Bungalows are scattered through a coconut garden, a 10-minute drive from Dam Market.',
    address: '90 Tran Phu',
    city: 'Nha Trang',
    district: 'Loc Tho',
    ward: 'Loc Tho',
    postalCode: '650000',
    phone: '0258 3852 468',
    email: 'nhatrang@smartstay.ai',
    businessType: 'resort',
    starRating: 4,
    latitude: 12.2388,
    longitude: 109.1967,
    totalFloors: 8,
    builtYear: 2016,
    renovationYear: 2022,
    cancellation: { freeUntilHours: 72, latePenalty: 'full' },
    amenities: ['Free WiFi', 'Swimming pool', 'Spa', 'Restaurant', 'Bar', 'Buffet breakfast', '24/7 front desk', 'Parking'],
    images: [
      { name: 'hotel-exterior-05', category: 'cover', caption: 'The resort seen from Nha Trang Bay' },
      { name: 'hotel-exterior-06', category: 'exterior', caption: 'Bungalow area in the coconut garden' },
      { name: 'hotel-pool-02', category: 'exterior', caption: 'Outdoor swimming pool' },
      { name: 'hotel-spa-01', category: 'exterior', caption: 'Spa area' },
      { name: 'hotel-lobby-03', category: 'exterior', caption: 'Open lobby facing the sea' },
    ],
    roomTypes: [
      {
        name: 'Bay View Deluxe', description: 'A 30m² room with a balcony looking straight out over Nha Trang Bay, with a king bed.',
        maxOccupancy: 2, maxAdults: 2, maxChildren: 1, basePrice: 1_350_000, areaSqm: 30, bedType: 'king', viewType: 'ocean', floor: 5, roomCount: 10, hasBalcony: true,
        beds: [{ bedType: 'king', quantity: 1 }],
        amenities: ['Air conditioning', 'Flat-screen TV', 'Minibar', 'Balcony', 'In-room safe'],
        images: ['room-13', 'room-14'],
      },
      {
        name: 'Coconut Garden Bungalow', description: 'A private 40m² bungalow in the coconut garden, with its own terrace and direct access to the pool.',
        maxOccupancy: 3, maxAdults: 2, maxChildren: 1, basePrice: 1_900_000, areaSqm: 40, bedType: 'king', viewType: 'garden', floor: 1, roomCount: 6, hasBalcony: true,
        beds: [{ bedType: 'king', quantity: 1 }, { bedType: 'sofa_bed', quantity: 1 }],
        amenities: ['Air conditioning', 'Flat-screen TV', 'Minibar', 'Balcony', 'Bathtub', 'Coffee maker'],
        images: ['room-15', 'suite-05'],
      },
    ],
    charges: [
      { chargeType: 'tax', name: 'VAT', amount: 8, isPercentage: true },
      { chargeType: 'fee', name: 'Resort fee', amount: 80_000, isPercentage: false, chargeFrequency: 'per_night' },
    ],
    policies: [
      { title: 'Cancellation policy', description: 'Free cancellation up to 72 hours before check-in time. Later cancellations forfeit the full room charge.', important: true },
      { title: 'Resort fee', description: 'The 80,000 VND per night resort fee covers beach towels, beach loungers and the morning yoga class.', important: true },
      { title: 'Check-in / check-out', description: 'Check-in from 14:00, check-out before 12:00.' },
    ],
    nearby: [
      { name: 'Tran Phu Beach', category: 'beach', distance: 0.05, transportType: 'walk', journeyMinutes: 1 },
      { name: 'Dam Market', category: 'attraction', distance: 3.5, transportType: 'car', journeyMinutes: 10 },
      { name: 'Cam Ranh Airport', category: 'airport', distance: 32, transportType: 'car', journeyMinutes: 45 },
      { name: 'Po Nagar Cham Towers', category: 'landmark', distance: 4.2, transportType: 'car', journeyMinutes: 12 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Ngày lễ — KHAI TAY, có chủ đích.
//
// Hệ thống KHÔNG có khái niệm ngày lễ: PricingRuleType chỉ có seasonal|weekend|occupancy|early_bird,
// không có 'holiday', cũng không có lịch âm. Đây là lựa chọn thiết kế giống booking.com — nền tảng
// cung cấp công cụ, khách sạn tự định giá — chứ không phải thiếu sót. Muốn phụ thu lễ thì tạo một
// rule 'seasonal' trùng khoảng ngày lễ, đúng như bảng dưới.
//
// CẢNH BÁO BẢO TRÌ: lễ dương lịch (1/1, 30/4, 2/9) cố định hằng năm, nhưng TẾT NGUYÊN ĐÁN theo lịch
// ÂM nên mỗi năm rơi vào một ngày dương khác — hết mùa phải cập nhật tay bảng này. Không có gì trong
// hệ thống nhắc việc đó.
//
// priority 50 — CAO HƠN mọi rule khác (weekend 10, occupancy 15, seasonal 20) vì engine chỉ áp ĐÚNG
// MỘT rule có priority cao nhất, không cộng dồn. Nhờ vậy lễ rơi vào cuối tuần thì ăn giá lễ, không
// bị rule cuối tuần rẻ hơn giành mất.
// ---------------------------------------------------------------------------
const HOLIDAY_RULE_PRIORITY = 50;

const HOLIDAYS: { name: string; start: string; end: string; surchargePercent: number }[] = [
  { name: 'National Day (Sep 2)', start: '2026-08-31', end: '2026-09-02', surchargePercent: 35 },
  { name: "New Year's Day", start: '2026-12-31', end: '2027-01-01', surchargePercent: 25 },
  // Mùng 1 Tết Đinh Mùi rơi vào 06/02/2027 (dương lịch) — kiểm lại khi sang năm khác
  { name: 'Lunar New Year (Tet)', start: '2027-02-05', end: '2027-02-11', surchargePercent: 50 },
  { name: 'Reunification Day & Labour Day', start: '2027-04-29', end: '2027-05-03', surchargePercent: 40 },
];

// Giấy tờ mỗi khách sạn phải nộp — dùng chung cho cả 4 hồ sơ
const DOCUMENT_TYPES: VerificationDocumentType[] = [
  'business_license',
  'tax_certificate',
  'owner_id',
  'property_proof',
  'operating_license',
  'fire_safety',
  'classification',
];

const main = async (): Promise<void> => {
  console.log('Bắt đầu seed...\n');

  // config.ts bắt buộc NODE_ENV mà .env không khai → set trước rồi import động, để dùng đúng hàm
  // encrypt() của app. Số tài khoản ngân hàng trong DB PHẢI là ciphertext: API lưu bằng encrypt(),
  // nên nếu seed ghi plain thì lúc chi trả thật decrypt() sẽ ném lỗi auth tag.
  process.env.NODE_ENV ??= 'development';
  const { encrypt } = await import('../src/utils/encryption');

  // ----- Dọn sạch -----
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  const tableNames = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  if (tableNames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);
  }

  // ----- Tài khoản -----
  const userByEmail = new Map<string, { id: string }>();
  for (const acc of ACCOUNTS) {
    const user = await prisma.user.create({
      data: {
        fullName: acc.fullName,
        email: acc.email,
        phone: acc.phone,
        passwordHash: await bcrypt.hash(acc.password, 8),
        role: acc.role,
        status: 'active',
        emailVerifiedAt: new Date(),
        profile: { create: { nationality: 'Vietnamese', preferredLanguage: 'vi', preferredCurrency: 'VND', marketingOptIn: false } },
      },
    });
    userByEmail.set(acc.email, user);
    console.log(`  ✓ ${acc.role.padEnd(17)} ${acc.email.padEnd(22)} ${acc.password}`);
  }
  const admin = userByEmail.get('admin@gmail.com')!;
  const manager = userByEmail.get('manager@gmail.com')!;

  // ----- Mức hoa hồng nền toàn sàn -----
  // Bảng commission_rates là NGUỒN SỰ THẬT cho mọi phép tính hoa hồng (xem commission-rate.service).
  // Không có bản ghi nền thì resolveRate rơi về giá trị env — ra đúng số nhưng màn hình của Platform
  // Manager sẽ không có lịch sử nào để hiển thị, và không ai biết mức này do đâu mà có.
  // effectiveFrom lùi 1 năm để mọi booking mẫu (kể cả đơn cũ nhất) đều nằm trong khoảng hiệu lực.
  await prisma.commissionRate.create({
    data: {
      hotelId: null,
      rate: PLATFORM_BASE_COMMISSION_RATE,
      effectiveFrom: daysFromNow(-365),
      effectiveTo: null,
      source: 'platform_base',
      createdBy: admin.id,
    },
  });
  console.log(`\n  ✓ Mức hoa hồng nền toàn sàn: ${PLATFORM_BASE_COMMISSION_RATE}%`);

  // ----- Tiện nghi -----
  const amenityId = new Map<string, string>();
  for (const a of AMENITIES) {
    const created = await prisma.amenity.create({ data: a });
    amenityId.set(created.name, created.id);
  }
  console.log(`\n  ✓ ${AMENITIES.length} tiện nghi`);

  // ----- Partner + khách sạn + hồ sơ pháp lý -----
  const createdHotels: {
    id: string;
    name: string;
    charges: SeedHotel['charges'];
    roomTypes: { id: string; name: string; basePrice: number; roomCount: number; viewType: string }[];
  }[] = [];

  for (const h of HOTELS) {
    const owner = userByEmail.get(h.ownerEmail)!;

    const partner = await prisma.hotelPartner.create({
      data: {
        ownerId: owner.id,
        businessName: h.businessName,
        businessLicense: h.businessRegistrationNumber,
        contactEmail: h.email,
        contactPhone: h.phone,
        status: 'approved',
        // Cột này KHÔNG còn là nguồn sự thật (resolveRate đọc bảng commission_rates) — giữ đồng bộ
        // với mức nền để màn hình cũ nào còn đọc nó cũng không hiện số mâu thuẫn.
        commissionRate: PLATFORM_BASE_COMMISSION_RATE,
        approvedBy: admin.id,
        approvedAt: daysFromNow(-60),
      },
    });

    const hotel = await prisma.hotel.create({
      data: {
        partnerId: partner.id,
        name: h.name,
        description: h.description,
        address: h.address,
        city: h.city,
        district: h.district,
        ward: h.ward,
        country: 'Vietnam',
        postalCode: h.postalCode,
        phone: h.phone,
        email: h.email,
        businessType: h.businessType,
        businessRegistrationNumber: h.businessRegistrationNumber,
        taxCode: h.taxCode,
        starRating: h.starRating,
        latitude: h.latitude,
        longitude: h.longitude,
        totalFloors: h.totalFloors,
        builtYear: h.builtYear,
        renovationYear: h.renovationYear,
        checkInTime: '14:00',
        checkOutTime: '12:00',
        isActive: true,
        isListed: true,
        isSmokingAllowed: false,
        petsPolicy: 'not_allowed',
        minGuestAge: 0,
        languagesSpoken: ['vi', 'en'],
        maxLengthOfStay: 30,
        // Chính sách huỷ THẬT — engine tính tiền hoàn đọc đúng chỗ này (xem hotel.readCancellationPolicy)
        settings: { cancellation: h.cancellation },
        images: {
          create: h.images.map((im, i) => ({
            imageCategory: im.category,
            url: img(im.name),
            caption: im.caption,
            isPrimary: im.category === 'cover',
            sortOrder: i,
          })),
        },
        amenities: { create: h.amenities.map((name) => ({ amenityId: amenityId.get(name)! })) },
        contacts: {
          create: [
            { contactType: 'general', name: 'Front desk', phone: h.phone, phoneType: 'voice', email: h.email },
            { contactType: 'invoices', name: 'Accounting department', email: `invoice-${h.city.toLowerCase().replace(/\s/g, '')}@smartstay.ai` },
          ],
        },
        nearbyPlaces: {
          create: h.nearby.map((n) => ({
            name: n.name,
            category: n.category,
            distance: n.distance,
            distanceUnit: 'km' as const,
            transportType: n.transportType,
            journeyMinutes: n.journeyMinutes,
          })),
        },
        policies: { create: h.policies.map((p) => ({ title: p.title, description: p.description, important: p.important ?? false })) },
        charges: {
          create: h.charges.map((c) => ({
            chargeType: c.chargeType,
            name: c.name,
            amount: c.amount,
            isPercentage: c.isPercentage,
            // Tính theo % thì tần suất vô nghĩa — engine bỏ qua, nên lưu null cho khỏi hiểu nhầm
            chargeFrequency: c.isPercentage ? null : (c.chargeFrequency ?? 'per_stay'),
          })),
        },
        // Ví: mỗi khách sạn đúng một ví (ràng buộc unique)
        wallet: { create: {} },
      },
    });

    // --- Cấu hình số phòng đã khai khi đăng ký ---
    const totalRooms = h.roomTypes.reduce((s, rt) => s + rt.roomCount, 0);
    await prisma.hotelRoomConfig.create({
      data: {
        hotelId: hotel.id,
        totalRooms,
        types: { create: h.roomTypes.map((rt) => ({ name: rt.name, quantity: rt.roomCount })) },
      },
    });

    // --- Hồ sơ duyệt: request → documents → licenses ---
    const request = await prisma.hotelVerificationRequest.create({
      data: {
        partnerId: partner.id,
        hotelId: hotel.id,
        status: 'approved',
        submittedAt: daysFromNow(-65),
        reviewedBy: manager.id,
        reviewedAt: daysFromNow(-60),
        notes: 'Application complete, all documents valid.',
      },
    });

    const docIdByType = new Map<VerificationDocumentType, string>();
    for (const documentType of DOCUMENT_TYPES) {
      const doc = await prisma.hotelVerificationDocument.create({
        data: {
          verificationRequestId: request.id,
          partnerId: partner.id,
          hotelId: hotel.id,
          documentType,
          fileUrl: DOC_URL,
          status: 'approved',
          reviewedBy: manager.id,
          reviewedAt: daysFromNow(-60),
        },
      });
      docIdByType.set(documentType, doc.id);
    }

    // starRating của giấy xếp hạng dùng enum star1..star5 (KHÔNG phải chuỗi "4")
    const starEnum = (`star${h.starRating}` as const) as 'star1' | 'star2' | 'star3' | 'star4' | 'star5';
    const licenses: { licenseType: LicenseType; number: string; docType: VerificationDocumentType }[] = [
      { licenseType: 'business_license', number: h.businessRegistrationNumber, docType: 'business_license' },
      { licenseType: 'operating_license', number: `OL-${h.businessRegistrationNumber.slice(-4)}`, docType: 'operating_license' },
      { licenseType: 'fire_safety', number: `FS-${h.businessRegistrationNumber.slice(-4)}`, docType: 'fire_safety' },
    ];
    for (const l of licenses) {
      await prisma.hotelLicense.create({
        data: {
          hotelId: hotel.id,
          verificationRequestId: request.id,
          licenseType: l.licenseType,
          licenseNumber: l.licenseType === 'business_license' ? l.number : null,
          certificateNumber: l.licenseType === 'business_license' ? null : l.number,
          issueDate: daysFromNow(-400),
          expiryDate: daysFromNow(1000),
          authority: `${h.city} Department of Planning and Investment`,
          validityStatus: 'active',
          currentDocumentId: docIdByType.get(l.docType)!,
        },
      });
    }
    // Giấy xếp hạng sao — không có số hiệu, chỉ có hạng
    await prisma.hotelLicense.create({
      data: {
        hotelId: hotel.id,
        verificationRequestId: request.id,
        licenseType: 'classification',
        certificateNumber: `CL-${h.businessRegistrationNumber.slice(-4)}`,
        issueDate: daysFromNow(-380),
        expiryDate: daysFromNow(1200),
        authority: `${h.city} Department of Tourism`,
        validityStatus: 'active',
        starRating: starEnum,
        currentDocumentId: docIdByType.get('classification')!,
      },
    });

    // --- Người đại diện ---
    await prisma.hotelRepresentative.create({
      data: {
        hotelId: hotel.id,
        partnerId: partner.id,
        fullName: h.representative.fullName,
        role: h.representative.role,
        dateOfBirth: new Date('1988-05-20'),
        idNumber: h.representative.idNumber,
        phone: h.representative.phone,
        address: h.representative.address,
        idFrontImageUrl: DOC_URL,
        idBackImageUrl: DOC_URL,
      },
    });

    // --- Tài khoản nhận tiền: số TK mã hoá đúng như API làm ---
    await prisma.hotelPayoutAccount.create({
      data: {
        hotelId: hotel.id,
        partnerId: partner.id,
        accountHolder: h.payout.accountHolder,
        bankName: h.payout.bankName,
        accountNumber: encrypt(h.payout.accountNumber),
        bankBranch: h.payout.bankBranch,
        taxIdVatNumber: h.taxCode,
        registeredBusinessAddress: `${h.address}, ${h.district}, ${h.city}`,
        isPrimary: true,
      },
    });

    // --- Staff trực khách sạn ---
    const staff = userByEmail.get(h.staffEmail)!;
    await prisma.hotelStaffAssignment.create({
      data: { hotelId: hotel.id, userId: staff.id, assignedRole: 'staff' },
    });

    // --- Loại phòng + giường + ảnh + tiện nghi + phòng vật lý ---
    const roomTypes: { id: string; name: string; basePrice: number; roomCount: number; viewType: string }[] = [];
    for (const rt of h.roomTypes) {
      const created = await prisma.roomType.create({
        data: {
          hotelId: hotel.id,
          name: rt.name,
          description: rt.description,
          maxOccupancy: rt.maxOccupancy,
          maxAdults: rt.maxAdults,
          maxChildren: rt.maxChildren,
          basePrice: rt.basePrice,
          areaSqm: rt.areaSqm,
          sizeUnit: 'sqm',
          bedType: rt.bedType,
          viewType: rt.viewType,
          isActive: true,
          isNonSmoking: true,
          hasPrivateBathroom: true,
          hasBalcony: rt.hasBalcony,
          beds: { create: rt.beds },
          images: { create: rt.images.map((name, i) => ({ url: img(name), isPrimary: i === 0, sortOrder: i })) },
          amenities: { create: rt.amenities.map((name) => ({ amenityId: amenityId.get(name)! })) },
          rooms: {
            create: Array.from({ length: rt.roomCount }, (_, i) => ({
              hotelId: hotel.id,
              roomNumber: `${rt.floor}${String(i + 1).padStart(2, '0')}`,
              floor: rt.floor,
              status: 'available' as const,
            })),
          },
        },
      });
      roomTypes.push({ id: created.id, name: rt.name, basePrice: rt.basePrice, roomCount: rt.roomCount, viewType: rt.viewType });
    }

    // --- FAQ: bộ chung + câu dựng từ dữ liệu thật của chính khách sạn này ---
    const minPrice = Math.min(...h.roomTypes.map((r) => r.basePrice));
    await prisma.faqKnowledgeBase.createMany({
      data: [
        ...GENERIC_FAQS.map((f) => ({ hotelId: hotel.id, ...f })),
        { hotelId: hotel.id, category: 'Facilities', question: 'What amenities does the hotel offer?', answer: `The hotel offers: ${h.amenities.join(', ')}.` },
        { hotelId: hotel.id, category: 'Rooms', question: 'What room types are available?', answer: `Room types: ${h.roomTypes.map((r) => r.name).join(', ')}.` },
        { hotelId: hotel.id, category: 'Rooms', question: 'How much is the cheapest room?', answer: `Rooms start from ${minPrice.toLocaleString('en-US')} VND per night.` },
        { hotelId: hotel.id, category: 'Location', question: 'Where is the hotel located?', answer: `${h.address}, ${h.district}, ${h.city}.` },
        { hotelId: hotel.id, category: 'General', question: 'What is the hotel star rating?', answer: `The hotel is rated ${h.starRating} stars.` },
      ],
    });

    createdHotels.push({ id: hotel.id, name: h.name, charges: h.charges, roomTypes });
    console.log(`  ✓ ${h.name.padEnd(34)} ${h.roomTypes.length} loại phòng, ${totalRooms} phòng, ${DOCUMENT_TYPES.length} giấy tờ`);
  }

  // ----- Pricing rule: đủ CẢ 4 loại để demo/test engine tính giá -----
  const [danang, saigon, hanoi, nhatrang] = createdHotels;
  const oceanDanang = danang.roomTypes.find((r) => r.viewType === 'ocean')!;

  // ----- Đơn xin giảm hoa hồng đang CHỜ DUYỆT (để test luồng của Platform Manager) -----
  // Cố ý để ở trạng thái pending, KHÔNG duyệt sẵn: duyệt rồi thì mất chính thứ cần demo (hàng chờ
  // của PM, nút Duyệt/Từ chối, và việc khách sạn chuyển từ mức nền sang ưu đãi riêng).
  // 12% < mức nền 15% và ≥ sàn cứng 10% nên hợp lệ với mọi ràng buộc của commission-rate.service.
  await prisma.commissionRateRequest.create({
    data: {
      hotelId: danang.id,
      requestedBy: userByEmail.get('partner@gmail.com')!.id,
      requestedRate: 12,
      // Mức sẽ chịu nếu đơn không được duyệt — ở đây là mức nền vì khách sạn chưa có ưu đãi nào
      currentRate: PLATFORM_BASE_COMMISSION_RATE,
      reason:
        'Several new resorts have opened around My Khe Beach, pushing room rates down while operating costs keep rising. ' +
        'If the 12% rate is approved, we commit to growing bookings through the platform by at least 30% over the next 6 months.',
      status: 'pending',
      isRenewal: false,
      createdAt: daysFromNow(-2),
    },
  });
  console.log(`\n  ✓ 1 đơn xin giảm hoa hồng chờ duyệt: ${danang.name} xin 12% (mức nền ${PLATFORM_BASE_COMMISSION_RATE}%)`);

  await prisma.pricingRule.create({
    data: {
      hotelId: danang.id, roomTypeId: oceanDanang.id, name: 'Weekend surcharge — Ocean View Deluxe',
      ruleType: 'weekend' as PricingRuleType, startDate: daysFromNow(0), endDate: daysFromNow(90),
      dayOfWeek: [5, 6], adjustmentType: 'percentage' as AdjustmentType, adjustmentValue: 20, priority: 10, isActive: true,
    },
  });
  await prisma.pricingRule.create({
    data: {
      hotelId: nhatrang.id, name: 'Summer peak season — whole hotel',
      ruleType: 'seasonal' as PricingRuleType, startDate: daysFromNow(15), endDate: daysFromNow(60),
      dayOfWeek: [], adjustmentType: 'percentage' as AdjustmentType, adjustmentValue: 30, priority: 20, isActive: true,
    },
  });
  await prisma.pricingRule.create({
    data: {
      hotelId: saigon.id, name: 'Early bird — 15% off',
      ruleType: 'early_bird' as PricingRuleType, startDate: daysFromNow(0), endDate: daysFromNow(30),
      dayOfWeek: [], adjustmentType: 'percentage' as AdjustmentType, adjustmentValue: -15, priority: 5, isActive: true,
    },
  });
  await prisma.pricingRule.create({
    data: {
      hotelId: hanoi.id, name: 'High occupancy surcharge',
      ruleType: 'occupancy' as PricingRuleType, startDate: daysFromNow(0), endDate: daysFromNow(90),
      dayOfWeek: [], occupancyThreshold: 80, adjustmentType: 'percentage' as AdjustmentType, adjustmentValue: 25, priority: 15, isActive: true,
    },
  });
  console.log('\n  ✓ 4 pricing rule: weekend, seasonal, early_bird, occupancy');

  // ----- Rule GIẢM GIÁ (adjustmentValue < 0) để trang /deals có deal thật -----
  // Deal = khách sạn đang có rule giảm hiệu lực HÔM NAY; giảm trừ thẳng vào giá phòng (không cần mã).
  // priority cao hơn rule phụ thu để bảo đảm áp được ngay hôm nay. Cùng Saigon early_bird -15% ở trên
  // ⇒ /deals có 3 khách sạn (Saigon, Đà Nẵng, Hà Nội).
  await prisma.pricingRule.create({
    data: {
      hotelId: danang.id, name: 'Flash sale today — 25% off',
      ruleType: 'seasonal' as PricingRuleType, startDate: daysFromNow(0), endDate: daysFromNow(1),
      dayOfWeek: [], adjustmentType: 'percentage' as AdjustmentType, adjustmentValue: -25, priority: 30, isActive: true,
    },
  });
  await prisma.pricingRule.create({
    data: {
      hotelId: hanoi.id, name: 'Grand opening offer — 20% off',
      ruleType: 'seasonal' as PricingRuleType, startDate: daysFromNow(0), endDate: daysFromNow(45),
      dayOfWeek: [], adjustmentType: 'percentage' as AdjustmentType, adjustmentValue: -20, priority: 30, isActive: true,
    },
  });
  console.log('  ✓ 2 rule giảm giá cho /deals: Đà Nẵng -25% (flash), Hà Nội -20%');

  // ----- Phụ thu ngày lễ: mỗi khách sạn × mỗi dịp lễ (roomTypeId để trống = áp cả khách sạn) -----
  for (const hotel of createdHotels) {
    for (const holiday of HOLIDAYS) {
      await prisma.pricingRule.create({
        data: {
          hotelId: hotel.id,
          name: `${holiday.name} surcharge`,
          ruleType: 'seasonal' as PricingRuleType,
          startDate: new Date(`${holiday.start}T00:00:00Z`),
          endDate: new Date(`${holiday.end}T00:00:00Z`),
          dayOfWeek: [],
          adjustmentType: 'percentage' as AdjustmentType,
          adjustmentValue: holiday.surchargePercent,
          priority: HOLIDAY_RULE_PRIORITY,
          isActive: true,
        },
      });
    }
  }
  console.log(`  ✓ ${HOLIDAYS.length} dịp lễ × ${createdHotels.length} khách sạn = ${HOLIDAYS.length * createdHotels.length} rule phụ thu lễ`);
  for (const h of HOLIDAYS) {
    console.log(`      ${h.name.padEnd(26)} ${h.start} → ${h.end}   +${h.surchargePercent}%`);
  }

  // priceOverride một đêm "lễ" — demo giá cố định theo đêm, rule cuối tuần vẫn cộng tiếp lên giá này
  await prisma.roomAvailability.create({
    data: { roomTypeId: oceanDanang.id, hotelId: danang.id, date: daysFromNow(10), totalRooms: oceanDanang.roomCount, bookedRooms: 0, priceOverride: 2_500_000 },
  });

  // ----- Booking mẫu -----
  // Tính tiền GIỐNG HỆT createBooking: subtotal → thuế/phí → total, để dữ liệu seed không mâu thuẫn
  // với những gì API sẽ tính ra cho đơn mới.
  const money = (hotel: (typeof createdHotels)[number], basePrice: number, nights: number, guests: number) => {
    const subtotal = basePrice * nights;
    let tax = 0;
    let fee = 0;
    for (const c of hotel.charges) {
      const v = c.isPercentage
        ? subtotal * (c.amount / 100)
        : c.amount * ({ per_stay: 1, per_night: nights, per_person: guests, per_person_per_night: guests * nights }[c.chargeFrequency ?? 'per_stay']);
      if (c.chargeType === 'tax') tax += v;
      else fee += v;
    }
    return { subtotal, taxAmount: Math.round(tax), feeAmount: Math.round(fee), totalAmount: subtotal + Math.round(tax) + Math.round(fee) };
  };

  const hold = async (roomTypeId: string, hotelId: string, totalRooms: number, checkIn: Date, checkOut: Date) => {
    for (const night of eachNightOfStay(checkIn, checkOut)) {
      await prisma.roomAvailability.upsert({
        where: { roomTypeId_date: { roomTypeId, date: night } },
        create: { roomTypeId, hotelId, date: night, totalRooms, bookedRooms: 1 },
        update: { bookedRooms: { increment: 1 } },
      });
    }
  };

  const customer1 = userByEmail.get('customer@gmail.com')!;
  const customer2 = userByEmail.get('customer2@gmail.com')!;
  const customer3 = userByEmail.get('customer3@gmail.com')!;

  interface SeedBooking {
    code: string;
    customerId: string;
    hotel: (typeof createdHotels)[number];
    roomTypeIdx: number;
    fromDay: number;
    nights: number;
    guests: number;
    status: 'confirmed' | 'checked_out' | 'cancelled';
    paid: boolean;
    voucher?: string;
    review?: { by: string; rating: number; title: string; content: string };
    specialRequests?: string;
  }

  const BOOKINGS: SeedBooking[] = [
    // Đà Nẵng — đủ vòng đời để demo check-in → check-out → đánh giá
    { code: 'BKSEED001', customerId: customer1.id, hotel: danang, roomTypeIdx: 0, fromDay: 7, nights: 2, guests: 2, status: 'confirmed', paid: true, voucher: 'VCSEED001', specialRequests: 'High floor, away from the elevator' },
    { code: 'BKSEED002', customerId: customer1.id, hotel: danang, roomTypeIdx: 0, fromDay: 0, nights: 2, guests: 2, status: 'confirmed', paid: true, voucher: 'VCSEED002' },
    { code: 'BKSEED003', customerId: customer2.id, hotel: danang, roomTypeIdx: 2, fromDay: -5, nights: 2, guests: 2, status: 'checked_out', paid: true },
    { code: 'BKSEED004', customerId: customer3.id, hotel: danang, roomTypeIdx: 1, fromDay: -12, nights: 3, guests: 4, status: 'checked_out', paid: true, review: { by: customer3.id, rating: 5, title: 'Wonderful resort', content: 'Spacious room with a balcony looking straight out to the sea. Friendly staff and a breakfast with plenty of choice. We will come back.' } },
    { code: 'BKSEED005', customerId: customer2.id, hotel: danang, roomTypeIdx: 0, fromDay: -20, nights: 2, guests: 2, status: 'checked_out', paid: true, review: { by: customer2.id, rating: 4, title: 'Worth the money', content: 'The beachfront location is very convenient. The pool gets a bit crowded in the afternoon, but overall a great stay.' } },
    { code: 'BKSEED006', customerId: customer1.id, hotel: danang, roomTypeIdx: 2, fromDay: 20, nights: 1, guests: 2, status: 'cancelled', paid: false },
    // Sài Gòn
    { code: 'BKSEED007', customerId: customer1.id, hotel: saigon, roomTypeIdx: 1, fromDay: -8, nights: 2, guests: 2, status: 'checked_out', paid: true, review: { by: customer1.id, rating: 5, title: 'Right in the centre', content: 'A 5-minute walk to Ben Thanh Market. Clean room with good sound insulation even facing the street.' } },
    { code: 'BKSEED008', customerId: customer2.id, hotel: saigon, roomTypeIdx: 0, fromDay: 5, nights: 3, guests: 1, status: 'confirmed', paid: true },
    // Hà Nội
    { code: 'BKSEED009', customerId: customer3.id, hotel: hanoi, roomTypeIdx: 1, fromDay: -15, nights: 2, guests: 2, status: 'checked_out', paid: true, review: { by: customer3.id, rating: 4, title: 'Great spot in the Old Quarter', content: 'Loved the balcony overlooking the street. A little noisy at the weekend, exactly as the hotel had warned.' } },
    { code: 'BKSEED010', customerId: customer1.id, hotel: hanoi, roomTypeIdx: 0, fromDay: 12, nights: 2, guests: 2, status: 'confirmed', paid: true },
    // Nha Trang
    { code: 'BKSEED011', customerId: customer2.id, hotel: nhatrang, roomTypeIdx: 1, fromDay: -25, nights: 3, guests: 3, status: 'checked_out', paid: true, review: { by: customer2.id, rating: 5, title: 'Very private bungalow', content: 'Set in the coconut garden, just a few steps to the pool in the morning. The resort fee is worth it since it includes the beach loungers.' } },
    { code: 'BKSEED012', customerId: customer3.id, hotel: nhatrang, roomTypeIdx: 0, fromDay: 25, nights: 2, guests: 2, status: 'confirmed', paid: true },
  ];

  let paymentSeq = 0;
  for (const b of BOOKINGS) {
    const rt = b.hotel.roomTypes[b.roomTypeIdx];
    const checkIn = daysFromNow(b.fromDay);
    const checkOut = daysFromNow(b.fromDay + b.nights);
    const m = money(b.hotel, rt.basePrice, b.nights, b.guests);

    // Đơn đã huỷ không giữ tồn kho (giống cancelBooking: trả phòng lại ngay)
    if (b.status !== 'cancelled') {
      await hold(rt.id, b.hotel.id, rt.roomCount, checkIn, checkOut);
    }

    const booking = await prisma.booking.create({
      data: {
        bookingCode: b.code,
        customerId: b.customerId,
        hotelId: b.hotel.id,
        roomTypeId: rt.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numNights: b.nights,
        numGuests: b.guests,
        basePricePerNight: rt.basePrice,
        subtotal: m.subtotal,
        discountAmount: 0,
        taxAmount: m.taxAmount,
        feeAmount: m.feeAmount,
        totalAmount: m.totalAmount,
        status: b.status,
        source: 'website',
        specialRequests: b.specialRequests ?? null,
        ...(b.status === 'checked_out' && { checkedInAt: checkIn, checkedOutAt: checkOut }),
        ...(b.status === 'cancelled' && { cancelledAt: daysFromNow(-1), cancellationReason: 'Guest changed travel plans' }),
      },
    });

    if (b.voucher) {
      await prisma.bookingVoucher.create({
        data: { bookingId: booking.id, voucherCode: b.voucher, qrData: `SMARTSTAY|${b.voucher}|${b.code}`, expiresAt: checkOut },
      });
    }

    if (b.paid) {
      paymentSeq += 1;
      const payment = await prisma.payment.create({
        data: {
          bookingId: booking.id,
          paymentMethod: 'vnpay',
          transactionId: `SEEDPAY${String(paymentSeq).padStart(4, '0')}`,
          amount: m.totalAmount,
          currency: 'VND',
          status: 'completed',
          paidAt: daysFromNow(b.fromDay - 1),
        },
      });

      // Hoa hồng: đơn đã trả phòng thì đã tất toán (tiền về ví khả dụng), đơn tương lai còn treo
      // Booking mẫu đều phát sinh trong thời gian mức nền có hiệu lực, và không khách sạn nào có
      // ưu đãi riêng ⇒ rate đúng bằng mức nền (khớp kết quả resolveRate nếu tính lại).
      const rate = PLATFORM_BASE_COMMISSION_RATE;
      // Tính trên totalAmount (tiền phòng − giảm giá + thuế + phí) — ĐÚNG như payment.service và
      // booking.service làm khi tiền thật về. Trước đây seed tính trên subtotal nên hoa hồng và số
      // dư ví thấp hơn thực tế, khiến báo cáo doanh thu demo không khớp công thức của hệ thống.
      const commissionAmount = Math.round((m.totalAmount * rate) / 100);
      const net = m.totalAmount - commissionAmount;
      const settled = b.status === 'checked_out';
      await prisma.platformCommission.create({
        data: {
          bookingId: booking.id,
          paymentId: payment.id,
          partnerId: (await prisma.hotel.findUniqueOrThrow({ where: { id: b.hotel.id }, select: { partnerId: true } })).partnerId,
          commissionRate: rate,
          commissionAmount,
          status: settled ? 'settled' : 'pending',
          ...(settled && { settledAt: checkOut }),
        },
      });
      await prisma.wallet.update({
        where: { hotelId: b.hotel.id },
        data: settled
          ? { balanceAvailable: { increment: net } }
          : { balancePending: { increment: net } },
      });
    }

    if (b.review) {
      await prisma.review.create({
        data: {
          bookingId: booking.id,
          customerId: b.review.by,
          hotelId: b.hotel.id,
          // Điểm review theo thang 10 (khách chấm 1–10). rating trong data ở thang 5 nên ×2.
          overallRating: b.review.rating * 2,
          cleanlinessRating: b.review.rating * 2,
          serviceRating: b.review.rating * 2,
          locationRating: 10,
          valueRating: b.review.rating * 2,
          title: b.review.title,
          content: b.review.content,
          status: 'published',
        },
      });
    }
  }
  console.log(`  ✓ ${BOOKINGS.length} booking (kèm thanh toán, hoa hồng, ví, voucher, đánh giá)`);

  // ----- Ví khách: nạp sẵn số dư để demo thanh toán bằng ví ngay, khỏi phải huỷ đơn trước -----
  // customer@gmail.com: đủ trả trọn một đơn rẻ ⇒ demo "ví trả hết, booking confirmed ngay"
  // customer2@gmail.com: cố tình để ÍT ⇒ demo "ví trả một phần, cổng trả phần còn lại"
  // customer3@gmail.com: không có ví ⇒ demo trạng thái ví rỗng
  await prisma.wallet.create({
    data: {
      customerId: customer1.id,
      balanceAvailable: 2_000_000,
      transactions: {
        create: {
          type: 'adjustment',
          amount: 2_000_000,
          balanceAfter: 2_000_000,
          description: 'Sample balance for the wallet payment demo',
        },
      },
    },
  });
  await prisma.wallet.create({
    data: {
      customerId: customer2.id,
      balanceAvailable: 300_000,
      transactions: {
        create: {
          type: 'adjustment',
          amount: 300_000,
          balanceAfter: 300_000,
          description: 'Small sample balance for the wallet + gateway split payment demo',
        },
      },
    },
  });
  console.log('  ✓ ví khách: customer@ 2.000.000đ (trả trọn đơn), customer2@ 300.000đ (trả kết hợp)');

  // Lưu ý: trang /deals KHÔNG còn dùng model Promotion — deal được suy ra từ pricing rule GIẢM GIÁ
  // (xem các rule âm ở trên + promotion.service.ts). Không seed Promotion nữa.

  console.log('\nSeed xong.\n');
  console.log('Tài khoản mẫu — quy ước <role>@gmail.com / <role>123:');
  console.log('  admin@gmail.com / admin123        manager@gmail.com / manager123');
  console.log('  partner@gmail.com / partner123    (partner2..4@gmail.com cùng mật khẩu)');
  console.log('  staff@gmail.com / staff123        (staff2..4@gmail.com cùng mật khẩu)');
  console.log('  customer@gmail.com / customer123  (customer2..3@gmail.com cùng mật khẩu)');
  console.log('  guest@gmail.com / guest123');
  console.log(`\n${HOTELS.length} khách sạn, mỗi khách sạn có hồ sơ pháp lý đầy đủ đã duyệt, ảnh thật từ Cloudinary.`);
  console.log('Booking để demo: BKSEED002 nhận phòng HÔM NAY (voucher VCSEED002 để test QR check-in).');
  console.log('BKSEED003 đã trả phòng và CHƯA đánh giá → dùng để test POST /reviews.');
  console.log(`\nGiá lễ: cả ${HOTELS.length} khách sạn đều có phụ thu cho ${HOLIDAYS.length} dịp lễ (gần nhất: ${HOLIDAYS[0].name} ${HOLIDAYS[0].start}).`);
  console.log('Lưu ý: hệ thống KHÔNG tự biết ngày lễ — phụ thu lễ là rule seasonal khai tay trong seed này.');
  console.log('Tết theo lịch âm nên mỗi năm một ngày dương khác → phải cập nhật tay bảng HOLIDAYS.');
};

main()
  .catch((e) => {
    console.error('Seed lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
