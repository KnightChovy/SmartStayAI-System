import { useState } from 'react';

export default function AccommodationTypes() {
  const [selected, setSelected] = useState('Hotels');

  const types = [
    {
      name: 'Hotels',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGEHsJF-a695lzR1UnE4YTkgAadikzuYwgRlDu7r5YclSOEVpFm2M1pDIxxr84tCUNQjWRar7nlnRYxBpm20JO3hch_uMml69_Ifm3h6s6syqO0WQskoUnzS0BUER0iYGCu4Fv0C6oKwpHj6OCwtB63T0BI9kN_OCkJoHgPrnV6varDzhgPSB5K7U4Pz50tK6WewJB8ITKZzlyrUOmjqbsjnr_07dptSe4KmQ_kjRkxbUgb0ZAV2nzXZ7rbV4jLW-LS1lt77kaLYJj',
    },
    {
      name: 'Apartments',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsZxEDt-wm6heNCH-KjHZkS_kvrM97qOZ51tHzI2pWK-A6qX_H91mRXhA97MO4o9PIvaImHKd0CAoXHSyiuKhRJxgcWsGTwivb8X3kcpZEt93lnxNIkS2rBQFjYpBHZfGtANscN_pQ9cWn9qLxahy8iEs7a87TXIba6kjEey1lYS72Ovt9X9zYX1gEzAAS0PtYZ5KkguJfmAx-QUrL4VhUv14716Fbi2QtZLGptwUx4Bk3Ano-nQ5gIvk6vj-e6wBjvC8V8bRXaCx7',
    },
    {
      name: 'Resorts',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdVhcvjdei_xfxqui3zUK3QYOHbU0alsYuK_yHFZSqDRGvGHhNtZO8DVjwg3peWhtCUkqOr8nPvxBICYcuyF6KektKvjSahiyJRlJGEWFVndDS4yhkygm1WxtVEJDpfhiurjhU3-wQr27n-hPuM3eLKfEMx93iuKqW22MhlphYPRuup1lnsaMKl8zp4HglQPEXgLR_PXy09gRABX7XJ8cAMQnjwChGxRy4uqY5UOya-fDM4xuHe9tbGY9_FVv2b_aS2e41ZYVx14MR',
    },
    {
      name: 'Villas',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0GRW5Ggunq2gbEKqes9hAtE79NJQjlANBeZR-v9mjMwqVt5BVBq4kNvexr4F815IHkWA3kVpaEMx9NDB7SsKsZZgK2iHIz1gJhBzI4xIztgRLnFXnCC5EBmOBHoGV6TRc5smqRj504q1Ec0fZHQdysm1rEo-WEHunkwyc6BBXdUaJHpm4tszb0ShQ4C28co2XhBhlpbbROXuRjvyBp1G3tmOlUHvsLwPDmnwubi1gWHW07BtFLYaWmtbD4jjenD6lyXQev9q-q4nN',
    },
    {
      name: 'Cabins',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdTwO7i7bHvGDCuJo-Gltw8NdkshYxc7DcKdtZaMUVHP6qAINkUIALtcFhRqz_lGBw44Aeohpc2suC6M9BhCyUFhIIOawZG2Zpf_JiSrM6XLGsJIr4FK1mt81P09-a41K4Hnn3aiqCbCvn6ZQes2FM_f2UD0-aYNx1bvVRm65HyuUQ0Yefw4xMtARWLitT3W4Ohp0Eq5ycARQTLg4upiMD0ruc5XMvkI9vH73LRK1xcwmTHslf9JSV-K5WnOY9QnxEFpShyVE40nOJ',
    },
    {
      name: 'Unique Stays',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHwVk3gnJoaVhiQj_t08OOZ5TJZtiDPzv96WVXrmfxWxlfqYnCPL_wQKaNaThXE8Yq3vM73TjCQFAi2W4Yki3YD88t62snJO32RzUjQM8dtqN97U83gdKZz5s0tL5dhtLnH9n8cPYdxq_aZ-iwAUURDoFSe5cW2pWAw7chRUvAWXKMdTltw1rCHa8P-uY6FkuuzrcGkIyQ-c5EukdLOQhXzDtg8vxKC3a_BhWaPGAsyAtLF2qZ1JPRQjCBwIPLxSSMh8BBCYm8QJVG',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-section-gap w-full">
      <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-8">
        Search by type of accommodation
      </h2>
      <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar pb-6">
        {types.map(type => {
          const isSelected = selected === type.name;
          return (
            <button
              key={type.name}
              onClick={() => setSelected(type.name)}
              className={`flex flex-col items-center gap-4 min-w-[140px] group transition-all duration-300 ${isSelected ? 'opacity-100 scale-102' : 'opacity-70 hover:opacity-100'}`}
            >
              <div
                className={`w-full aspect-square rounded-3xl bg-surface-container overflow-hidden ring-2 transition-all duration-300 shadow-sm ${isSelected ? 'ring-primary' : 'ring-outline-variant/20 group-hover:scale-105'}`}
              >
                <img
                  alt={type.name}
                  className="w-full h-full object-cover"
                  src={type.img}
                />
              </div>
              <span
                className={`text-sm font-bold font-be-vietnam ${isSelected ? 'text-primary' : 'text-on-surface'}`}
              >
                {type.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
