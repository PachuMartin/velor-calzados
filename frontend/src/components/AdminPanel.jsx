import React, { useState } from 'react';
import { Settings, ShoppingBag, Film, Plus, Trash2, Edit, Save, AlertCircle, FileText, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { formatImageUrl, FALLBACK_IMAGE } from '../utils/imageHelper';

export default function AdminPanel({ products, videos, settings, token, onUpdate, apiBase, isDemo, isDarkMode }) {
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'videos', 'settings'
  const [msg, setMsg] = useState({ text: '', type: '' }); // type: 'success' | 'error'
  const [loading, setLoading] = useState(false);

  // Forms State
  const [productForm, setProductForm] = useState({
    id: null,
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    tag: '',
    category: 'Calzado',
    sizes: '36, 37, 38, 39',
    colors: 'Negro, Blanco',
    stock: '10',
    existingImages: [],
    images: null,
    imageUrlInput: ''
  });
  
  const [showProductForm, setShowProductForm] = useState(false);

  const [videoForm, setVideoForm] = useState({
    productId: '',
    caption: '',
    videoFile: null,
    videoUrlInput: ''
  });
  const [showVideoForm, setShowVideoForm] = useState(false);

  const [settingsForm, setSettingsForm] = useState({
    storeName: settings.storeName,
    whatsapp: settings.whatsapp,
    instagram: settings.instagram,
    tiktok: settings.tiktok
  });

  const triggerMessage = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  // --- SETTINGS MANAGEMENT ---
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isDemo) {
      triggerMessage("Ajustes guardados (Simulado en modo demo)");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiBase}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settingsForm)
      });
      if (res.ok) {
        triggerMessage("Configuración de la tienda guardada correctamente");
        onUpdate();
      } else {
        if (res.status === 401 || res.status === 403) {
          triggerMessage("Sesión expirada. Por favor, cierra sesión e ingresa nuevamente.", "error");
        } else {
          triggerMessage("Error al guardar la configuración", "error");
        }
      }
    } catch (err) {
      triggerMessage("Error al conectar con el servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- PRODUCT CRUD ---
  const handleEditProduct = (prod) => {
    setProductForm({
      id: prod.id,
      name: prod.name,
      description: prod.description,
      price: prod.price.toString(),
      originalPrice: prod.originalPrice ? prod.originalPrice.toString() : '',
      tag: prod.tag || '',
      category: prod.category,
      sizes: prod.sizes.join(', '),
      colors: prod.colors.join(', '),
      stock: prod.stock.toString(),
      existingImages: prod.images || [],
      images: null,
      imageUrlInput: ''
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este producto? Esto también eliminará los videos asociados.')) return;

    if (isDemo) {
      triggerMessage("Producto eliminado (Simulado en modo demo)");
      onUpdate();
      return;
    }

    try {
      const res = await fetch(`${apiBase}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        triggerMessage("Producto eliminado correctamente");
        onUpdate();
      } else {
        triggerMessage("Error al eliminar el producto", "error");
      }
    } catch (err) {
      triggerMessage("Error al conectar con el servidor", "error");
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const sizesArr = productForm.sizes.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const colorsArr = productForm.colors.split(',').map(c => c.trim()).filter(c => c.length > 0);

    if (isDemo) {
      triggerMessage(`Producto ${productForm.id ? 'editado' : 'creado'} con éxito (Simulado en modo demo)`);
      setShowProductForm(false);
      setLoading(false);
      onUpdate();
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('description', productForm.description);
      formData.append('price', productForm.price);
      formData.append('originalPrice', productForm.originalPrice || '');
      formData.append('tag', productForm.tag || '');
      formData.append('category', productForm.category);
      formData.append('sizes', JSON.stringify(sizesArr));
      formData.append('colors', JSON.stringify(colorsArr));
      formData.append('stock', productForm.stock);
      formData.append('existingImages', JSON.stringify(productForm.existingImages || []));

      if (productForm.images && productForm.images.length > 0) {
        for (let i = 0; i < productForm.images.length; i++) {
          formData.append('images', productForm.images[i]);
        }
      }

      if (productForm.imageUrlInput) {
        const urlArray = productForm.imageUrlInput
          .split(/[\n,]+/)
          .map(u => u.trim())
          .filter(u => u.length > 0);
        if (urlArray.length > 0) {
          formData.append('imageUrlList', JSON.stringify(urlArray));
        }
      }

      const url = productForm.id 
        ? `${apiBase}/products/${productForm.id}`
        : `${apiBase}/products`;
      
      const method = productForm.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        triggerMessage(productForm.id ? "Producto actualizado correctamente" : "Producto creado correctamente");
        setShowProductForm(false);
        setProductForm({
          id: null, name: '', description: '', price: '', originalPrice: '', tag: '', category: 'Calzado',
          sizes: '36, 37, 38, 39', colors: 'Negro, Blanco', stock: '10', existingImages: [], images: null, imageUrlInput: ''
        });
        onUpdate();
      } else {
        if (res.status === 401 || res.status === 403) {
          triggerMessage("Sesión de administrador no válida o expirada. Por favor, cierra sesión e ingresa con la contraseña para renovar el token.", "error");
        } else {
          const errorData = await res.json().catch(() => ({}));
          triggerMessage(errorData.error || `Error (${res.status}) al guardar el producto`, "error");
        }
      }
    } catch (err) {
      triggerMessage("Error de servidor al guardar el producto", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- VIDEO MANAGEMENT ---
  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isDemo) {
      triggerMessage("Video subido y vinculado (Simulado en modo demo)");
      setShowVideoForm(false);
      setLoading(false);
      onUpdate();
      return;
    }

    try {
      const formData = new FormData();
      formData.append('productId', videoForm.productId);
      formData.append('caption', videoForm.caption);

      if (videoForm.videoFile) {
        formData.append('video', videoForm.videoFile);
      } else if (videoForm.videoUrlInput) {
        formData.append('videoUrlInput', videoForm.videoUrlInput);
      } else {
        triggerMessage("Debes subir un archivo de video o ingresar una URL", "error");
        setLoading(false);
        return;
      }

      const res = await fetch(`${apiBase}/videos`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        triggerMessage("Video subido correctamente al Feed");
        setShowVideoForm(false);
        setVideoForm({ productId: '', caption: '', videoFile: null, videoUrlInput: '' });
        onUpdate();
      } else {
        const errData = await res.json();
        triggerMessage(errData.error || "Error al subir el video", "error");
      }
    } catch (err) {
      triggerMessage("Error al conectar con el servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este video del feed?')) return;

    if (isDemo) {
      triggerMessage("Video eliminado del feed (Simulado en modo demo)");
      onUpdate();
      return;
    }

    try {
      const res = await fetch(`${apiBase}/videos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        triggerMessage("Video eliminado del feed");
        onUpdate();
      } else {
        triggerMessage("Error al eliminar el video", "error");
      }
    } catch (err) {
      triggerMessage("Error al conectar con el servidor", "error");
    }
  };

  return (
    <div className={`min-h-[calc(100vh-60px)] flex flex-col md:flex-row pb-12 transition-colors duration-300 ${
      isDarkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'
    }`}>
      {/* Sidebar Tabs */}
      <div className={`w-full md:w-64 border-r p-4 flex flex-col gap-2 md:sticky md:top-[60px] md:h-[calc(100vh-60px)] transition-colors duration-300 ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
      }`}>
        <div className="mb-6 hidden md:block text-left">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-pink-500">Panel de Control</h2>
          <p className={`text-[10px] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Administrador de la tienda</p>
        </div>
        
        <button
          onClick={() => { setActiveTab('products'); setShowProductForm(false); }}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
            activeTab === 'products' ? 'bg-pink-500 text-white' : isDarkMode ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-650 hover:bg-zinc-200 hover:text-zinc-950'
          }`}
        >
          <ShoppingBag size={15} />
          Gestionar Productos
        </button>

        <button
          onClick={() => { setActiveTab('videos'); setShowVideoForm(false); }}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
            activeTab === 'videos' ? 'bg-pink-500 text-white' : isDarkMode ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-650 hover:bg-zinc-200 hover:text-zinc-950'
          }`}
        >
          <Film size={15} />
          Feed de Videos (Reels)
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
            activeTab === 'settings' ? 'bg-pink-500 text-white' : isDarkMode ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-650 hover:bg-zinc-200 hover:text-zinc-950'
          }`}
        >
          <Settings size={15} />
          Ajustes de Tienda
        </button>

        {isDemo && (
          <div className="mt-auto bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-3 text-[10px] text-yellow-500 leading-normal text-left">
            💡 <b>Modo Demostración</b>: El backend está desconectado. Las acciones de agregar, editar o eliminar se simularán de forma local en memoria.
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-8 max-w-5xl overflow-y-auto">
        {/* Banner notification alerts */}
        {msg.text && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-2 text-xs border ${
            msg.type === 'error' 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            {msg.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
            <p className="font-semibold">{msg.text}</p>
          </div>
        )}

        {/* TAB 1: PRODUCT LIST & FORM */}
        {activeTab === 'products' && (
          <div>
            {!showProductForm ? (
              <div className="text-left">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-lg font-extrabold">Productos en Stock</h1>
                    <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Agrega y edita los calzados y prendas de tu tienda.</p>
                  </div>
                  <button
                    onClick={() => {
                      setProductForm({
                        id: null, name: '', description: '', price: '', category: 'Calzado',
                        sizes: '36, 37, 38, 39', colors: 'Negro, Blanco', stock: '10', images: null, imageUrlInput: ''
                      });
                      setShowProductForm(true);
                    }}
                    className="flex items-center gap-1.5 bg-pink-500 hover:bg-pink-600 transition-all text-white font-bold px-4 py-2.5 rounded-2xl text-xs active:scale-95 shadow-md"
                  >
                    <Plus size={14} />
                    Nuevo Producto
                  </button>
                </div>

                {/* Table list */}
                <div className={`border rounded-3xl overflow-hidden ${
                  isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <div className="overflow-x-auto">
                    <table className={`w-full text-left text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      <thead className={`text-[10px] font-extrabold uppercase border-b ${
                        isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-500' : 'bg-zinc-100 border-zinc-200 text-zinc-400'
                      }`}>
                        <tr>
                          <th className="px-6 py-4">Producto</th>
                          <th className="px-6 py-4">Categoría</th>
                          <th className="px-6 py-4">Precio</th>
                          <th className="px-6 py-4">Stock</th>
                          <th className="px-6 py-4">Tallas y Colores</th>
                          <th className="px-6 py-4 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800/60' : 'divide-zinc-200'}`}>
                        {products.map(prod => {
                          const prodImg = prod.images && prod.images[0]
                            ? (prod.images[0].startsWith('http') ? prod.images[0] : `${apiBase.replace('/api', '')}${prod.images[0]}`)
                            : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100';
                          return (
                            <tr key={prod.id} className={`transition-colors ${isDarkMode ? 'hover:bg-zinc-900/40' : 'hover:bg-zinc-100/60'}`}>
                              <td className="px-6 py-4 flex items-center gap-3">
                                <img src={prodImg} alt="" className={`w-10 h-10 object-cover rounded-lg border ${
                                  isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
                                }`} />
                                <div>
                                  <span className={`font-extrabold ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>{prod.name}</span>
                                  <span className={`block text-[10px] font-mono mt-0.5 ${isDarkMode ? 'text-zinc-650' : 'text-zinc-400'}`}>{prod.id}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-bold">{prod.category}</td>
                              <td className={`px-6 py-4 font-extrabold ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>${prod.price.toFixed(2)}</td>
                              <td className={`px-6 py-4 font-bold ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>{prod.stock} u.</td>
                              <td className="px-6 py-4 text-[10px] max-w-[200px]">
                                <div className="line-clamp-1"><b>T:</b> {prod.sizes.join(', ')}</div>
                                <div className="line-clamp-1 mt-0.5"><b>C:</b> {prod.colors.join(', ')}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleEditProduct(prod)}
                                    className={`p-2 rounded-lg transition-all ${
                                      isDarkMode ? 'bg-zinc-850 hover:bg-pink-500 hover:text-white' : 'bg-zinc-200 hover:bg-pink-500 hover:text-white text-zinc-700'
                                    }`}
                                    title="Editar"
                                  >
                                    <Edit size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(prod.id)}
                                    className={`p-2 rounded-lg transition-all ${
                                      isDarkMode ? 'bg-zinc-850 hover:bg-rose-500 hover:text-white' : 'bg-zinc-200 hover:bg-rose-500 hover:text-white text-zinc-700'
                                    }`}
                                    title="Eliminar"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {products.length === 0 && (
                          <tr>
                            <td colSpan="6" className="text-center py-10 text-zinc-550">No hay productos en inventario.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* PRODUCT FORM */
              <div className={`text-left max-w-2xl border p-6 rounded-3xl ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200 shadow-sm'
              }`}>
                <h2 className="text-base font-extrabold mb-4">{productForm.id ? 'Editar Producto' : 'Crear Nuevo Producto'}</h2>
                <form onSubmit={handleProductSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[10px] uppercase font-bold mb-1 pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Nombre del Producto</label>
                      <input
                        type="text" required value={productForm.name}
                        onChange={e => setProductForm({...productForm, name: e.target.value})}
                        className={`w-full border rounded-xl p-3 focus:outline-none focus:border-pink-500 ${
                          isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                        }`}
                        placeholder="ej: Zapatilla Neon Air"
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] uppercase font-bold mb-1 pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Categoría</label>
                      <select
                        value={productForm.category}
                        onChange={e => setProductForm({...productForm, category: e.target.value})}
                        className={`w-full border rounded-xl p-3 focus:outline-none focus:border-pink-500 ${
                          isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                        }`}
                      >
                        <option value="Calzado">Calzado</option>
                        <option value="Prendas">Prendas</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] uppercase font-bold mb-1 pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Descripción</label>
                    <textarea
                      required rows="3" value={productForm.description}
                      onChange={e => setProductForm({...productForm, description: e.target.value})}
                      className={`w-full border rounded-xl p-3 focus:outline-none focus:border-pink-500 resize-none ${
                        isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                      }`}
                      placeholder="Describa el material, detalles de confección..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[10px] uppercase font-bold mb-1 pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Precio de Venta ($)</label>
                      <input
                        type="number" step="0.01" required value={productForm.price}
                        onChange={e => setProductForm({...productForm, price: e.target.value})}
                        className={`w-full border rounded-xl p-3 focus:outline-none focus:border-pink-500 font-mono ${
                          isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                        }`}
                        placeholder="ej: 79.99"
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] uppercase font-bold mb-1 pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Precio Original / Anterior ($) (Opcional)</label>
                      <input
                        type="number" step="0.01" value={productForm.originalPrice}
                        onChange={e => setProductForm({...productForm, originalPrice: e.target.value})}
                        className={`w-full border rounded-xl p-3 focus:outline-none focus:border-pink-500 font-mono ${
                          isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                        }`}
                        placeholder="ej: 99.99 (Para mostrar oferta)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[10px] uppercase font-bold mb-1 pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Etiqueta Especial (Opcional)</label>
                      <select
                        value={productForm.tag}
                        onChange={e => setProductForm({...productForm, tag: e.target.value})}
                        className={`w-full border rounded-xl p-3 focus:outline-none focus:border-pink-500 ${
                          isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                        }`}
                      >
                        <option value="">Ninguna</option>
                        <option value="Nuevo">Nuevo</option>
                        <option value="Oferta">Oferta</option>
                        <option value="Popular">Popular</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-[10px] uppercase font-bold mb-1 pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Stock Disponible</label>
                      <input
                        type="number" required value={productForm.stock}
                        onChange={e => setProductForm({...productForm, stock: e.target.value})}
                        className={`w-full border rounded-xl p-3 focus:outline-none focus:border-pink-500 font-mono ${
                          isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                        }`}
                        placeholder="ej: 10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[10px] uppercase font-bold mb-1 pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Tallas (Separadas por comas)</label>
                      <input
                        type="text" required value={productForm.sizes}
                        onChange={e => setProductForm({...productForm, sizes: e.target.value})}
                        className={`w-full border rounded-xl p-3 focus:outline-none focus:border-pink-500 ${
                          isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                        }`}
                        placeholder="ej: 35, 36, 37, 38"
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] uppercase font-bold mb-1 pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Colores (Separados por comas)</label>
                      <input
                        type="text" required value={productForm.colors}
                        onChange={e => setProductForm({...productForm, colors: e.target.value})}
                        className={`w-full border rounded-xl p-3 focus:outline-none focus:border-pink-500 ${
                          isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                        }`}
                        placeholder="ej: Negro, Blanco, Azul"
                      />
                    </div>
                  </div>

                  <div className={`border-t pt-4 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className={`block text-[10px] uppercase font-bold pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        Fotografías del Producto (Múltiples fotos permitidas)
                      </label>
                      <span className="text-[10px] text-pink-500 font-bold bg-pink-500/10 px-2 py-0.5 rounded-full">
                        {(productForm.existingImages?.length || 0) + (productForm.images?.length || 0)} fotos en total
                      </span>
                    </div>

                    {/* Existing photos preview grid with delete button */}
                    {productForm.existingImages && productForm.existingImages.length > 0 && (
                      <div className="mb-4">
                        <span className={`text-[10px] block mb-1.5 font-semibold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                          Fotos actuales del producto (haz clic en 🗑️ para eliminar una foto):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {productForm.existingImages.map((imgUrl, idx) => {
                            const fullUrl = formatImageUrl(imgUrl, apiBase);
                            return (
                              <div key={idx} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-zinc-700 bg-black shadow-sm">
                                <img 
                                  src={fullUrl} 
                                  alt="" 
                                  onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                                  className="w-full h-full object-cover" 
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProductForm({
                                      ...productForm,
                                      existingImages: productForm.existingImages.filter((_, i) => i !== idx)
                                    });
                                  }}
                                  className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 hover:text-rose-200 transition-opacity"
                                  title="Quitar esta foto"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Subir archivos locales (PC / Celular) */}
                    <div>
                      <span className={`text-[10px] block mb-1 font-semibold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                        📁 Subir archivos desde tu dispositivo (puedes seleccionar varias fotos a la vez):
                      </span>
                      <input
                        type="file" multiple accept="image/*"
                        onChange={e => setProductForm({...productForm, images: e.target.files})}
                        className={`w-full border rounded-xl p-3 focus:outline-none ${
                          isDarkMode 
                            ? 'bg-zinc-950 border-zinc-800 text-zinc-400 file:bg-zinc-850 file:text-zinc-200' 
                            : 'bg-white border-zinc-300 text-zinc-500 file:bg-zinc-100 file:text-zinc-700'
                        }`}
                      />
                      {productForm.images && productForm.images.length > 0 && (
                        <p className="text-[10px] text-emerald-400 mt-1.5 font-bold pl-1 flex items-center gap-1">
                          ✓ {productForm.images.length} archivo(s) nuevo(s) seleccionado(s) listos para subir.
                        </p>
                      )}
                    </div>

                    {/* Ingresar múltiples URLs con Vista Previa en Vivo */}
                    <div className="mt-4">
                      <span className={`text-[10px] block mb-1 font-semibold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                        🌐 O pega enlaces web directos de fotos (puedes ingresar varias URLs, una por línea):
                      </span>
                      <textarea
                        rows="3"
                        value={productForm.imageUrlInput}
                        onChange={e => setProductForm({...productForm, imageUrlInput: e.target.value})}
                        className={`w-full border rounded-xl p-3 focus:outline-none focus:border-pink-500 font-mono text-xs resize-none ${
                          isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                        }`}
                        placeholder={"https://i.ibb.co/abc/foto1.jpg\nhttps://images.unsplash.com/photo-...\nhttps://res.cloudinary.com/..."}
                      />

                      {/* Live preview of entered links */}
                      {productForm.imageUrlInput && productForm.imageUrlInput.trim().length > 0 && (
                        <div className="mt-2.5 p-3 rounded-xl bg-black/40 border border-zinc-800">
                          <span className="text-[10px] font-bold text-zinc-400 block mb-1.5">
                            Vista previa de los enlaces ingresados:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {productForm.imageUrlInput
                              .split(/[\n,]+/)
                              .map(u => u.trim())
                              .filter(u => u.length > 0)
                              .map((u, i) => (
                                <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 flex items-center justify-center">
                                  <img 
                                    src={formatImageUrl(u, apiBase)} 
                                    alt="Preview" 
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                                    }}
                                    className="w-full h-full object-cover" 
                                  />
                                  <div className="hidden absolute inset-0 bg-rose-950/80 text-[8px] text-rose-300 font-bold p-1 text-center items-center justify-center">
                                    Link Inválido
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800/80">
                    <button
                      type="button" onClick={() => setShowProductForm(false)}
                      className={`px-5 py-2.5 font-bold rounded-xl active:scale-95 transition-all ${
                        isDarkMode ? 'bg-zinc-800 hover:bg-zinc-850 text-zinc-300' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700'
                      }`}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit" disabled={loading}
                      className="flex items-center gap-1 bg-pink-500 hover:bg-pink-600 text-white font-bold px-6 py-2.5 rounded-xl active:scale-95 transition-all"
                    >
                      {loading ? 'Guardando...' : 'Guardar Producto'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VIDEOS LIST & UPLOAD */}
        {activeTab === 'videos' && (
          <div>
            {!showVideoForm ? (
              <div className="text-left">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-lg font-extrabold">Videos del Feed (TikTok Style)</h1>
                    <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Administra los reels e historias que se muestran en el feed.</p>
                  </div>
                  <button
                    onClick={() => {
                      setVideoForm({ productId: '', caption: '', videoFile: null, videoUrlInput: '' });
                      setShowVideoForm(true);
                    }}
                    className="flex items-center gap-1.5 bg-pink-500 hover:bg-pink-600 text-white font-bold px-4 py-2.5 rounded-2xl text-xs active:scale-95 shadow-md"
                  >
                    <Plus size={14} />
                    Subir Video
                  </button>
                </div>

                {/* Videos lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos.map(vid => {
                    const linkedProduct = products.find(p => p.id === vid.productId);
                    const vidSrc = vid.videoUrl.startsWith('http') ? vid.videoUrl : `${apiBase.replace('/api', '')}${vid.videoUrl}`;
                    return (
                      <div key={vid.id} className={`border rounded-3xl overflow-hidden p-4 flex flex-col justify-between gap-3 group relative ${
                        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                      }`}>
                        {/* Video thumbnail / player preview */}
                        <div className="aspect-[9/16] max-h-[300px] w-full overflow-hidden bg-black rounded-2xl relative">
                          <video src={vidSrc} className="w-full h-full object-cover" muted controls={false} playsInline />
                          {/* Trash button absolute */}
                          <button
                            onClick={() => handleDeleteVideo(vid.id)}
                            className="absolute top-2 right-2 p-2.5 rounded-full bg-black/60 hover:bg-rose-600 hover:text-white text-gray-300 transition-all shadow-md active:scale-95"
                            title="Eliminar Video"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Caption and Product link info */}
                        <div className="text-left flex-1 flex flex-col justify-between">
                          <p className={`text-xs font-normal line-clamp-2 mt-2 ${isDarkMode ? 'text-gray-200' : 'text-zinc-700'}`}>"{vid.caption}"</p>
                          <div className={`mt-3 pt-2 border-t ${isDarkMode ? 'border-zinc-800/80' : 'border-zinc-200'}`}>
                            <span className="text-[10px] text-zinc-400 uppercase font-bold">Vinculado a:</span>
                            {linkedProduct ? (
                              <div className={`flex items-center gap-1.5 mt-1 font-bold text-xs ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                {linkedProduct.name}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 mt-1 font-bold text-zinc-400 text-xs">
                                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                                General / Sin producto
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {videos.length === 0 && (
                    <div className="col-span-full py-16 text-center text-zinc-550 text-xs">No hay videos en el feed. Sube uno nuevo.</div>
                  )}
                </div>
              </div>
            ) : (
              /* UPLOAD VIDEO FORM */
              <div className={`text-left max-w-xl border p-6 rounded-3xl ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200 shadow-sm'
              }`}>
                <h2 className="text-base font-extrabold mb-4">Subir Nuevo Video de Feed</h2>
                <form onSubmit={handleVideoSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className={`block text-[10px] uppercase font-bold mb-1 pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Vincular con Producto</label>
                    <select
                      value={videoForm.productId}
                      onChange={e => setVideoForm({...videoForm, productId: e.target.value})}
                      className={`w-full border rounded-xl p-3 focus:outline-none focus:border-pink-500 ${
                        isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                      }`}
                    >
                      <option value="">Selecciona un producto para comprar desde el video...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (${p.price.toFixed(2)})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-[10px] uppercase font-bold mb-1 pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Descripción / Caption</label>
                    <textarea
                      required rows="2" value={videoForm.caption}
                      onChange={e => setVideoForm({...videoForm, caption: e.target.value})}
                      className={`w-full border rounded-xl p-3 focus:outline-none focus:border-pink-500 resize-none ${
                        isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                      }`}
                      placeholder="Escribe un hashtag o texto llamativo..."
                    />
                  </div>

                  <div className="border-t border-zinc-800/80 pt-4">
                    <label className={`block text-[10px] uppercase font-bold mb-1.5 pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Enlace de TikTok o Instagram Reel (Recomendado)</label>
                    <input
                      type="url" value={videoForm.videoUrlInput}
                      onChange={e => setVideoForm({...videoForm, videoUrlInput: e.target.value})}
                      className={`w-full border rounded-xl p-3 focus:outline-none focus:border-pink-500 font-mono ${
                        isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                      }`}
                      placeholder="ej: https://www.tiktok.com/@usuario/video/123456"
                    />

                    <p className="text-[10px] text-zinc-500 my-3 text-center font-semibold">O sube un archivo de video local si prefieres:</p>
                    
                    <input
                      type="file" accept="video/*"
                      onChange={e => setVideoForm({...videoForm, videoFile: e.target.files[0]})}
                      className={`w-full border rounded-xl p-3 focus:outline-none ${
                        isDarkMode 
                          ? 'bg-zinc-950 border-zinc-800 text-zinc-400 file:bg-zinc-850 file:text-zinc-200' 
                          : 'bg-white border-zinc-300 text-zinc-500 file:bg-zinc-100 file:text-zinc-700'
                      }`}
                    />
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800/80">
                    <button
                      type="button" onClick={() => setShowVideoForm(false)}
                      className={`px-5 py-2.5 font-bold rounded-xl active:scale-95 transition-all ${
                        isDarkMode ? 'bg-zinc-800 hover:bg-zinc-850 text-zinc-300' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700'
                      }`}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit" disabled={loading}
                      className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-6 py-2.5 rounded-xl active:scale-95 transition-all"
                    >
                      {loading ? 'Subiendo...' : 'Publicar Reel'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STORE SETTINGS */}
        {activeTab === 'settings' && (
          <div className={`text-left max-w-xl border p-6 rounded-3xl ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200 shadow-sm'
          }`}>
            <div className="mb-4">
              <h1 className="text-base font-extrabold">Configuración General</h1>
              <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Modifica los enlaces sociales, datos de contacto y título comercial.</p>
            </div>
            
            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className={`block text-[10px] uppercase font-bold mb-1 pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Nombre Comercial de la Tienda</label>
                <input
                  type="text" required value={settingsForm.storeName}
                  onChange={e => setSettingsForm({...settingsForm, storeName: e.target.value})}
                  className={`w-full border rounded-xl p-3 focus:outline-none focus:border-pink-500 ${
                    isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[10px] uppercase font-bold mb-1 pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Teléfono WhatsApp de Pedidos</label>
                <input
                  type="text" required value={settingsForm.whatsapp}
                  onChange={e => setSettingsForm({...settingsForm, whatsapp: e.target.value})}
                  className={`w-full border rounded-xl p-3 focus:outline-none focus:border-pink-500 font-mono ${
                    isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                  }`}
                  placeholder="+5491123456789 (con código de país)"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">Debe incluir el código de país (ej. +549... para Argentina) sin espacios.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[10px] uppercase font-bold mb-1 pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Enlace de Instagram</label>
                  <input
                    type="url" value={settingsForm.instagram}
                    onChange={e => setSettingsForm({...settingsForm, instagram: e.target.value})}
                    className={`w-full border rounded-xl p-3 focus:outline-none focus:border-pink-500 font-mono ${
                      isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] uppercase font-bold mb-1 pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Enlace de TikTok</label>
                  <input
                    type="url" value={settingsForm.tiktok}
                    onChange={e => setSettingsForm({...settingsForm, tiktok: e.target.value})}
                    className={`w-full border rounded-xl p-3 focus:outline-none focus:border-pink-500 font-mono ${
                      isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-800/80">
                <button
                  type="submit" disabled={loading}
                  className="flex items-center gap-1.5 bg-pink-500 hover:bg-pink-600 text-white font-bold px-6 py-2.5 rounded-xl active:scale-95 transition-all shadow-md"
                >
                  <Save size={14} />
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
