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
  { email: 'admin@gmail.com', password: 'admin123', fullName: 'Quản trị hệ thống', role: 'admin', phone: '0900000001' },
  { email: 'manager@gmail.com', password: 'manager123', fullName: 'Quản lý sàn', role: 'platform_manager', phone: '0900000002' },

  // 4 partner — mỗi người sở hữu một khách sạn
  { email: 'partner@gmail.com', password: 'partner123', fullName: 'Trần Minh Đức', role: 'hotel_partner', phone: '0901000001' },
  { email: 'partner2@gmail.com', password: 'partner123', fullName: 'Nguyễn Thu Hà', role: 'hotel_partner', phone: '0901000002' },
  { email: 'partner3@gmail.com', password: 'partner123', fullName: 'Lê Quốc Bảo', role: 'hotel_partner', phone: '0901000003' },
  { email: 'partner4@gmail.com', password: 'partner123', fullName: 'Phạm Hải Yến', role: 'hotel_partner', phone: '0901000004' },

  // 4 staff — mỗi người trực một khách sạn
  { email: 'staff@gmail.com', password: 'staff123', fullName: 'Lễ tân Đà Nẵng', role: 'staff', phone: '0902000001' },
  { email: 'staff2@gmail.com', password: 'staff123', fullName: 'Lễ tân Sài Gòn', role: 'staff', phone: '0902000002' },
  { email: 'staff3@gmail.com', password: 'staff123', fullName: 'Lễ tân Hà Nội', role: 'staff', phone: '0902000003' },
  { email: 'staff4@gmail.com', password: 'staff123', fullName: 'Lễ tân Nha Trang', role: 'staff', phone: '0902000004' },

  // Khách — nhiều người để có đủ đánh giá cho điểm trung bình hiển thị đẹp
  { email: 'customer@gmail.com', password: 'customer123', fullName: 'Nguyễn Văn An', role: 'customer', phone: '0903000001' },
  { email: 'customer2@gmail.com', password: 'customer123', fullName: 'Trần Thị Bình', role: 'customer', phone: '0903000002' },
  { email: 'customer3@gmail.com', password: 'customer123', fullName: 'Võ Hoàng Long', role: 'customer', phone: '0903000003' },

  { email: 'guest@gmail.com', password: 'guest123', fullName: 'Khách vãng lai', role: 'guest', phone: '0904000001' },
];

// ---------------------------------------------------------------------------
// Tiện nghi dùng chung
// ---------------------------------------------------------------------------
const AMENITIES: { name: string; icon: string; category: AmenityCategory }[] = [
  { name: 'WiFi miễn phí', icon: 'wifi', category: 'connectivity' },
  { name: 'Hồ bơi', icon: 'pool', category: 'wellness' },
  { name: 'Phòng gym', icon: 'gym', category: 'wellness' },
  { name: 'Spa', icon: 'spa', category: 'wellness' },
  { name: 'Bãi đậu xe', icon: 'parking', category: 'parking' },
  { name: 'Nhà hàng', icon: 'restaurant', category: 'restaurant' },
  { name: 'Quầy bar', icon: 'bar', category: 'food_drink' },
  { name: 'Bữa sáng buffet', icon: 'breakfast', category: 'food_drink' },
  { name: 'Lễ tân 24/7', icon: 'reception', category: 'service' },
  { name: 'Dịch vụ giặt là', icon: 'laundry', category: 'service' },
  { name: 'Đưa đón sân bay', icon: 'shuttle', category: 'service' },
  { name: 'Điều hoà', icon: 'air-conditioner', category: 'room' },
  { name: 'TV màn hình phẳng', icon: 'tv', category: 'room' },
  { name: 'Minibar', icon: 'minibar', category: 'room' },
  { name: 'Ban công', icon: 'balcony', category: 'room' },
  { name: 'Két an toàn', icon: 'safe', category: 'room' },
  { name: 'Máy pha cà phê', icon: 'coffee', category: 'room' },
  { name: 'Bồn tắm', icon: 'bathtub', category: 'room' },
];

// FAQ chung — nhiều câu để trợ lý AI có cái mà chọn lọc
const GENERIC_FAQS: { category: string; question: string; answer: string }[] = [
  { category: 'Chính sách', question: 'Khách sạn có cho mang theo thú cưng không?', answer: 'Rất tiếc, khách sạn không nhận thú cưng, trừ chó dẫn đường hỗ trợ người khuyết tật.' },
  { category: 'Chính sách', question: 'Chính sách hủy phòng như thế nào?', answer: 'Hủy miễn phí nếu báo trước 48 giờ so với giờ nhận phòng; trong vòng 48 giờ sẽ bị thu phí 1 đêm đầu.' },
  { category: 'Chính sách', question: 'Khách sạn có cho hút thuốc trong phòng không?', answer: 'Tất cả phòng đều cấm hút thuốc. Có khu vực hút thuốc riêng ngoài trời.' },
  { category: 'Chính sách', question: 'Trẻ em ở cùng có tính phí không?', answer: 'Trẻ dưới 6 tuổi ngủ ghép giường với bố mẹ được miễn phí; từ 6 tuổi tính như người lớn hoặc phụ thu giường phụ.' },
  { category: 'Chính sách', question: 'Nhận phòng cần giấy tờ gì?', answer: 'Khách vui lòng xuất trình CCCD/CMND hoặc hộ chiếu còn hiệu lực khi nhận phòng.' },
  { category: 'Chính sách', question: 'Giờ nhận và trả phòng là mấy giờ?', answer: 'Nhận phòng từ 14:00, trả phòng trước 12:00.' },
  { category: 'Chính sách', question: 'Nhận phòng sớm hoặc trả phòng muộn được không?', answer: 'Tuỳ tình trạng phòng. Trả phòng muộn sau 12:00 có thể phụ thu; vui lòng hỏi lễ tân.' },
  { category: 'Tiện ích', question: 'Khách sạn có WiFi miễn phí không?', answer: 'Có WiFi miễn phí tốc độ cao ở toàn bộ khu vực và trong phòng.' },
  { category: 'Tiện ích', question: 'Hồ bơi mở cửa mấy giờ?', answer: 'Hồ bơi mở từ 6:00 đến 21:00 hằng ngày (nếu khách sạn có hồ bơi).' },
  { category: 'Tiện ích', question: 'Bữa sáng phục vụ mấy giờ?', answer: 'Bữa sáng buffet phục vụ từ 6:30 đến 9:30.' },
  { category: 'Tiện ích', question: 'Có chỗ đậu xe không?', answer: 'Có bãi đậu xe cho khách lưu trú, ưu tiên theo chỗ trống.' },
  { category: 'Tiện ích', question: 'Có thể gửi hành lý trước hoặc sau giờ nhận phòng không?', answer: 'Có, lễ tân nhận giữ hành lý miễn phí trước khi nhận phòng và sau khi trả phòng.' },
  { category: 'Thanh toán', question: 'Khách sạn nhận thanh toán bằng hình thức nào?', answer: 'Nhận thanh toán online qua VNPay, chuyển khoản quét QR qua SePay, và tiền mặt tại quầy lễ tân.' },
  { category: 'Thanh toán', question: 'Khách sạn có xuất hóa đơn VAT không?', answer: 'Có, hoá đơn được phát hành khi trả phòng và đã tách riêng phần thuế.' },
  { category: 'Thanh toán', question: 'Tôi hủy phòng đã trả tiền thì được hoàn lại không?', answer: 'Có. Hoàn 100% nếu hủy trước 48 giờ; trong 48 giờ giữ lại 1 đêm đầu. Yêu cầu hoàn tiền cần khách sạn duyệt trước khi chuyển khoản.' },
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
  commissionRate: number;
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
    businessName: 'Công ty TNHH Biển Xanh Hospitality',
    businessRegistrationNumber: '0401234567',
    taxCode: '0401234567-001',
    commissionRate: 15,
    representative: { fullName: 'Trần Minh Đức', role: 'owner', idNumber: '048201001234', phone: '0901000001', address: '12 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng' },
    payout: { accountHolder: 'TRAN MINH DUC', bankName: 'Vietcombank', accountNumber: '0071000123456', bankBranch: 'CN Đà Nẵng' },
    name: 'SmartStay Đà Nẵng Beach Resort',
    description:
      'Khu nghỉ dưỡng 5 sao nằm ngay mặt tiền biển Mỹ Khê, cách sân bay Đà Nẵng 15 phút xe. Toàn bộ phòng đều có ban công riêng nhìn ra biển, kèm hồ bơi vô cực, spa và nhà hàng hải sản.',
    address: '128 Võ Nguyên Giáp',
    city: 'Đà Nẵng',
    district: 'Sơn Trà',
    ward: 'Phước Mỹ',
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
    amenities: ['WiFi miễn phí', 'Hồ bơi', 'Spa', 'Phòng gym', 'Nhà hàng', 'Quầy bar', 'Bữa sáng buffet', 'Lễ tân 24/7', 'Bãi đậu xe', 'Đưa đón sân bay'],
    images: [
      { name: 'resort-01', category: 'cover', caption: 'Toàn cảnh khu nghỉ dưỡng nhìn từ biển' },
      { name: 'resort-02', category: 'exterior', caption: 'Khuôn viên và lối vào chính' },
      { name: 'resort-03', category: 'exterior', caption: 'Khu vườn nhiệt đới' },
      { name: 'hotel-pool-01', category: 'exterior', caption: 'Hồ bơi vô cực hướng biển' },
      { name: 'resort-04', category: 'exterior', caption: 'Bãi biển riêng' },
    ],
    roomTypes: [
      {
        name: 'Deluxe Hướng Biển', description: 'Phòng 32m² với ban công riêng nhìn thẳng ra biển Mỹ Khê, giường King và bồn tắm nằm.',
        maxOccupancy: 2, maxAdults: 2, maxChildren: 1, basePrice: 1_500_000, areaSqm: 32, bedType: 'king', viewType: 'ocean', floor: 5, roomCount: 8, hasBalcony: true,
        beds: [{ bedType: 'king', quantity: 1 }],
        amenities: ['Điều hoà', 'TV màn hình phẳng', 'Minibar', 'Ban công', 'Két an toàn', 'Bồn tắm'],
        images: ['room-01', 'room-02'],
      },
      {
        name: 'Suite Gia Đình', description: 'Suite 55m² hai phòng ngủ riêng biệt, phù hợp gia đình 4 người, có khu bếp nhỏ và phòng khách.',
        maxOccupancy: 4, maxAdults: 2, maxChildren: 2, basePrice: 2_600_000, areaSqm: 55, bedType: 'king', viewType: 'ocean', floor: 8, roomCount: 4, hasBalcony: true,
        beds: [{ bedType: 'king', quantity: 1 }, { bedType: 'single', quantity: 2 }],
        amenities: ['Điều hoà', 'TV màn hình phẳng', 'Minibar', 'Ban công', 'Két an toàn', 'Máy pha cà phê', 'Bồn tắm'],
        images: ['suite-01', 'suite-02'],
      },
      {
        name: 'Standard Hướng Vườn', description: 'Phòng 26m² nhìn ra vườn nhiệt đới, yên tĩnh, giường Queen.',
        maxOccupancy: 2, maxAdults: 2, maxChildren: 0, basePrice: 900_000, areaSqm: 26, bedType: 'queen', viewType: 'garden', floor: 3, roomCount: 10, hasBalcony: false,
        beds: [{ bedType: 'queen', quantity: 1 }],
        amenities: ['Điều hoà', 'TV màn hình phẳng', 'Két an toàn'],
        images: ['room-03', 'room-04'],
      },
    ],
    charges: [
      { chargeType: 'tax', name: 'VAT', amount: 8, isPercentage: true },
      { chargeType: 'fee', name: 'Phí dịch vụ', amount: 50_000, isPercentage: false, chargeFrequency: 'per_night' },
    ],
    policies: [
      { title: 'Chính sách huỷ phòng', description: 'Huỷ miễn phí trước 48 giờ so với giờ nhận phòng. Huỷ muộn hơn sẽ bị giữ lại tiền một đêm đầu.', important: true },
      { title: 'Giờ nhận / trả phòng', description: 'Nhận phòng từ 14:00, trả phòng trước 12:00. Trả phòng muộn có thể phụ thu.' },
      { title: 'Đặt cọc', description: 'Đặt cọc minibar 200.000đ khi nhận phòng, hoàn lại đầy đủ lúc trả phòng nếu không phát sinh.' },
      { title: 'Thú cưng', description: 'Không nhận thú cưng, trừ chó dẫn đường hỗ trợ người khuyết tật.' },
    ],
    nearby: [
      { name: 'Biển Mỹ Khê', category: 'beach', distance: 0.1, transportType: 'walk', journeyMinutes: 2 },
      { name: 'Sân bay quốc tế Đà Nẵng', category: 'airport', distance: 6, transportType: 'car', journeyMinutes: 15 },
      { name: 'Cầu Rồng', category: 'landmark', distance: 3.2, transportType: 'car', journeyMinutes: 10 },
      { name: 'Bán đảo Sơn Trà', category: 'nature', distance: 8, transportType: 'car', journeyMinutes: 20 },
    ],
  },

  {
    ownerEmail: 'partner2@gmail.com',
    staffEmail: 'staff2@gmail.com',
    businessName: 'Công ty CP Sài Gòn Central Group',
    businessRegistrationNumber: '0312345678',
    taxCode: '0312345678-001',
    commissionRate: 12,
    representative: { fullName: 'Nguyễn Thu Hà', role: 'general_manager', idNumber: '079198002345', phone: '0901000002', address: '45 Lê Lợi, Quận 1, TP.HCM' },
    payout: { accountHolder: 'NGUYEN THU HA', bankName: 'Techcombank', accountNumber: '19036789012345', bankBranch: 'CN Sài Gòn' },
    name: 'SmartStay Saigon Central',
    description:
      'Khách sạn 4 sao ngay trung tâm Quận 1, đi bộ 5 phút tới chợ Bến Thành và phố đi bộ Nguyễn Huệ. Lựa chọn quen thuộc của khách công tác nhờ phòng họp và WiFi tốc độ cao.',
    address: '45 Lê Lợi',
    city: 'Thành phố Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Bến Nghé',
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
    amenities: ['WiFi miễn phí', 'Phòng gym', 'Nhà hàng', 'Quầy bar', 'Bữa sáng buffet', 'Lễ tân 24/7', 'Bãi đậu xe', 'Dịch vụ giặt là'],
    images: [
      { name: 'hotel-exterior-01', category: 'cover', caption: 'Mặt tiền khách sạn trên đường Lê Lợi' },
      { name: 'hotel-exterior-02', category: 'exterior', caption: 'Toà nhà nhìn từ phố đi bộ' },
      { name: 'hotel-lobby-01', category: 'exterior', caption: 'Sảnh đón khách' },
      { name: 'hotel-restaurant-01', category: 'exterior', caption: 'Nhà hàng tầng trệt' },
    ],
    roomTypes: [
      {
        name: 'Superior', description: 'Phòng 24m² nhìn ra thành phố, bàn làm việc rộng, phù hợp khách công tác.',
        maxOccupancy: 2, maxAdults: 2, maxChildren: 0, basePrice: 850_000, areaSqm: 24, bedType: 'queen', viewType: 'city', floor: 4, roomCount: 12, hasBalcony: false,
        beds: [{ bedType: 'queen', quantity: 1 }],
        amenities: ['Điều hoà', 'TV màn hình phẳng', 'Két an toàn', 'Máy pha cà phê'],
        images: ['room-05', 'room-06'],
      },
      {
        name: 'Deluxe Thành Phố', description: 'Phòng 30m² tầng cao, cửa sổ kính lớn nhìn toàn cảnh trung tâm Quận 1.',
        maxOccupancy: 3, maxAdults: 2, maxChildren: 1, basePrice: 1_200_000, areaSqm: 30, bedType: 'king', viewType: 'city', floor: 10, roomCount: 8, hasBalcony: false,
        beds: [{ bedType: 'king', quantity: 1 }, { bedType: 'sofa_bed', quantity: 1 }],
        amenities: ['Điều hoà', 'TV màn hình phẳng', 'Minibar', 'Két an toàn', 'Máy pha cà phê'],
        images: ['room-07', 'room-08'],
      },
      {
        name: 'Executive Suite', description: 'Suite 48m² tầng 16 có phòng khách riêng và quyền vào phòng chờ Executive.',
        maxOccupancy: 3, maxAdults: 3, maxChildren: 0, basePrice: 2_200_000, areaSqm: 48, bedType: 'king', viewType: 'city', floor: 16, roomCount: 4, hasBalcony: true,
        beds: [{ bedType: 'king', quantity: 1 }],
        amenities: ['Điều hoà', 'TV màn hình phẳng', 'Minibar', 'Két an toàn', 'Máy pha cà phê', 'Bồn tắm', 'Ban công'],
        images: ['suite-03', 'suite-04'],
      },
    ],
    charges: [{ chargeType: 'tax', name: 'VAT', amount: 8, isPercentage: true }],
    policies: [
      { title: 'Chính sách huỷ phòng', description: 'Huỷ miễn phí trước 24 giờ so với giờ nhận phòng. Huỷ muộn hơn sẽ bị giữ lại tiền một đêm đầu.', important: true },
      { title: 'Giờ nhận / trả phòng', description: 'Nhận phòng từ 14:00, trả phòng trước 12:00.' },
      { title: 'Trẻ em', description: 'Trẻ dưới 6 tuổi ngủ ghép giường với bố mẹ được miễn phí.' },
    ],
    nearby: [
      { name: 'Chợ Bến Thành', category: 'attraction', distance: 0.6, transportType: 'walk', journeyMinutes: 8 },
      { name: 'Phố đi bộ Nguyễn Huệ', category: 'attraction', distance: 0.4, transportType: 'walk', journeyMinutes: 5 },
      { name: 'Sân bay Tân Sơn Nhất', category: 'airport', distance: 7.5, transportType: 'car', journeyMinutes: 25 },
      { name: 'Ga Metro Bến Thành', category: 'public_transport', distance: 0.7, transportType: 'walk', journeyMinutes: 9 },
    ],
  },

  {
    ownerEmail: 'partner3@gmail.com',
    staffEmail: 'staff3@gmail.com',
    businessName: 'Công ty TNHH Hà Nội Heritage',
    businessRegistrationNumber: '0101234567',
    taxCode: '0101234567-001',
    commissionRate: 10,
    representative: { fullName: 'Lê Quốc Bảo', role: 'legal_representative', idNumber: '001199003456', phone: '0901000003', address: '22 Hàng Bạc, Hoàn Kiếm, Hà Nội' },
    payout: { accountHolder: 'LE QUOC BAO', bankName: 'BIDV', accountNumber: '21010001234567', bankBranch: 'CN Hoàn Kiếm' },
    name: 'SmartStay Hanoi Old Quarter',
    description:
      'Khách sạn boutique 3 sao trong lòng phố cổ Hà Nội, đi bộ 5 phút ra hồ Hoàn Kiếm. Kiến trúc nhà phố cải tạo giữ nguyên nét cũ, phù hợp khách muốn ở giữa khu phố cổ.',
    address: '22 Hàng Bạc',
    city: 'Hà Nội',
    district: 'Hoàn Kiếm',
    ward: 'Hàng Buồm',
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
    amenities: ['WiFi miễn phí', 'Nhà hàng', 'Lễ tân 24/7', 'Dịch vụ giặt là', 'Đưa đón sân bay'],
    images: [
      { name: 'hotel-exterior-03', category: 'cover', caption: 'Mặt tiền nhà phố cổ đã cải tạo' },
      { name: 'hotel-exterior-04', category: 'exterior', caption: 'Góc phố Hàng Bạc' },
      { name: 'hotel-lobby-02', category: 'exterior', caption: 'Sảnh nhỏ ấm cúng' },
    ],
    roomTypes: [
      {
        name: 'Standard Phố Cổ', description: 'Phòng 20m² gọn gàng, cửa sổ nhìn ra phố Hàng Bạc nhộn nhịp.',
        maxOccupancy: 2, maxAdults: 2, maxChildren: 0, basePrice: 650_000, areaSqm: 20, bedType: 'double', viewType: 'city', floor: 2, roomCount: 10, hasBalcony: false,
        beds: [{ bedType: 'double', quantity: 1 }],
        amenities: ['Điều hoà', 'TV màn hình phẳng'],
        images: ['room-09', 'room-10'],
      },
      {
        name: 'Superior Ban Công', description: 'Phòng 26m² có ban công nhỏ nhìn xuống phố cổ, sáng và thoáng.',
        maxOccupancy: 2, maxAdults: 2, maxChildren: 1, basePrice: 950_000, areaSqm: 26, bedType: 'queen', viewType: 'city', floor: 4, roomCount: 6, hasBalcony: true,
        beds: [{ bedType: 'queen', quantity: 1 }],
        amenities: ['Điều hoà', 'TV màn hình phẳng', 'Minibar', 'Ban công'],
        images: ['room-11', 'room-12'],
      },
    ],
    charges: [
      { chargeType: 'tax', name: 'VAT', amount: 8, isPercentage: true },
      { chargeType: 'fee', name: 'Phí phục vụ', amount: 30_000, isPercentage: false, chargeFrequency: 'per_stay' },
    ],
    policies: [
      { title: 'Chính sách huỷ phòng', description: 'Huỷ miễn phí trước 24 giờ so với giờ nhận phòng.', important: true },
      { title: 'Tiếng ồn khu phố cổ', description: 'Khách sạn nằm giữa khu phố đi bộ cuối tuần, có thể ồn tới khuya thứ Sáu và thứ Bảy.', important: true },
      { title: 'Giờ nhận / trả phòng', description: 'Nhận phòng từ 14:00, trả phòng trước 12:00.' },
    ],
    nearby: [
      { name: 'Hồ Hoàn Kiếm', category: 'landmark', distance: 0.4, transportType: 'walk', journeyMinutes: 5 },
      { name: 'Chợ Đồng Xuân', category: 'attraction', distance: 0.8, transportType: 'walk', journeyMinutes: 10 },
      { name: 'Sân bay Nội Bài', category: 'airport', distance: 27, transportType: 'car', journeyMinutes: 45 },
      { name: 'Nhà hát Lớn Hà Nội', category: 'landmark', distance: 1.2, transportType: 'walk', journeyMinutes: 15 },
    ],
  },

  {
    ownerEmail: 'partner4@gmail.com',
    staffEmail: 'staff4@gmail.com',
    businessName: 'Công ty CP Nha Trang Bay Resorts',
    businessRegistrationNumber: '4201234567',
    taxCode: '4201234567-001',
    commissionRate: 14,
    representative: { fullName: 'Phạm Hải Yến', role: 'director', idNumber: '056200004567', phone: '0901000004', address: '90 Trần Phú, Nha Trang, Khánh Hoà' },
    payout: { accountHolder: 'PHAM HAI YEN', bankName: 'ACB', accountNumber: '18790001234567', bankBranch: 'CN Nha Trang' },
    name: 'SmartStay Nha Trang Bay',
    description:
      'Resort 4 sao bên vịnh Nha Trang với bãi biển riêng, hồ bơi ngoài trời và spa. Bungalow nằm rải trong vườn dừa, cách chợ Đầm 10 phút xe.',
    address: '90 Trần Phú',
    city: 'Nha Trang',
    district: 'Lộc Thọ',
    ward: 'Lộc Thọ',
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
    amenities: ['WiFi miễn phí', 'Hồ bơi', 'Spa', 'Nhà hàng', 'Quầy bar', 'Bữa sáng buffet', 'Lễ tân 24/7', 'Bãi đậu xe'],
    images: [
      { name: 'hotel-exterior-05', category: 'cover', caption: 'Resort nhìn từ vịnh Nha Trang' },
      { name: 'hotel-exterior-06', category: 'exterior', caption: 'Khu bungalow trong vườn dừa' },
      { name: 'hotel-pool-02', category: 'exterior', caption: 'Hồ bơi ngoài trời' },
      { name: 'hotel-spa-01', category: 'exterior', caption: 'Khu spa' },
      { name: 'hotel-lobby-03', category: 'exterior', caption: 'Sảnh mở hướng biển' },
    ],
    roomTypes: [
      {
        name: 'Deluxe Hướng Vịnh', description: 'Phòng 30m² ban công nhìn thẳng ra vịnh Nha Trang, giường King.',
        maxOccupancy: 2, maxAdults: 2, maxChildren: 1, basePrice: 1_350_000, areaSqm: 30, bedType: 'king', viewType: 'ocean', floor: 5, roomCount: 10, hasBalcony: true,
        beds: [{ bedType: 'king', quantity: 1 }],
        amenities: ['Điều hoà', 'TV màn hình phẳng', 'Minibar', 'Ban công', 'Két an toàn'],
        images: ['room-13', 'room-14'],
      },
      {
        name: 'Bungalow Vườn Dừa', description: 'Bungalow riêng 40m² giữa vườn dừa, hiên riêng và lối đi thẳng ra hồ bơi.',
        maxOccupancy: 3, maxAdults: 2, maxChildren: 1, basePrice: 1_900_000, areaSqm: 40, bedType: 'king', viewType: 'garden', floor: 1, roomCount: 6, hasBalcony: true,
        beds: [{ bedType: 'king', quantity: 1 }, { bedType: 'sofa_bed', quantity: 1 }],
        amenities: ['Điều hoà', 'TV màn hình phẳng', 'Minibar', 'Ban công', 'Bồn tắm', 'Máy pha cà phê'],
        images: ['room-15', 'suite-05'],
      },
    ],
    charges: [
      { chargeType: 'tax', name: 'VAT', amount: 8, isPercentage: true },
      { chargeType: 'fee', name: 'Phí resort', amount: 80_000, isPercentage: false, chargeFrequency: 'per_night' },
    ],
    policies: [
      { title: 'Chính sách huỷ phòng', description: 'Huỷ miễn phí trước 72 giờ so với giờ nhận phòng. Huỷ muộn hơn sẽ mất toàn bộ tiền phòng.', important: true },
      { title: 'Phí resort', description: 'Phí resort 80.000đ/đêm đã gồm khăn tắm biển, ghế bãi biển và lớp yoga buổi sáng.', important: true },
      { title: 'Giờ nhận / trả phòng', description: 'Nhận phòng từ 14:00, trả phòng trước 12:00.' },
    ],
    nearby: [
      { name: 'Bãi biển Trần Phú', category: 'beach', distance: 0.05, transportType: 'walk', journeyMinutes: 1 },
      { name: 'Chợ Đầm', category: 'attraction', distance: 3.5, transportType: 'car', journeyMinutes: 10 },
      { name: 'Sân bay Cam Ranh', category: 'airport', distance: 32, transportType: 'car', journeyMinutes: 45 },
      { name: 'Tháp Bà Ponagar', category: 'landmark', distance: 4.2, transportType: 'car', journeyMinutes: 12 },
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
  { name: 'Quốc khánh 2/9', start: '2026-08-31', end: '2026-09-02', surchargePercent: 35 },
  { name: 'Tết Dương lịch', start: '2026-12-31', end: '2027-01-01', surchargePercent: 25 },
  // Mùng 1 Tết Đinh Mùi rơi vào 06/02/2027 (dương lịch) — kiểm lại khi sang năm khác
  { name: 'Tết Nguyên đán Đinh Mùi', start: '2027-02-05', end: '2027-02-11', surchargePercent: 50 },
  { name: 'Lễ 30/4 - 1/5', start: '2027-04-29', end: '2027-05-03', surchargePercent: 40 },
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
        commissionRate: h.commissionRate,
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
            { contactType: 'general', name: 'Lễ tân', phone: h.phone, phoneType: 'voice', email: h.email },
            { contactType: 'invoices', name: 'Phòng kế toán', email: `invoice-${h.city.toLowerCase().replace(/\s/g, '')}@smartstay.ai` },
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
        notes: 'Hồ sơ đầy đủ, giấy tờ hợp lệ.',
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
      { licenseType: 'operating_license', number: `GP-${h.businessRegistrationNumber.slice(-4)}`, docType: 'operating_license' },
      { licenseType: 'fire_safety', number: `PCCC-${h.businessRegistrationNumber.slice(-4)}`, docType: 'fire_safety' },
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
          authority: `Sở Kế hoạch và Đầu tư ${h.city}`,
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
        certificateNumber: `XH-${h.businessRegistrationNumber.slice(-4)}`,
        issueDate: daysFromNow(-380),
        expiryDate: daysFromNow(1200),
        authority: `Sở Du lịch ${h.city}`,
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
        { hotelId: hotel.id, category: 'Tiện ích', question: 'Khách sạn có những tiện nghi gì?', answer: `Khách sạn có: ${h.amenities.join(', ')}.` },
        { hotelId: hotel.id, category: 'Phòng', question: 'Khách sạn có những loại phòng nào?', answer: `Các loại phòng: ${h.roomTypes.map((r) => r.name).join(', ')}.` },
        { hotelId: hotel.id, category: 'Phòng', question: 'Phòng rẻ nhất giá bao nhiêu?', answer: `Giá phòng thấp nhất từ ${minPrice.toLocaleString('vi-VN')}đ/đêm.` },
        { hotelId: hotel.id, category: 'Vị trí', question: 'Khách sạn nằm ở đâu?', answer: `${h.address}, ${h.district}, ${h.city}.` },
        { hotelId: hotel.id, category: 'Thông tin', question: 'Khách sạn được xếp hạng mấy sao?', answer: `Khách sạn đạt chuẩn ${h.starRating} sao.` },
      ],
    });

    createdHotels.push({ id: hotel.id, name: h.name, charges: h.charges, roomTypes });
    console.log(`  ✓ ${h.name.padEnd(34)} ${h.roomTypes.length} loại phòng, ${totalRooms} phòng, ${DOCUMENT_TYPES.length} giấy tờ`);
  }

  // ----- Pricing rule: đủ CẢ 4 loại để demo/test engine tính giá -----
  const [danang, saigon, hanoi, nhatrang] = createdHotels;
  const oceanDanang = danang.roomTypes.find((r) => r.viewType === 'ocean')!;

  await prisma.pricingRule.create({
    data: {
      hotelId: danang.id, roomTypeId: oceanDanang.id, name: 'Phụ thu cuối tuần — Deluxe Hướng Biển',
      ruleType: 'weekend' as PricingRuleType, startDate: daysFromNow(0), endDate: daysFromNow(90),
      dayOfWeek: [5, 6], adjustmentType: 'percentage' as AdjustmentType, adjustmentValue: 20, priority: 10, isActive: true,
    },
  });
  await prisma.pricingRule.create({
    data: {
      hotelId: nhatrang.id, name: 'Cao điểm hè — toàn khách sạn',
      ruleType: 'seasonal' as PricingRuleType, startDate: daysFromNow(15), endDate: daysFromNow(60),
      dayOfWeek: [], adjustmentType: 'percentage' as AdjustmentType, adjustmentValue: 30, priority: 20, isActive: true,
    },
  });
  await prisma.pricingRule.create({
    data: {
      hotelId: saigon.id, name: 'Đặt sớm giảm 15%',
      ruleType: 'early_bird' as PricingRuleType, startDate: daysFromNow(0), endDate: daysFromNow(30),
      dayOfWeek: [], adjustmentType: 'percentage' as AdjustmentType, adjustmentValue: -15, priority: 5, isActive: true,
    },
  });
  await prisma.pricingRule.create({
    data: {
      hotelId: hanoi.id, name: 'Phụ thu khi gần kín phòng',
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
      hotelId: danang.id, name: 'Flash sale hôm nay — giảm 25%',
      ruleType: 'seasonal' as PricingRuleType, startDate: daysFromNow(0), endDate: daysFromNow(1),
      dayOfWeek: [], adjustmentType: 'percentage' as AdjustmentType, adjustmentValue: -25, priority: 30, isActive: true,
    },
  });
  await prisma.pricingRule.create({
    data: {
      hotelId: hanoi.id, name: 'Ưu đãi mở bán — giảm 20%',
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
          name: `Phụ thu ${holiday.name}`,
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
    { code: 'BKSEED001', customerId: customer1.id, hotel: danang, roomTypeIdx: 0, fromDay: 7, nights: 2, guests: 2, status: 'confirmed', paid: true, voucher: 'VCSEED001', specialRequests: 'Phòng tầng cao, xa thang máy' },
    { code: 'BKSEED002', customerId: customer1.id, hotel: danang, roomTypeIdx: 0, fromDay: 0, nights: 2, guests: 2, status: 'confirmed', paid: true, voucher: 'VCSEED002' },
    { code: 'BKSEED003', customerId: customer2.id, hotel: danang, roomTypeIdx: 2, fromDay: -5, nights: 2, guests: 2, status: 'checked_out', paid: true },
    { code: 'BKSEED004', customerId: customer3.id, hotel: danang, roomTypeIdx: 1, fromDay: -12, nights: 3, guests: 4, status: 'checked_out', paid: true, review: { by: customer3.id, rating: 5, title: 'Resort tuyệt vời', content: 'Phòng rộng, ban công nhìn thẳng ra biển. Nhân viên nhiệt tình, bữa sáng nhiều món. Sẽ quay lại.' } },
    { code: 'BKSEED005', customerId: customer2.id, hotel: danang, roomTypeIdx: 0, fromDay: -20, nights: 2, guests: 2, status: 'checked_out', paid: true, review: { by: customer2.id, rating: 4, title: 'Đáng tiền', content: 'Vị trí sát biển rất tiện. Hồ bơi hơi đông vào buổi chiều nhưng nhìn chung rất ổn.' } },
    { code: 'BKSEED006', customerId: customer1.id, hotel: danang, roomTypeIdx: 2, fromDay: 20, nights: 1, guests: 2, status: 'cancelled', paid: false },
    // Sài Gòn
    { code: 'BKSEED007', customerId: customer1.id, hotel: saigon, roomTypeIdx: 1, fromDay: -8, nights: 2, guests: 2, status: 'checked_out', paid: true, review: { by: customer1.id, rating: 5, title: 'Ngay trung tâm', content: 'Đi bộ ra Bến Thành 5 phút. Phòng sạch, cách âm tốt dù ở mặt đường.' } },
    { code: 'BKSEED008', customerId: customer2.id, hotel: saigon, roomTypeIdx: 0, fromDay: 5, nights: 3, guests: 1, status: 'confirmed', paid: true },
    // Hà Nội
    { code: 'BKSEED009', customerId: customer3.id, hotel: hanoi, roomTypeIdx: 1, fromDay: -15, nights: 2, guests: 2, status: 'checked_out', paid: true, review: { by: customer3.id, rating: 4, title: 'Vị trí đẹp giữa phố cổ', content: 'Ban công nhìn xuống phố rất thích. Cuối tuần hơi ồn đúng như khách sạn đã báo trước.' } },
    { code: 'BKSEED010', customerId: customer1.id, hotel: hanoi, roomTypeIdx: 0, fromDay: 12, nights: 2, guests: 2, status: 'confirmed', paid: true },
    // Nha Trang
    { code: 'BKSEED011', customerId: customer2.id, hotel: nhatrang, roomTypeIdx: 1, fromDay: -25, nights: 3, guests: 3, status: 'checked_out', paid: true, review: { by: customer2.id, rating: 5, title: 'Bungalow rất riêng tư', content: 'Ở giữa vườn dừa, sáng ra hồ bơi vài bước chân. Phí resort đáng giá vì gồm cả ghế bãi biển.' } },
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
        ...(b.status === 'cancelled' && { cancelledAt: daysFromNow(-1), cancellationReason: 'Khách đổi lịch trình' }),
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
      const rate = HOTELS.find((x) => x.name === b.hotel.name)!.commissionRate;
      const commissionAmount = Math.round((m.subtotal * rate) / 100);
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
          ? { balanceAvailable: { increment: m.subtotal - commissionAmount } }
          : { balancePending: { increment: m.subtotal - commissionAmount } },
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
          description: 'Số dư mẫu để demo thanh toán bằng ví',
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
          description: 'Số dư mẫu (ít) để demo thanh toán kết hợp ví + cổng',
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
