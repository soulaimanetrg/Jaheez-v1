import React, { useState } from 'react';
import { Search, MapPin, Clock, Flame, Star, ChevronLeft, Grid } from 'lucide-react';

export function Hologram() {
  const [activeCategory, setActiveCategory] = useState('الكل');

  const categories = [
    { name: 'الكل', icon: '🍽️' },
    { name: 'مطاعم', icon: '🍔' },
    { name: 'بقالة', icon: '🛒' },
    { name: 'صيدلية', icon: '💊' },
    { name: 'حلويات', icon: '🧁' },
    { name: 'مقاهي', icon: '☕' },
  ];

  const recentSearches = ['شاورما', 'بيتزا', 'قهوة مختصة', 'صيدلية قريبة'];

  const trending = [
    { rank: '01', name: 'وجبات سريعة' },
    { rank: '02', name: 'عروض الغداء' },
    { rank: '03', name: 'توصيل مجاني' },
    { rank: '04', name: 'حلويات شرقية' },
  ];

  const stores = [
    { name: 'مطعم البحر الأزرق', rating: 4.8, time: '20-30 د' },
    { name: 'بيتزا سافي', rating: 4.5, time: '30-40 د' },
    { name: 'مشاوي المدينة', rating: 4.7, time: '25-35 د' },
    { name: 'فطور آسفي', rating: 4.9, time: '15-25 د' },
  ];

  return (
    <div dir="rtl" className="relative mx-auto max-w-[390px] h-[844px] overflow-hidden bg-[#050B18] text-white font-sans flex flex-col">
      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .hologram-border {
          position: relative;
          border-radius: 9999px;
          background: #050B18;
          z-index: 1;
        }
        .hologram-border::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 9999px;
          background: linear-gradient(90deg, #00ffcc, #ff00ff, #00ffff, #00ffcc);
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
          z-index: -1;
        }
        .hologram-border-box {
          position: relative;
          border-radius: 12px;
          background: #050B18;
          z-index: 1;
        }
        .hologram-border-box::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 12px;
          background: linear-gradient(90deg, #00ffcc, #ff00ff, #00ffff, #00ffcc);
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
          z-index: -1;
        }
        .hologram-text {
          background: linear-gradient(90deg, #00ffcc, #ff00ff, #00ffff, #00ffcc);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .particles {
          background-image: radial-gradient(circle at center, rgba(0, 255, 204, 0.15) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .hologram-accent-line {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(180deg, #00ffcc, #ff00ff);
          background-size: 100% 200%;
          animation: shimmer 3s linear infinite;
        }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="absolute inset-0 particles pointer-events-none opacity-50"></div>

      <div className="relative z-10 flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-5 pt-14 pb-4 bg-[#050B18]/90 backdrop-blur-md sticky top-0 z-20 border-b border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold tracking-widest text-white/90">JAHEEZ</h1>
            <div className="flex items-center gap-1.5 text-xs font-light tracking-wide bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <span className="opacity-80">آسفي</span>
              <span>📍</span>
            </div>
          </div>
          <div className="hologram-border">
            <div className="flex items-center px-4 py-3 gap-3">
              <Search className="w-5 h-5 text-[#00ffcc]" />
              <input
                type="text"
                placeholder="ابحث عن مطعم، وجبة..."
                className="bg-transparent border-none outline-none text-sm w-full placeholder-white/30 text-white"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mt-6 px-5">
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={(isActive ? 'hologram-border' : 'bg-white/5 border border-white/10 rounded-full') + ' px-5 py-2.5 flex items-center gap-2 whitespace-nowrap transition-all duration-300'}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span className={'text-sm font-medium ' + (isActive ? 'text-white' : 'text-white/60')}>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Searches */}
        <div className="mt-8 px-5">
          <h2 className="text-xs font-semibold text-white/40 mb-4 tracking-wider">مؤخراً</h2>
          <div className="flex flex-wrap gap-2.5">
            {recentSearches.map((search, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                <Clock className="w-3.5 h-3.5 text-white/40" />
                <span className="text-xs text-white/70">{search}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trending */}
        <div className="mt-10 px-5">
          <h2 className="text-xs font-semibold text-white/40 mb-4 tracking-wider flex items-center gap-2">
            الأكثر طلبًا <Flame className="w-3.5 h-3.5 text-[#ff00ff]" />
          </h2>
          <div className="flex flex-col gap-3">
            {trending.map((item, i) => (
              <div key={i} className="relative bg-white/[0.02] border border-white/5 rounded-lg p-4 flex items-center justify-between overflow-hidden group">
                <div className="hologram-accent-line opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-[#00ffcc]/70">{item.rank}</span>
                  <span className="text-sm font-medium text-white/90">{item.name}</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-white/20" />
              </div>
            ))}
          </div>
        </div>

        {/* Store Cards Grid */}
        <div className="mt-10 px-5 pb-10">
          <h2 className="text-xs font-semibold text-white/40 mb-4 tracking-wider">اكتشف</h2>
          <div className="grid grid-cols-2 gap-4">
            {stores.map((store, i) => (
              <div key={i} className="hologram-border-box">
                <div className="p-4 flex flex-col gap-3 h-full">
                  <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center">
                    <Grid className="w-5 h-5 text-white/30" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white/90 mb-1 leading-tight">{store.name}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-white/50">
                      <span className="flex items-center gap-0.5 text-[#ff00ff]">
                        <Star className="w-3 h-3 fill-current" /> {store.rating}
                      </span>
                      <span>•</span>
                      <span>{store.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
