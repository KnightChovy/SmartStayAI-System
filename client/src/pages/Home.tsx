import Hero from '../components/Home/Hero';
import WhyChooseUs from '../components/Home/WhyChooseUs';
import Promotions from '../components/Home/Promotions';
import AccommodationTypes from '../components/Home/AccommodationTypes';
import TrendingDestinations from '../components/Home/TrendingDestinations';
import DiscoverVietnam from '../components/Home/DiscoverVietnam';
import WeekendDeals from '../components/Home/WeekendDeals';
import GuestFavorites from '../components/Home/GuestFavorites';
import LoyaltyBanner from '../components/Home/LoyaltyBanner';
import PopularVietnameseTourists from '../components/Home/PopularVietnameseTourists';

export default function Home() {
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
