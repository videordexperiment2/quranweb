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
                    <p>Memuat data Al-Quran dari GitHub...</p>
                </div>
            `;

            // Coba load data dari GitHub
            const response = await fetch('https://raw.githubusercontent.com/urangbandung/quran/main/data/quran.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const rawData = await response.json();
            this.surahs = this.processQuranData(rawData);
            this.filteredSurahs = [...this.surahs];
            
        } catch (error) {
            console.error('Error loading Quran data:', error);
            // Fallback ke data dummy jika gagal
            this.loadDummyData();
        }
    }

    processQuranData(rawData) {
        try {
            // Proses data dari urangbandung/quran
            return rawData.map((surah, index) => {
                // Pastikan struktur data sesuai
                const surahNumber = surah.number || surah.nomor || (index + 1);
                
                return {
                    number: parseInt(surahNumber),
                    name: surah.name || surah.nama || surah.english_name || `Surah ${surahNumber}`,
                    name_arabic: surah.name_arabic || surah.nama_arabic || 'القرآن',
                    name_translations: {
                        id: surah.name_translations?.id || surah.arti || surah.translation || `Surah ${surahNumber}`,
                        en: surah.name_translations?.en || surah.name || surah.english_name || `Surah ${surahNumber}`
                    },
                    number_of_ayah: surah.number_of_ayah || surah.ayah_count || surah.jumlah_ayat || 0,
                    type: {
                        id: surah.type?.id || surah.tempat_turun || surah.revelation_type || 'Makkiyah',
                        en: surah.type?.en || surah.type || surah.revelation_type || 'Meccan'
                    },
                    verses: surah.verses || surah.ayahs || []
                };
            });
        } catch (error) {
            console.error('Error processing data:', error);
            return this.getDummySurahs();
        }
    }

    loadDummyData() {
        this.surahs = this.getDummySurahs();
        this.filteredSurahs = [...this.surahs];
        
        document.getElementById('surahGrid').innerHTML = `
            <div class="no-results">
                <p>⚠️ Menggunakan data demo karena masalah koneksi</p>
                <p>Silakan refresh halaman beberapa saat lagi</p>
            </div>
        `;
        
        setTimeout(() => this.displaySurahList(), 2000);
    }

    getDummySurahs() {
        return [
            {
                number: 1,
                name: "Al-Fatihah",
                name_arabic: "الفاتحة",
                name_translations: { 
                    id: "Pembukaan", 
                    en: "The Opening" 
                },
                number_of_ayah: 7,
                type: { 
                    id: "Makkiyah", 
                    en: "Meccan" 
                },
                verses: [
                    {
                        number: 1,
                        text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
                        translation_id: "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang."
                    },
                    {
                        number: 2,
                        text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
                        translation_id: "Segala puji bagi Allah, Tuhan seluruh alam,"
                    },
                    {
                        number: 3,
                        text: "الرَّحْمَٰنِ الرَّحِيمِ",
                        translation_id: "Yang Maha Pengasih, Maha Penyayang,"
                    }
                ]
            },
            {
                number: 2,
                name: "Al-Baqarah",
                name_arabic: "البقرة",
                name_translations: { 
                    id: "Sapi Betina", 
                    en: "The Cow" 
                },
                number_of_ayah: 286,
                type: { 
                    id: "Madaniyah", 
                    en: "Medinan" 
                },
                verses: []
            },
            {
                number: 3,
                name: "Ali 'Imran",
                name_arabic: "آل عمران",
                name_translations: { 
                    id: "Keluarga Imran", 
                    en: "Family of Imran" 
                },
                number_of_ayah: 200,
                type: { 
                    id: "Madaniyah", 
                    en: "Medinan" 
                },
                verses: []
            }
        ];
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        searchInput.addEventListener('input', (e) => {
            this.searchSurahs(e.target.value);
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchSurahs(searchInput.value);
            }
        });
        
        searchBtn.addEventListener('click', () => {
            this.searchSurahs(searchInput.value);
        });
        
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
                surah.name_arabic.includes(query) ||
                surah.number.toString().includes(query) ||
                surah.name_translations.en.toLowerCase().includes(searchTerm)
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
                    <p>Coba kata kunci lain seperti "fatihah" atau "1"</p>
                </div>
            `;
            return;
        }

        surahGrid.innerHTML = this.filteredSurahs.map(surah => `
            <div class="surah-card" onclick="quranApp.showSurahDetail(${surah.number})">
                <div class="surah-number">${surah.number}</div>
                <div class="surah-name-ar">${surah.name_arabic || 'القرآن'}</div>
                <div class="surah-name-id">${surah.name_translations?.id || surah.name || 'Surah'}</div>
                <div class="surah-info">
                    <span>${surah.number_of_ayah || 0} Ayat</span>
                    <span>${this.formatRevelationType(surah.type?.id) || 'Makkiyah'}</span>
                </div>
            </div>
        `).join('');
    }

    formatRevelationType(type) {
        if (!type) return 'Makkiyah';
        if (type.toLowerCase().includes('madani')) return 'Madaniyah';
        if (type.toLowerCase().includes('mekkah') || type.toLowerCase().includes('makki')) return 'Makkiyah';
        return type;
    }

    async showSurahDetail(surahNumber) {
        this.currentSurah = this.surahs.find(s => s.number === surahNumber);
        
        if (!this.currentSurah) {
            // Jika tidak ditemukan, gunakan dummy
            this.currentSurah = this.getDummySurahs().find(s => s.number === surahNumber) || this.getDummySurahs()[0];
        }

        // Hide surah list and show detail
        document.getElementById('surahList').style.display = 'none';
        document.getElementById('surahDetail').style.display = 'block';

        // Display surah header
        document.getElementById('surahTitle').innerHTML = `
            ${this.currentSurah.name_arabic || 'القرآن'}<br>
            <span style="font-size: 1.2rem; font-family: 'Roboto', sans-serif; color: #666;">
                ${this.currentSurah.name_translations?.id || this.currentSurah.name || 'Surah'}
            </span>
        `;
        
        document.getElementById('surahInfo').innerHTML = `
            <div class="surah-info-detail">
                <p>${this.currentSurah.number_of_ayah || 0} Ayat • ${this.formatRevelationType(this.currentSurah.type?.id) || 'Makkiyah'}</p>
                <p style="margin-top: 10px; font-style: italic;">"${this.currentSurah.name_translations?.en || this.currentSurah.name || 'Surah'}"</p>
            </div>
        `;

        // Display verses
        this.displayVerses();
    }

    displayVerses() {
        const versesContainer = document.getElementById('versesContainer');
        
        if (!this.currentSurah.verses || this.currentSurah.verses.length === 0) {
            versesContainer.innerHTML = `
                <div class="no-results">
                    <p>📝 Ayat-ayat untuk surah ini belum tersedia</p>
                    <p>Data lengkap akan ditambahkan dalam update berikutnya</p>
                </div>
            `;
            return;
        }

        versesContainer.innerHTML = this.currentSurah.verses.map(verse => `
            <div class="verse">
                <div class="verse-header">
                    <div class="verse-number">${verse.number || verse.ayah_number || ''}</div>
                </div>
                <div class="verse-text-ar">${verse.text || verse.ayah_text || 'القرآن'}</div>
                ${verse.translation_id ? `<div class="verse-text-id">${verse.translation_id}</div>` : ''}
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
// Fungsi debugging untuk melihat struktur data
function debugQuranData() {
    fetch('https://raw.githubusercontent.com/urangbandung/quran/main/data/quran.json')
        .then(response => response.json())
        .then(data => {
            console.log('Struktur data dari repository:');
            console.log('Jumlah surah:', data.length);
            console.log('Contoh data pertama:', data[0]);
            console.log('Struktur lengkap:', data);
        })
        .catch(error => {
            console.error('Debug error:', error);
        });
}
// Initialize the app
let quranApp;

// Debug: Tampilkan info di console
console.log('Menginisialisasi Al-Quran Digital...');
console.log('Sumber data: https://github.com/urangbandung/quran');

document.addEventListener('DOMContentLoaded', () => {
    quranApp = new QuranApp();
    // Uncomment baris di bawah untuk debugging
    // debugQuranData();
});