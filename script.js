// API Configuration
const API_BASE = 'https://api.myquran.com/v2';

// Global State
const state = {
    surahs: [],
    currentSurah: null,
    currentAyat: null,
    bookmarks: JSON.parse(localStorage.getItem('bookmarks')) || [],
    lastRead: JSON.parse(localStorage.getItem('lastRead')) || null,
    settings: JSON.parse(localStorage.getItem('settings')) || {
        theme: 'light',
        arabicSize: 28,
        translationSize: 16,
        qari: '01',
        autoPlayNext: false
    }
};

// DOM Elements
const elements = {
    pages: document.querySelectorAll('.page'),
    loadingScreen: document.getElementById('loadingScreen'),
    suratGrid: document.getElementById('suratGrid'),
    juzGrid: document.getElementById('juzGrid'),
    ayatContainer: document.getElementById('ayatContainer'),
    tafsirContent: document.getElementById('tafsirContent'),
    bookmarksList: document.getElementById('bookmarksList'),
    searchSurat: document.getElementById('searchSurat'),
    toast: document.getElementById('toast')
};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
    setupEventListeners();
    applySettings();
});

async function initializeApp() {
    try {
        // Load surahs
        await loadSurahs();
        
        // Setup navigation
        setupNavigation();
        
        // Load last read
        if (state.lastRead) {
            displayLastRead();
        }
        
        // Hide loading screen
        setTimeout(() => {
            elements.loadingScreen.classList.add('hide');
        }, 1000);
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showToast('Gagal memuat aplikasi. Silakan refresh halaman.');
    }
}

// Load Surahs
async function loadSurahs() {
    try {
        const response = await fetch(`${API_BASE}/surat/semua`);
        const data = await response.json();
        
        if (data.code === 200) {
            state.surahs = data.data;
            displaySurahs(state.surahs);
        }
    } catch (error) {
        console.error('Failed to load surahs:', error);
        showToast('Gagal memuat daftar surat');
    }
}

// Display Surahs
function displaySurahs(surahs) {
    elements.suratGrid.innerHTML = '';
    
    surahs.forEach(surah => {
        const card = document.createElement('div');
        card.className = 'surat-card';
        card.onclick = () => loadSurahDetail(surah.nomor);
        
        card.innerHTML = `
            <div class="surat-number-box">${surah.nomor}</div>
            <div class="surat-card-content">
                <div class="surat-card-header">
                    <span class="surat-latin">${surah.namaLatin}</span>
                    <span class="surat-arabic">${surah.nama}</span>
                </div>
                <div class="surat-meta">
                    ${surah.tempatTurun} • ${surah.jumlahAyat} Ayat • ${surah.arti}
                </div>
            </div>
        `;
        
        elements.suratGrid.appendChild(card);
    });
}

// Load Surah Detail
async function loadSurahDetail(surahNumber) {
    try {
        showLoadingState();
        
        const response = await fetch(`${API_BASE}/surat/${surahNumber}`);
        const data = await response.json();
        
        if (data.code === 200) {
            state.currentSurah = data.data;
            displaySurahDetail(data.data);
            
            // Update last read
            updateLastRead(surahNumber, 1);
            
            // Navigate to detail page
            navigateToPage('suratDetail');
        }
    } catch (error) {
        console.error('Failed to load surah detail:', error);
        showToast('Gagal memuat detail surat');
    } finally {
        hideLoadingState();
    }
}

// Display Surah Detail
function displaySurahDetail(surah) {
    // Update header
    document.getElementById('suratInfo').innerHTML = `
        <h1>${surah.namaLatin} - ${surah.nama}</h1>
        <p>${surah.tempatTurun} • ${surah.jumlahAyat} Ayat • ${surah.arti}</p>
    `;
    
    // Setup audio
    const audio = document.getElementById('suratAudio');
    const qari = state.settings.qari;
    audio.src = `https://media.e-quran.id/audio-full/${qari}/${String(surah.nomor).padStart(3, '0')}.mp3`;
    
    // Clear and populate ayat container
    elements.ayatContainer.innerHTML = '';
    
    // Add bismillah for applicable surahs
    if (surah.nomor !== 1 && surah.nomor !== 9) {
        const bismillah = createBismillah();
        elements.ayatContainer.appendChild(bismillah);
    }
    
    // Add ayat items
    surah.ayat.forEach(ayat => {
        const ayatItem = createAyatItem(surah.nomor, ayat);
        elements.ayatContainer.appendChild(ayatItem);
    });
}

// Create Ayat Item
function createAyatItem(surahNumber, ayat) {
    const div = document.createElement('div');
    div.className = 'ayat-item';
    div.id = `ayat-${ayat.nomorAyat}`;
    
    const isBookmarked = state.bookmarks.some(b => 
        b.surah === surahNumber && b.ayat === ayat.nomorAyat
    );
    
    div.innerHTML = `
        <div class="ayat-header">
            <span class="ayat-number-badge">${ayat.nomorAyat}</span>
            <div class="ayat-actions">
                <button class="ayat-action-btn" onclick="playAyat(${surahNumber}, ${ayat.nomorAyat})" title="Play">
                    <i class="fas fa-play"></i>
                </button>
                <button class="ayat-action-btn" onclick="showTafsir(${surahNumber}, ${ayat.nomorAyat})" title="Tafsir">
                    <i class="fas fa-book"></i>
                </button>
                <button class="ayat-action-btn ${isBookmarked ? 'bookmarked' : ''}" 
                        onclick="toggleBookmark(${surahNumber}, ${ayat.nomorAyat})" 
                        title="Bookmark">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="ayat-action-btn" onclick="copyAyat('${ayat.teksArab}', '${ayat.teksIndonesia}')" title="Copy">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="ayat-action-btn" onclick="shareAyat(${surahNumber}, ${ayat.nomorAyat})" title="Share">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        </div>
        <div class="ayat-arabic" style="font-size: ${state.settings.arabicSize}px">
            ${ayat.teksArab}
        </div>
        <div class="ayat-translation" style="font-size: ${state.settings.translationSize}px">
            ${ayat.teksIndonesia}
        </div>
    `;
    
    return div;
}

// Create Bismillah
function createBismillah() {
    const div = document.createElement('div');
    div.className = 'ayat-item';
    div.innerHTML = `
        <div class="ayat-arabic" style="font-size: ${state.settings.arabicSize}px; text-align: center;">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>
        <div class="ayat-translation" style="font-size: ${state.settings.translationSize}px; text-align: center;">
            Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.
        </div>
    `;
    return div;
}

// Play Ayat Audio
async function playAyat(surahNumber, ayatNumber) {
    try {
        const qari = state.settings.qari;
        const surahPadded = String(surahNumber).padStart(3, '0');
        const ayatPadded = String(ayatNumber).padStart(3, '0');
        const audioUrl = `https://media.e-quran.id/audio/${qari}/${surahPadded}${ayatPadded}.mp3`;
        
        const audio = new Audio(audioUrl);
        audio.play();
        
        // Auto play next if enabled
        if (state.settings.autoPlayNext) {
            audio.addEventListener('ended', () => {
                const nextAyat = ayatNumber + 1;
                const totalAyat = state.currentSurah.jumlahAyat;
                
                if (nextAyat <= totalAyat) {
                    playAyat(surahNumber, nextAyat);
                    
                    // Scroll to next ayat
                    const nextElement = document.getElementById(`ayat-${nextAyat}`);
                    if (nextElement) {
                        nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            });
        }
    } catch (error) {
        console.error('Failed to play ayat:', error);
        showToast('Gagal memutar audio');
    }
}

// Show Tafsir
async function showTafsir(surahNumber, ayatNumber) {
    try {
        const response = await fetch(`${API_BASE}/tafsir/${surahNumber}/${ayatNumber}`);
        const data = await response.json();
        
        if (data.code === 200) {
            const tafsir = data.data;
            
            elements.tafsirContent.innerHTML = `
                <h3>${tafsir.surah.namaLatin} : ${ayatNumber}</h3>
                <div class="ayat-arabic" style="margin: 1rem 0;">
                    ${tafsir.ayat.teksArab}
                </div>
                <p><strong>Terjemahan:</strong></p>
                <p style="margin-bottom: 1rem;">${tafsir.ayat.teksIndonesia}</p>
                <p><strong>Tafsir:</strong></p>
                <p style="line-height: 1.8;">${tafsir.tafsir.teksTafsir}</p>
            `;
            
            document.getElementById('tafsirModal').classList.add('show');
        }
    } catch (error) {
        console.error('Failed to load tafsir:', error);
        showToast('Gagal memuat tafsir');
    }
}

// Close Tafsir Modal
function closeTafsirModal() {
    document.getElementById('tafsirModal').classList.remove('show');
}

// Toggle Bookmark
function toggleBookmark(surahNumber, ayatNumber) {
    const index = state.bookmarks.findIndex(b => 
        b.surah === surahNumber && b.ayat === ayatNumber
    );
    
    if (index > -1) {
        // Remove bookmark
        state.bookmarks.splice(index, 1);
        showToast('Bookmark dihapus');
    } else {
        // Add bookmark
        const surah = state.surahs.find(s => s.nomor === surahNumber);
        const ayat = state.currentSurah.ayat.find(a => a.nomorAyat === ayatNumber);
        
        state.bookmarks.push({
            surah: surahNumber,
            ayat: ayatNumber,
            surahName: surah.namaLatin,
            arabicText: ayat.teksArab,
            translation: ayat.teksIndonesia,
            timestamp: Date.now()
        });
        
        showToast('Bookmark ditambahkan');
    }
    
    // Save to localStorage
    localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
    
    // Update UI
    const button = document.querySelector(`#ayat-${ayatNumber} .ayat-action-btn:nth-child(3)`);
    if (button) {
        button.classList.toggle('bookmarked');
    }
    
    // Update bookmarks page if visible
    if (document.getElementById('bookmarksPage').classList.contains('active')) {
        displayBookmarks();
    }
}

// Display Bookmarks
function displayBookmarks() {
    if (state.bookmarks.length === 0) {
        elements.bookmarksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bookmark"></i>
                <p>Belum ada ayat yang disimpan</p>
            </div>
        `;
        return;
    }
    
    elements.bookmarksList.innerHTML = '';
    
    state.bookmarks.reverse().forEach((bookmark, index) => {
        const item = document.createElement('div');
        item.className = 'bookmark-item';
        
        item.innerHTML = `
            <div class="bookmark-header">
                <span class="bookmark-surah">${bookmark.surahName} : ${bookmark.ayat}</span>
                <button class="bookmark-delete" onclick="deleteBookmark(${state.bookmarks.length - 1 - index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="bookmark-arabic">${bookmark.arabicText}</div>
            <div class="bookmark-translation">${bookmark.translation}</div>
        `;
        
        item.onclick = (e) => {
            if (!e.target.closest('.bookmark-delete')) {
                loadSurahDetail(bookmark.surah);
                setTimeout(() => {
                    document.getElementById(`ayat-${bookmark.ayat}`).scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }, 500);
            }
        };
        
        elements.bookmarksList.appendChild(item);
    });
}

// Delete Bookmark
function deleteBookmark(index) {
    state.bookmarks.splice(index, 1);
    localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
    displayBookmarks();
    showToast('Bookmark dihapus');
}

// Copy Ayat
function copyAyat(arabic, translation) {
    const text = `${arabic}\n\n${translation}`;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Ayat berhasil disalin');
        });
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Ayat berhasil disalin');
    }
}

// Share Ayat
function shareAyat(surahNumber, ayatNumber) {
    const surah = state.surahs.find(s => s.nomor === surahNumber);
    const ayat = state.currentSurah.ayat.find(a => a.nomorAyat === ayatNumber);
    
    const text = `${surah.namaLatin} : ${ayatNumber}\n\n${ayat.teksArab}\n\n${ayat.teksIndonesia}`;
    
    if (navigator.share) {
        navigator.share({
            title: `${surah.namaLatin} : ${ayatNumber}`,
            text: text
        });
    } else {
        copyAyat(ayat.teksArab, ayat.teksIndonesia);
    }
}

// Setup Navigation
function setupNavigation() {
    // Desktop navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            navigateToPage(page);
            
            // Update active state
            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
            });
            item.classList.add('active');
        });
    });
    
    // Mobile navigation
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            navigateToPage(page);
            
            // Update active state
            document.querySelectorAll('.mobile-nav-item').forEach(nav => {
                nav.classList.remove('active');
            });
            item.classList.add('active');
        });
    });
}

// Navigate to Page
function navigateToPage(pageName) {
    // Hide all pages
    elements.pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const targetPage = document.getElementById(`${pageName}Page`);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Load page-specific content
        switch(pageName) {
            case 'juz':
                displayJuz();
                break;
            case 'bookmarks':
                displayBookmarks();
                break;
        }
    }
}

// Display Juz
function displayJuz() {
    elements.juzGrid.innerHTML = '';
    
    for (let i = 1; i <= 30; i++) {
        const card = document.createElement('div');
        card.className = 'juz-card';
        card.onclick = () => showToast(`Juz ${i} - Fitur dalam pengembangan`);
        
        card.innerHTML = `
            <div class="juz-number">${i}</div>
            <div>Juz ${i}</div>
        `;
        
        elements.juzGrid.appendChild(card);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Search functionality
    elements.searchSurat.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = state.surahs.filter(surah => 
            surah.namaLatin.toLowerCase().includes(query) ||
            surah.arti.toLowerCase().includes(query) ||
            surah.nama.includes(query)
        );
        displaySurahs(filtered);
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            
            // Filter surahs
            let filtered = state.surahs;
            if (filter !== 'all') {
                filtered = state.surahs.filter(s => 
                    s.tempatTurun.toLowerCase() === filter
                );
            }
            displaySurahs(filtered);
        });
    });
    
    // Settings
    document.getElementById('themeSelect').addEventListener('change', (e) => {
        state.settings.theme = e.target.value;
        applyTheme(e.target.value);
        saveSettings();
    });
    
    document.getElementById('arabicSize').addEventListener('input', (e) => {
        state.settings.arabicSize = parseInt(e.target.value);
        document.getElementById('arabicSizeValue').textContent = `${e.target.value}px`;
        updateTextSizes();
        saveSettings();
    });
    
    document.getElementById('translationSize').addEventListener('input', (e) => {
        state.settings.translationSize = parseInt(e.target.value);
        document.getElementById('translationSizeValue').textContent = `${e.target.value}px`;
        updateTextSizes();
        saveSettings();
    });
    
    document.getElementById('qariSelect').addEventListener('change', (e) => {
        state.settings.qari = e.target.value;
        saveSettings();
    });
    
    document.getElementById('autoPlayNext').addEventListener('change', (e) => {
        state.settings.autoPlayNext = e.target.checked;
        saveSettings();
    });
    
    // Audio controls
    document.getElementById('audioToggle').addEventListener('click', () => {
        const player = document.getElementById('audioPlayer');
        player.classList.toggle('show');
        
        if (player.classList.contains('show')) {
            document.getElementById('suratAudio').play();
        } else {
            document.getElementById('suratAudio').pause();
        }
    });
    
    // Modal close on outside click
    document.getElementById('tafsirModal').addEventListener('click', (e) => {
        if (e.target.id === 'tafsirModal') {
            closeTafsirModal();
        }
    });
}

// Update Last Read
function updateLastRead(surahNumber, ayatNumber) {
    const surah = state.surahs.find(s => s.nomor === surahNumber);
    
    state.lastRead = {
        surah: surahNumber,
        ayat: ayatNumber,
        surahName: surah.namaLatin,
        timestamp: Date.now()
    };
    
    localStorage.setItem('lastRead', JSON.stringify(state.lastRead));
    displayLastRead();
}

// Display Last Read
function displayLastRead() {
    const lastReadDiv = document.getElementById('lastRead');
    
    if (state.lastRead) {
        lastReadDiv.innerHTML = `
            <h3>Terakhir Dibaca</h3>
            <p>${state.lastRead.surahName} : ${state.lastRead.ayat}</p>
            <button onclick="continueReading()">Lanjutkan Membaca →</button>
        `;
        lastReadDiv.style.display = 'block';
    }
}

// Continue Reading
function continueReading() {
    if (state.lastRead) {
        loadSurahDetail(state.lastRead.surah);
        setTimeout(() => {
            const element = document.getElementById(`ayat-${state.lastRead.ayat}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 500);
    }
}

// Back to Surat List
function backToSuratList() {
    navigateToPage('surat');
    document.getElementById('suratAudio').pause();
    document.getElementById('audioPlayer').classList.remove('show');
}

// Apply Settings
function applySettings() {
    // Apply theme
    applyTheme(state.settings.theme);
    
    // Apply text sizes
    document.getElementById('arabicSize').value = state.settings.arabicSize;
    document.getElementById('arabicSizeValue').textContent = `${state.settings.arabicSize}px`;
    document.getElementById('translationSize').value = state.settings.translationSize;
    document.getElementById('translationSizeValue').textContent = `${state.settings.translationSize}px`;
    
    // Apply qari
    document.getElementById('qariSelect').value = state.settings.qari;
    
    // Apply auto play
    document.getElementById('autoPlayNext').checked = state.settings.autoPlayNext;
}

// Apply Theme
function applyTheme(theme) {
    if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = prefersDark ? 'dark' : 'light';
    }
    
    document.documentElement.setAttribute('data-theme', theme);
}

// Update Text Sizes
function updateTextSizes() {
    document.querySelectorAll('.ayat-arabic').forEach(el => {
        el.style.fontSize = `${state.settings.arabicSize}px`;
    });
    
    document.querySelectorAll('.ayat-translation').forEach(el => {
        el.style.fontSize = `${state.settings.translationSize}px`;
    });
}

// Save Settings
function saveSettings() {
    localStorage.setItem('settings', JSON.stringify(state.settings));
}

// Clear All Data
function clearAllData() {
    if (confirm('Apakah Anda yakin ingin menghapus semua data?')) {
        localStorage.clear();
        state.bookmarks = [];
        state.lastRead = null;
        state.settings = {
            theme: 'light',
            arabicSize: 28,
            translationSize: 16,
            qari: '01',
            autoPlayNext: false
        };
        
        applySettings();
        displayBookmarks();
        document.getElementById('lastRead').style.display = 'none';
        showToast('Semua data berhasil dihapus');
    }
}

// Show Toast
function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// Show Loading State
function showLoadingState() {
    // You can implement a loading indicator here
}

// Hide Loading State
function hideLoadingState() {
    // Hide loading indicator
}

// Audio Controls
function togglePlayPause() {
    const audio = document.getElementById('suratAudio');
    const icon = document.getElementById('playPauseIcon');
    
    if (audio.paused) {
        audio.play();
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
    } else {
        audio.pause();
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
    }
}

function previousAyat() {
    // Implement previous ayat functionality
    showToast('Fitur dalam pengembangan');
}

function nextAyat() {
    // Implement next ayat functionality
    showToast('Fitur dalam pengembangan');
}

// Update audio icon on play/pause
document.getElementById('suratAudio').addEventListener('play', () => {
    document.getElementById('playPauseIcon').classList.remove('fa-play');
    document.getElementById('playPauseIcon').classList.add('fa-pause');
});

document.getElementById('suratAudio').addEventListener('pause', () => {
    document.getElementById('playPauseIcon').classList.remove('fa-pause');
    document.getElementById('playPauseIcon').classList.add('fa-play');
});