import express from 'express';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'tienda-calzado-secreto-super-seguro-12345';

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

// Database Helper Functions
const DB_FILE = path.join(__dirname, 'db.json');

async function readDB() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database file, returning empty state:", error);
    return { settings: {}, admin: { username: "admin", password: "123456" }, products: [], videos: [] };
  }
}

async function writeDB(data) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Multer Storage Configuration for media uploads
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
    // Accept only images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed!'), false);
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

// Root Healthcheck Endpoints
app.get(['/', '/api'], (req, res) => {
  res.json({
    status: 'online',
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
  const db = await readDB();

  if (db.admin.username === username && db.admin.password === password) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, storeName: db.settings.storeName });
  }

  res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
});

// Verify Admin Token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, username: req.user.username });
});

// Settings API
app.get('/api/settings', async (req, res) => {
  const db = await readDB();
  res.json(db.settings);
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  const db = await readDB();
  db.settings = { ...db.settings, ...req.body };
  await writeDB(db);
  res.json(db.settings);
});

// Products API
app.get('/api/products', async (req, res) => {
  const db = await readDB();
  res.json(db.products);
});

// Create new product (supports multiple image uploads & URLs)
app.post('/api/products', authenticateToken, upload.array('images', 15), async (req, res) => {
  try {
    const db = await readDB();
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

    db.products.push(newProduct);
    await writeDB(db);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product (supports adding and removing multiple images)
app.put('/api/products/:id', authenticateToken, upload.array('images', 15), async (req, res) => {
  try {
    const db = await readDB();
    const productIndex = db.products.findIndex(p => p.id === req.params.id);

    if (productIndex === -1) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const existingProduct = db.products[productIndex];
    const { name, description, price, originalPrice, tag, category, sizes, colors, stock } = req.body;

    let imageUrls = [];

    // Retain existing images if provided
    if (req.body.existingImages) {
      try {
        const parsed = JSON.parse(req.body.existingImages);
        if (Array.isArray(parsed)) imageUrls.push(...parsed);
      } catch (e) {}
    } else if (!req.files || req.files.length === 0) {
      imageUrls = [...existingProduct.images];
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

    const updatedProduct = {
      ...existingProduct,
      name: name || existingProduct.name,
      description: description || existingProduct.description,
      price: price ? parseFloat(price) : existingProduct.price,
      originalPrice: originalPrice !== undefined ? (originalPrice ? parseFloat(originalPrice) : null) : existingProduct.originalPrice,
      tag: tag !== undefined ? (tag || null) : existingProduct.tag,
      category: category || existingProduct.category,
      images: imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500'],
      sizes: typeof sizes === 'string' ? JSON.parse(sizes) : (sizes || existingProduct.sizes),
      colors: typeof colors === 'string' ? JSON.parse(colors) : (colors || existingProduct.colors),
      stock: stock !== undefined ? parseInt(stock) : existingProduct.stock
    };

    db.products[productIndex] = updatedProduct;
    await writeDB(db);
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  const db = await readDB();
  const productExists = db.products.some(p => p.id === req.params.id);

  if (!productExists) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  // Remove product
  db.products = db.products.filter(p => p.id !== req.params.id);
  // Remove videos associated with product (optional, but clean)
  db.videos = db.videos.filter(v => v.productId !== req.params.id);

  await writeDB(db);
  res.json({ message: 'Producto eliminado correctamente' });
});

// Videos API
app.get('/api/videos', async (req, res) => {
  const db = await readDB();
  res.json(db.videos);
});

// Upload new video and link to product
app.post('/api/videos', authenticateToken, upload.single('video'), async (req, res) => {
  try {
    const db = await readDB();
    const { productId, caption } = req.body;

    let videoUrl = '';
    if (req.file) {
      videoUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.videoUrlInput) {
      videoUrl = req.body.videoUrlInput;
    } else {
      return res.status(400).json({ error: 'Es obligatorio subir un archivo de video' });
    }

    const newVideo = {
      id: 'vid-' + Date.now(),
      videoUrl,
      productId: productId || null,
      caption: caption || '',
      likes: 0
    };

    db.videos.push(newVideo);
    await writeDB(db);
    res.status(201).json(newVideo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete video
app.delete('/api/videos/:id', authenticateToken, async (req, res) => {
  const db = await readDB();
  const videoExists = db.videos.some(v => v.id === req.params.id);

  if (!videoExists) {
    return res.status(404).json({ error: 'Video no encontrado' });
  }

  // Optional: Delete physical file if it starts with /uploads/
  const video = db.videos.find(v => v.id === req.params.id);
  if (video.videoUrl.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, video.videoUrl);
    try {
      if (existsSync(filePath)) {
        await fs.unlink(filePath);
      }
    } catch (err) {
      console.error("Could not delete video file:", err);
    }
  }

  db.videos = db.videos.filter(v => v.id !== req.params.id);
  await writeDB(db);
  res.json({ message: 'Video eliminado correctamente' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
