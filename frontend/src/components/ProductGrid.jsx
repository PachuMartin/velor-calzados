import React, { useState } from 'react';
import { ShoppingBag, Eye } from 'lucide-react';

export default function ProductGrid({ products, onOpenProduct, apiBase, isDarkMode }) {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [hoveredProduct, setHoveredProduct] = useState(null);

  const categories = ['Todos', 'Calzado', 'Prendas'];

  const filteredProducts = selectedCategory === 'Todos'
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className={`min-h-[calc(100vh-60px)] pb-20 px-4 md:px-8 transition-colors duration-300 ${
      isDarkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'
    }`}>
      {/* Category Pills (Instagram-style tags) */}
      <div className={`flex justify-center gap-3 py-6 sticky top-[60px] z-30 transition-colors duration-300 ${
        isDarkMode ? 'bg-zinc-950/90' : 'bg-white/90'
      } backdrop-blur-md`}>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all border ${
              selectedCategory === category
                ? isDarkMode
                  ? 'bg-white text-black border-white shadow-lg'
                  : 'bg-black text-white border-black shadow-lg'
                : isDarkMode
                  ? 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Grid container */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
          {filteredProducts.map(product => {
            const productImageUrl = product.images && product.images[0]
              ? (product.images[0].startsWith('http') ? product.images[0] : `${apiBase.replace('/api', '')}${product.images[0]}`)
              : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500';

            const isHovered = hoveredProduct === product.id;

            return (
              <div
                key={product.id}
                className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col cursor-pointer ${
                  isDarkMode 
                    ? 'bg-zinc-900 border-zinc-800 hover:border-pink-500/50' 
                    : 'bg-zinc-50 border-zinc-200 hover:border-pink-500/50 shadow-sm'
                }`}
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
                onClick={() => onOpenProduct(product)}
              >
                {/* Product Image Container */}
                <div className="aspect-square relative w-full overflow-hidden bg-zinc-950">
                  <img
                    src={productImageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  
                  {/* Category Badge */}
                  <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-[10px] text-zinc-300 font-semibold px-2 py-0.5 rounded-full border border-white/5">
                    {product.category}
                  </span>

                  {/* Dark overlay on hover */}
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-3 transition-opacity duration-300 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <button className="p-3 bg-pink-500 rounded-full hover:bg-pink-600 active:scale-95 transition-all text-white shadow-lg">
                      <ShoppingBag size={18} />
                    </button>
                    <button className="p-3 bg-white text-black rounded-full hover:bg-zinc-200 active:scale-95 transition-all shadow-lg">
                      <Eye size={18} />
                    </button>
                  </div>
                </div>

                {/* Info Section */}
                <div className="p-3.5 flex flex-col flex-1 text-left">
                  <div className="flex justify-between items-start gap-1">
                    <h3 className={`text-sm font-bold line-clamp-1 group-hover:text-pink-400 transition-colors ${
                      isDarkMode ? 'text-gray-100' : 'text-zinc-800'
                    }`}>
                      {product.name}
                    </h3>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1">
                    {product.description}
                  </p>
                  
                  {/* Bottom details */}
                  <div className={`mt-3 flex items-center justify-between pt-2 border-t ${
                    isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
                  }`}>
                    <span className={`text-sm font-extrabold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                      ${product.price.toFixed(2)}
                    </span>
                    {product.stock <= 3 && product.stock > 0 ? (
                      <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                        ¡Solo {product.stock} disp!
                      </span>
                    ) : product.stock === 0 ? (
                      <span className="text-[9px] font-bold text-zinc-400 bg-zinc-850 px-1.5 py-0.5 rounded">
                        Sin stock
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500">
                        {product.stock} u.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-500 gap-2">
          <p className="text-base font-semibold">No se encontraron productos.</p>
          <p className="text-xs text-zinc-600">Intenta buscar en otra categoría o agrega nuevos productos.</p>
        </div>
      )}
    </div>
  );
}
