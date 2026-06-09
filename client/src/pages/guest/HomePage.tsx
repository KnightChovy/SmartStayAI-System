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

export default function HomePage() {
  return (
    <>
      <Hero />
      <WhyChooseUs />
      <Promotions />
      <AccommodationTypes />
      <TrendingDestinations />
      <DiscoverVietnam />
      <WeekendDeals />
      <GuestFavorites />
      <LoyaltyBanner />
      <PopularVietnameseTourists />
    </>
  );
}
