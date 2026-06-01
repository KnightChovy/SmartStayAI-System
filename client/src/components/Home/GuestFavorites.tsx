export default function GuestFavorites() {
  const favorites = [
    {
      name: 'Zen Boutique Retreat',
      reviewer: 'Sarah J., London',
      quote:
        "The attention to detail was beyond anything I've experienced. Truly a sanctuary.",
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQGvh5rZi4XE1-dRZysUYKaVXmtvDOTPSzlCJyMdxPHOf0Fgk_2fNvLEqBtFmPdMZ0ZgDnH-pYxD1_B1ef_72BSVmXaID3MBErm1zwHKGEMNAtVD_lQd_av_L74ZkOdxAyporZVZfZ_TqnWfYqcbBmOivOQ_Ms9Dby2JGXY7RKAIEIp09v3rymY-0opa7TiLY4s9eZpGCDjASQaYsJi2NM8m8TGzB9_okDypw8HhOgoGiUawExLtY8t9zCYpjXU2tqQZvoUz-hgcKy',
    },
    {
      name: 'Heritage Manor Suite',
      reviewer: 'David K., Tokyo',
      quote:
        'Old world charm meets modern AI intelligence. Seamless booking and stay.',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqczKJdl1iN7al_icqEFN86eE-qMTVxpDof3yLIPBzfnsIyJL__TZtTGr2tH47n__0SK-eyb66IUlUlfZiBElGEb_Mfmlz7O7sMAlUWplYQeK1fvYsOmvb2nIUt1to_YbTqrE_DSPIW8Zw1hRaJGrGram_ZJznJzmOIaXox4IfIbowv3xFboRCsrv27rCfNgAvQDWnIn2_6Nyu-csaLDue2EhfO6b1TZ9eub8a8JaEW5d2mbiO2KtZkunQDuBfF7IZ58vKy_u0N_DV',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-section-gap w-full">
      <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-8">
        The guest's favorite accommodation
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {favorites.map((fav, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:flex-row gap-6 p-6 rounded-3xl bg-white ring-1 ring-outline-variant/10 shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0 mx-auto sm:mx-0">
              <img
                alt={fav.name}
                className="w-full h-full object-cover"
                src={fav.img}
              />
            </div>
            <div className="flex flex-col justify-center text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className="material-symbols-outlined text-sm text-premium-gold"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                ))}
              </div>
              <h4 className="font-bold text-on-surface mb-2 font-be-vietnam text-lg">
                {fav.name}
              </h4>
              <p className="text-on-surface-variant italic text-sm font-be-vietnam">
                "{fav.quote}"
              </p>
              <p className="text-[10px] font-bold text-primary mt-3 uppercase tracking-widest font-be-vietnam">
                — {fav.reviewer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
