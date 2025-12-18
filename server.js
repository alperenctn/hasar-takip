// hasar-takip/server.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// =================== KONFİGÜRASYON ===================
const UPLOADS_DIR = 'uploads';
const DB_FILE = 'database.json';

// =================== MIDDLEWARE ===================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // public klasöründeki dosyaları servis et
app.use('/uploads', express.static(UPLOADS_DIR)); // uploads klasörünü erişime aç

// =================== KLASÖRLERİ OLUŞTUR ===================
// Uploads klasörünü oluştur
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log(`✅ ${UPLOADS_DIR} klasörü oluşturuldu`);
}

// Database dosyasını oluştur
if (!fs.existsSync(DB_FILE)) {
    const initialData = {
        files: [],
        users: [
            { id: 1, username: '123', password: '123' }
        ],
        statistics: {
            totalFiles: 0,
            fileTypes: {},
            fileStatuses: {},
            readyFilesCount: 0,
            pendingFilesCount: 0
        }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    console.log(`✅ ${DB_FILE} dosyası oluşturuldu`);
}

// =================== DOSYA YÜKLEME AYARLARI ===================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: function (req, file, cb) {
        // Desteklenen dosya türleri
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Desteklenmeyen dosya türü. Sadece: JPG, PNG, PDF, DOC, DOCX, TXT'));
        }
    }
});

// =================== VERİTABANI FONKSİYONLARI ===================
function readDB() {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function updateStatistics() {
    const db = readDB();
    const files = db.files;
    
    // İstatistikleri sıfırla
    const statistics = {
        totalFiles: files.length,
        fileTypes: {},
        fileStatuses: {},
        readyFilesCount: 0,
        pendingFilesCount: 0
    };
    
    // Dosya türleri
    const fileTypesList = ['Değer Kaybı', 'İkame Araç Bedeli', 'İcra Takibi', 'Pert Farkı', 'Diğer'];
    fileTypesList.forEach(type => statistics.fileTypes[type] = 0);
    
    // Dosya durumları
    const fileStatusesList = ['Başvuruya Hazır', 'Başvuru Yapıldı', 'Evrak Tedarik Aşamasında', 'Tahkimde', 'İcrada', 'Kapandı'];
    fileStatusesList.forEach(status => statistics.fileStatuses[status] = 0);
    
    // Hesaplamalar
    files.forEach(file => {
        // Dosya türleri
        if (file.fileTypes && file.fileTypes.length > 0) {
            file.fileTypes.forEach(type => {
                if (statistics.fileTypes[type] !== undefined) {
                    statistics.fileTypes[type]++;
                }
            });
        }
        
        // Dosya durumu
        if (file.fileStatus && statistics.fileStatuses[file.fileStatus] !== undefined) {
            statistics.fileStatuses[file.fileStatus]++;
        }
        
        // Özel sayımlar
        if (file.fileStatus === 'Başvuruya Hazır') statistics.readyFilesCount++;
        if (file.fileStatus === 'Evrak Tedarik Aşamasında') statistics.pendingFilesCount++;
    });
    
    db.statistics = statistics;
    writeDB(db);
    
    return statistics;
}

// =================== API ROUTES ===================

// ----- KULLANICI İŞLEMLERİ -----
app.post('/api/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const db = readDB();
        
        const user = db.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            res.json({ 
                success: true, 
                user: { 
                    id: user.id, 
                    username: user.username 
                } 
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Geçersiz kullanıcı adı veya şifre' 
            });
        }
    } catch (error) {
        console.error('❌ Giriş hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Giriş yapılamadı' 
        });
    }
});

// ----- DOSYA İŞLEMLERİ -----
// Tüm dosyaları getir
app.get('/api/files', (req, res) => {
    try {
        const db = readDB();
        res.json(db.files);
    } catch (error) {
        console.error('❌ Dosya listeleme hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Dosyalar yüklenemedi' 
        });
    }
});

// Yeni dosya ekle
app.post('/api/files', (req, res) => {
    try {
        const db = readDB();
        const newFile = {
            id: Date.now().toString(),
            registrationDate: new Date().toISOString(),
            ...req.body
        };
        
        db.files.push(newFile);
        writeDB(db);
        updateStatistics();
        
        res.json({ 
            success: true, 
            file: newFile 
        });
    } catch (error) {
        console.error('❌ Dosya ekleme hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Dosya eklenemedi' 
        });
    }
});

// Dosya güncelle
app.put('/api/files/:id', (req, res) => {
    try {
        const db = readDB();
        const fileId = req.params.id;
        const fileIndex = db.files.findIndex(f => f.id === fileId);
        
        if (fileIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Dosya bulunamadı' 
            });
        }
        
        db.files[fileIndex] = { ...db.files[fileIndex], ...req.body };
        writeDB(db);
        updateStatistics();
        
        res.json({ 
            success: true, 
            file: db.files[fileIndex] 
        });
    } catch (error) {
        console.error('❌ Dosya güncelleme hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Dosya güncellenemedi' 
        });
    }
});

// Dosya sil
app.delete('/api/files/:id', (req, res) => {
    try {
        const db = readDB();
        const fileId = req.params.id;
        const fileIndex = db.files.findIndex(f => f.id === fileId);
        
        if (fileIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Dosya bulunamadı' 
            });
        }
        
        // Dosyaya ait belgeleri fiziksel olarak da sil
        const file = db.files[fileIndex];
        if (file.documents && file.documents.length > 0) {
            file.documents.forEach(doc => {
                if (doc.filename) {
                    const filePath = path.join(UPLOADS_DIR, doc.filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
            });
        }
        
        db.files.splice(fileIndex, 1);
        writeDB(db);
        updateStatistics();
        
        res.json({ 
            success: true, 
            message: 'Dosya silindi' 
        });
    } catch (error) {
        console.error('❌ Dosya silme hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Dosya silinemedi' 
        });
    }
});

// Dosya ara
app.get('/api/files/search', (req, res) => {
    try {
        const searchTerm = req.query.q?.toLowerCase() || '';
        const db = readDB();
        
        if (!searchTerm) {
            return res.json(db.files);
        }
        
        const filteredFiles = db.files.filter(file => 
            (file.clientName && file.clientName.toLowerCase().includes(searchTerm)) ||
            (file.plate && file.plate.toLowerCase().includes(searchTerm)) ||
            (file.tc && file.tc.toLowerCase().includes(searchTerm))
        );
        
        res.json(filteredFiles);
    } catch (error) {
        console.error('❌ Arama hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Arama yapılamadı' 
        });
    }
});

// ----- BELGE İŞLEMLERİ -----
// Belge yükle
app.post('/api/upload', upload.single('document'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'Dosya seçilmedi' 
            });
        }
        
        const documentInfo = {
            id: Date.now().toString(),
            name: req.file.originalname,
            type: req.body.type || 'Belge',
            filename: req.file.filename, // Sunucudaki benzersiz isim
            originalname: req.file.originalname,
            path: `/uploads/${req.file.filename}`, // Tarayıcıda kullanılacak yol
            uploadedDate: new Date().toISOString(),
            size: req.file.size,
            mimetype: req.file.mimetype
        };
        
        console.log('✅ Belge yüklendi:', documentInfo.name);
        
        res.json({ 
            success: true, 
            document: documentInfo 
        });
    } catch (error) {
        console.error('❌ Belge yükleme hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Belge yüklenemedi: ' + error.message 
        });
    }
});

// Belge indir
app.get('/api/download/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(UPLOADS_DIR, filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ 
                success: false, 
                message: `Dosya bulunamadı: ${filename}` 
            });
        }
        
        res.download(filePath);
        console.log('📥 İndirilen dosya:', filename);
    } catch (error) {
        console.error('❌ Belge indirme hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Belge indirilemedi' 
        });
    }
});

// Belge görüntüle
app.get('/api/view/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(UPLOADS_DIR, filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ 
                success: false, 
                message: 'Dosya bulunamadı' 
            });
        }
        
        // Dosya türüne göre content-type belirle
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.txt': 'text/plain'
        };
        
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        
        res.sendFile(path.resolve(filePath));
        console.log('👁️ Görüntülenen dosya:', filename);
    } catch (error) {
        console.error('❌ Belge görüntüleme hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Belge görüntülenemedi' 
        });
    }
});

// ----- İSTATİSTİKLER -----
app.get('/api/stats', (req, res) => {
    try {
        const db = readDB();
        const stats = {
            typeStats: db.statistics.fileTypes,
            statusStats: db.statistics.fileStatuses,
            readyFilesCount: db.statistics.readyFilesCount,
            pendingFilesCount: db.statistics.pendingFilesCount,
            totalFiles: db.statistics.totalFiles
        };
        
        res.json(stats);
    } catch (error) {
        console.error('❌ İstatistik hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'İstatistikler alınamadı' 
        });
    }
});

// =================== HATA YAKALAMA ===================
app.use((err, req, res, next) => {
    console.error('🔥 Sunucu hatası:', err.message);
    
    // Multer hataları
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
            success: false, 
            message: 'Dosya boyutu 10MB\'dan küçük olmalıdır' 
        });
    }
    
    if (err.message && err.message.includes('Desteklenmeyen dosya türü')) {
        return res.status(400).json({ 
            success: false, 
            message: err.message 
        });
    }
    
    res.status(500).json({ 
        success: false, 
        message: 'Sunucu hatası: ' + err.message 
    });
});

// 404 sayfası
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Sayfa bulunamadı' 
    });
});

// =================== SUNUCUYU BAŞLAT ===================
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log(`✅ SERVER ÇALIŞIYOR: http://localhost:${PORT}`);
    console.log('='.repeat(50) + '\n');
    console.log(`📁 Ana sayfa: http://localhost:${PORT}`);
    console.log(`📁 Uploads klasörü: http://localhost:${PORT}/uploads/`);
    console.log(`🗄️  Veritabanı: ${DB_FILE}`);
    console.log(`🔧 API Endpointleri:`);
    console.log(`   - POST /api/login`);
    console.log(`   - GET  /api/files`);
    console.log(`   - POST /api/upload`);
    console.log(`   - GET  /api/stats`);
    console.log('\n' + '='.repeat(50));
    
    // İstatistikleri güncelle
    updateStatistics();
});