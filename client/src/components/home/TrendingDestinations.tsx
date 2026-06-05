export default function TrendingDestinations() {
  const destinations = [
    {
      name: 'Bali',
      properties: '1,240 Properties',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDNlzjs5xNOiucdseoHWD_vj-bltfGw0mL8heHI330ULrdRDlsarrvu7dizsTpFixOf6GXkkhl85UpeEnXWwKA6Fvzn4L2xnR4hzKQjUVHTRBfJs3leHsK1DlaeV6ZtSit6oa0-drShdEPqbPpzsgRnStDdMRAaV6rj3iX7aO1qreSpjcavFBRqhZqIxZGhRBG24vnaIcdzBZjNMWshq5esf14luZ0lEkZcp1wYrgBOXA_XWdYBwCmes15-UYJK_xbn4WsaSqiKeVs',
    },
    {
      name: 'Paris',
      properties: '890 Properties',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNZdrm1zyfdbgimV8-FZubJRGphHOvDICGsN9MYHdtxIH-LZqhCWMLRNT2Do-1p4yM21xcm3MXEQwCUrIpO_Sfo_WAUjytKHxJmnqtwhIapEXxOQGcrjHdG752ddlFUIEPlg7wfvzMrkoRh7uHsPoN8SB-If1PWniSt3_7qndcl7mc0Lu1GNYWSC8Zh3nVCiMXAdODKRb-NK_3yG-BTUaAuJ-sAkDa0DALL0bLX0E21ypwaKcC3_yCCx6XAZODUNKMjAuIPpqrvCET',
    },
    {
      name: 'Tokyo',
      properties: '2,100 Properties',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAssoyTZax5jYTodEJ2brm0_3ROCW3IppsbfuRRlkOJGNcJCEBc0dHZBEZICWfRJjUa726fowJv6dtNCQ-ZNL_i4xv1ORnSEnN6bjEQVxEgWVcO8gXgpKCFURMX4KchxkmAhim3D6fM3qFCIqKmNPlokxbUK6x79kPOBKABKhF9E4O3CQmUnMHsbnI0w_96PLuC_EUD0ogneSzFkAMw56Aa1ACL6bxRk81kEWnti9fm4i-AQ_5v5VML9taTL2k3_TJ6brSxM2cjEbZz',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-section-gap w-full">
      <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-8">
        Trending Destinations
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {destinations.map(dest => (
          <div
            key={dest.name}
            onClick={() => alert(`Exploring ${dest.name} sanctuary...`)}
            className="relative h-112.5 rounded-3xl overflow-hidden group cursor-pointer shadow-xl"
          >
            <img
              alt={dest.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              src={dest.img}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-10 left-10 text-white">
              <h3 className="text-3xl font-bold mb-1 font-be-vietnam">
                {dest.name}
              </h3>
              <p className="text-xs font-bold opacity-80 uppercase tracking-widest font-be-vietnam">
                {dest.properties}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
