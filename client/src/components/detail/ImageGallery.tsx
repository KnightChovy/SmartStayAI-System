import { Button } from '../ui/button';
import type { ImageGalleryProps } from '@/types/detail.types';

export function ImageGallery({
  images,
  activePhotoIdx,
  setActivePhotoIdx,
  handlePrevPhoto,
  handleNextPhoto,
}: ImageGalleryProps) {
  return (
    <section className="mb-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-87.5 md:h-125 relative overflow-hidden">
        {/* Large Primary Image */}
        <div
          className="md:col-span-8 rounded-3xl overflow-hidden relative cursor-pointer group"
          onClick={() => setActivePhotoIdx(0)}
        >
          <img
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-out"
            alt={images[0].alt}
            src={images[0].url}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>
        </div>
        {/* Stacked Secondary Images */}
        <div className="hidden md:grid md:col-span-4 grid-rows-2 gap-4 h-full">
          <div
            className="rounded-3xl overflow-hidden cursor-pointer group relative"
            onClick={() => setActivePhotoIdx(1)}
          >
            <img
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
              alt={images[1].alt}
              src={images[1].url}
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
          </div>
          <div
            className="rounded-3xl overflow-hidden relative cursor-pointer group"
            onClick={() => setActivePhotoIdx(2)}
          >
            <img
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
              alt={images[2].alt}
              src={images[2].url}
            />
            <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors duration-300"></div>
            <Button
              onClick={e => {
                e.stopPropagation();
                setActivePhotoIdx(0);
              }}
              className="absolute bottom-6 right-6 bg-white/20 hover:bg-white/35 backdrop-blur-xl border border-white/30 text-white font-semibold py-2.5 px-4 rounded-2xl shadow-lg transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95 text-xs tracking-wider"
            >
              <span className="material-symbols-outlined text-sm">
                grid_view
              </span>
              See all photos
            </Button>
          </div>
        </div>
      </div>

      {/* Lightbox / Gallery Modal */}
      {activePhotoIdx !== null && (
        <div
          className="fixed inset-0 z-100 bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl animate-fade-in"
          onClick={() => setActivePhotoIdx(null)}
        >
          <button
            onClick={() => setActivePhotoIdx(null)}
            className="absolute top-6 right-6 text-white hover:text-outline-variant p-2 rounded-full hover:bg-white/10 transition-all cursor-pointer border-none"
            aria-label="Close Lightbox"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>

          <div className="relative max-w-5xl w-full h-[70vh] flex items-center justify-center">
            {/* Prev Trigger */}
            <button
              onClick={handlePrevPhoto}
              className="absolute left-0 md:-left-16 text-white hover:text-outline-variant p-3 rounded-full hover:bg-white/10 transition-all cursor-pointer border-none"
              aria-label="Previous Photo"
            >
              <span className="material-symbols-outlined text-4xl">
                chevron_left
              </span>
            </button>

            {/* Slider Image Container */}
            <div className="w-full h-full flex flex-col justify-center items-center gap-4">
              <img
                src={images[activePhotoIdx].url}
                alt={images[activePhotoIdx].alt}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-scale-in"
                onClick={e => e.stopPropagation()}
              />
              <p className="text-white/80 text-xs md:text-sm text-center max-w-xl font-semibold leading-relaxed px-4">
                {images[activePhotoIdx].alt}
              </p>
              <div className="flex items-center gap-2.5 mt-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={e => {
                      e.stopPropagation();
                      setActivePhotoIdx(idx);
                    }}
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer border-none ${
                      activePhotoIdx === idx
                        ? 'bg-white scale-125'
                        : 'bg-white/30 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Next Trigger */}
            <button
              onClick={handleNextPhoto}
              className="absolute right-0 md:-right-16 text-white hover:text-outline-variant p-3 rounded-full hover:bg-white/10 transition-all cursor-pointer border-none"
              aria-label="Next Photo"
            >
              <span className="material-symbols-outlined text-4xl">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
