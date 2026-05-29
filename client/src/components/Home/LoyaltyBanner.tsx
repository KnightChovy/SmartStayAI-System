export default function LoyaltyBanner() {
  return (
    <section className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-section-gap w-full">
      <div className="relative rounded-3xl bg-inverse-surface p-12 md:p-16 overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')",
          }}
        ></div>
        <div className="relative z-10 max-w-xl text-center lg:text-left">
          <h2 className="font-be-vietnam text-3xl md:text-display-lg text-white mb-6 font-bold">
            Travel more, spend less.
          </h2>
          <p className="text-sm md:text-base text-inverse-on-surface/80 mb-4 font-be-vietnam">
            Join SmartStay Rewards and earn points on every booking. Gold status
            is just a few stays away.
          </p>
          <div className="flex flex-wrap gap-6 mt-8 justify-center lg:justify-start">
            <div className="flex items-center gap-2 text-white/90">
              <span className="material-symbols-outlined text-ai-glow">
                check_circle
              </span>
              <span className="text-xs font-semibold font-be-vietnam">
                10% Points Back
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <span className="material-symbols-outlined text-ai-glow">
                check_circle
              </span>
              <span className="text-xs font-semibold font-be-vietnam">
                Free Upgrades
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <span className="material-symbols-outlined text-ai-glow">
                check_circle
              </span>
              <span className="text-xs font-semibold font-be-vietnam">
                Priority Support
              </span>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <button
            onClick={() => alert('Joining SmartStay Rewards...')}
            className="px-10 py-5 bg-primary text-white font-semibold rounded-2xl hover:bg-on-primary-container transition-all shadow-lg text-center cursor-pointer font-be-vietnam text-sm"
          >
            Join Rewards
          </button>
          <button
            onClick={() => alert('Loading rewards information...')}
            className="px-10 py-5 bg-white/10 backdrop-blur-md border border-outline text-white font-semibold rounded-2xl hover:bg-white/20 transition-all text-center cursor-pointer font-be-vietnam text-sm"
          >
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
}
