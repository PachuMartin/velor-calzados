import React from 'react';
import { X, Trash2, ShoppingBag, Send } from 'lucide-react';

export default function Cart({ isOpen, onClose, cartItems, onRemove, onUpdateQty, settings, isDarkMode }) {
  if (!isOpen) return null;

  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Generate WhatsApp text and open link
  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    let message = `*¡Hola ${settings.storeName}! Vengo de la tienda online y quiero hacer un pedido:* \n\n`;
    
    cartItems.forEach((item, index) => {
      message += `*${index + 1}. ${item.product.name}*\n`;
      message += `   Talla: ${item.size || 'N/A'} | Color: ${item.color || 'N/A'}\n`;
      message += `   Cantidad: ${item.quantity} u. | Precio: $${(item.product.price * item.quantity).toFixed(2)}\n\n`;
    });

    message += `*Total a pagar: $${total.toFixed(2)}*\n\n`;
    message += `_Por favor, confírmenme la disponibilidad y los datos para coordinar el pago y el envío._ 🚚👠`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${settings.whatsapp.replace('+', '')}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        {/* Cart Slide-Over Panel */}
        <div className={`w-screen max-w-md shadow-2xl flex flex-col h-full animate-slide-in transition-colors duration-300 ${
          isDarkMode ? 'bg-zinc-900 border-l border-zinc-800 text-white' : 'bg-white border-l border-zinc-200 text-zinc-900'
        }`}>
          {/* Header */}
          <div className={`px-6 py-5 border-b flex items-center justify-between transition-colors ${
            isDarkMode ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-zinc-50'
          }`}>
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-pink-500" />
              <h2 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Mi Pedido</h2>
            </div>
            <button 
              onClick={onClose}
              className={`p-2 rounded-full transition-all active:scale-95 ${
                isDarkMode ? 'hover:bg-zinc-800 text-gray-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-500 hover:text-zinc-850'
              }`}
            >
              <X size={18} />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {cartItems.length > 0 ? (
              cartItems.map((item, index) => {
                const imgUrl = item.product.images && item.product.images[0]
                  ? (item.product.images[0].startsWith('http') ? item.product.images[0] : `http://localhost:5000${item.product.images[0]}`)
                  : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500';

                return (
                  <div 
                    key={`${item.product.id}-${item.size}-${item.color}`}
                    className={`flex gap-4 border rounded-2xl p-3 transition-all text-left ${
                      isDarkMode 
                        ? 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-800' 
                        : 'bg-zinc-50 border-zinc-200/80 hover:border-zinc-200 shadow-sm'
                    }`}
                  >
                    {/* Cover image */}
                    <img 
                      src={imgUrl} 
                      alt={item.product.name} 
                      className={`w-20 h-20 object-cover rounded-xl border ${
                        isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
                      }`}
                    />

                    {/* Meta info */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className={`text-xs font-bold line-clamp-1 ${isDarkMode ? 'text-gray-100' : 'text-zinc-800'}`}>{item.product.name}</h4>
                        <p className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          Talla: <span className={`font-extrabold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{item.size}</span> | Color: <span className={`font-extrabold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{item.color}</span>
                        </p>
                      </div>
                      
                      {/* Quantity triggers and price */}
                      <div className="flex items-center justify-between mt-2">
                        <div className={`flex items-center rounded-lg border ${
                          isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-100 border-zinc-200'
                        }`}>
                          <button 
                            onClick={() => onUpdateQty(index, -1)}
                            className="w-7 h-7 text-xs text-zinc-400 hover:text-white transition-colors"
                          >
                            -
                          </button>
                          <span className={`w-5 text-center text-xs font-bold ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>{item.quantity}</span>
                          <button 
                            onClick={() => onUpdateQty(index, 1)}
                            className="w-7 h-7 text-xs text-zinc-400 hover:text-white transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs font-extrabold text-pink-400">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Delete Item Button */}
                    <button 
                      onClick={() => onRemove(index)}
                      className={`p-1 self-start active:scale-95 transition-all ${
                        isDarkMode ? 'text-zinc-650 hover:text-rose-400' : 'text-zinc-400 hover:text-rose-500'
                      }`}
                      title="Eliminar del carrito"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-550 gap-3 py-20 text-center">
                <ShoppingBag size={48} className={`animate-bounce ${isDarkMode ? 'text-zinc-800' : 'text-zinc-200'}`} />
                <p className="text-sm font-semibold">El carrito está vacío</p>
                <p className="text-xs text-zinc-400">Explora nuestro catálogo e inicio y añade prendas a tu carrito.</p>
              </div>
            )}
          </div>

          {/* Checkout & Summary Footer */}
          {cartItems.length > 0 && (
            <div className={`p-6 border-t ${
              isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex justify-between items-center mb-6">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Subtotal:</span>
                <span className={`text-xl font-extrabold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>${total.toFixed(2)}</span>
              </div>
              
              <button
                onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-[0.98] transition-all text-white font-bold py-3.5 rounded-2xl shadow-lg"
              >
                <Send size={15} />
                Enviar pedido por WhatsApp
              </button>
              
              <p className="text-[10px] text-zinc-500 text-center mt-3 leading-snug">
                Al hacer clic, se abrirá WhatsApp con el detalle de tu carrito para que confirmemos tu pago y envío de forma personalizada.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
