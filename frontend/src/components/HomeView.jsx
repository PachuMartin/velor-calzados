import React from 'react';
import { ShoppingBag, Tag, Sparkles, ArrowRight } from 'lucide-react';
import { formatImageUrl, FALLBACK_IMAGE } from '../utils/imageHelper';

export default function HomeView({ products, onOpenProduct, apiBase, setActiveTab, isDarkMode }) {
  const offers = products.filter(p => p.originalPrice && p.originalPrice > p.price);
  const newProducts = products.filter(p => p.tag === 'Nuevo' || p.id === 'prod-2' || p.id === 'prod-4');

  const bannerImg = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000&auto=format&fit=crop&q=80";

  return (
    <div className={`min-h-[calc(100vh-60px)] pb-20 overflow-y-auto transition-colors duration-300 ${
      isDarkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'
    }`}>
      {/* Hero Banner Section */}
      <div className="relative h-[280px] md:h-[400px] w-full overflow-hidden flex items-center">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <img 
          src={bannerImg} 
          alt="Colección Femenina" 
          className="absolute inset-0 w-full h-full object-cover object-center animate-scale-slow"
        />
        
        <div className="relative z-20 max-w-4xl mx-auto px-6 text-left flex flex-col items-start gap-4">
          <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-widest text-pink-500 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
            Nueva Colección 2026
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight max-w-md text-white">
            Eleva tu Estilo Diario
          </h1>
          <p className="text-xs md:text-sm text-zinc-300 max-w-sm leading-relaxed">
            Descubre las últimas tendencias en calzado y prendas diseñadas para destacar tu personalidad.
          </p>
          <div className="flex gap-3 mt-2">
            <button 
              onClick={() => setActiveTab('feed')}
              className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-95 transition-all text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-lg"
            >
              Ver Reels
              <ArrowRight size={14} />
            </button>
            <button 
              onClick={() => setActiveTab('grid')}
              className="bg-zinc-900/80 hover:bg-zinc-800 text-white border border-zinc-700 text-xs font-bold px-5 py-3 rounded-2xl active:scale-95 transition-all"
            >
              Explorar Catálogo
            </button>
          </div>
        </div>
      </div>

      {/* Offers Section */}
      {offers.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 text-left">
          <div className={`flex items-center gap-2 mb-6 border-b pb-3 ${
            isDarkMode ? 'border-zinc-900' : 'border-zinc-200'
          }`}>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <Tag size={16} />
            </div>
            <div>
              <h2 className={`text-base font-extrabold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                Ofertas Especiales
              </h2>
              <p className="text-[10px] text-zinc-500">Descuentos exclusivos por tiempo limitado.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {offers.map(product => {
              const rawImg = product.images && product.images[0] ? product.images[0] : null;
              const productImageUrl = formatImageUrl(rawImg, apiBase);
              const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

              return (
                <div 
                  key={product.id}
                  onClick={() => onOpenProduct(product)}
                  className={`group rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col cursor-pointer ${
                    isDarkMode 
                      ? 'bg-zinc-900 border-zinc-800/80 hover:border-pink-500/40' 
                      : 'bg-white border-zinc-200 hover:border-pink-500/40 shadow-sm'
                  }`}
                >
                  <div className="aspect-square relative overflow-hidden bg-zinc-950">
                    <img 
                      src={productImageUrl} 
                      alt={product.name} 
                      onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-2 left-2 bg-rose-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-lg border border-rose-400/20">
                      {discount}% OFF
                    </span>
                  </div>
                  
                  <div className="p-3.5 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className={`text-xs font-bold line-clamp-1 group-hover:text-pink-400 transition-colors ${
                        isDarkMode ? 'text-gray-200' : 'text-zinc-800'
                      }`}>
                        {product.name}
                      </h3>
                      <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{product.category}</p>
                    </div>

                    <div className={`mt-3 flex items-center justify-between pt-2 border-t ${
                      isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
                    }`}>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 line-through">${product.originalPrice.toFixed(2)}</span>
                        <span className={`text-xs font-extrabold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                      <span className={`p-2 rounded-xl transition-all ${
                        isDarkMode 
                          ? 'bg-zinc-850 text-zinc-400 hover:text-white hover:bg-pink-500' 
                          : 'bg-zinc-100 text-zinc-500 hover:text-white hover:bg-pink-500'
                      }`}>
                        <ShoppingBag size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Arrivals Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 text-left">
        <div className={`flex items-center gap-2 mb-6 border-b pb-3 ${
          isDarkMode ? 'border-zinc-900' : 'border-zinc-200'
        }`}>
          <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500 border border-pink-500/20">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className={`text-base font-extrabold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              Nuevos Ingresos
            </h2>
            <p className="text-[10px] text-zinc-500">Lo último que llegó a nuestro stock.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {newProducts.map(product => {
            const rawImg = product.images && product.images[0] ? product.images[0] : null;
            const productImageUrl = formatImageUrl(rawImg, apiBase);

            return (
              <div 
                key={product.id}
                onClick={() => onOpenProduct(product)}
                className={`group rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col cursor-pointer ${
                  isDarkMode 
                    ? 'bg-zinc-900 border-zinc-800/80 hover:border-pink-500/40' 
                    : 'bg-white border-zinc-200 hover:border-pink-500/40 shadow-sm'
                }`}
              >
                <div className="aspect-square relative overflow-hidden bg-zinc-950">
                  <img 
                    src={productImageUrl} 
                    alt={product.name} 
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-2 left-2 bg-pink-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-lg border border-pink-400/20">
                    NUEVO
                  </span>
                </div>
                
                <div className="p-3.5 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className={`text-xs font-bold line-clamp-1 group-hover:text-pink-400 transition-colors ${
                      isDarkMode ? 'text-gray-200' : 'text-zinc-800'
                    }`}>
                      {product.name}
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{product.category}</p>
                  </div>

                  <div className={`mt-3 flex items-center justify-between pt-2 border-t ${
                    isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
                  }`}>
                    <span className={`text-xs font-extrabold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                      ${product.price.toFixed(2)}
                    </span>
                    <span className={`p-2 rounded-xl transition-all ${
                      isDarkMode 
                        ? 'bg-zinc-850 text-zinc-400 hover:text-white hover:bg-pink-500' 
                        : 'bg-zinc-100 text-zinc-500 hover:text-white hover:bg-pink-500'
                    }`}>
                      <ShoppingBag size={12} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
