import { useState } from "react"

export default function WeekendDeals() {
  const [favorites, setFavorites] = useState<string[]>([])

  const deals = [
    {
      id: "azure",
      name: "The Azure Sanctuary",
      location: "MALDIVES",
      discount: "-15% OFF",
      rating: "9.8",
      oldPrice: "$1,450",
      newPrice: "$1,232",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDDzgUSXLLVSSXfUrMmgJ1Fs92Zm1BIXSUNXaHcKgonezS6qe_rk8QNrG_cPJFuQBc7bxdJaHXZGhEoA0NnVOLZ1RkuX2F6Gqf08jk8sXPxi-_YA8J1bjBoGY8qTRyyiXoDCtz87XE_EYO4tvtNKH_annHO6YMsRNolBxJUSRMZvxYhj3DGOoBxryrC-K6Q-GnOmQyb-cYEQL4fcYckI1wR57jpS1K7YAXs5X8-tRRJIwAwDCLBIf5MN6h2CV1C1BxS1y7xwAOi3GIv",
    },
    {
      id: "timberline",
      name: "Timberline Retreat",
      location: "ASPEN, COLORADO",
      discount: "-20% OFF",
      rating: "9.5",
      oldPrice: "$890",
      newPrice: "$712",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDpk1cue5hP07fB-nD6v90aap4YXNxhjzZX5Hw3S__EKI0xD6DJRhNvuorqMeBqEQx9GG3juoJPhbKpUQciMfITMBkq7wVCex7oGIy0n8CFQkBbqEH-IPPpJ2AQbcRKPYOyFMjm3Hpl3HSC1SvXabGH1eNTwvR6nSN048DOs_UCSSy6g6WlqBEjVuyQCt-Po3G-8V_HDdoRaXoaBVd96O_ZV4KHMGhRYMJ0McR8r2-dyWiPVgKRir9nkLy-5-JD1dieU9N-Tc3ifbCi",
    },
    {
      id: "lake",
      name: "Villa del Lago",
      location: "LAKE COMO, ITALY",
      discount: "-10% OFF",
      rating: "9.9",
      oldPrice: "$2,100",
      newPrice: "$1,890",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB6ZZae1A_cZ8k8PfSppSa390ekHX-Rr0yqntOdXoEFKomXdfvHESRJ3MOj35UTDYDMB_W1B19gkINqRTUes5rVLGaZUIZHCqIagBzSdQY7CEMFAmFAOsemuBupjmoTjZOA1AzzezeaaMKLUYz8K43zDii0iHdsOazNu3DYjfkMetDpA4vuO9w6oviKvWViuDjstvlvwypb-eU3nNy6MqQx0qvdIFsWTL5PG5EyNQajjyAKMZv1KKCgrqFRwtVzBe-7DPJt2rP2iCiR",
    },
  ]

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((fav) => fav !== id))
    } else {
      setFavorites([...favorites, id])
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-section-gap w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">
            Weekend Deals
          </h2>
          <p className="text-on-surface-variant text-sm font-medium font-be-vietnam">
            Limited time offers for the upcoming weekend
          </p>
        </div>
        <button 
          onClick={() => alert("Redirecting to all weekend specials...")}
          className="text-sm font-semibold text-primary font-bold hover:underline cursor-pointer"
        >
          View all deals
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {deals.map((deal) => {
          const isFav = favorites.includes(deal.id)
          return (
            <div 
              key={deal.id} 
              onClick={() => alert(`Booking details for ${deal.name}...`)}
              className="bg-surface-container-lowest rounded-3xl overflow-hidden premium-shadow group cursor-pointer border border-outline-variant/10 hover:scale-[1.01] transition-transform duration-300"
            >
              <div className="relative h-64 overflow-hidden">
                <img 
                  alt={deal.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  src={deal.img}
                />
                <button 
                  onClick={(e) => toggleFavorite(deal.id, e)}
                  className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-all shadow-md cursor-pointer ${isFav ? "bg-red-500/80 text-white" : "bg-white/20 text-white hover:bg-white/40"}`}
                >
                  <span className="material-symbols-outlined text-xl flex items-center justify-center" style={{ fontVariationSettings: `'FILL' ${isFav ? 1 : 0}` }}>
                    favorite
                  </span>
                </button>
                <div className="absolute top-4 left-4 bg-ai-glow text-[10px] font-bold px-2 py-1 rounded-md text-on-surface uppercase tracking-wider">
                  {deal.discount}
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-be-vietnam">
                    {deal.location}
                  </span>
                  <div className="bg-surface-container px-2 py-1 rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                    <span className="text-xs font-bold text-on-surface font-be-vietnam">
                      {deal.rating}
                    </span>
                  </div>
                </div>
                <h4 className="font-be-vietnam font-semibold text-lg text-on-surface mb-4">
                  {deal.name}
                </h4>
                <div className="flex items-center gap-3">
                  <span className="text-on-surface-variant line-through text-sm font-be-vietnam">
                    {deal.oldPrice}
                  </span>
                  <span className="font-be-vietnam font-bold text-lg text-on-surface">
                    {deal.newPrice} 
                    <span className="text-sm font-normal text-on-surface-variant font-be-vietnam"> / night</span>
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
