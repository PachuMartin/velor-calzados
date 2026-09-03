import express from 'express';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'tienda-calzado-secreto-super-seguro-12345';

// Middlewares
app.use(cors());
app.use(express.json());

// Create uploads folder if it doesn't exist
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!existsSync(UPLOADS_DIR)) {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Local DB File Fallback
const DB_FILE = path.join(__dirname, 'db.json');

async function readLocalDB() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      settings: { storeName: "Velor Calzados", whatsapp: "+5491123456789", instagram: "https://instagram.com/bellamoda", tiktok: "https://tiktok.com/@bellamoda" },
      admin: { username: "admin", password: "123456" },
      products: [],
      videos: []
    };
  }
}

async function writeLocalDB(data) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// --- MONGODB ATLAS SCHEMAS & MODELS ---
const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  originalPrice: Number,
  tag: String,
  category: { type: String, default: 'Calzado' },
  images: [String],
  sizes: [String],
  colors: [String],
  stock: { type: Number, default: 0 }
}, { timestamps: true });

const VideoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  videoUrl: { type: String, required: true },
  productId: String,
  caption: String,
  likes: { type: Number, default: 0 }
}, { timestamps: true });

const SettingsSchema = new mongoose.Schema({
  storeName: { type: String, default: "Velor Calzados" },
  primaryColor: { type: String, default: "#ec4899" },
  whatsapp: { type: String, default: "+5491123456789" },
  instagram: { type: String, default: "https://instagram.com/bellamoda" },
  tiktok: { type: String, default: "https://tiktok.com/@bellamoda" }
});

const AdminSchema = new mongoose.Schema({
  username: { type: String, default: "admin" },
  password: { type: String, default: "123456" }
});

const ProductModel = mongoose.model('Product', ProductSchema);
const VideoModel = mongoose.model('Video', VideoSchema);
const SettingsModel = mongoose.model('Settings', SettingsSchema);
const AdminModel = mongoose.model('Admin', AdminSchema);

let isMongoConnected = false;

// Connect to MongoDB Atlas if MONGO_URI is set
const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
  try {
    await mongoose.connect(MONGO_URI);
    isMongoConnected = true;
    console.log("🟢 Conectado exitosamente a la base de datos persistente en MongoDB Atlas");

    // Auto-seed if database is newly created and empty
    const productCount = await ProductModel.countDocuments();
    if (productCount === 0) {
      console.log("🌱 Inicializando base de datos en la nube con catálogo base...");
      const localDB = await readLocalDB();
      if (localDB.products && localDB.products.length > 0) await ProductModel.insertMany(localDB.products);
      if (localDB.videos && localDB.videos.length > 0) await VideoModel.insertMany(localDB.videos);
      if (localDB.settings) await SettingsModel.create(localDB.settings);
      if (localDB.admin) await AdminModel.create(localDB.admin);
      console.log("✅ Catálogo inicial migrado a MongoDB Atlas con éxito.");
    }
  } catch (err) {
    console.error("⚠️ Error conectando a MongoDB Atlas. Usando base de datos local (db.json):", err.message);
    isMongoConnected = false;
  }
} else {
  console.log("ℹ️ MONGO_URI no configurado. Usando base de datos local db.json");
}

// --- UNIFIED DATABASE REPOSITORY ---
const dbService = {
  async getAdmin() {
    if (isMongoConnected) {
      let admin = await AdminModel.findOne();
      if (!admin) admin = await AdminModel.create({ username: "admin", password: "123456" });
      return admin;
    }
    const local = await readLocalDB();
    return local.admin || { username: "admin", password: "123456" };
  },

  async getSettings() {
    if (isMongoConnected) {
      let settings = await SettingsModel.findOne();
      if (!settings) {
        settings = await SettingsModel.create({
          storeName: "Velor Calzados",
          primaryColor: "#ec4899",
          whatsapp: "+5491123456789",
          instagram: "https://instagram.com/bellamoda",
          tiktok: "https://tiktok.com/@bellamoda"
        });
      }
      return settings;
    }
    const local = await readLocalDB();
    return local.settings;
  },

  async updateSettings(newSettings) {
    if (isMongoConnected) {
      let settings = await SettingsModel.findOne();
      if (settings) {
        Object.assign(settings, newSettings);
        await settings.save();
      } else {
        settings = await SettingsModel.create(newSettings);
      }
      return settings;
    }
    const local = await readLocalDB();
    local.settings = { ...local.settings, ...newSettings };
    await writeLocalDB(local);
    return local.settings;
  },

  async getProducts() {
    if (isMongoConnected) {
      return await ProductModel.find().sort({ createdAt: -1 });
    }
    const local = await readLocalDB();
    return local.products || [];
  },

  async createProduct(productData) {
    if (isMongoConnected) {
      return await ProductModel.create(productData);
    }
    const local = await readLocalDB();
    local.products.push(productData);
    await writeLocalDB(local);
    return productData;
  },

  async updateProduct(id, updateData) {
    if (isMongoConnected) {
      return await ProductModel.findOneAndUpdate({ id }, updateData, { new: true });
    }
    const local = await readLocalDB();
    const index = local.products.findIndex(p => p.id === id);
    if (index === -1) return null;
    local.products[index] = { ...local.products[index], ...updateData };
    await writeLocalDB(local);
    return local.products[index];
  },

  async deleteProduct(id) {
    if (isMongoConnected) {
      await ProductModel.deleteOne({ id });
      await VideoModel.deleteMany({ productId: id });
      return true;
    }
    const local = await readLocalDB();
    local.products = local.products.filter(p => p.id !== id);
    local.videos = local.videos.filter(v => v.productId !== id);
    await writeLocalDB(local);
    return true;
  },

  async getVideos() {
    if (isMongoConnected) {
      return await VideoModel.find().sort({ createdAt: -1 });
    }
    const local = await readLocalDB();
    return local.videos || [];
  },

  async createVideo(videoData) {
    if (isMongoConnected) {
      return await VideoModel.create(videoData);
    }
    const local = await readLocalDB();
    local.videos.push(videoData);
    await writeLocalDB(local);
    return videoData;
  },

  async deleteVideo(id) {
    if (isMongoConnected) {
      await VideoModel.deleteOne({ id });
      return true;
    }
    const local = await readLocalDB();
    local.videos = local.videos.filter(v => v.id !== id);
    await writeLocalDB(local);
    return true;
  }
};

// --- MULTER STORAGE CONFIGURATION ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes y videos.'), false);
    }
  }
});

// Middleware for Admin Authorization
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// --- API ENDPOINTS ---

// Root Healthcheck & Database Status Endpoint
app.get(['/', '/api'], (req, res) => {
  res.json({
    status: 'online',
    database: isMongoConnected ? 'MongoDB Atlas (Persistent Cloud)' : 'Local File (db.json)',
    message: 'Servidor API de Velor Calzados activo y funcionando correctamente 🚀',
    endpoints: [
      '/api/products',
      '/api/settings',
      '/api/videos'
    ]
  });
});

// Admin Authentication
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await dbService.getAdmin();
  const settings = await dbService.getSettings();

  if (admin.username === username && admin.password === password) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, storeName: settings.storeName });
  }

  res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
});

// Verify Admin Token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, username: req.user.username });
});

// Settings API
app.get('/api/settings', async (req, res) => {
  const settings = await dbService.getSettings();
  res.json(settings);
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  const updatedSettings = await dbService.updateSettings(req.body);
  res.json(updatedSettings);
});

// Products API
app.get('/api/products', async (req, res) => {
  const products = await dbService.getProducts();
  res.json(products);
});

// Create new product (supports multiple image uploads & URLs)
app.post('/api/products', authenticateToken, upload.array('images', 15), async (req, res) => {
  try {
    const { name, description, price, originalPrice, tag, category, sizes, colors, stock } = req.body;

    let imageUrls = [];

    // Add multiple uploaded file paths
    if (req.files && req.files.length > 0) {
      imageUrls.push(...req.files.map(file => `/uploads/${file.filename}`));
    }

    // Add multiple URLs from list
    if (req.body.imageUrlList) {
      try {
        const parsed = JSON.parse(req.body.imageUrlList);
        if (Array.isArray(parsed)) {
          imageUrls.push(...parsed.filter(u => u && typeof u === 'string' && u.trim().length > 0));
        }
      } catch (e) {}
    }

    const newProduct = {
      id: 'prod-' + Date.now(),
      name,
      description,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      tag: tag || null,
      category: category || 'Calzado',
      images: imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500'],
      sizes: typeof sizes === 'string' ? JSON.parse(sizes) : (sizes || []),
      colors: typeof colors === 'string' ? JSON.parse(colors) : (colors || []),
      stock: parseInt(stock) || 0
    };

    const savedProduct = await dbService.createProduct(newProduct);
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product (supports adding and removing multiple images)
app.put('/api/products/:id', authenticateToken, upload.array('images', 15), async (req, res) => {
  try {
    const { name, description, price, originalPrice, tag, category, sizes, colors, stock } = req.body;

    let imageUrls = [];

    // Retain existing images if provided
    if (req.body.existingImages) {
      try {
        const parsed = JSON.parse(req.body.existingImages);
        if (Array.isArray(parsed)) imageUrls.push(...parsed);
      } catch (e) {}
    }

    // Append newly uploaded files
    if (req.files && req.files.length > 0) {
      imageUrls.push(...req.files.map(file => `/uploads/${file.filename}`));
    }

    // Append newly provided image URLs
    if (req.body.imageUrlList) {
      try {
        const parsed = JSON.parse(req.body.imageUrlList);
        if (Array.isArray(parsed)) {
          imageUrls.push(...parsed.filter(u => u && typeof u === 'string' && u.trim().length > 0));
        }
      } catch (e) {}
    }

    const updatePayload = {
      name,
      description,
      price: price ? parseFloat(price) : undefined,
      originalPrice: originalPrice !== undefined ? (originalPrice ? parseFloat(originalPrice) : null) : undefined,
      tag: tag !== undefined ? (tag || null) : undefined,
      category: category || 'Calzado',
      images: imageUrls.length > 0 ? imageUrls : undefined,
      sizes: typeof sizes === 'string' ? JSON.parse(sizes) : sizes,
      colors: typeof colors === 'string' ? JSON.parse(colors) : colors,
      stock: stock !== undefined ? parseInt(stock) : undefined
    };

    // Remove undefined keys
    Object.keys(updatePayload).forEach(key => updatePayload[key] === undefined && delete updatePayload[key]);

    const updated = await dbService.updateProduct(req.params.id, updatePayload);
    if (!updated) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  await dbService.deleteProduct(req.params.id);
  res.json({ message: 'Producto eliminado correctamente' });
});

// Videos API
app.get('/api/videos', async (req, res) => {
  const videos = await dbService.getVideos();
  res.json(videos);
});

// Upload new video and link to product
app.post('/api/videos', authenticateToken, upload.single('video'), async (req, res) => {
  try {
    const { productId, caption } = req.body;

    let videoUrl = '';
    if (req.file) {
      videoUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.videoUrlInput) {
      videoUrl = req.body.videoUrlInput;
    } else {
      return res.status(400).json({ error: 'Es obligatorio subir un archivo o URL de video' });
    }

    const newVideo = {
      id: 'vid-' + Date.now(),
      videoUrl,
      productId: productId || null,
      caption: caption || '',
      likes: 0
    };

    const savedVideo = await dbService.createVideo(newVideo);
    res.status(201).json(savedVideo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete video
app.delete('/api/videos/:id', authenticateToken, async (req, res) => {
  await dbService.deleteVideo(req.params.id);
  res.json({ message: 'Video eliminado correctamente' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
