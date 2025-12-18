const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Dosya yükleme konfigürasyonu
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Veritabanı dosya yolu
const DB_FILE = 'database.json';
const UPLOADS_DIR = 'uploads';

// Veritabanını başlat
function initializeDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      files: [],
      users: [{ username: '123', password: '123' }],
      settings: { initialized: true }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  }
}

// API Routes

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Dosya listesi
app.get('/api/files', (req, res) => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      initializeDatabase();
    }
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    res.json(data.files);
  } catch (error) {
    console.error('Dosya listesi okuma hatası:', error);
    res.status(500).json({ error: 'Dosya listesi alınamadı' });
  }
});

// Yeni dosya ekle
app.post('/api/files', (req, res) => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      initializeDatabase();
    }
    
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    const newFile = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
      ...req.body,
      registrationDate: new Date().toISOString(),
      documents: req.body.documents || []
    };
    
    data.files.push(newFile);
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    
    res.json({ success: true, file: newFile });
  } catch (error) {
    console.error('Dosya ekleme hatası:', error);
    res.status(500).json({ error: 'Dosya eklenemedi' });
  }
});

// Dosya güncelle
app.put('/api/files/:id', (req, res) => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      initializeDatabase();
    }
    
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    const fileIndex = data.files.findIndex(f => f.id === req.params.id);
    
    if (fileIndex === -1) {
      return res.status(404).json({ error: 'Dosya bulunamadı' });
    }
    
    data.files[fileIndex] = { ...data.files[fileIndex], ...req.body };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    
    res.json({ success: true, file: data.files[fileIndex] });
  } catch (error) {
    console.error('Dosya güncelleme hatası:', error);
    res.status(500).json({ error: 'Dosya güncellenemedi' });
  }
});

// Dosya sil
app.delete('/api/files/:id', (req, res) => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      initializeDatabase();
    }
    
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    const fileIndex = data.files.findIndex(f => f.id === req.params.id);
    
    if (fileIndex === -1) {
      return res.status(404).json({ error: 'Dosya bulunamadı' });
    }
    
    // Dosyaya ait belgeleri sil
    const file = data.files[fileIndex];
    if (file.documents && file.documents.length > 0) {
      file.documents.forEach(doc => {
        const filePath = path.join(UPLOADS_DIR, doc.path || doc.name);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    data.files.splice(fileIndex, 1);
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Dosya silme hatası:', error);
    res.status(500).json({ error: 'Dosya silinemedi' });
  }
});

// Belge yükle
app.post('/api/upload', upload.single('document'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Dosya yüklenemedi' });
    }
    
    const documentInfo = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
      name: req.file.originalname,
      type: req.body.type || 'Belge',
      path: req.file.filename,
      uploadedDate: new Date().toISOString(),
      size: req.file.size
    };
    
    res.json({ success: true, document: documentInfo });
  } catch (error) {
    console.error('Belge yükleme hatası:', error);
    res.status(500).json({ error: 'Belge yüklenemedi' });
  }
});

// Belge indir
app.get('/api/download/:filename', (req, res) => {
  try {
    const filePath = path.join(UPLOADS_DIR, req.params.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Dosya bulunamadı' });
    }
    
    res.download(filePath);
  } catch (error) {
    console.error('Belge indirme hatası:', error);
    res.status(500).json({ error: 'Belge indirilemedi' });
  }
});

// Belge görüntüle
app.get('/api/view/:filename', (req, res) => {
  try {
    const filePath = path.join(UPLOADS_DIR, req.params.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Dosya bulunamadı' });
    }
    
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Belge görüntüleme hatası:', error);
    res.status(500).json({ error: 'Belge görüntülenemedi' });
  }
});

// Kullanıcı girişi
app.post('/api/login', (req, res) => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      initializeDatabase();
    }
    
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    const { username, password } = req.body;
    
    const user = data.users.find(u => u.username === username && u.password === password);
    
    if (user) {
      res.json({ success: true, user: { username: user.username } });
    } else {
      res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ error: 'Giriş yapılamadı' });
  }
});

// İstatistikler
app.get('/api/stats', (req, res) => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      initializeDatabase();
    }
    
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    const files = data.files;
    
    // Dosya türü istatistikleri
    const fileTypes = ['Değer Kaybı', 'İkame Araç Bedeli', 'İcra Takibi', 'Pert Farkı', 'Diğer'];
    const typeStats = {};
    fileTypes.forEach(type => typeStats[type] = 0);
    
    files.forEach(file => {
      if (file.fileTypes && file.fileTypes.length > 0) {
        file.fileTypes.forEach(type => {
          if (typeStats.hasOwnProperty(type)) typeStats[type]++;
        });
      } else if (file.fileType && typeStats.hasOwnProperty(file.fileType)) {
        typeStats[file.fileType]++;
      }
    });
    
    // Dosya durumu istatistikleri
    const fileStatuses = ['Başvuruya Hazır', 'Başvuru Yapıldı', 'Evrak Tedarik Aşamasında', 'Tahkimde', 'İcrada', 'Kapandı'];
    const statusStats = {};
    fileStatuses.forEach(status => statusStats[status] = 0);
    
    files.forEach(file => {
      if (file.fileStatus && statusStats.hasOwnProperty(file.fileStatus)) {
        statusStats[file.fileStatus]++;
      }
    });
    
    // Başvuruya hazır dosya sayısı
    const readyFilesCount = files.filter(f => f.fileStatus === 'Başvuruya Hazır').length;
    
    // Evrak tedarik dosya sayısı
    const pendingFilesCount = files.filter(f => f.fileStatus === 'Evrak Tedarik Aşamasında').length;
    
    res.json({
      typeStats,
      statusStats,
      readyFilesCount,
      pendingFilesCount,
      totalFiles: files.length
    });
  } catch (error) {
    console.error('İstatistik hatası:', error);
    res.status(500).json({ error: 'İstatistikler alınamadı' });
  }
});

// Tüm route'lar için fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`✅ Server çalışıyor: http://localhost:${PORT}`);
  console.log(`📁 Uploads klasörü: ${path.join(__dirname, UPLOADS_DIR)}`);
  console.log(`🗄️  Veritabanı dosyası: ${path.join(__dirname, DB_FILE)}`);
  
  // Veritabanını başlat
  initializeDatabase();
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
  }
});