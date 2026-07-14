import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

export default function AccommodationTypes() {
  const { t } = useTranslation('home');
  const [selected, setSelected] = useState('hotels');

  const types = [
    {
      key: 'hotels',
      label: t('accommodationTypes.hotels'),
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGEHsJF-a695lzR1UnE4YTkgAadikzuYwgRlDu7r5YclSOEVpFm2M1pDIxxr84tCUNQjWRar7nlnRYxBpm20JO3hch_uMml69_Ifm3h6s6syqO0WQskoUnzS0BUER0iYGCu4Fv0C6oKwpHj6OCwtB63T0BI9kN_OCkJoHgPrnV6varDzhgPSB5K7U4Pz50tK6WewJB8ITKZzlyrUOmjqbsjnr_07dptSe4KmQ_kjRkxbUgb0ZAV2nzXZ7rbV4jLW-LS1lt77kaLYJj',
    },
    {
      key: 'apartments',
      label: t('accommodationTypes.apartments'),
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsZxEDt-wm6heNCH-KjHZkS_kvrM97qOZ51tHzI2pWK-A6qX_H91mRXhA97MO4o9PIvaImHKd0CAoXHSyiuKhRJxgcWsGTwivb8X3kcpZEt93lnxNIkS2rBQFjYpBHZfGtANscN_pQ9cWn9qLxahy8iEs7a87TXIba6kjEey1lYS72Ovt9X9zYX1gEzAAS0PtYZ5KkguJfmAx-QUrL4VhUv14716Fbi2QtZLGptwUx4Bk3Ano-nQ5gIvk6vj-e6wBjvC8V8bRXaCx7',
    },
    {
      key: 'resorts',
      label: t('accommodationTypes.resorts'),
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdVhcvjdei_xfxqui3zUK3QYOHbU0alsYuK_yHFZSqDRGvGHhNtZO8DVjwg3peWhtCUkqOr8nPvxBICYcuyF6KektKvjSahiyJRlJGEWFVndDS4yhkygm1WxtVEJDpfhiurjhU3-wQr27n-hPuM3eLKfEMx93iuKqW22MhlphYPRuup1lnsaMKl8zp4HglQPEXgLR_PXy09gRABX7XJ8cAMQnjwChGxRy4uqY5UOya-fDM4xuHe9tbGY9_FVv2b_aS2e41ZYVx14MR',
    },
    {
      key: 'villas',
      label: t('accommodationTypes.villas'),
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0GRW5Ggunq2gbEKqes9hAtE79NJQjlANBeZR-v9mjMwqVt5BVBq4kNvexr4F815IHkWA3kVpaEMx9NDB7SsKsZZgK2iHIz1gJhBzI4xIztgRLnFXnCC5EBmOBHoGV6TRc5smqRj504q1Ec0fZHQdysm1rEo-WEHunkwyc6BBXdUaJHpm4tszb0ShQ4C28co2XhBhlpbbROXuRjvyBp1G3tmOlUHvsLwPDmnwubi1gWHW07BtFLYaWmtbD4jjenD6lyXQev9q-q4nN',
    },
    {
      key: 'cabins',
      label: t('accommodationTypes.cabins'),
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdTwO7i7bHvGDCuJo-Gltw8NdkshYxc7DcKdtZaMUVHP6qAINkUIALtcFhRqz_lGBw44Aeohpc2suC6M9BhCyUFhIIOawZG2Zpf_JiSrM6XLGsJIr4FK1mt81P09-a41K4Hnn3aiqCbCvn6ZQes2FM_f2UD0-aYNx1bvVRm65HyuUQ0Yefw4xMtARWLitT3W4Ohp0Eq5ycARQTLg4upiMD0ruc5XMvkI9vH73LRK1xcwmTHslf9JSV-K5WnOY9QnxEFpShyVE40nOJ',
    },
    {
      key: 'unique',
      label: t('accommodationTypes.unique'),
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHwVk3gnJoaVhiQj_t08OOZ5TJZtiDPzv96WVXrmfxWxlfqYnCPL_wQKaNaThXE8Yq3vM73TjCQFAi2W4Yki3YD88t62snJO32RzUjQM8dtqN97U83gdKZz5s0tL5dhtLnH9n8cPYdxq_aZ-iwAUURDoFSe5cW2pWAw7chRUvAWXKMdTltw1rCHa8P-uY6FkuuzrcGkIyQ-c5EukdLOQhXzDtg8vxKC3a_BhWaPGAsyAtLF2qZ1JPRQjCBwIPLxSSMh8BBCYm8QJVG',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-section-gap w-full">
      <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-8">
        {t('accommodationTypes.title')}
      </h2>
      <div className="flex items-center gap-5 overflow-x-auto hide-scrollbar pt-6 pb-6 px-3">
        {types.map(type => {
          const isSelected = selected === type.key;
          const label = type.label;
          return (
            <Button
              variant="ghost"
              key={type.key}
              onClick={() => setSelected(type.key)}
              className={`flex flex-col items-center gap-4 min-w-55 group transition-all duration-300 h-auto p-0 hover:bg-transparent ${isSelected ? 'opacity-100 scale-102' : 'opacity-70 hover:opacity-100'}`}
            >
              <div
                className={`w-55 aspect-square rounded-4xl bg-surface-container overflow-hidden ring-2 transition-all duration-300 shadow-sm group-hover:scale-105 ${isSelected ? 'ring-primary' : 'ring-outline-variant/20'}`}
              >
                <img
                  alt={label}
                  className="w-full h-full object-cover"
                  src={type.img}
                />
              </div>
              <span
                className={`text-sm font-bold font-be-vietnam ${isSelected ? 'text-primary' : 'text-on-surface'}`}
              >
                {label}
              </span>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
