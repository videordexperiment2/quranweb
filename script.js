// API Base URL
const API_BASE = 'https://api.myquran.com/v2';

// Global Variables
let allSurahs = [];
let bookmarks = JSON.parse(localStorage.getItem('quranBookmarks')) || [];
let currentSurah = null;
let currentAudio = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadSurahList();
    setupEventListeners();
    updateBookmarkView();
});

// Setup Event Listeners
function setupEventListeners() {
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchView(e.target.dataset.view);
        });
    });

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterSurahs(e.target.value);
    });

    // Qari selection
    document.getElementById('qariSelect').addEventListener('change', (e) => {
        if (currentSurah) {
            updateAudioSource(currentSurah, e.target.value);
        }
    });
}

// Switch between views (Surah, Juz, Bookmark)
function switchView(view) {
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');

    // Update active view content
    document.querySelectorAll('.view-content').forEach(content => {
        content.classList.remove('active');
    });

    switch(view) {
        case 'surah':
            document.getElementById('surahList').classList.add('active');
            document.getElementById('searchInput').style.display = 'block';
            break;
        case 'juz':
            document.getElementById('juzList').classList.add('active');
            document.getElementById('searchInput').style.display = 'none';
            loadJuzList();
            break;
        case 'bookmark':
            document.getElementById('bookmarkList').classList.add('active');
            document.getElementById('searchInput').style.display = 'none';
            updateBookmarkView();
            break;
    }
}

// Load Surah List
async function loadSurahList() {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/surat/semua`);
        const data = await response.json();
        
        if (data.code === 200) {
            allSurahs = data.data;
            displaySurahs(allSurahs);
        }
    } catch (error) {
        console.error('Error loading surahs:', error);
        showError('Gagal memuat daftar surah. Silakan coba lagi.');
    } finally {
        showLoading(false);
    }
}

// Display Surahs
function displaySurahs(surahs) {
    const surahList = document.getElementById('surahList');
    surahList.innerHTML = '';

    surahs.forEach(surah => {
        const surahCard = document.createElement('div');
        surahCard.className = 'surah-card';
        surahCard.onclick = () => loadSurahDetail(surah.nomor);
        
        surahCard.innerHTML = `
            <div class="surah-number">${surah.nomor}</div>
            <div class="surah-name">
                <div>
                    <h3>${surah.namaLatin}</h3>
                    <div class="surah-meta">
                        ${surah.tempatTurun} • ${surah.jumlahAyat} Ayat
                    </div>
                </div>
                <div class="surah-name-arabic">${surah.nama}</div>
            </div>
            <div class="surah-meta">${surah.arti}</div>
        `;
        
        surahList.appendChild(surahCard);
    });
}

// Filter Surahs (Search)
function filterSurahs(query) {
    const filtered = allSurahs.filter(surah => 
        surah.namaLatin.toLowerCase().includes(query.toLowerCase()) ||
        surah.arti.toLowerCase().includes(query.toLowerCase()) ||
        surah.nomor.toString().includes(query)
    );
    displaySurahs(filtered);
}

// Load Juz List
function loadJuzList() {
    const juzList = document.getElementById('juzList');
    juzList.innerHTML = '';

    for (let i = 1; i <= 30; i++) {
        const juzCard = document.createElement('div');
        juzCard.className = 'juz-card';
        juzCard.onclick = () => loadJuzDetail(i);
        
        juzCard.innerHTML = `
            <h3>Juz ${i}</h3>
        `;
        
        juzList.appendChild(juzCard);
    }
}

// Load Surah Detail
async function loadSurahDetail(surahNumber) {
    showLoading(true);
    currentSurah = surahNumber;
    
    try {
        const response = await fetch(`${API_BASE}/surat/${surahNumber}`);
        const data = await response.json();
        
        if (data.code === 200) {
            displaySurahDetail(data.data);
            
            // Hide surah list and show detail
            document.getElementById('surahList').style.display = 'none';
            document.getElementById('surahDetail').style.display = 'block';
            
            // Update audio source
            const qariValue = document.getElementById('qariSelect').value;
            updateAudioSource(surahNumber, qariValue);
        }
    } catch (error) {
        console.error('Error loading surah detail:', error);
        showError('Gagal memuat detail surah. Silakan coba lagi.');
    } finally {
        showLoading(false);
    }
}

// Display Surah Detail
function displaySurahDetail(surah) {
    document.getElementById('surahTitle').textContent = `${surah.namaLatin} (${surah.nama})`;
    document.getElementById('surahInfo').textContent = 
        `${surah.tempatTurun} • ${surah.jumlahAyat} Ayat • ${surah.arti}`;
    
    const ayatList = document.getElementById('ayatList');
    ayatList.innerHTML = '';
    
    // Add Bismillah if not Al-Fatihah or At-Taubah
    if (surah.nomor !== 1 && surah.nomor !== 9) {
        const bismillah = document.createElement('div');
        bismillah.className = 'ayat-item';
        bismillah.innerHTML = `
            <div class="ayat-arabic">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</div>
            <div class="ayat-translation">Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.</div>
        `;
        ayatList.appendChild(bismillah);
    }
    
    // Display each ayat
    surah.ayat.forEach(ayat => {
        const ayatItem = document.createElement('div');
        ayatItem.className = 'ayat-item';
        ayatItem.id = `ayat-${ayat.nomorAyat}`;
        
        ayatItem.innerHTML = `
            <div class="ayat-number">${ayat.nomorAyat}</div>
            <div class="ayat-arabic">${ayat.teksArab}</div>
            <div class="ayat-translation">${ayat.teksIndonesia}</div>
            <div class="ayat-actions">
                <button class="ayat-btn" onclick="playAyatAudio(${surah.nomor}, ${ayat.nomorAyat})">
                    🔊 Play
                </button>
                <button class="ayat-btn" onclick="showTafsir(${surah.nomor}, ${ayat.nomorAyat})">
                    📖 Tafsir
                </button>
                <button class="ayat-btn" onclick="toggleBookmark(${surah.nomor}, ${ayat.nomorAyat}, '${surah.namaLatin}')">
                    ${isBookmarked(surah.nomor, ayat.nomorAyat) ? '❤️' : '🤍'} Bookmark
                </button>
                <button class="ayat-btn" onclick="copyAyat('${ayat.teksArab}', '${ayat.teksIndonesia}')">
                    📋 Salin
                </button>
            </div>
        `;
        
        ayatList.appendChild(ayatItem);
    });
}

// Update Audio Source
function updateAudioSource(surahNumber, qariCode) {
    const audioPlayer = document.getElementById('audioPlayer');
    const paddedSurah = String(surahNumber).padStart(3, '0');
    audioPlayer.src = `https://media.e-quran.id/audio-full/${qariCode}/${paddedSurah}.mp3`;
}

// Play Ayat Audio
async function playAyatAudio(surahNumber, ayatNumber) {
    try {
        const paddedSurah = String(surahNumber).padStart(3, '0');
        const paddedAyat = String(ayatNumber).padStart(3, '0');
        const qariCode = document.getElementById('qariSelect').value;
        
        const audioUrl = `https://media.e-quran.id/audio/${qariCode}/${paddedSurah}${paddedAyat}.mp3`;
        
        if (currentAudio) {
            currentAudio.pause();
        }
        
        currentAudio = new Audio(audioUrl);
        currentAudio.play();
    } catch (error) {
        console.error('Error playing audio:', error);
        alert('Gagal memutar audio');
    }
}

// Show Tafsir
async function showTafsir(surahNumber, ayatNumber) {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/tafsir/${surahNumber}/${ayatNumber}`);
        const data = await response.json();
        
        if (data.code === 200) {
            const modal = document.getElementById('tafsirModal');
            const content = document.getElementById('tafsirContent');
            
            content.innerHTML = `
                <h4>Surah ${data.data.surah.namaLatin} Ayat ${ayatNumber}</h4>
                <p class="ayat-arabic" style="font-size: 1.3rem; margin: 20px 0;">${data.data.ayat.teksArab}</p>
                <p style="margin-bottom: 20px;"><strong>Terjemahan:</strong> ${data.data.ayat.teksIndonesia}</p>
                <p><strong>Tafsir:</strong></p>
                <p style="line-height: 1.8;">${data.data.tafsir.teksTafsir}</p>
            `;
            
            modal.classList.add('show');
        }
    } catch (error) {
        console.error('Error loading tafsir:', error);
        alert('Gagal memuat tafsir');
    } finally {
        showLoading(false);
    }
}

// Close Tafsir Modal
function closeTafsir() {
    document.getElementById('tafsirModal').classList.remove('show');
}

// Copy Ayat
function copyAyat(arabicText, translationText) {
    const textToCopy = `${arabicText}\n\n${translationText}`;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            showNotification('Ayat berhasil disalin!');
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Ayat berhasil disalin!');
    }
}

// Bookmark Functions
function toggleBookmark(surahNumber, ayatNumber, surahName) {
    const bookmarkId = `${surahNumber}-${ayatNumber}`;
    const existingIndex = bookmarks.findIndex(b => b.id === bookmarkId);
    
    if (existingIndex !== -1) {
        bookmarks.splice(existingIndex, 1);
        showNotification('Bookmark dihapus');
    } else {
        bookmarks.push({
            id: bookmarkId,
            surahNumber,
            ayatNumber,
            surahName,
            timestamp: new Date().getTime()
        });
        showNotification('Bookmark ditambahkan');
    }
    
    localStorage.setItem('quranBookmarks', JSON.stringify(bookmarks));
    
    // Update button if in detail view
    if (document.getElementById('surahDetail').style.display === 'block') {
        loadSurahDetail(currentSurah);
    }
    
    updateBookmarkView();
}

function isBookmarked(surahNumber, ayatNumber) {
    const bookmarkId = `${surahNumber}-${ayatNumber}`;
    return bookmarks.some(b => b.id === bookmarkId);
}

function updateBookmarkView() {
    const bookmarkList = document.getElementById('bookmarkList');
    
    if (bookmarks.length === 0) {
        bookmarkList.innerHTML = `
            <div class="empty-state">
                <p>📑 Belum ada bookmark</p>
            </div>
        `;
        return;
    }
    
    bookmarkList.innerHTML = '<div class="surah-list" id="bookmarkCards"></div>';
    const bookmarkCards = document.getElementById('bookmarkCards');
    
    bookmarks.reverse().forEach(bookmark => {
        const card = document.createElement('div');
        card.className = 'surah-card';
        card.onclick = () => {
            loadSurahDetail(bookmark.surahNumber);
            setTimeout(() => {
                document.getElementById(`ayat-${bookmark.ayatNumber}`).scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 500);
        };
        
        card.innerHTML = `
            <h3>${bookmark.surahName}</h3>
            <p>Ayat ${bookmark.ayatNumber}</p>
            <p class="surah-meta">${new Date(bookmark.timestamp).toLocaleDateString('id-ID')}</p>
        `;
        
        bookmarkCards.appendChild(card);
    });
}

// Back to List
function backToList() {
    document.getElementById('surahDetail').style.display = 'none';
    document.getElementById('surahList').style.display = 'grid';
    
    // Stop audio if playing
    const audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.pause();
    
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
}

// Show Loading
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.add('active');
    } else {
        loading.classList.remove('active');
    }
}

// Show Error
function showError(message) {
    alert(message);
}

// Show Notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 2000;
        animation: slideUp 0.3s;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Handle Juz Detail (simplified version)
async function loadJuzDetail(juzNumber) {
    alert(`Fitur Juz ${juzNumber} dalam pengembangan`);
    // You can implement full juz functionality here
    // The API might have endpoints for juz that you can utilize
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('tafsirModal');
    if (event.target === modal) {
        modal.classList.remove('show');
    }
}