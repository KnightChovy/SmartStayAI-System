import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import Hero from '../../components/home/Hero';
import WhyChooseUs from '../../components/home/WhyChooseUs';
import WeekendDeals from '../../components/home/WeekendDeals';
import LoyaltyBanner from '../../components/home/LoyaltyBanner';
import PopularVietnameseTourists from '../../components/home/PopularVietnameseTourists';
import Testimonials from '../../components/home/Testimonials';
import TrustBar from '../../components/shared/TrustBar';
import PaymentBadges from '../../components/shared/PaymentBadges';
import WelcomeProfileModal from '../../components/account/WelcomeProfileModal';
import { useAuthStore } from '@/stores/authStore';
import { useUpdateProfile } from '@/hooks/account';
import type { WelcomeProfileInput } from '../../validations/auth.validation';

export default function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  const updateProfile = useUpdateProfile();

  // Vừa verify email xong → bật modal nhập thêm thông tin.
  const justRegistered = Boolean(
    (location.state as { justRegistered?: boolean } | null)?.justRegistered
  );
  const [showWelcome, setShowWelcome] = useState(justRegistered);

  // Xoá cờ khỏi history để reload trang không bật lại modal.
  useEffect(() => {
    if (justRegistered) {
      navigate('.', { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (values: WelcomeProfileInput) => {
    const phone = values.phone || null;
    updateUser({ fullName: values.fullName, phone });
    try {
      await updateProfile.mutateAsync({ fullName: values.fullName, phone });
    } catch {
      // Lỗi lưu profile mock không chặn luồng — vẫn đóng modal.
    }
    setShowWelcome(false);
  };

  return (
    <>
      {/*
        Landing chỉ giữ những khối chạy trên dữ liệu thật hoặc là nội dung thương hiệu:
        Hero (form tìm kiếm thật), WhyChooseUs, WeekendDeals (GET /hotels), LoyaltyBanner,
        PopularVietnameseTourists (điểm đến VN → search thật). Các khối demo hardcode
        (Promotions, AccommodationTypes, TrendingDestinations, DiscoverVietnam, GuestFavorites)
        đã gỡ vì dữ liệu bịa và bấm vào không ra kết quả.
      */}
      <Hero />
      {/* Dải tín hiệu tin cậy ngay dưới hero (SS-004) */}
      <div className="border-b border-outline-variant/20 bg-surface py-5">
        <TrustBar className="px-margin-mobile" />
      </div>
      <WhyChooseUs />
      <WeekendDeals />
      <Testimonials />
      <LoyaltyBanner />
      <PopularVietnameseTourists />
      {/* Badge thanh toán + SSL (SS-004) */}
      <div className="bg-surface py-10">
        <PaymentBadges className="px-margin-mobile" />
      </div>

      <WelcomeProfileModal
        open={showWelcome}
        isSubmitting={updateProfile.isPending}
        defaults={{
          fullName: user?.fullName ?? '',
          email: user?.email ?? '',
          phone: user?.phone ?? '',
        }}
        onClose={() => setShowWelcome(false)}
        onSubmit={handleSave}
      />
    </>
  );
}
