class QuranApp {
    constructor() {
        this.surahs = [];
        this.filteredSurahs = [];
        this.currentSurah = null;
        this.init();
    }

    async init() {
        await this.loadQuranData();
        this.setupEventListeners();
        this.displaySurahList();
    }

    async loadQuranData() {
        try {
            // Menampilkan loading
            document.getElementById('surahGrid').innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Memuat data Al-Quran...</p>
                </div>
            `;

            // Fetch data dari GitHub raw
            const response = await fetch('https://raw.githubusercontent.com/urangbandung/quran/main/data/quran.json');
            
            if (!response.ok) {
                throw new Error('Gagal memuat data');
            }
            
            this.surahs = await response.json();
            this.filteredSurahs = [...this.surahs];
            
        } catch (error) {
            console.error('Error loading Quran data:', error);
            document.getElementById('surahGrid').innerHTML = `
                <div class="no-results">
                    <p>❌ Gagal memuat data Al-Quran</p>
                    <p>Silakan coba lagi nanti</p>
                </div>
            `;
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        searchInput.addEventListener('input', (e) => {
            this.searchSurahs(e.target.value);
        });
        
        searchBtn.addEventListener('click', () => {
            this.searchSurahs(searchInput.value);
        });
        
        // Back button
        document.getElementById('backBtn').addEventListener('click', () => {
            this.showSurahList();
        });
    }

    searchSurahs(query) {
        if (!query.trim()) {
            this.filteredSurahs = [...this.surahs];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredSurahs = this.surahs.filter(surah => 
                surah.name.toLowerCase().includes(searchTerm) ||
                surah.name_translations.id.toLowerCase().includes(searchTerm) ||
                surah.name_arabic.includes(query)
            );
        }
        this.displaySurahList();
    }

    displaySurahList() {
        const surahGrid = document.getElementById('surahGrid');
        
        if (this.filteredSurahs.length === 0) {
            surahGrid.innerHTML = `
                <div class="no-results">
                    <p>🔍 Tidak ditemukan surah yang cocok</p>
                </div>
            `;
            return;
        }

        surahGrid.innerHTML = this.filteredSurahs.map(surah => `
            <div class="surah-card" onclick="quranApp.showSurahDetail(${surah.number})">
                <div class="surah-number">${surah.number}</div>
                <div class="surah-name-ar">${surah.name_arabic}</div>
                <div class="surah-name-id">${surah.name_translations.id}</div>
                <div class="surah-info">
                    <span>${surah.number_of_ayah} Ayat</span>
                    <span>${surah.type.id}</span>
                </div>
            </div>
        `).join('');
    }

    showSurahDetail(surahNumber) {
        this.currentSurah = this.surahs.find(s => s.number === surahNumber);
        
        if (!this.currentSurah) return;

        // Hide surah list and show detail
        document.getElementById('surahList').style.display = 'none';
        document.getElementById('surahDetail').style.display = 'block';

        // Display surah header
        document.getElementById('surahTitle').innerHTML = `
            ${this.currentSurah.name_arabic}<br>
            <span style="font-size: 1.2rem; font-family: 'Roboto', sans-serif; color: #666;">
                ${this.currentSurah.name_translations.id}
            </span>
        `;
        
        document.getElementById('surahInfo').innerHTML = `
            <div class="surah-info-detail">
                <p>${this.currentSurah.number_of_ayah} Ayat • ${this.currentSurah.type.id}</p>
                <p style="margin-top: 10px; font-style: italic;">"${this.currentSurah.name_translations.en}"</p>
            </div>
        `;

        // Display verses
        this.displayVerses();
    }

    displayVerses() {
        const versesContainer = document.getElementById('versesContainer');
        
        versesContainer.innerHTML = this.currentSurah.verses.map(verse => `
            <div class="verse">
                <div class="verse-header">
                    <div class="verse-number">${verse.number}</div>
                </div>
                <div class="verse-text-ar">${verse.text}</div>
                <div class="verse-text-id">${verse.translation_id || 'Terjemahan tidak tersedia'}</div>
            </div>
        `).join('');
    }

    showSurahList() {
        document.getElementById('surahDetail').style.display = 'none';
        document.getElementById('surahList').style.display = 'block';
        document.getElementById('searchInput').value = '';
        this.filteredSurahs = [...this.surahs];
        this.displaySurahList();
    }
}

// Initialize the app
let quranApp;

document.addEventListener('DOMContentLoaded', () => {
    quranApp = new QuranApp();
});

// Keyboard shortcut for search
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
});
