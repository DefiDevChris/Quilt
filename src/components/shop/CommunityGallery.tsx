'use client';

import { COLORS } from '@/lib/design-system';

const galleryImages = [
  { id: 1, src: '/images/community-01.jpg', alt: 'Beautiful quilt on bed' },
  { id: 2, src: '/images/community-02.jpg', alt: 'Hands quilting' },
  { id: 3, src: '/images/community-03.jpg', alt: 'Baby quilt on crib' },
  { id: 4, src: '/images/community-04.jpg', alt: 'Quilt wall hanging' },
  { id: 5, src: '/images/community-05.jpg', alt: 'Stack of quilts' },
  { id: 6, src: '/images/community-06.jpg', alt: 'Proud maker with quilt' },
];

export default function CommunityGallery() {
  return (
    <section className="py-20 lg:py-28" style={{ backgroundColor: COLORS.surface }}>
      <div className="w-full px-6 lg:px-12">
        {/* Header */}
        <div className="mb-12">
          <span
            className="text-xs uppercase tracking-widest mb-3 block"
            style={{ color: COLORS.textDim, fontFamily: 'var(--font-display)' }}
          >
            Community Gallery
          </span>
          <h2
            className="text-4xl lg:text-5xl mb-4"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 300,
              color: COLORS.text,
              fontStyle: 'italic',
            }}
          >
            Made with QuiltCorgi
          </h2>
          <p style={{ color: COLORS.textDim }}>
            Tag <span className="font-medium" style={{ color: COLORS.primary }}>#quiltcorgi</span> to share your work.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {galleryImages.map((image, index) => (
            <div
              key={image.id}
              className="group relative rounded-[20px] overflow-hidden"
              style={{ aspectRatio: '1/1' }}
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.style.backgroundColor = `${COLORS.primary}10`;
                  }}
                />
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-espresso/0 group-hover:bg-espresso/20 transition-colors duration-300"
                style={{
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${COLORS.text}33`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
