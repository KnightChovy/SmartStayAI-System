import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

export default function PopularVietnameseTourists() {
  const navigate = useNavigate();
  const { t } = useTranslation('home');
  const destinations = [
    {
      city: 'Singapore',
      name: t('popular.singapore.name'),
      desc: t('popular.singapore.desc'),
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAd-hkER3UuTQlK6lbHLjLXOOhe_yU3CTlU9JlHrH9PG3Um60Itp0JjXAWixThdgmGZU2udYfaqPRHF_qrl6SXA3C5G4n3R8sMAgQVqMANXr2KDucRQtm6IeOmGeDHGegpDIhXNYeVUR8Cucy7YD0y-mUYAHks3H7Eq2A0Hoda49xfDhBT7knd6nKIX-d6jIVdty3KjyDCEdzktPYNvFDvOmn7Azlup6U5pwWLWXF3-QP6h_Ae-dJ0mErF6TTUJlXH90u3pTvI6FTTf',
    },
    {
      city: 'Thailand',
      name: t('popular.thailand.name'),
      desc: t('popular.thailand.desc'),
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgKeUfZ7kGY8qU1muxQFwxxte7noVhzaIxn11chzfkBy1Y_yrzegbZ30Ag59N_Xyc8b2iTLMG5D_d12vRAQGlXHan-bTMDl0PDMzbrUbfcTsfopOSseyJv1mqJUJsnMzvaSWuIWtkX02Z_j_J6e9Xe1oK8DE8HiqufpYFGn9uW1Z4XZSBDLmhoNpYXY3LMfMZiMwaU2i4XrwrOVuPEYExeXwfmJ922U9Fo2zXGUBN18uu4ZjoaF2LbXZoMgP5k6bA0BTA-j2tCL5ke',
    },
    {
      city: 'South Korea',
      name: t('popular.korea.name'),
      desc: t('popular.korea.desc'),
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGOEAoS4KxA_K8BYCwvSEYzOW6KhAVpyfmA4L2i7rr1olyX4khQAnJ0F81FjbGmN8GVS1yHQ0NKjncikzLTvcLl-3XxAOvDhOap-l-ckaMb7CwXlRolUtkJ7XwRd2ZQTUV5kUEmWZCM52okS-1PFk_qo35-xPBhgvg15lHuciXqdDupXznjInfuCmvBSHrkpw0yqv8PFkaOvPoeDitlgJfI_br7twBK9zqpU-YOfV-ofKzdUO9vIpy4rDOTJhEzvcCpcHZ2lRWSADg',
    },
    {
      city: 'Japan',
      name: t('popular.japan.name'),
      desc: t('popular.japan.desc'),
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAssoyTZax5jYTodEJ2brm0_3ROCW3IppsbfuRRlkOJGNcJCEBc0dHZBEZICWfRJjUa726fowJv6dtNCQ-ZNL_i4xv1ORnSEnN6bjEQVxEgWVcO8gXgpKCFURMX4KchxkmAhim3D6fM3qFCIqKmNPlokxbUK6x79kPOBKABKhF9E4O3CQmUnMHsbnI0w_96PLuC_EUD0ogneSzFkAMw56Aa1ACL6bxRk81kEWnti9fm4i-AQ_5v5VML9taTL2k3_TJ6brSxM2cjEbZz',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-section-gap w-full">
      <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-8">
        {t('popular.title')}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {destinations.map(dest => {
          const name = dest.name;
          return (
            <div
              key={dest.city}
              onClick={() => navigate(`/search?city=${encodeURIComponent(dest.city)}`)}
              className="group cursor-pointer"
            >
              <div className="h-48 rounded-3xl overflow-hidden mb-3 relative shadow-md">
                <img
                  alt={name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src={dest.img}
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
              </div>
              <h4 className="font-bold text-on-surface font-be-vietnam text-base">
                {name}
              </h4>
              <p className="text-xs text-on-surface-variant font-be-vietnam">
                {dest.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
