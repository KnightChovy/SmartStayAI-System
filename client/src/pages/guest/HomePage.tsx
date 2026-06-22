import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import Hero from '../../components/home/Hero';
import WhyChooseUs from '../../components/home/WhyChooseUs';
import Promotions from '../../components/home/Promotions';
import AccommodationTypes from '../../components/home/AccommodationTypes';
import TrendingDestinations from '../../components/home/TrendingDestinations';
import DiscoverVietnam from '../../components/home/DiscoverVietnam';
import WeekendDeals from '../../components/home/WeekendDeals';
import GuestFavorites from '../../components/home/GuestFavorites';
import LoyaltyBanner from '../../components/home/LoyaltyBanner';
import PopularVietnameseTourists from '../../components/home/PopularVietnameseTourists';
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
      <Hero />
      <WhyChooseUs />
      <Promotions />
      <AccommodationTypes />
      <TrendingDestinations />
      <DiscoverVietnam />
      <WeekendDeals />
      <LoyaltyBanner />
      <PopularVietnameseTourists />
      <GuestFavorites />

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
