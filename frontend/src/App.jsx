import React, { useState, useEffect } from 'react';
import { ShoppingBag, Play, Grid, User, LogOut, Settings, MessageCircle, AlertTriangle, Home, Sun, Moon } from 'lucide-react';
import VideoFeed from './components/VideoFeed';
import ProductGrid from './components/ProductGrid';
import Cart from './components/Cart';
import ProductDetail from './components/ProductDetail';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import HomeView from './components/HomeView';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'feed' (TikTok), 'grid' (Instagram)
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [products, setProducts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [settings, setSettings] = useState({
    storeName: "Velor Calzados",
    primaryColor: "#ec4899",
    whatsapp: "+5491123456789",
    instagram: "https://instagram.com/bellamoda",
    tiktok: "https://tiktok.com/@bellamoda"
  });
  
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken') || null);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [backendOffline, setBackendOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load Initial Data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Try to fetch settings
      const settingsRes = await fetch(`${API_BASE}/settings`);
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }

      // Fetch products
      const productsRes = await fetch(`${API_BASE}/products`);
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }

      // Fetch videos
      const videosRes = await fetch(`${API_BASE}/videos`);
      if (videosRes.ok) {
        const videosData = await videosRes.json();
        setVideos(videosData);
      }

      setBackendOffline(false);
    } catch (error) {
      console.warn("Backend offline. Running in Demo Mode with local fallback database.");
      setBackendOffline(true);
      
      // Load fallback mock data (matching db.json structure)
      const mockDB = await import('./mockData.js').catch(() => ({
        default: {
          products: [
            {
              id: "prod-1",
              name: "Tacos Aguja Blue Dream",
              description: "Elegantes zapatos de tacón aguja color azul eléctrico, perfectos para fiestas y eventos de gala. Material de gamuza sintética de alta calidad.",
              price: 89.99,
              category: "Calzado",
              images: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500"],
              sizes: ["35", "36", "37", "38", "39", "40"],
              colors: ["Azul", "Negro"],
              stock: 10
            },
            {
              id: "prod-2",
              name: "Zapatillas Urbanas Retro-Neon",
              description: "Zapatillas deportivas con diseño urbano retro de los 90s. Colores vibrantes de neón y suela de goma duradera.",
              price: 75.00,
              category: "Calzado",
              images: ["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500"],
              sizes: ["36", "37", "38", "39"],
              colors: ["Multicolor", "Blanco"],
              stock: 12
            }
          ],
          videos: [
            {
              id: "vid-1",
              videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-makeup-40156-large.mp4",
              productId: "prod-1",
              caption: "Pasarela de otoño con los increíbles Tacos Blue Dream ✨👠 ¡Consigue los tuyos hoy!",
              likes: 1250
            },
            {
              id: "vid-2",
              videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-in-a-cyberpunk-style-34329-large.mp4",
              productId: "prod-2",
              caption: "Look urbano cyberpunk con las nuevas Retro-Neon. Comodidad y estilo sin límites 💥👟",
              likes: 980
            }
          ]
        }
      }));
      
      setProducts(mockDB.default.products);
      setVideos(mockDB.default.videos);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Verify Admin Token on launch
  useEffect(() => {
    if (adminToken) {
      fetch(`${API_BASE}/auth/verify`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      .then(res => {
        if (!res.ok) {
          localStorage.removeItem('adminToken');
          setAdminToken(null);
        }
      })
      .catch(() => {
        // In backend-offline mode, allow keeping admin session if manually logged in
      });
    }
  }, [adminToken]);

  // Cart Functions
  const addToCart = (product, quantity, size, color) => {
    const existingIndex = cart.findIndex(item => 
      item.product.id === product.id && 
      item.size === size && 
      item.color === color
    );

    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += quantity;
      setCart(newCart);
    } else {
      setCart([...cart, { product, quantity, size, color }]);
    }
    setIsCartOpen(true);
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const updateCartQuantity = (index, change) => {
    const newCart = [...cart];
    const newQty = newCart[index].quantity + change;
    if (newQty > 0) {
      newCart[index].quantity = newQty;
      setCart(newCart);
    }
  };

  const logoutAdmin = () => {
    localStorage.removeItem('adminToken');
    setAdminToken(null);
    setShowAdmin(false);
  };

  return (
    <div className={`min-h-screen flex flex-col relative transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-zinc-900'
    }`}>
      {/* Header / Navbar */}
      <header className={`fixed top-0 left-0 w-full z-40 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between transition-colors duration-300 ${
        isDarkMode ? 'bg-black/80 border-gray-800 text-white' : 'bg-white/80 border-gray-200 text-zinc-900'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`font-cursive text-3xl font-bold pb-1 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {settings.storeName}
          </span>
          {backendOffline && (
            <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
              <AlertTriangle size={10} /> DEMO
            </span>
          )}
        </div>

        {/* View Toggle (Hidden in Admin Mode) */}
        {!showAdmin && (
          <div className={`flex rounded-full p-1 border transition-all duration-300 ${
            isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-200'
          }`}>
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'home'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                  : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Home size={13} />
              Inicio
            </button>
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'feed'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                  : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Play size={13} className={activeTab === 'feed' ? 'fill-white' : ''} />
              Reels
            </button>
            <button
              onClick={() => setActiveTab('grid')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'grid'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                  : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Grid size={13} />
              Catálogo
            </button>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggler */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full border transition-all ${
              isDarkMode 
                ? 'border-gray-800 hover:border-pink-500 text-gray-400 hover:text-pink-500 bg-gray-950' 
                : 'border-gray-200 hover:border-pink-500 text-zinc-500 hover:text-pink-500 bg-white shadow-sm'
            }`}
            title={isDarkMode ? "Modo Claro" : "Modo Oscuro"}
          >
            {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {adminToken ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAdmin(!showAdmin)}
                className={`p-2 rounded-full border transition-all ${
                  showAdmin 
                    ? 'bg-pink-500 border-pink-400 text-white shadow-md' 
                    : isDarkMode 
                      ? 'border-gray-800 hover:border-pink-500 text-gray-400 hover:text-pink-500 bg-gray-950' 
                      : 'border-gray-200 hover:border-pink-500 text-zinc-500 hover:text-pink-500 bg-white shadow-sm'
                }`}
                title="Panel de Administración"
              >
                <Settings size={18} />
              </button>
              <button
                onClick={logoutAdmin}
                className={`p-2 rounded-full border transition-all ${
                  isDarkMode 
                    ? 'border-gray-800 hover:border-red-500 text-gray-400 hover:text-red-500 bg-gray-950' 
                    : 'border-gray-200 hover:border-red-500 text-zinc-500 hover:text-red-500 bg-white shadow-sm'
                }`}
                title="Cerrar Sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className={`p-2 rounded-full border transition-all ${
                isDarkMode 
                  ? 'border-gray-800 hover:border-pink-500 text-gray-400 hover:text-pink-500 bg-gray-950' 
                  : 'border-gray-200 hover:border-pink-500 text-zinc-500 hover:text-pink-500 bg-white shadow-sm'
              }`}
              title="Iniciar Sesión Administrador"
            >
              <User size={18} />
            </button>
          )}

          {!showAdmin && (
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative p-2 rounded-full border transition-all ${
                isDarkMode 
                  ? 'border-gray-800 hover:border-pink-500 text-gray-400 hover:text-pink-500 bg-gray-950' 
                  : 'border-gray-200 hover:border-pink-500 text-zinc-500 hover:text-pink-500 bg-white shadow-sm'
              }`}
            >
              <ShoppingBag size={18} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse shadow-md">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 pt-[60px] overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        {loading ? (
          <div className="h-full flex items-center justify-center flex-col gap-3">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 text-sm">Cargando la experiencia...</p>
          </div>
        ) : showAdmin ? (
          <AdminPanel 
            products={products} 
            videos={videos} 
            settings={settings}
            token={adminToken}
            onUpdate={fetchData}
            apiBase={API_BASE}
            isDemo={backendOffline}
            isDarkMode={isDarkMode}
          />
        ) : activeTab === 'home' ? (
          <HomeView 
            products={products} 
            onOpenProduct={setSelectedProduct} 
            apiBase={API_BASE}
            setActiveTab={setActiveTab}
            isDarkMode={isDarkMode}
          />
        ) : activeTab === 'feed' ? (
          <VideoFeed 
            videos={videos} 
            products={products} 
            onOpenProduct={setSelectedProduct} 
            apiBase={API_BASE}
          />
        ) : (
          <ProductGrid 
            products={products} 
            onOpenProduct={setSelectedProduct} 
            apiBase={API_BASE}
            isDarkMode={isDarkMode}
          />
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
          apiBase={API_BASE}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Shopping Cart Slide-over */}
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onRemove={removeFromCart}
        onUpdateQty={updateCartQuantity}
        settings={settings}
        isDarkMode={isDarkMode}
      />

      {/* Admin Login Modal */}
      {showLogin && (
        <Login
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onLoginSuccess={(token) => {
            setAdminToken(token);
            setShowLogin(false);
            setShowAdmin(true);
          }}
          apiBase={API_BASE}
          isDemo={backendOffline}
        />
      )}
    </div>
  );
}
