import { useTranslation } from 'react-i18next';
import InfoPageHeader from '../../components/shared/InfoPageHeader';

const POST_IMAGES = [
  'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop',
];

export default function BlogPage() {
  const { t } = useTranslation('pages');
  const posts = t('blog.posts', { returnObjects: true });
  return (
    <div className="py-12 w-full">
      <InfoPageHeader
        eyebrow={t('blog.eyebrow')}
        title={t('blog.title')}
        description={t('blog.description')}
      />

      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post, i) => (
            <article
              key={post.title}
              className="group cursor-pointer rounded-3xl overflow-hidden bg-white ring-1 ring-outline-variant/10 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={POST_IMAGES[i]}
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
