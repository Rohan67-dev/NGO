import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, Sparkles, ArrowRight, Users, Utensils, Trees, GraduationCap, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '@/api/axiosClient';
import { Product, ImpactMetric, Campaign, ImpactStory } from '@/types';
import { ProductCard } from '@/components/shop/ProductCard';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';

export const Home: React.FC = () => {
  const { setCart, openCart } = useCartStore();
  const { isInWishlist } = useWishlistStore();

  // Fetch Featured Products
  const { data: featuredProducts } = useQuery<Product[]>({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const res = await axiosClient.get('/products/featured');
      return res.data.data;
    },
  });

  // Fetch Impact Metrics
  const { data: impactMetrics } = useQuery<ImpactMetric[]>({
    queryKey: ['impact-metrics'],
    queryFn: async () => {
      const res = await axiosClient.get('/impact/metrics');
      return res.data.data;
    },
  });

  // Fetch Active Campaigns
  const { data: campaigns } = useQuery<Campaign[]>({
    queryKey: ['active-campaigns'],
    queryFn: async () => {
      const res = await axiosClient.get('/campaigns');
      return res.data.data;
    },
  });

  // Fetch Impact Stories
  const { data: stories } = useQuery<{ content: ImpactStory[] }>({
    queryKey: ['home-stories'],
    queryFn: async () => {
      const res = await axiosClient.get('/stories?page=0&size=3');
      return res.data.data;
    },
  });

  const handleAddToCart = async (product: Product) => {
    try {
      const res = await axiosClient.post('/cart/items', { productId: product.id, quantity: 1 });
      if (res.data.success) {
        setCart(res.data.data);
        openCart();
      }
    } catch (e) {
      console.error('Failed to add to cart', e);
    }
  };

  const handleToggleWishlist = async (productId: number) => {
    try {
      if (isInWishlist(productId)) {
        await axiosClient.delete(`/wishlist/${productId}`);
      } else {
        await axiosClient.post(`/wishlist/${productId}`);
      }
    } catch (e) {
      console.error('Failed to toggle wishlist', e);
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-900 text-white pt-16 pb-24 rounded-b-3xl shadow-xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>SHOP WITH PURPOSE &bull; DIRECT NGO IMPACT</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Turn Your Shopping Into <span className="text-emerald-400">Verifiable Social Impact.</span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Every handcrafted product you purchase generates fair wages for rural artisans, funds children's education, and powers sustainable community initiatives.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/shop"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-emerald-600/30 hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span>Browse Impact Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/impact"
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-6 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Heart className="w-4 h-4 text-emerald-400" />
                <span>See Verified Impact</span>
              </Link>
            </div>

            {/* Quick Trust Badges */}
            <div className="pt-6 border-t border-slate-800 grid grid-cols-3 gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Fair-Wage Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Eco-Friendly</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Razorpay Secured</span>
              </div>
            </div>
          </div>

          {/* Hero Feature Image */}
          <div className="relative mx-auto max-w-md lg:max-w-none">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 relative group">
              <img
                src="https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&q=80&w=1000"
                alt="Rural woman artisan crafting handcrafted products"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              
              <div className="absolute bottom-4 left-4 right-4 p-4 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700 text-white flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-400">Artisan Livelihood Initiative</h4>
                  <p className="text-[11px] text-slate-300">Supporting over 3,200 rural families</p>
                </div>
                <span className="bg-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">Verified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. REAL-TIME NGO IMPACT METRICS COUNTER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-md">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">TRANSPARENT NGO METRICS</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Our Collective Impact So Far</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {impactMetrics?.map((m) => (
              <div key={m.id} className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-md">
                  {m.icon === 'Utensils' && <Utensils className="w-5 h-5" />}
                  {m.icon === 'Users' && <Users className="w-5 h-5" />}
                  {m.icon === 'Trees' && <Trees className="w-5 h-5" />}
                  {m.icon === 'GraduationCap' && <GraduationCap className="w-5 h-5" />}
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{m.value.toLocaleString()}+</span>
                <span className="text-xs font-bold text-emerald-700 mt-0.5">{m.title}</span>
                <span className="text-[10px] text-slate-500 mt-1">{m.description}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS CATALOG */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">HANDMADE WITH LOVE</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Featured Impact Products</h2>
          </div>
          <Link to="/shop" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            View All Products &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts?.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onToggleWishlist={handleToggleWishlist}
            />
          ))}
        </div>
      </section>

      {/* 4. ACTIVE CAMPAIGN HIGHLIGHT */}
      {campaigns && campaigns.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-emerald-900 to-slate-900 rounded-3xl text-white p-8 md:p-12 shadow-xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="bg-amber-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  ACTIVE CAMPAIGN
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold">{campaigns[0].title}</h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{campaigns[0].description}</p>

                {/* Progress Bar */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Raised: ₹{campaigns[0].currentAmount.toLocaleString()}</span>
                    <span>Target: ₹{campaigns[0].targetAmount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, campaigns[0].progressPercentage)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to={`/campaigns/${campaigns[0].slug}`}
                    className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all text-xs"
                  >
                    <span>Support This Initiative</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="aspect-[4/3] rounded-2xl overflow-hidden border-2 border-slate-700">
                <img
                  src={campaigns[0].imageUrl || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800'}
                  alt={campaigns[0].title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. IMPACT STORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">EDITORIAL &amp; TRANSPARENCY</span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Stories From Our Beneficiaries</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stories?.content?.map((story) => (
            <Link
              key={story.id}
              to={`/stories/${story.slug}`}
              className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              <div className="aspect-video bg-slate-100 overflow-hidden">
                <img
                  src={story.imageUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800'}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 mb-2">
                    {story.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{story.excerpt}</p>
                </div>
                <div className="pt-4 border-t border-slate-100 text-[11px] font-semibold text-emerald-600 flex items-center justify-between mt-4">
                  <span>Read Full Story</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
