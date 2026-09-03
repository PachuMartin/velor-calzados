import React, { useState } from 'react';
import { X, ShoppingCart, Check, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProductDetail({ product, onClose, onAddToCart, apiBase, isDarkMode }) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || '');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const imagesList = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500'];

  const currentImg = imagesList[activeImageIndex] || imagesList[0];
  const productImageUrl = currentImg.startsWith('http')
    ? currentImg
    : `${apiBase.replace('/api', '')}${currentImg}`;

  const nextImage = (e) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % imagesList.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);
  };

  const handleAddToCart = () => {
    if (!selectedSize && product.sizes.length > 0) {
      alert('Por favor selecciona una talla');
      return;
    }
    if (!selectedColor && product.colors.length > 0) {
      alert('Por favor selecciona un color');
      return;
    }
    onAddToCart(product, quantity, selectedSize, selectedColor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div 
        className={`relative w-full max-w-lg border rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] transition-colors duration-300 ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 z-20 p-2 rounded-full border active:scale-95 transition-all ${
            isDarkMode 
              ? 'bg-black/60 hover:bg-black/80 text-gray-300 hover:text-white border-white/5' 
              : 'bg-white/80 hover:bg-white text-zinc-600 hover:text-zinc-900 border-zinc-200 shadow-sm'
          }`}
        >
          <X size={18} />
        </button>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto no-scrollbar flex-1">
          {/* Main Product Image with Gallery Carousel Controls */}
          <div className="aspect-square relative w-full bg-zinc-950 group select-none">
            <img 
              src={productImageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover transition-all duration-300"
            />

            {/* Photo Counter Badge */}
            {imagesList.length > 1 && (
              <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/10">
                {activeImageIndex + 1} / {imagesList.length}
              </div>
            )}

            {/* Left / Right Carousel Navigation Arrows */}
            {imagesList.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/10 active:scale-90 transition-all opacity-80 hover:opacity-100 shadow-lg"
                  title="Foto anterior"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/10 active:scale-90 transition-all opacity-80 hover:opacity-100 shadow-lg"
                  title="Foto siguiente"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="bg-zinc-800 text-zinc-400 font-extrabold uppercase px-6 py-3 rounded-xl tracking-wider text-sm border border-zinc-700">
                  Sin Stock Disponible
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails (if multiple images) */}
          {product.images && product.images.length > 1 && (
            <div className={`flex gap-2 p-3 overflow-x-auto ${isDarkMode ? 'bg-zinc-950' : 'bg-zinc-100'}`}>
              {product.images.map((img, index) => {
                const thumbUrl = img.startsWith('http') ? img : `${apiBase.replace('/api', '')}${img}`;
                return (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                      activeImageIndex === index ? 'border-pink-500 scale-95' : 'border-zinc-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Detailed Specifications */}
          <div className="p-6 text-left">
            <span className="text-[10px] uppercase font-bold text-pink-400 tracking-widest bg-pink-500/10 px-2.5 py-1 rounded-full border border-pink-500/20">
              {product.category}
            </span>
            <h2 className={`text-xl font-extrabold mt-3 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{product.name}</h2>
            <p className="text-xl font-extrabold text-pink-400 mt-2">${product.price.toFixed(2)}</p>
            
            <p className={`text-xs mt-3 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {product.description}
            </p>

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-5">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  Tallas disponibles:
                </h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-10 h-10 px-3 rounded-xl text-xs font-extrabold border transition-all ${
                        selectedSize === size
                          ? isDarkMode ? 'bg-white text-black border-white' : 'bg-black text-white border-black'
                          : isDarkMode 
                            ? 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white' 
                            : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:text-zinc-900'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-5">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  Color:
                </h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                        selectedColor === color
                          ? 'bg-pink-500 text-white border-pink-400 shadow-sm'
                          : isDarkMode 
                            ? 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white' 
                            : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:text-zinc-900'
                      }`}
                    >
                      {selectedColor === color && <Check size={12} />}
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="mt-5 flex items-center gap-4">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  Cantidad:
                </h4>
                <div className={`flex items-center rounded-xl border ${
                  isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-100 border-zinc-200'
                }`}>
                  <button 
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className={`w-10 h-10 text-lg transition-colors ${
                      isDarkMode ? 'hover:text-white text-zinc-400' : 'hover:text-zinc-900 text-zinc-500'
                    }`}
                  >
                    -
                  </button>
                  <span className={`w-8 text-center text-xs font-extrabold ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>{quantity}</span>
                  <button 
                    onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                    className={`w-10 h-10 text-lg transition-colors ${
                      isDarkMode ? 'hover:text-white text-zinc-400' : 'hover:text-zinc-900 text-zinc-500'
                    }`}
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-zinc-500">
                  {product.stock} unidades en stock
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Add To Cart Button */}
        <div className={`p-4 border-t ${
          isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
        }`}>
          {product.stock > 0 ? (
            <button
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-[0.98] transition-all text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg"
            >
              <ShoppingCart size={16} />
              Añadir al Carrito - ${(product.price * quantity).toFixed(2)}
            </button>
          ) : (
            <button
              disabled
              className="w-full bg-zinc-800 text-zinc-500 font-bold py-3.5 px-6 rounded-2xl cursor-not-allowed border border-zinc-700"
            >
              No disponible
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
