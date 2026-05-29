import { useState } from "react"
import AccommodationTypes from "../components/home/AccommodationTypes"

export default function AccommodationTypesPage() {
  const [selectedCategory, setSelectedCategory] = useState("All")

  const listings = [
    {
      name: "The Azure Sanctuary",
      category: "Resorts",
      location: "Maldives",
      price: "$1,232 / night",
      rating: "9.8",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDDzgUSXLLVSSXfUrMmgJ1Fs92Zm1BIXSUNXaHcKgonezS6qe_rk8QNrG_cPJFuQBc7bxdJaHXZGhEoA0NnVOLZ1RkuX2F6Gqf08jk8sXPxi-_YA8J1bjBoGY8qTRyyiXoDCtz87XE_EYO4tvtNKH_annHO6YMsRNolBxJUSRMZvxYhj3DGOoBxryrC-K6Q-GnOmQyb-cYEQL4fcYckI1wR57jpS1K7YAXs5X8-tRRJIwAwDCLBIf5MN6h2CV1C1BxS1y7xwAOi3GIv",
    },
    {
      name: "Timberline Retreat",
      category: "Cabins",
      location: "Aspen, Colorado",
      price: "$712 / night",
      rating: "9.5",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDpk1cue5hP07fB-nD6v90aap4YXNxhjzZX5Hw3S__EKI0xD6DJRhNvuorqMeBqEQx9GG3juoJPhbKpUQciMfITMBkq7wVCex7oGIy0n8CFQkBbqEH-IPPpJ2AQbcRKPYOyFMjm3Hpl3HSC1SvXabGH1eNTwvR6nSN048DOs_UCSSy6g6WlqBEjVuyQCt-Po3G-8V_HDdoRaXoaBVd96O_ZV4KHMGhRYMJ0McR8r2-dyWiPVgKRir9nkLy-5-JD1dieU9N-Tc3ifbCi",
    },
    {
      name: "Villa del Lago",
      category: "Villas",
      location: "Lake Como, Italy",
      price: "$1,890 / night",
      rating: "9.9",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB6ZZae1A_cZ8k8PfSppSa390ekHX-Rr0yqntOdXoEFKomXdfvHESRJ3MOj35UTDYDMB_W1B19gkINqRTUes5rVLGaZUIZHCqIagBzSdQY7CEMFAmFAOsemuBupjmoTjZOA1AzzezeaaMKLUYz8K43zDii0iHdsOazNu3DYjfkMetDpA4vuO9w6oviKvWViuDjstvlvwypb-eU3nNy6MqQx0qvdIFsWTL5PG5EyNQajjyAKMZv1KKCgrqFRwtVzBe-7DPJt2rP2iCiR",
    },
    {
      name: "Zen Boutique Retreat",
      category: "Hotels",
      location: "London, UK",
      price: "$650 / night",
      rating: "9.7",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBQGvh5rZi4XE1-dRZysUYKaVXmtvDOTPSzlCJyMdxPHOf0Fgk_2fNvLEqBtFmPdMZ0ZgDnH-pYxD1_B1ef_72BSVmXaID3MBErm1zwHKGEMNAtVD_lQd_av_L74ZkOdxAyporZVZfZ_TqnWfYqcbBmOivOQ_Ms9Dby2JGXY7RKAIEIp09v3rymY-0opa7TiLY4s9eZpGCDjASQaYsJi2NM8m8TGzB9_okDypw8HhOgoGiUawExLtY8t9zCYpjXU2tqQZvoUz-hgcKy",
    },
    {
      name: "Heritage Manor Suite",
      category: "Apartments",
      location: "Tokyo, Japan",
      price: "$480 / night",
      rating: "9.6",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDqczKJdl1iN7al_icqEFN86eE-qMTVxpDof3yLIPBzfnsIyJL__TZtTGr2tH47n__0SK-eyb66IUlUlfZiBElGEb_Mfmlz7O7sMAlUWplYQeK1fvYsOmvb2nIUt1to_YbTqrE_DSPIW8Zw1hRaJGrGram_ZJznJzmOIaXox4IfIbowv3xFboRCsrv27rCfNgAvQDWnIn2_6Nyu-csaLDue2EhfO6b1TZ9eub8a8JaEW5d2mbiO2KtZkunQDuBfF7IZ58vKy_u0N_DV",
    },
  ]

  const filteredListings = selectedCategory === "All" 
    ? listings 
    : listings.filter(l => l.category === selectedCategory)

  return (
    <div className="py-12 flex flex-col items-center w-full">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 text-center mb-12">
        <span className="bg-secondary/10 text-secondary text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
          Tailored Sanctuaries
        </span>
        <h1 className="font-be-vietnam text-display-lg md:text-5xl font-bold text-on-surface mt-6 mb-4">
          Browse by Accommodation Type
        </h1>
        <p className="font-be-vietnam text-base text-on-surface-variant max-w-xl mx-auto">
          From rustic high-altitude cabins to sweeping overwater resorts, filter to match your travel profile.
        </p>
      </div>

      <AccommodationTypes />

      {/* Category selector */}
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 w-full mb-8">
        <div className="flex flex-wrap gap-3 justify-center border-b border-outline-variant/20 pb-6">
          {["All", "Hotels", "Apartments", "Resorts", "Villas", "Cabins"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat 
                  ? "bg-on-surface text-white shadow-md" 
                  : "bg-white text-on-surface border border-outline-variant/30 hover:bg-surface-container-low"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Listings grid */}
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 w-full mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredListings.map((listing, i) => (
            <div 
              key={i}
              onClick={() => alert(`Exploring ${listing.name}...`)}
              className="bg-white rounded-3xl overflow-hidden premium-shadow group cursor-pointer border border-outline-variant/10 hover:scale-[1.01] transition-transform duration-300"
            >
              <div className="relative h-60 overflow-hidden">
                <img 
                  alt={listing.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src={listing.img}
                />
                <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                  {listing.category}
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-be-vietnam">
                    {listing.location}
                  </span>
                  <div className="bg-surface-container px-2 py-1 rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                    <span className="text-xs font-bold text-on-surface font-be-vietnam">
                      {listing.rating}
                    </span>
                  </div>
                </div>
                <h4 className="font-be-vietnam font-semibold text-lg text-on-surface mb-4">
                  {listing.name}
                </h4>
                <span className="font-be-vietnam font-bold text-base text-on-surface block">
                  {listing.price}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
