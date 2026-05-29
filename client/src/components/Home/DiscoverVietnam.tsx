export default function DiscoverVietnam() {
  const destinations = [
    {
      name: 'Ha Long Bay',
      desc: 'Emerald waters & limestone peaks',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPAdIUqMtZZAp8Sh7wnH7kXrsQAi-LnRzGk6VDpidtJqWCAxf6JvaRnoneE94AqiijCfOGPVMoT687KLU6vhhPuBlfJFdjddR_BJ8ShkBHZQ7OaaJL0MP_OSMWV8EQlIFFNTk49bcg7mtKwB9p4yW0mpILZOOojwvDzW4cLK-ZoBDPa8zj3N90LGJI7D-OrSwrO2PB0VnyDHU7eexSlOGuZ9dYeAQZEcNKk6HhAY2wYjJttthRUAVbMKx6xI-VWBDNpjRQ8VVKkPbC',
    },
    {
      name: 'Hoi An',
      desc: 'Ancient lanterns & tailored luxury',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCc3D7BopQAQG9ycIJvXm7FLB1dMSle7Lmug8GiOY83gB9EXwTZY_7n9wcfBFLo_cMnmjgPlQF2TMa94tGu6A0-G6806F2U4iEmlv93VyMvJLwHWy43gZxh-LPaZvrHBceq2PJQdv-RJwNtQzt9tA3jblcxUrYL90KdxbzvREZpaH1JwHb3gj4s1fpzGvRV134H8SNYM2YAhODBUVM-mu55sLZVt3azdQQqSy5P0uyMipjhIbBXExT0AMDnT3QK2D4yy1Hj78Xbt9PS',
    },
    {
      name: 'Da Lat',
      desc: 'Mist-covered pines & French villas',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGGaeYvjAFlvGt1t12TGH70wd_Es186mgyyp3tSzO9aaDNhgA1O-VA9G_RxNx2F4WLBTPx9AcmNz4FHDKtaNgpR6twk8Cv5Aken-eLRqpXoiWp9XlxfmaEXCQ1rtteqo-FcyhTt1ZD2q5Xg2MzODZ9Zpwtn7YTP6jf4FBjcR9NPRK6BIYpC9nbf8ic5ffPuKqBb457KNaJY1aKseUI4HaM-msrz0GAROaze3tP-09bO_FL14gKSVb6a52GCLBJjLOF3AARqoRThxGS',
    },
    {
      name: 'Phu Quoc',
      desc: 'Pristine white sands & sunset spas',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChAOxgPsZKyVJ4uhbf5usTnArbIcRYkAG1TYy6-8Ee46_C2lFjSg5HmTPZzAEtfZt8jV31ZEFcJtGnYFKCYPJGFQDOsGWzoq0LFYFPNC0KoQDgYmo2InhT_ysEjDWVRkbGUKvBXfBjMuu6N95cPgYBfVhtv9rddYZ978OsUqI6UN4BvRvk55MdXKpRf0qdVxaRDDVv_DZy6kaD34APFAWqbMQRKDPzPYh6AKcUS4WYHcDOwZ4VLW07446JBJ40a8ushRM5I9631wGD',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-section-gap w-full">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">
            Discover Vietnam
          </h2>
          <p className="text-on-surface-variant text-sm font-medium font-be-vietnam">
            Curated "Quiet Luxury" escapes in the heart of the East.
          </p>
        </div>
        <button
          onClick={() => alert('Loading all Vietnam sanctuaries...')}
          className="text-sm font-semibold text-primary font-bold hover:underline flex items-center gap-2 cursor-pointer"
        >
          View all destinations
          <span className="material-symbols-outlined text-sm font-bold">
            arrow_forward
          </span>
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {destinations.map(dest => (
          <div
            key={dest.name}
            onClick={() => alert(`Curating itinerary for ${dest.name}...`)}
            className="group cursor-pointer"
          >
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden mb-4 shadow-md">
              <img
                alt={dest.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                src={dest.img}
              />
            </div>
            <h4 className="font-bold text-on-surface text-lg font-be-vietnam">
              {dest.name}
            </h4>
            <p className="text-on-surface-variant text-sm font-be-vietnam">
              {dest.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
