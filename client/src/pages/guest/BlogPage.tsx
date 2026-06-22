import InfoPageHeader from '../../components/shared/InfoPageHeader';

const posts = [
  {
    category: 'Travel Guides',
    title: '10 hidden sanctuaries in Vietnam for a quiet luxury escape',
    excerpt:
      'From misty Da Lat villas to lantern-lit Hoi An suites, here are the stays our team can’t stop recommending.',
    author: 'Mai Tran',
    date: 'Jun 18, 2026',
    img: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070&auto=format&fit=crop',
  },
  {
    category: 'Product',
    title: 'How our AI concierge actually understands what you want',
    excerpt:
      'A peek behind the curtain at the technology that turns a casual question into the perfect booking.',
    author: 'David Kim',
    date: 'Jun 10, 2026',
    img: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2070&auto=format&fit=crop',
  },
  {
    category: 'Tips',
    title: 'The art of the last-minute booking (without the stress)',
    excerpt:
      'Smart alerts, flexible rates, and a few insider habits that make spontaneous trips effortless.',
    author: 'Sarah Johnson',
    date: 'May 29, 2026',
    img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop',
  },
];

export default function BlogPage() {
  return (
    <div className="py-12 w-full">
      <InfoPageHeader
        eyebrow="Stories & insights"
        title="The SmartStay Blog"
        description="Travel inspiration, product news, and tips for the modern explorer."
      />

      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map(post => (
            <article
              key={post.title}
              className="group cursor-pointer rounded-3xl overflow-hidden bg-white ring-1 ring-outline-variant/10 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={post.img}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <span className="text-xs font-bold text-primary uppercase tracking-widest font-be-vietnam">
                  {post.category}
                </span>
                <h3 className="font-bold text-on-surface text-lg font-be-vietnam mt-2 mb-2">
                  {post.title}
                </h3>
                <p className="text-sm text-on-surface-variant font-be-vietnam mb-4">
                  {post.excerpt}
                </p>
                <p className="text-xs text-on-surface-variant font-be-vietnam">
                  {post.author} · {post.date}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
