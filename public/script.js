// API endpoint - Localhost için
const API_URL = 'http://localhost:3000';

// Ana veri yapıları
let currentUser = null;
let files = [];
let currentFileId = null;
let isSubmitting = false;
let isEditing = false;

// Dosya türleri (ÇOKLU SEÇİM)
const fileTypes = [
    'Değer Kaybı',
    'İkame Araç Bedeli',
    'İcra Takibi',
    'Pert Farkı',
    'Diğer'
];

// Dosya durumları
const fileStatuses = [
    'Başvuruya Hazır',
    'Başvuru Yapıldı',
    'Evrak Tedarik Aşamasında',
    'Tahkimde',
    'İcrada',
    'Kapandı'
];

// Belge türleri ("Diğer" hariç)
const allDocumentTypes = [
    'Kaza Tespit Tutanağı',
    'Araç Fotoğrafları',
    'Ruhsat Fotokopileri',
    'Kimlik Fotokopileri',
    'Ekspertiz Raporu',
    'Vekaletname',
    'Hasar Onarım Faturası'
];

// ==================== API FONKSİYONLARI ====================

// Dosyaları API'den yükle
async function loadFilesFromAPI() {
    try {
        console.log('Loading files from API...');
        const response = await fetch(`${API_URL}/api/files`);
        if (!response.ok) throw new Error('Dosyalar yüklenemedi');
        
        const data = await response.json();
        console.log('API response:', data);
        files = data;
        
        return files;
    } catch (error) {
        console.error('Dosya yükleme hatası:', error);
        showError('Dosyalar yüklenemedi. Sunucuya bağlanılamıyor.');
        return [];
    }
}

// Yeni dosya ekle (API)
async function addFileAPI(fileData) {
    try {
        const response = await fetch(`${API_URL}/api/files`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(fileData)
        });
        
        if (!response.ok) throw new Error('Dosya eklenemedi');
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Dosya ekleme hatası:', error);
        showError('Dosya eklenemedi.');
        return null;
    }
}

// Dosya güncelle (API)
async function updateFileAPI(fileId, fileData) {
    try {
        const response = await fetch(`${API_URL}/api/files/${fileId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(fileData)
        });
        
        if (!response.ok) throw new Error('Dosya güncellenemedi');
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Dosya güncelleme hatası:', error);
        showError('Dosya güncellenemedi.');
        return null;
    }
}

// Dosya sil (API)
async function deleteFileAPI(fileId) {
    try {
        const response = await fetch(`${API_URL}/api/files/${fileId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Dosya silinemedi');
        
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Dosya silme hatası:', error);
        showError('Dosya silinemedi.');
        return false;
    }
}

// Belge yükle (API)
async function uploadDocumentAPI(file, type) {
    console.log('🔍 uploadDocumentAPI çağrıldı:', file.name, type);
    
    try {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('type', type);
        
        console.log('📡 API isteği gönderiliyor...');
        const response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData
        });
        
        console.log('📊 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            let errorMessage = `Sunucu hatası: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
                console.error('❌ Sunucu hatası detayı:', errorData);
            } catch (e) {
                const errorText = await response.text();
                console.error('❌ Sunucu hatası (text):', errorText);
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('✅ Upload başarılı! Sonuç:', result);
        
        if (!result.success) {
            throw new Error(result.message || 'Upload başarısız');
        }
        
        return result.document;
        
    } catch (error) {
        console.error('🔥 uploadDocumentAPI hatası:', error);
        showError(`Belge yüklenemedi: ${error.message}`);
        return null;
    }
}

// Belge sil (API)
async function deleteDocumentAPI(docId) {
    try {
        const response = await fetch(`${API_URL}/api/documents/${docId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Belge silinemedi');
        
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Belge silme hatası:', error);
        showError('Belge silinemedi.');
        return false;
    }
}

// İstatistikleri getir (API)
async function getStatsAPI() {
    try {
        const response = await fetch(`${API_URL}/api/stats`);
        if (!response.ok) throw new Error('İstatistikler alınamadı');
        
        return await response.json();
    } catch (error) {
        console.error('İstatistik hatası:', error);
        return null;
    }
}

// ==================== UTILITY FONKSİYONLARI ====================

function showError(message) {
    alert('Hata: ' + message);
}

function showSuccess(message) {
    alert('✓ ' + message);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getStatusClass(status) {
    const statusClasses = {
        'Başvuruya Hazır': 'status-ready',
        'Başvuru Yapıldı': 'status-new',
        'Evrak Tedarik Aşamasında': 'status-pending',
        'Tahkimde': 'status-arbitration',
        'İcrada': 'status-enforcement',
        'Kapandı': 'status-closed'
    };
    
    return statusClasses[status] || 'status-default';
}

// Tarih formatlama fonksiyonu
function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth()+1).toString().padStart(2, '0')}.${date.getFullYear()}`;
    } catch (error) {
        console.error('Tarih formatlama hatası:', error, dateStr);
        return dateStr;
    }
}

function formatFileSize(bytes) {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ==================== UYGULAMA BAŞLATMA ====================

// Uygulama başlatma
document.addEventListener('DOMContentLoaded', function() {
    // Element referansları
    const loginScreen = document.getElementById('loginScreen');
    const appScreen = document.getElementById('appScreen');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    // Giriş kontrolü
    if (localStorage.getItem('isLoggedIn') === 'true') {
        loginScreen.style.display = 'none';
        appScreen.style.display = 'block';
        initializeApp();
    }
    
    // Giriş butonu
    loginBtn.addEventListener('click', async function() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        try {
            const response = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                currentUser = data.user;
                localStorage.setItem('isLoggedIn', 'true');
                loginScreen.style.display = 'none';
                appScreen.style.display = 'block';
                initializeApp();
            } else {
                alert('Hatalı kullanıcı adı veya şifre!');
            }
        } catch (error) {
            console.error('Giriş hatası:', error);
            alert('Giriş yapılamadı. Sunucuya bağlanılamıyor.');
        }
    });
    
    // Çıkış butonu
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('isLoggedIn');
        location.reload();
    });
    
    // Enter tuşu ile giriş
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginBtn.click();
        }
    });
});

// Uygulamayı başlat
async function initializeApp() {
    loadEventListeners();
    await loadFiles();
    showFileList();
    await updateStats();
}

// Event listener'ları yükle
function loadEventListeners() {
    // Menü butonları
    document.getElementById('newFileBtn').addEventListener('click', showNewFileForm);
    document.getElementById('listFilesBtn').addEventListener('click', showFileList);
    
    // Özel sayfa butonları
    document.getElementById('showPendingBtn').addEventListener('click', showPendingFiles);
    document.getElementById('showReadyBtn').addEventListener('click', showReadyFiles);
    document.getElementById('hidePendingFilesBtn').addEventListener('click', hidePendingFiles);
    document.getElementById('hideReadyFilesBtn').addEventListener('click', hideReadyFiles);
    
    // Arama işlemleri
    document.getElementById('searchBtn').addEventListener('click', searchFiles);
    document.getElementById('clearSearchBtn').addEventListener('click', clearSearch);
    
    // Geri butonları
    document.getElementById('backToListBtn').addEventListener('click', showFileList);
    document.getElementById('backToListFromNewBtn').addEventListener('click', showFileList);
    
    // Dosya işlem butonları
    document.getElementById('editFileBtn').addEventListener('click', function() {
        if (currentFileId) {
            if (isEditing) {
                cancelEdit();
            } else {
                editFile(currentFileId);
            }
        }
    });
    
    document.getElementById('deleteFileBtn').addEventListener('click', function() {
        if (currentFileId) {
            deleteFile(currentFileId);
        }
    });
    
    // Arama kutusunda enter tuşu
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchFiles();
        }
    });
}

// Dosyaları yükle
async function loadFiles() {
    files = await loadFilesFromAPI();
}

// Dosya listesini göster
function showFileList() {
    document.getElementById('fileListSection').style.display = 'block';
    document.getElementById('fileDetailSection').style.display = 'none';
    document.getElementById('newFileSection').style.display = 'none';
    
    // Özel sayfaları gizle, tüm dosyaları göster
    document.getElementById('pendingFilesSection').style.display = 'none';
    document.getElementById('readyFilesSection').style.display = 'none';
    document.getElementById('allFilesSection').style.display = 'block';
    
    // Düzenleme modunu kapat
    isEditing = false;
    document.getElementById('editFileBtn').innerHTML = '<i class="fas fa-edit"></i> Düzenle';
    
    renderFilesTable();
}

// Yeni dosya formunu göster
function showNewFileForm() {
    document.getElementById('fileListSection').style.display = 'none';
    document.getElementById('fileDetailSection').style.display = 'none';
    document.getElementById('newFileSection').style.display = 'block';
    
    // Düzenleme modunu kapat
    isEditing = false;
    
    renderNewFileForm();
}

// Dosya detayını göster
async function showFileDetail(fileId) {
    document.getElementById('fileListSection').style.display = 'none';
    document.getElementById('fileDetailSection').style.display = 'block';
    document.getElementById('newFileSection').style.display = 'none';
    
    // Düzenleme modunu kapat
    isEditing = false;
    document.getElementById('fileEdit').style.display = 'none';
    document.getElementById('fileView').style.display = 'block';
    document.getElementById('editFileBtn').innerHTML = '<i class="fas fa-edit"></i> Düzenle';
    
    currentFileId = fileId;
    await renderFileDetail(fileId);
}

// Evrak tedarik dosyalarını göster
function showPendingFiles() {
    document.getElementById('pendingFilesSection').style.display = 'block';
    document.getElementById('readyFilesSection').style.display = 'none';
    document.getElementById('allFilesSection').style.display = 'none';
    
    renderPendingFilesTable();
}

// Başvuruya hazır dosyaları göster
function showReadyFiles() {
    document.getElementById('pendingFilesSection').style.display = 'none';
    document.getElementById('readyFilesSection').style.display = 'block';
    document.getElementById('allFilesSection').style.display = 'none';
    
    renderReadyFilesTable();
}

// Evrak tedarik dosyalarını gizle
function hidePendingFiles() {
    showFileList();
}

// Başvuruya hazır dosyaları gizle
function hideReadyFiles() {
    showFileList();
}

// ==================== TABLO RENDER FONKSİYONLARI ====================

// Dosya listesi tablosunu oluştur
function renderFilesTable(filteredFiles = null) {
    const filesToDisplay = filteredFiles || files;
    const tbody = document.getElementById('filesTableBody');
    
    tbody.innerHTML = '';
    
    if (filesToDisplay.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <i class="fas fa-folder-open" style="font-size: 48px; color: #cbd5e1; margin-bottom: 15px;"></i>
                    <p style="color: #64748b;">Henüz kayıtlı dosya bulunmamaktadır.</p>
                    <button onclick="showNewFileForm()" class="btn btn-primary mt-3">
                        <i class="fas fa-plus"></i> İlk Dosyayı Ekle
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    // Önce "Başvuruya Hazır", sonra "Evrak Tedarik Aşamasında", sonra diğerleri
    const sortedFiles = [...filesToDisplay].sort((a, b) => {
        if (a.fileStatus === 'Başvuruya Hazır' && b.fileStatus !== 'Başvuruya Hazır') return -1;
        if (a.fileStatus !== 'Başvuruya Hazır' && b.fileStatus === 'Başvuruya Hazır') return 1;
        
        if (a.fileStatus === 'Evrak Tedarik Aşamasında' && b.fileStatus !== 'Evrak Tedarik Aşamasında') return -1;
        if (a.fileStatus !== 'Evrak Tedarik Aşamasında' && b.fileStatus === 'Evrak Tedarik Aşamasında') return 1;
        
        return new Date(b.registrationDate) - new Date(a.registrationDate);
    });
    
    sortedFiles.forEach(file => {
        const row = document.createElement('tr');
        
        const date = new Date(file.registrationDate);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth()+1).toString().padStart(2, '0')}.${date.getFullYear()}`;
        
        const fileTypesDisplay = getFileTypesDisplay(file);
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${file.clientName}</td>
            <td>${file.plate}</td>
            <td>${fileTypesDisplay}</td>
            <td><span class="status-badge ${getStatusClass(file.fileStatus)}">${file.fileStatus || '-'}</span></td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="showFileDetail('${file.id}')">
                    <i class="fas fa-eye"></i> Göster
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteFile('${file.id}')">
                    <i class="fas fa-trash"></i> Sil
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Evrak tedarik dosyaları tablosunu oluştur
function renderPendingFilesTable() {
    const pendingFiles = files.filter(file => file.fileStatus === 'Evrak Tedarik Aşamasında');
    const tbody = document.getElementById('pendingFilesTableBody');
    
    tbody.innerHTML = '';
    
    if (pendingFiles.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <i class="fas fa-hourglass-half" style="font-size: 48px; color: #cbd5e1; margin-bottom: 15px;"></i>
                    <p style="color: #64748b;">Evrak tedarik aşamasında dosya bulunmamaktadır.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    pendingFiles.forEach(file => {
        const row = document.createElement('tr');
        
        const date = new Date(file.registrationDate);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth()+1).toString().padStart(2, '0')}.${date.getFullYear()}`;
        
        const missingDocs = getMissingDocuments(file);
        const missingCount = missingDocs.length;
        
        const fileTypesDisplay = getFileTypesDisplay(file);
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${file.clientName}</td>
            <td>${file.plate}</td>
            <td>${fileTypesDisplay}</td>
            <td>
                ${missingCount > 0 ? 
                    `<span class="badge" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white;">${missingCount} eksik</span>` : 
                    '<span class="badge" style="background: linear-gradient(135deg, #4ade80 0%, #16a34a 100%); color: white;">Tamam</span>'}
            </td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="showFileDetail('${file.id}')">
                    <i class="fas fa-eye"></i> Göster
                </button>
                <button class="btn btn-success btn-sm" onclick="markAsReady('${file.id}')">
                    <i class="fas fa-check"></i> Hazır
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Başvuruya hazır dosyalar tablosunu oluştur
function renderReadyFilesTable() {
    const readyFiles = files.filter(file => file.fileStatus === 'Başvuruya Hazır');
    const tbody = document.getElementById('readyFilesTableBody');
    
    tbody.innerHTML = '';
    
    if (readyFiles.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <i class="fas fa-clipboard-check" style="font-size: 48px; color: #cbd5e1; margin-bottom: 15px;"></i>
                    <p style="color: #64748b;">Başvuruya hazır dosya bulunmamaktadır.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    readyFiles.forEach(file => {
        const row = document.createElement('tr');
        
        const date = new Date(file.registrationDate);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth()+1).toString().padStart(2, '0')}.${date.getFullYear()}`;
        
        const missingDocs = getMissingDocuments(file);
        const missingCount = missingDocs.length;
        
        const fileTypesDisplay = getFileTypesDisplay(file);
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${file.clientName}</td>
            <td>${file.plate}</td>
            <td>${fileTypesDisplay}</td>
            <td>
                ${missingCount > 0 ? 
                    `<span class="badge" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white;">${missingCount} eksik</span>` : 
                    '<span class="badge" style="background: linear-gradient(135deg, #4ade80 0%, #16a34a 100%); color: white;">Tamam</span>'}
            </td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="showFileDetail('${file.id}')">
                    <i class="fas fa-eye"></i> Göster
                </button>
                <button class="btn btn-success btn-sm" onclick="markAsApplied('${file.id}')">
                    <i class="fas fa-paper-plane"></i> Başvur
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Dosya türlerini göster
function getFileTypesDisplay(file) {
    if (file.fileTypes && file.fileTypes.length > 0) {
        if (file.fileTypes.length <= 2) {
            return file.fileTypes.join(', ');
        } else {
            return `${file.fileTypes[0]}, ${file.fileTypes[1]} +${file.fileTypes.length - 2}`;
        }
    } else if (file.fileType) {
        return file.fileType;
    }
    return '-';
}

// Eksik belgeleri bul
function getMissingDocuments(file) {
    const uploadedTypes = file.documents ? file.documents.map(doc => doc.type) : [];
    return allDocumentTypes.filter(type => !uploadedTypes.includes(type));
}

// ==================== DOSYA İŞLEMLERİ ====================

// Dosyayı "Başvuru Yapıldı" olarak işaretle
async function markAsApplied(fileId) {
    if (!confirm('Bu dosyayı "Başvuru Yapıldı" olarak işaretlemek istediğinize emin misiniz?')) {
        return;
    }
    
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex !== -1) {
        const file = files[fileIndex];
        const updatedFile = { ...file, fileStatus: 'Başvuru Yapıldı' };
        
        const result = await updateFileAPI(fileId, updatedFile);
        if (result && result.success) {
            files[fileIndex] = updatedFile;
            renderReadyFilesTable();
            updateStats();
            showSuccess('Dosya "Başvuru Yapıldı" olarak güncellendi.');
            
            const readyFiles = files.filter(file => file.fileStatus === 'Başvuruya Hazır');
            if (readyFiles.length === 0) {
                hideReadyFiles();
            }
        }
    }
}

// Dosyayı "Başvuruya Hazır" olarak işaretle
async function markAsReady(fileId) {
    if (!confirm('Bu dosyayı "Başvuruya Hazır" olarak işaretlemek istediğinize emin misiniz?')) {
        return;
    }
    
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex !== -1) {
        const file = files[fileIndex];
        const updatedFile = { ...file, fileStatus: 'Başvuruya Hazır' };
        
        const result = await updateFileAPI(fileId, updatedFile);
        if (result && result.success) {
            files[fileIndex] = updatedFile;
            renderPendingFilesTable();
            updateStats();
            showSuccess('Dosya "Başvuruya Hazır" olarak güncellendi.');
            
            const pendingFiles = files.filter(file => file.fileStatus === 'Evrak Tedarik Aşamasında');
            if (pendingFiles.length === 0) {
                hidePendingFiles();
            }
        }
    }
}

// ==================== DOSYA DETAY RENDER ====================

// Dosya detayını render et
async function renderFileDetail(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    console.log('Rendering file detail for:', fileId);
    
    const fileView = document.getElementById('fileView');
    document.getElementById('fileDetailTitle').textContent = `${file.clientName} - ${file.plate}`;
    
    const missingDocuments = getMissingDocuments(file);
    const fileTypesHtml = renderFileTypes(file);
    const documentsHtml = renderUploadedDocuments(file);
    
    fileView.innerHTML = `
        <!-- NOTLAR BÖLÜMÜ -->
        <div class="form-section">
            <h3><i class="fas fa-sticky-note"></i> Notlar</h3>
            <div style="padding: 15px; background: white; border-radius: var(--radius); border: 1px solid var(--border);">
                ${file.notes ? file.notes.split('\n').map(note => `<p style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9;">${note}</p>`).join('') : '<p>Henüz not eklenmemiş.</p>'}
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
            <div class="form-section">
                <h3><i class="fas fa-user"></i> Genel Bilgiler</h3>
                <div class="form-row">
                    <label>Kayıt Tarihi:</label>
                    <div style="padding: 10px; background: white; border-radius: var(--radius); border: 1px solid var(--border);">${formatDate(file.registrationDate)}</div>
                </div>
                <div class="form-row">
                    <label>Müvekkil Adı:</label>
                    <div style="padding: 10px; background: white; border-radius: var(--radius); border: 1px solid var(--border);">${file.clientName || '-'}</div>
                </div>
                <div class="form-row">
                    <label>TC Kimlik No:</label>
                    <div style="padding: 10px; background: white; border-radius: var(--radius); border: 1px solid var(--border);">${file.tc || '-'}</div>
                </div>
                <div class="form-row">
                    <label>Araç Plakası:</label>
                    <div style="padding: 10px; background: white; border-radius: var(--radius); border: 1px solid var(--border);">${file.plate || '-'}</div>
                </div>
                <div class="form-row">
                    <label>Sürücü Adı:</label>
                    <div style="padding: 10px; background: white; border-radius: var(--radius); border: 1px solid var(--border);">${file.driverName || '-'}</div>
                </div>
            </div>
            
            <div class="form-section">
                <h3><i class="fas fa-folder"></i> Dosya Bilgileri</h3>
                <div class="form-row">
                    <label>Dosya Türü:</label>
                    <div style="padding: 10px; background: white; border-radius: var(--radius); border: 1px solid var(--border);">
                        ${fileTypesHtml}
                    </div>
                </div>
                <div class="form-row">
                    <label>Dosya Durumu:</label>
                    <div style="padding: 10px; background: white; border-radius: var(--radius); border: 1px solid var(--border);">
                        <span class="status-badge ${getStatusClass(file.fileStatus)}">
                            ${file.fileStatus || '-'}
                        </span>
                    </div>
                </div>
                <div class="form-row">
                    <label>Oran Bilgisi:</label>
                    <div style="padding: 10px; background: white; border-radius: var(--radius); border: 1px solid var(--border);">${file.percentage || '-'}</div>
                </div>
                <div class="form-row">
                    <label>Ustası:</label>
                    <div style="padding: 10px; background: white; border-radius: var(--radius); border: 1px solid var(--border);">${file.master || '-'}</div>
                </div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
            <div class="form-section">
                <h3><i class="fas fa-users"></i> Karşı Taraf Bilgileri</h3>
                <div class="form-row">
                    <label>Adı Soyadı:</label>
                    <div style="padding: 10px; background: white; border-radius: var(--radius); border: 1px solid var(--border);">${file.opponentName || '-'}</div>
                </div>
                <div class="form-row">
                    <label>Plakası:</label>
                    <div style="padding: 10px; background: white; border-radius: var(--radius); border: 1px solid var(--border);">${file.opponentPlate || '-'}</div>
                </div>
                <div class="form-row">
                    <label>Sürücü Adı:</label>
                    <div style="padding: 10px; background: white; border-radius: var(--radius); border: 1px solid var(--border);">${file.opponentDriver || '-'}</div>
                </div>
                <div class="form-row">
                    <label>Sigorta Şirketi:</label>
                    <div style="padding: 10px; background: white; border-radius: var(--radius); border: 1px solid var(--border);">${file.insuranceCompany || '-'}</div>
            </div>
            </div>
            
            <div class="form-section">
                <h3><i class="fas fa-calendar-alt"></i> Süreç Takibi</h3>
                <div class="form-row">
                    <label>Sigorta Başvuru Tarihi:</label>
                    <div style="padding: 10px; background: white; border-radius: var(--radius); border: 1px solid var(--border);">${formatDate(file.insuranceApplicationDate) || '-'}</div>
                </div>
                <div class="form-row">
                    <label>Tahkim Başvuru Tarihi:</label>
                    <div style="padding: 10px; background: white; border-radius: var(--radius); border: 1px solid var(--border);">${formatDate(file.arbitrationApplicationDate) || '-'}</div>
                </div>
                <div class="form-row">
                    <label>İcra Başvuru Tarihi:</label>
                    <div style="padding: 10px; background: white; border-radius: var(--radius); border: 1px solid var(--border);">${formatDate(file.enforcementApplicationDate) || '-'}</div>
                </div>
                <div class="form-row">
                    <label>Güncel Durum:</label>
                    <div style="padding: 10px; background: white; border-radius: var(--radius); border: 1px solid var(--border);">${file.currentStatus || '-'}</div>
                </div>
            </div>
        </div>
        
        <div class="form-section">
            <h3><i class="fas fa-paperclip"></i> Yüklenen Belgeler</h3>
            <div class="documents-grid" id="uploadedDocumentsGrid">
                ${documentsHtml}
            </div>
        </div>
        
        <!-- EKSİK BELGELER LİSTESİ -->
        ${missingDocuments.length > 0 ? `
        <div class="missing-documents">
            <h4><i class="fas fa-exclamation-triangle"></i> Yüklenmemiş Belgeler</h4>
            ${missingDocuments.map(doc => `
                <div class="missing-doc-item">
                    <i class="fas fa-times-circle"></i>
                    <span>${doc}</span>
                </div>
            `).join('')}
        </div>
        ` : ''}
    `;
}

// Dosya türlerini render et
function renderFileTypes(file) {
    if (file.fileTypes && file.fileTypes.length > 0) {
        return `
            <div class="file-type-tags">
                ${file.fileTypes.map(type => `
                    <span class="file-type-tag">
                        <i class="fas fa-tag"></i> ${type}
                    </span>
                `).join('')}
            </div>
        `;
    } else if (file.fileType) {
        return `
            <div class="file-type-tags">
                <span class="file-type-tag">
                    <i class="fas fa-tag"></i> ${file.fileType}
                </span>
            </div>
        `;
    }
    return '-';
}

// Yüklenen belgeleri grid formatında göster
function renderUploadedDocuments(file) {
    if (!file.documents || file.documents.length === 0) {
        return `
            <div style="text-align: center; padding: 40px; color: #94a3b8;">
                <i class="fas fa-file-upload" style="font-size: 48px; margin-bottom: 15px;"></i>
                <p>Henüz belge yüklenmemiş</p>
            </div>
        `;
    }
    
    try {
        return file.documents.map((doc, index) => {
            const docName = doc.name || doc.originalname || 'Belge';
            const docType = doc.type || 'Belge';
            const docDate = doc.uploadedDate || new Date().toISOString();
            const docSize = doc.size || 0;
            const docFilename = doc.filename || doc.id || '';
            const docId = doc.id || doc._id || '';
            
            const safeDocName = docName.replace(/'/g, "\\'").replace(/"/g, '\\"');
            const safeDocFilename = docFilename.replace(/'/g, "\\'").replace(/"/g, '\\"');
            const safeDocId = docId.replace(/'/g, "\\'").replace(/"/g, '\\"');
            
            return `
            <div class="document-card">
                <div class="document-icon">
                    <i class="fas fa-file-pdf"></i>
                </div>
                <div class="document-info">
                    <div class="document-name">${docName}</div>
                    <div class="document-type">${docType}</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 5px;">
                        ${formatDate(docDate)} • ${formatFileSize(docSize)}
                    </div>
                </div>
                <div class="document-actions">
                    ${docFilename ? `
                        <button class="btn btn-primary btn-sm" onclick="viewDocument('${safeDocFilename}')">
                            <i class="fas fa-eye"></i> Göster
                        </button>
                        <button class="btn btn-success btn-sm" onclick="downloadDocument('${safeDocFilename}', '${safeDocName}')">
                            <i class="fas fa-download"></i> İndir
                        </button>
                    ` : `
                        <button class="btn btn-primary btn-sm disabled">
                            <i class="fas fa-eye"></i> Göster
                        </button>
                        <button class="btn btn-success btn-sm disabled">
                            <i class="fas fa-download"></i> İndir
                        </button>
                    `}
                    <button class="btn btn-danger btn-sm" onclick="removeDocumentFromFile('${file.id}', '${safeDocId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error rendering documents:', error);
        return `
            <div style="text-align: center; padding: 40px; color: #94a3b8;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 15px;"></i>
                <p>Belgeler yüklenirken hata oluştu</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}

// Belge görüntüle
function viewDocument(filename) {
    window.open(`${API_URL}/api/view/${filename}`, '_blank');
}

// Belge indir
function downloadDocument(filename, originalName) {
    const a = document.createElement('a');
    a.href = `${API_URL}/api/download/${filename}`;
    a.download = originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Dosyadan belge sil
async function removeDocumentFromFile(fileId, docId) {
    if (!confirm('Bu belgeyi silmek istediğinize emin misiniz?')) {
        return;
    }
    
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) {
        showError('Dosya bulunamadı.');
        return;
    }
    
    try {
        const success = await deleteDocumentAPI(docId);
        if (success) {
            files[fileIndex].documents = files[fileIndex].documents.filter(doc => 
                doc.id !== docId && doc._id !== docId
            );
            
            showSuccess('Belge silindi.');
            renderFileDetail(fileId);
        } else {
            throw new Error('Belge silinemedi');
        }
    } catch (error) {
        console.error('Belge silme hatası:', error);
        showError('Belge silinemedi.');
    }
}

// ==================== YENİ DOSYA FORMU ====================

// Yeni dosya formunu render et
function renderNewFileForm() {
    const form = document.getElementById('newFileForm');
    
    const fileTypeCheckboxes = fileTypes.map(type => `
        <div class="checkbox-item">
            <input type="checkbox" id="fileType_${type.replace(/\s+/g, '_')}" name="fileTypes" value="${type}">
            <label for="fileType_${type.replace(/\s+/g, '_')}">${type}</label>
        </div>
    `).join('');
    
    const fileStatusOptions = fileStatuses.map(status => 
        `<option value="${status}">${status}</option>`
    ).join('');
    
    const documentTypeOptions = allDocumentTypes.map(type => 
        `<option value="${type}">${type}</option>`
    ).join('');
    
    form.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
            <div class="form-section">
                <h3><i class="fas fa-user"></i> Genel Bilgiler</h3>
                <div class="form-row">
                    <label for="clientName">Müvekkil Adı *</label>
                    <input type="text" id="clientName" required>
                </div>
                <div class="form-row">
                    <label for="tc">TC Kimlik No</label>
                    <input type="text" id="tc">
                </div>
                <div class="form-row">
                    <label for="plate">Araç Plakası *</label>
                    <input type="text" id="plate" required>
                </div>
                <div class="form-row">
                    <label for="driverName">Sürücü Adı</label>
                    <input type="text" id="driverName">
                </div>
            </div>
            
            <div class="form-section">
                <h3><i class="fas fa-folder"></i> Dosya Bilgileri</h3>
                <div class="form-row">
                    <label>Dosya Türü (Çoklu Seçim) *</label>
                    <div class="checkbox-group">
                        ${fileTypeCheckboxes}
                    </div>
                </div>
                <div class="form-row">
                    <label for="fileStatus">Dosya Durumu</label>
                    <select id="fileStatus">
                        <option value="Başvuruya Hazır">Başvuruya Hazır</option>
                        <option value="Evrak Tedarik Aşamasında">Evrak Tedarik Aşamasında</option>
                        ${fileStatusOptions}
                    </select>
                </div>
                <div class="form-row">
                    <label for="percentage">Oran Bilgisi</label>
                    <input type="text" id="percentage" placeholder="%20">
                </div>
                <div class="form-row">
                    <label for="master">Ustası</label>
                    <input type="text" id="master">
                </div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
            <div class="form-section">
                <h3><i class="fas fa-users"></i> Karşı Taraf Bilgileri</h3>
                <div class="form-row">
                    <label for="opponentName">Adı Soyadı</label>
                    <input type="text" id="opponentName">
                </div>
                <div class="form-row">
                    <label for="opponentPlate">Plakası</label>
                    <input type="text" id="opponentPlate">
                </div>
                <div class="form-row">
                    <label for="opponentDriver">Sürücü Adı</label>
                    <input type="text" id="opponentDriver">
                </div>
                <div class="form-row">
                    <label for="insuranceCompany">Sigorta Şirketi</label>
                    <input type="text" id="insuranceCompany">
                </div>
            </div>
            
            <div class="form-section">
                <h3><i class="fas fa-calendar-alt"></i> Süreç Takibi</h3>
                <div class="form-row">
                    <label for="insuranceApplicationDate">Sigorta Başvuru Tarihi</label>
                    <input type="date" id="insuranceApplicationDate">
                </div>
                <div class="form-row">
                    <label for="arbitrationApplicationDate">Tahkim Başvuru Tarihi</label>
                    <input type="date" id="arbitrationApplicationDate">
                </div>
                <div class="form-row">
                    <label for="enforcementApplicationDate">İcra Başvuru Tarihi</label>
                    <input type="date" id="enforcementApplicationDate">
                </div>
                <div class="form-row">
                    <label for="currentStatus">Güncel Durum</label>
                    <input type="text" id="currentStatus">
                </div>
            </div>
        </div>
        
        <div class="form-section">
            <h3><i class="fas fa-sticky-note"></i> Notlar</h3>
            <div class="form-row">
                <label for="notes">Dosya Notları</label>
                <textarea id="notes" placeholder="Dosya hakkında notlar..."></textarea>
            </div>
        </div>
        
        <div class="form-section">
            <h3><i class="fas fa-paperclip"></i> Belge Yükleme</h3>
            <div class="form-row">
                <label>Belge Türü</label>
                <select id="documentType">
                    <option value="">Belge Seçin</option>
                    ${documentTypeOptions}
                </select>
            </div>
            <div class="form-row">
                <input type="file" id="documentFile" multiple>
            </div>
            <button type="button" class="btn btn-secondary" onclick="addDocument()">
                <i class="fas fa-plus"></i> Belge Ekle
            </button>
            
            <div style="margin-top: 15px;" id="uploadedFilesListNew">
                <!-- Yüklenen dosyalar burada listelenecek -->
            </div>
        </div>
        
        <div style="display: flex; gap: 15px; margin-top: 30px; padding-top: 20px; border-top: 2px solid var(--border); justify-content: flex-end;">
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Dosyayı Kaydet
            </button>
            <button type="button" class="btn btn-secondary" onclick="showFileList()">
                <i class="fas fa-times"></i> İptal
            </button>
        </div>
    `;
    
    // Form submit eventini ekle
    form.onsubmit = async function(e) {
        e.preventDefault();
        await saveNewFile();
    };
}

// Yeni dosyaya belge ekle
function addDocument() {
    const docType = document.getElementById('documentType').value;
    const fileInput = document.getElementById('documentFile');
    
    console.log('🔍 addDocument çağrıldı:', {
        docType: docType,
        files: fileInput.files,
        fileCount: fileInput.files.length
    });
    
    if (!docType) {
        alert('Lütfen bir belge türü seçin.');
        return;
    }
    
    if (fileInput.files.length === 0) {
        alert('Lütfen bir dosya seçin.');
        return;
    }
    
    const fileList = document.getElementById('uploadedFilesListNew');
    
    for (let i = 0; i < fileInput.files.length; i++) {
        const file = fileInput.files[i];
        console.log(`📁 Dosya ${i + 1}:`, file);
        
        const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.id = fileId;
        fileItem.setAttribute('data-file-id', fileId);
        fileItem.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px; background: white; border-radius: var(--radius); margin-bottom: 8px; border: 1px solid var(--border);';
        
        // File objesini DOM elementine ekle
        fileItem.fileObject = file;
        
        fileItem.innerHTML = `
            <div>
                <span><strong>${docType}:</strong> ${file.name}</span>
                <div style="font-size: 12px; color: #94a3b8;">
                    ${formatFileSize(file.size)} • ${file.type || 'Unknown type'}
                </div>
            </div>
            <div style="display: flex; gap: 5px;">
                <button type="button" class="btn btn-success btn-sm" onclick="uploadSingleDocument('${fileId}', this)">
                    <i class="fas fa-upload"></i> Yükle
                </button>
                <button type="button" class="btn btn-danger btn-sm" onclick="removeDocumentItem('${fileId}')" style="padding: 4px 8px; font-size: 12px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Metadata'ları sakla
        fileItem.dataset.fileInfo = JSON.stringify({
            id: fileId,
            type: docType,
            name: file.name,
            size: file.size,
            mimeType: file.type,
            status: 'pending'
        });
        
        fileList.appendChild(fileItem);
        console.log(`✅ DOM öğesi eklendi: ${fileId}`, fileItem);
    }
    
    // Input'u temizle
    fileInput.value = '';
}

// Tekil belge yükle
async function uploadSingleDocument(fileId, button) {
    console.log('🔍 uploadSingleDocument çağrıldı:', fileId);
    
    const fileItem = document.getElementById(fileId) || document.querySelector(`[data-file-id="${fileId}"]`);
    if (!fileItem) {
        console.error('❌ Dosya öğesi bulunamadı:', fileId);
        showError('Dosya bulunamadı');
        return;
    }
    
    // File objesini al
    const file = fileItem.fileObject;
    if (!file) {
        console.error('❌ File object bulunamadı:', fileId);
        showError('Dosya objesi bulunamadı');
        return;
    }
    
    // File bilgilerini al
    let fileInfo;
    try {
        fileInfo = JSON.parse(fileItem.dataset.fileInfo || '{}');
        console.log('📋 Dosya bilgileri:', fileInfo);
    } catch (error) {
        console.error('❌ fileInfo parse hatası:', error);
        fileInfo = { type: 'Belge' };
    }
    
    console.log('📁 Yüklenecek dosya:', {
        name: file.name,
        size: file.size,
        type: file.type,
        docType: fileInfo.type
    });
    
    const originalButtonHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yükleniyor...';
    button.disabled = true;
    
    try {
        const uploadedDoc = await uploadDocumentAPI(file, fileInfo.type);
        
        if (uploadedDoc) {
            // Başarılı - uploadedDoc'u sakla
            fileItem.dataset.uploaded = 'true';
            
            // Güncellenmiş fileInfo'yu kaydet
            fileInfo.status = 'uploaded';
            fileInfo.uploadedDoc = uploadedDoc;
            fileItem.dataset.fileInfo = JSON.stringify(fileInfo);
            
            button.innerHTML = '<i class="fas fa-check"></i> Yüklendi';
            button.className = 'btn btn-success btn-sm disabled';
            button.disabled = true;
            
            console.log('✅ Dosya başarıyla yüklendi:', uploadedDoc);
            showSuccess(`${file.name} başarıyla yüklendi.`);
        } else {
            throw new Error('Belge yüklenemedi (null döndü)');
        }
    } catch (error) {
        console.error('❌ Dosya yükleme hatası:', error);
        button.innerHTML = originalButtonHTML;
        button.disabled = false;
        showError(`${file.name} yüklenemedi: ${error.message}`);
    }
}

// Belge öğesini sil
function removeDocumentItem(fileId) {
    const fileItem = document.getElementById(fileId) || document.querySelector(`[data-file-id="${fileId}"]`);
    if (fileItem) {
        fileItem.remove();
    }
}

// Yeni dosyayı kaydet
async function saveNewFile() {
    if (isSubmitting) return;
    isSubmitting = true;
    
    try {
        const clientName = document.getElementById('clientName').value.trim();
        const plate = document.getElementById('plate').value.trim();
        
        if (!clientName || !plate) {
            alert('Müvekkil adı ve plaka bilgisi zorunludur.');
            isSubmitting = false;
            return;
        }
        
        // Çoklu dosya türlerini al
        const selectedFileTypes = [];
        const checkboxes = document.querySelectorAll('input[name="fileTypes"]:checked');
        checkboxes.forEach(checkbox => {
            selectedFileTypes.push(checkbox.value);
        });
        
        if (selectedFileTypes.length === 0) {
            alert('Lütfen en az bir dosya türü seçin.');
            isSubmitting = false;
            return;
        }
        
        // Yüklenen belgeleri topla
        const fileItems = document.querySelectorAll('#uploadedFilesListNew .file-item');
        const documents = [];
        
        for (const item of fileItems) {
            const fileInfo = JSON.parse(item.dataset.fileInfo || '{}');
            if (fileInfo.status === 'uploaded' && fileInfo.uploadedDoc) {
                documents.push(fileInfo.uploadedDoc);
            }
        }
        
        const newFile = {
            id: generateId(),
            registrationDate: new Date().toISOString(),
            clientName,
            tc: document.getElementById('tc').value.trim(),
            plate,
            driverName: document.getElementById('driverName').value.trim(),
            fileTypes: selectedFileTypes,
            fileType: selectedFileTypes.length === 1 ? selectedFileTypes[0] : 'Çoklu',
            fileStatus: document.getElementById('fileStatus').value || 'Başvuruya Hazır',
            opponentName: document.getElementById('opponentName').value.trim(),
            opponentPlate: document.getElementById('opponentPlate').value.trim(),
            opponentDriver: document.getElementById('opponentDriver').value.trim(),
            insuranceCompany: document.getElementById('insuranceCompany').value.trim(),
            percentage: document.getElementById('percentage').value.trim(),
            master: document.getElementById('master').value.trim(),
            insuranceApplicationDate: document.getElementById('insuranceApplicationDate').value,
            arbitrationApplicationDate: document.getElementById('arbitrationApplicationDate').value,
            enforcementApplicationDate: document.getElementById('enforcementApplicationDate').value,
            currentStatus: document.getElementById('currentStatus').value.trim(),
            notes: document.getElementById('notes').value.trim(),
            documents: documents
        };
        
        console.log('💾 Yeni dosya verisi:', newFile);
        
        // API'ye gönder
        const result = await addFileAPI(newFile);
        
        if (result && result.success) {
            // Yerel listeyi güncelle
            files.push(newFile);
            
            showSuccess('Dosya başarıyla kaydedildi.');
            await loadFiles();
            showFileList();
            await updateStats();
        } else {
            throw new Error('Dosya kaydedilemedi');
        }
        
    } catch (error) {
        console.error('Dosya kaydetme hatası:', error);
        showError(`Dosya kaydedilirken bir hata oluştu: ${error.message}`);
    } finally {
        isSubmitting = false;
    }
}

// ==================== DÜZENLEME İŞLEMLERİ ====================

// Düzenleme formunu render et
function renderEditForm(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    const fileEdit = document.getElementById('fileEdit');
    
    const fileTypeCheckboxes = fileTypes.map(type => `
        <div class="checkbox-item">
            <input type="checkbox" id="editFileType_${type.replace(/\s+/g, '_')}" name="editFileTypes" value="${type}" 
                ${(file.fileTypes && file.fileTypes.includes(type)) || file.fileType === type ? 'checked' : ''}>
            <label for="editFileType_${type.replace(/\s+/g, '_')}">${type}</label>
        </div>
    `).join('');
    
    const fileStatusOptions = fileStatuses.map(status => 
        `<option value="${status}" ${file.fileStatus === status ? 'selected' : ''}>${status}</option>`
    ).join('');
    
    const documentTypeOptions = allDocumentTypes.map(type => 
        `<option value="${type}">${type}</option>`
    ).join('');
    
    // Mevcut belgeleri listele
    const currentDocumentsHtml = file.documents && file.documents.length > 0 ? 
        file.documents.map(doc => {
            const docId = doc.id || doc._id || '';
            const safeDocId = docId.replace(/'/g, "\\'").replace(/"/g, '\\"');
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: white; border-radius: var(--radius); margin-bottom: 8px; border: 1px solid var(--border);">
                    <div>
                        <div><strong>${doc.type}:</strong> ${doc.name || doc.originalname || 'Belge'}</div>
                        <div style="font-size: 12px; color: #94a3b8;">${formatDate(doc.uploadedDate || doc.createdAt)} • ${formatFileSize(doc.size)}</div>
                    </div>
                    <button type="button" class="btn btn-danger btn-sm" onclick="removeDocumentFromFile('${file.id}', '${safeDocId}')" style="padding: 4px 8px; font-size: 12px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('') : 
        '<div style="text-align: center; padding: 15px; color: #94a3b8;">Henüz belge yüklenmemiş</div>';
    
    fileEdit.innerHTML = `
        <form id="editFileForm" onsubmit="saveEditedFile('${file.id}'); return false;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                <div class="form-section">
                    <h3><i class="fas fa-user"></i> Genel Bilgiler</h3>
                    <div class="form-row">
                        <label for="editClientName">Müvekkil Adı *</label>
                        <input type="text" id="editClientName" value="${file.clientName || ''}" required>
                    </div>
                    <div class="form-row">
                        <label for="editTc">TC Kimlik No</label>
                        <input type="text" id="editTc" value="${file.tc || ''}">
                    </div>
                    <div class="form-row">
                        <label for="editPlate">Araç Plakası *</label>
                        <input type="text" id="editPlate" value="${file.plate || ''}" required>
                    </div>
                    <div class="form-row">
                        <label for="editDriverName">Sürücü Adı</label>
                        <input type="text" id="editDriverName" value="${file.driverName || ''}">
                    </div>
                </div>
                
                <div class="form-section">
                    <h3><i class="fas fa-folder"></i> Dosya Bilgileri</h3>
                    <div class="form-row">
                        <label>Dosya Türü (Çoklu Seçim) *</label>
                        <div class="checkbox-group">
                            ${fileTypeCheckboxes}
                        </div>
                    </div>
                    <div class="form-row">
                        <label for="editFileStatus">Dosya Durumu</label>
                        <select id="editFileStatus">
                            ${fileStatusOptions}
                        </select>
                    </div>
                    <div class="form-row">
                        <label for="editPercentage">Oran Bilgisi</label>
                        <input type="text" id="editPercentage" value="${file.percentage || ''}" placeholder="%20">
                    </div>
                    <div class="form-row">
                        <label for="editMaster">Ustası</label>
                        <input type="text" id="editMaster" value="${file.master || ''}">
                    </div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                <div class="form-section">
                    <h3><i class="fas fa-users"></i> Karşı Taraf Bilgileri</h3>
                    <div class="form-row">
                        <label for="editOpponentName">Adı Soyadı</label>
                        <input type="text" id="editOpponentName" value="${file.opponentName || ''}">
                    </div>
                    <div class="form-row">
                        <label for="editOpponentPlate">Plakası</label>
                        <input type="text" id="editOpponentPlate" value="${file.opponentPlate || ''}">
                    </div>
                    <div class="form-row">
                        <label for="editOpponentDriver">Sürücü Adı</label>
                        <input type="text" id="editOpponentDriver" value="${file.opponentDriver || ''}">
                    </div>
                    <div class="form-row">
                        <label for="editInsuranceCompany">Sigorta Şirketi</label>
                        <input type="text" id="editInsuranceCompany" value="${file.insuranceCompany || ''}">
                    </div>
                </div>
                
                <div class="form-section">
                    <h3><i class="fas fa-calendar-alt"></i> Süreç Takibi</h3>
                    <div class="form-row">
                        <label for="editInsuranceApplicationDate">Sigorta Başvuru Tarihi</label>
                        <input type="date" id="editInsuranceApplicationDate" value="${file.insuranceApplicationDate ? file.insuranceApplicationDate.split('T')[0] : ''}">
                    </div>
                    <div class="form-row">
                        <label for="editArbitrationApplicationDate">Tahkim Başvuru Tarihi</label>
                        <input type="date" id="editArbitrationApplicationDate" value="${file.arbitrationApplicationDate ? file.arbitrationApplicationDate.split('T')[0] : ''}">
                    </div>
                    <div class="form-row">
                        <label for="editEnforcementApplicationDate">İcra Başvuru Tarihi</label>
                        <input type="date" id="editEnforcementApplicationDate" value="${file.enforcementApplicationDate ? file.enforcementApplicationDate.split('T')[0] : ''}">
                    </div>
                    <div class="form-row">
                        <label for="editCurrentStatus">Güncel Durum</label>
                        <input type="text" id="editCurrentStatus" value="${file.currentStatus || ''}">
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <h3><i class="fas fa-sticky-note"></i> Notlar</h3>
                <div class="form-row">
                    <label for="editNotes">Dosya Notları</label>
                    <textarea id="editNotes" placeholder="Dosya hakkında notlar...">${file.notes || ''}</textarea>
                </div>
            </div>
            
            <div class="form-section">
                <h3><i class="fas fa-paperclip"></i> Belge Yükleme</h3>
                <div class="form-row">
                    <label>Yeni Belge Türü</label>
                    <select id="editDocumentType">
                        <option value="">Belge Seçin</option>
                        ${documentTypeOptions}
                    </select>
                </div>
                <div class="form-row">
                    <input type="file" id="editDocumentFile" multiple>
                </div>
                <button type="button" class="btn btn-secondary" onclick="addDocumentToEdit()">
                    <i class="fas fa-plus"></i> Yeni Belge Ekle
                </button>
                
                <h4 style="margin-top: 20px; margin-bottom: 10px;">Mevcut Belgeler</h4>
                <div style="margin-top: 15px;" id="editUploadedFilesList">
                    ${currentDocumentsHtml}
                </div>
                
                <div style="margin-top: 15px;" id="newFilesListEdit">
                    <!-- Yeni eklenen dosyalar burada listelenecek -->
                </div>
            </div>
            
            <div style="display: flex; gap: 15px; margin-top: 30px; padding-top: 20px; border-top: 2px solid var(--border); justify-content: flex-end;">
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> Değişiklikleri Kaydet
                </button>
                <button type="button" class="btn btn-secondary" onclick="cancelEdit()">
                    <i class="fas fa-times"></i> İptal
                </button>
            </div>
        </form>
    `;
}

// Düzenleme modunu aç
function editFile(fileId) {
    isEditing = true;
    document.getElementById('fileView').style.display = 'none';
    document.getElementById('fileEdit').style.display = 'block';
    document.getElementById('editFileBtn').innerHTML = '<i class="fas fa-times"></i> İptal';
    
    renderEditForm(fileId);
}

// Düzenlemeyi iptal et
function cancelEdit() {
    isEditing = false;
    document.getElementById('fileEdit').style.display = 'none';
    document.getElementById('fileView').style.display = 'block';
    document.getElementById('editFileBtn').innerHTML = '<i class="fas fa-edit"></i> Düzenle';
    
    // Detay sayfasını yenile
    if (currentFileId) {
        renderFileDetail(currentFileId);
    }
}

// Düzenleme formuna belge ekle
function addDocumentToEdit() {
    const docType = document.getElementById('editDocumentType').value;
    const fileInput = document.getElementById('editDocumentFile');
    
    console.log('🔍 addDocumentToEdit çağrıldı:', docType, fileInput.files);
    
    if (!docType) {
        alert('Lütfen bir belge türü seçin.');
        return;
    }
    
    if (fileInput.files.length === 0) {
        alert('Lütfen bir dosya seçin.');
        return;
    }
    
    const fileList = document.getElementById('newFilesListEdit');
    
    for (let i = 0; i < fileInput.files.length; i++) {
        const file = fileInput.files[i];
        console.log('📁 İşlenen dosya:', file);
        
        const fileId = 'edit_file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.id = fileId;
        fileItem.setAttribute('data-file-id', fileId);
        fileItem.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px; background: white; border-radius: var(--radius); margin-bottom: 8px; border: 1px solid var(--border);';
        
        // File objesini sakla
        fileItem.fileObject = file;
        
        fileItem.innerHTML = `
            <div>
                <span><strong>${docType}:</strong> ${file.name}</span>
                <div style="font-size: 12px; color: #94a3b8;">${formatFileSize(file.size)}</div>
            </div>
            <div style="display: flex; gap: 5px;">
                <button type="button" class="btn btn-success btn-sm" onclick="uploadSingleDocumentForEdit('${fileId}', this)">
                    <i class="fas fa-upload"></i> Yükle
                </button>
                <button type="button" class="btn btn-danger btn-sm" onclick="removeDocumentEditItem('${fileId}')" style="padding: 4px 8px; font-size: 12px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Metadata'yı kaydet
        fileItem.dataset.fileInfo = JSON.stringify({
            id: fileId,
            type: docType,
            name: file.name,
            size: file.size,
            fileType: file.type,
            status: 'pending'
        });
        
        fileList.appendChild(fileItem);
        console.log('✅ Dosya öğesi eklendi:', fileId);
    }
    
    fileInput.value = '';
}

// Düzenleme için tekil belge yükle
async function uploadSingleDocumentForEdit(fileId, button) {
    console.log('🔍 uploadSingleDocumentForEdit çağrıldı:', fileId);
    
    const fileItem = document.getElementById(fileId) || document.querySelector(`[data-file-id="${fileId}"]`);
    if (!fileItem) {
        console.error('❌ Dosya öğesi bulunamadı:', fileId);
        return;
    }
    
    // File objesini al
    const file = fileItem.fileObject;
    if (!file) {
        console.error('❌ File object bulunamadı:', fileId);
        showError('Dosya objesi bulunamadı');
        return;
    }
    
    const fileInfo = JSON.parse(fileItem.dataset.fileInfo || '{}');
    console.log('📁 Yüklenecek dosya:', file);
    console.log('📋 Dosya bilgileri:', fileInfo);
    
    const originalButtonHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yükleniyor...';
    button.disabled = true;
    
    try {
        const uploadedDoc = await uploadDocumentAPI(file, fileInfo.type);
        if (uploadedDoc) {
            // Başarılı
            fileItem.dataset.uploaded = 'true';
            
            // Güncellenmiş fileInfo
            fileInfo.status = 'uploaded';
            fileInfo.uploadedDoc = uploadedDoc;
            fileItem.dataset.fileInfo = JSON.stringify(fileInfo);
            
            button.innerHTML = '<i class="fas fa-check"></i> Yüklendi';
            button.className = 'btn btn-success btn-sm disabled';
            
            console.log('✅ Dosya başarıyla yüklendi:', uploadedDoc);
            showSuccess(`${file.name} başarıyla yüklendi.`);
        } else {
            throw new Error('Belge yüklenemedi (null döndü)');
        }
    } catch (error) {
        console.error('❌ Dosya yükleme hatası:', error);
        button.innerHTML = originalButtonHTML;
        button.disabled = false;
        showError(`${file.name} yüklenemedi: ${error.message}`);
    }
}

// Düzenleme belge öğesini sil
function removeDocumentEditItem(fileId) {
    const fileItem = document.getElementById(fileId) || document.querySelector(`[data-file-id="${fileId}"]`);
    if (fileItem) {
        fileItem.remove();
    }
}

// Düzenlenen dosyayı kaydet
async function saveEditedFile(fileId) {
    if (isSubmitting) return;
    isSubmitting = true;
    
    try {
        const fileIndex = files.findIndex(f => f.id === fileId);
        if (fileIndex === -1) {
            alert('Dosya bulunamadı.');
            isSubmitting = false;
            return;
        }
        
        const clientName = document.getElementById('editClientName').value.trim();
        const plate = document.getElementById('editPlate').value.trim();
        
        if (!clientName || !plate) {
            alert('Müvekkil adı ve plaka bilgisi zorunludur.');
            isSubmitting = false;
            return;
        }
        
        // Çoklu dosya türlerini al
        const selectedFileTypes = [];
        const checkboxes = document.querySelectorAll('input[name="editFileTypes"]:checked');
        checkboxes.forEach(checkbox => {
            selectedFileTypes.push(checkbox.value);
        });
        
        if (selectedFileTypes.length === 0) {
            alert('Lütfen en az bir dosya türü seçin.');
            isSubmitting = false;
            return;
        }
        
        // Mevcut dosya
        const file = files[fileIndex];
        
        // Yeni yüklenen belgeleri topla
        const newFileItems = document.querySelectorAll('#newFilesListEdit .file-item');
        const newDocuments = [...file.documents];
        
        for (const item of newFileItems) {
            const fileInfo = JSON.parse(item.dataset.fileInfo || '{}');
            if (fileInfo.status === 'uploaded' && fileInfo.uploadedDoc) {
                newDocuments.push(fileInfo.uploadedDoc);
            }
        }
        
        // Güncellenmiş dosya
        const updatedFile = {
            ...file,
            clientName,
            tc: document.getElementById('editTc').value.trim(),
            plate,
            driverName: document.getElementById('editDriverName').value.trim(),
            fileTypes: selectedFileTypes,
            fileType: selectedFileTypes.length === 1 ? selectedFileTypes[0] : 'Çoklu',
            fileStatus: document.getElementById('editFileStatus').value,
            opponentName: document.getElementById('editOpponentName').value.trim(),
            opponentPlate: document.getElementById('editOpponentPlate').value.trim(),
            opponentDriver: document.getElementById('editOpponentDriver').value.trim(),
            insuranceCompany: document.getElementById('editInsuranceCompany').value.trim(),
            percentage: document.getElementById('editPercentage').value.trim(),
            master: document.getElementById('editMaster').value.trim(),
            insuranceApplicationDate: document.getElementById('editInsuranceApplicationDate').value,
            arbitrationApplicationDate: document.getElementById('editArbitrationApplicationDate').value,
            enforcementApplicationDate: document.getElementById('editEnforcementApplicationDate').value,
            currentStatus: document.getElementById('editCurrentStatus').value.trim(),
            notes: document.getElementById('editNotes').value.trim(),
            documents: newDocuments
        };
        
        // API'ye gönder
        const result = await updateFileAPI(fileId, updatedFile);
        if (result && result.success) {
            // Yerel listeyi güncelle
            files[fileIndex] = updatedFile;
            
            showSuccess('Dosya başarıyla güncellendi.');
            cancelEdit();
            renderFileDetail(fileId);
            updateStats();
        } else {
            throw new Error('Dosya güncellenemedi');
        }
        
    } catch (error) {
        console.error('Dosya güncelleme hatası:', error);
        showError(`Dosya güncellenirken bir hata oluştu: ${error.message}`);
    } finally {
        isSubmitting = false;
    }
}

// ==================== DİĞER İŞLEMLER ====================

// Dosyayı sil
async function deleteFile(fileId) {
    if (!confirm('Bu dosyayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
        return;
    }
    
    const success = await deleteFileAPI(fileId);
    if (success) {
        // Yerel listeyi güncelle
        files = files.filter(f => f.id !== fileId);
        
        showSuccess('Dosya başarıyla silindi.');
        
        if (currentFileId === fileId) {
            showFileList();
        } else {
            renderFilesTable();
        }
        
        updateStats();
    }
}

// Dosyaları ara
function searchFiles() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    
    if (!searchTerm) {
        renderFilesTable();
        return;
    }
    
    const filteredFiles = files.filter(file => 
        file.clientName.toLowerCase().includes(searchTerm) ||
        file.plate.toLowerCase().includes(searchTerm) ||
        (file.tc && file.tc.toLowerCase().includes(searchTerm)) ||
        (file.opponentName && file.opponentName.toLowerCase().includes(searchTerm)) ||
        (file.opponentPlate && file.opponentPlate.toLowerCase().includes(searchTerm))
    );
    
    renderFilesTable(filteredFiles);
}

// Arama temizle
function clearSearch() {
    document.getElementById('searchInput').value = '';
    renderFilesTable();
}

// İstatistikleri güncelle
async function updateStats() {
    try {
        const stats = await getStatsAPI();
        if (!stats) return;
        
        // Dosya türü istatistikleri
        const typeStatsHTML = Object.entries(stats.typeStats || {})
            .filter(([type, count]) => count > 0)
            .map(([type, count]) => `
                <div class="stat-item">
                    <div class="stat-label">${type}</div>
                    <div class="stat-count">${count}</div>
                </div>
            `).join('');
        
        const fileTypeStatsEl = document.getElementById('fileTypeStats');
        if (fileTypeStatsEl) {
            fileTypeStatsEl.innerHTML = typeStatsHTML || 
                '<div style="text-align: center; padding: 15px; color: #94a3b8;">Henüz dosya eklenmemiş</div>';
        }
        
        // Dosya durumu istatistikleri
        const statusStatsHTML = Object.entries(stats.statusStats || {})
            .filter(([status, count]) => count > 0)
            .map(([status, count]) => `
                <div class="stat-item">
                    <div class="stat-label">${status}</div>
                    <div class="stat-count">${count}</div>
                </div>
            `).join('');
        
        const fileStatusStatsEl = document.getElementById('fileStatusStats');
        if (fileStatusStatsEl) {
            fileStatusStatsEl.innerHTML = statusStatsHTML || 
                '<div style="text-align: center; padding: 15px; color: #94a3b8;">Henüz dosya eklenmemiş</div>';
        }
        
        // Başvuruya hazır dosya sayısı
        const readyFilesCountEl = document.getElementById('readyFilesCount');
        if (readyFilesCountEl) {
            readyFilesCountEl.textContent = stats.readyFilesCount || 0;
        }
        
        // Evrak tedarik dosya sayısı
        const pendingFilesCountEl = document.getElementById('pendingFilesCount');
        if (pendingFilesCountEl) {
            pendingFilesCountEl.textContent = stats.pendingFilesCount || 0;
        }
        
    } catch (error) {
        console.error('İstatistik güncelleme hatası:', error);
    }
}

// Global fonksiyonlar
window.addDocument = addDocument;
window.uploadSingleDocument = uploadSingleDocument;
window.removeDocumentItem = removeDocumentItem;
window.uploadSingleDocumentForEdit = uploadSingleDocumentForEdit;
window.removeDocumentEditItem = removeDocumentEditItem;
window.showFileDetail = showFileDetail;
window.showNewFileForm = showNewFileForm;
window.showFileList = showFileList;
window.deleteFile = deleteFile;
window.viewDocument = viewDocument;
window.downloadDocument = downloadDocument;
window.removeDocumentFromFile = removeDocumentFromFile;
window.markAsApplied = markAsApplied;
window.markAsReady = markAsReady;