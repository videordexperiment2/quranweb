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
            document.getElementById('surahGrid').innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Memuat data Al-Quran...</p>
                </div>
            `;

            const response = await fetch('https://raw.githubusercontent.com/urangbandung/quran/main/data/quran.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const rawData = await response.json();
            console.log('Raw data structure:', rawData); // Debug
            
            this.surahs = this.processQuranData(rawData);
            this.filteredSurahs = [...this.surahs];
            
            console.log('Processed surahs:', this.surahs); // Debug
            
        } catch (error) {
            console.error('Error loading Quran data:', error);
            this.loadDummyData();
        }
    }

    processQuranData(rawData) {
        try {
            // Coba berbagai kemungkinan struktur data
            let surahsData = [];
            
            // Jika rawData adalah array langsung
            if (Array.isArray(rawData)) {
                surahsData = rawData;
            }
            // Jika rawData memiliki properti tertentu
            else if (rawData.surahs) {
                surahsData = rawData.surahs;
            }
            else if (rawData.data) {
                surahsData = rawData.data;
            }
            else {
                // Coba asumsi rawData itu sendiri adalah objek surah
                surahsData = [rawData];
            }

            console.log('Surahs data:', surahsData); // Debug

            return surahsData.map((surah, index) => {
                // Debug setiap surah
                console.log(`Processing surah ${index}:`, surah);
                
                // Coba berbagai kemungkinan properti
                const number = surah.number || surah.nomor || surah.id || (index + 1);
                const name = surah.name || surah.nama || surah.englishName || surah.title || `Surah ${number}`;
                const name_arabic = surah.name_arabic || surah.arabic_name || surah.nama_arab || 'القرآن';
                const ayah_count = surah.ayah_count || surah.number_of_ayah || surah.ayahs?.length || surah.verses?.length || 0;
                
                // Coba dapatkan terjemahan
                let translation_id = 'Terjemahan tidak tersedia';
                if (surah.translation) {
                    translation_id = surah.translation;
                } else if (surah.arti) {
                    translation_id = surah.arti;
                } else if (surah.name_translations?.id) {
                    translation_id = surah.name_translations.id;
                } else if (typeof surah.translation === 'string') {
                    translation_id = surah.translation;
                }

                // Tentukan tipe surah
                let type_id = 'Makkiyah';
                if (surah.type) {
                    if (typeof surah.type === 'string') {
                        type_id = surah.type.includes('madani') || surah.type.includes('madinah') ? 'Madaniyah' : 'Makkiyah';
                    } else if (surah.type.id) {
                        type_id = surah.type.id.includes('madani') ? 'Madaniyah' : 'Makkiyah';
                    }
                }

                // Proses ayat-ayat
                let verses = [];
                if (surah.verses || surah.ayahs) {
                    const ayahs = surah.verses || surah.ayahs;
                    if (Array.isArray(ayahs)) {
                        verses = ayahs.map((ayah, ayahIndex) => ({
                            number: ayah.number || ayah.ayah_number || (ayahIndex + 1),
                            text: ayah.text || ayah.arabic_text || ayah.ayah || '',
                            translation_id: ayah.translation || ayah.translation_id || ayah.indo || ''
                        }));
                    }
                }

                return {
                    number: parseInt(number),
                    name: name,
                    name_arabic: name_arabic,
                    name_translations: {
                        id: translation_id,
                        en: name
                    },
                    number_of_ayah: parseInt(ayah_count),
                    type: {
                        id: type_id,
                        en: type_id === 'Madaniyah' ? 'Medinan' : 'Meccan'
                    },
                    verses: verses
                };
            });
        } catch (error) {
            console.error('Error processing data:', error);
            return this.getDummySurahs();
        }
    }

    loadDummyData() {
        const dummySurahs = [
            {
                number: 1,
                name: "Al-Fatihah",
                name_arabic: "الفاتحة",
                name_translations: { id: "Pembukaan", en: "The Opening" },
                number_of_ayah: 7,
                type: { id: "Makkiyah", en: "Meccan" },
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
                    },
                    {
                        number: 4,
                        text: "مَالِكِ يَوْمِ الدِّينِ",
                        translation_id: "Pemilik hari pembalasan."
                    },
                    {
                        number: 5,
                        text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
                        translation_id: "Hanya kepada Engkaulah kami menyembah dan hanya kepada Engkaulah kami mohon pertolongan."
                    },
                    {
                        number: 6,
                        text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
                        translation_id: "Tunjukilah kami jalan yang lurus,"
                    },
                    {
                        number: 7,
                        text: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
                        translation_id: "(yaitu) jalan orang-orang yang telah Engkau beri nikmat; bukan (jalan) mereka yang dimurkai dan bukan pula (jalan) mereka yang sesat."
                    }
                ]
            },
            {
                number: 2,
                name: "Al-Baqarah",
                name_arabic: "البقرة",
                name_translations: { id: "Sapi Betina", en: "The Cow" },
                number_of_ayah: 286,
                type: { id: "Madaniyah", en: "Medinan" },
                verses: []
            },
            {
                number: 3,
                name: "Ali 'Imran",
                name_arabic: "آل عمران",
                name_translations: { id: "Keluarga Imran", en: "Family of Imran" },
                number_of_ayah: 200,
                type: { id: "Madaniyah", en: "Medinan" },
                verses: []
            }
        ];

        this.surahs = dummySurahs;
        this.filteredSurahs = [...dummySurahs];
        
        document.getElementById('surahGrid').innerHTML = `
            <div class="no-results">
                <p>⚠️ Menampilkan data demo karena struktur data tidak sesuai</p>
                <p>Silakan periksa console browser untuk detail error</p>
            </div>
        `;
        
        setTimeout(() => this.displaySurahList(), 2000);
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
                surah.number.toString().includes(query)
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

    async showSurahDetail(surahNumber) {
        this.currentSurah = this.surahs.find(s => s.number === surahNumber);
        
        if (!this.currentSurah) {
            this.loadDummyData();
            this.currentSurah = this.surahs.find(s => s.number === surahNumber);
        }

        document.getElementById('surahList').style.display = 'none';
        document.getElementById('surahDetail').style.display = 'block';

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

        this.displayVerses();
    }

    displayVerses() {
        const versesContainer = document.getElementById('versesContainer');
        
        if (!this.currentSurah.verses || this.currentSurah.verses.length === 0) {
            if (this.currentSurah.number === 1) {
                // Tampilkan Al-Fatihah dari dummy data
                const dummySurah = this.getDummySurahForDetail(this.currentSurah.number);
                if (dummySurah) {
                    versesContainer.innerHTML = dummySurah.verses.map(verse => `
                        <div class="verse">
                            <div class="verse-header">
                                <div class="verse-number">${verse.number}</div>
                            </div>
                            <div class="verse-text-ar">${verse.text}</div>
                            <div class="verse-text-id">${verse.translation_id}</div>
                        </div>
                    `).join('');
                    return;
                }
            }
            
            versesContainer.innerHTML = `
                <div class="no-results">
                    <p>📝 Detail ayat belum tersedia untuk surah ini</p>
                </div>
            `;
            return;
        }

        versesContainer.innerHTML = this.currentSurah.verses.map(verse => `
            <div class="verse">
                <div class="verse-header">
                    <div class="verse-number">${verse.number}</div>
                </div>
                <div class="verse-text-ar">${verse.text}</div>
                <div class="verse-text-id">${verse.translation_id}</div>
            </div>
        `).join('');
    }

    getDummySurahForDetail(surahNumber) {
        const dummySurahs = [
            {
                number: 1,
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
                    },
                    {
                        number: 4,
                        text: "مَالِكِ يَوْمِ الدِّينِ",
                        translation_id: "Pemilik hari pembalasan."
                    },
                    {
                        number: 5,
                        text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
                        translation_id: "Hanya kepada Engkaulah kami menyembah dan hanya kepada Engkaulah kami mohon pertolongan."
                    },
                    {
                        number: 6,
                        text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
                        translation_id: "Tunjukilah kami jalan yang lurus,"
                    },
                    {
                        number: 7,
                        text: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
                        translation_id: "(yaitu) jalan orang-orang yang telah Engkau beri nikmat; bukan (jalan) mereka yang dimurkai dan bukan pula (jalan) mereka yang sesat."
                    }
                ]
            }
        ];
        
        return dummySurahs.find(s => s.number === surahNumber);
    }

    showSurahList() {
        document.getElementById('surahDetail').style.display = 'none';
        document.getElementById('surahList').style.display = 'block';
        document.getElementById('searchInput').value = '';
        this.filteredSurahs = [...this.surahs];
        this.displaySurahList();
    }

    getDummySurahs() {
        return [
            {
                number: 1,
                name: "Al-Fatihah",
                name_arabic: "الفاتحة",
                name_translations: { id: "Pembukaan", en: "The Opening" },
                number_of_ayah: 7,
                type: { id: "Makkiyah", en: "Meccan" },
                verses: []
            },
            {
                number: 2,
                name: "Al-Baqarah",
                name_arabic: "البقرة",
                name_translations: { id: "Sapi Betina", en: "The Cow" },
                number_of_ayah: 286,
                type: { id: "Madaniyah", en: "Medinan" },
                verses: []
            }
        ];
    }
}

// Initialize the app
let quranApp;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Quran App...');
    console.log('Fetching data from: https://raw.githubusercontent.com/urangbandung/quran/main/data/quran.json');
    quranApp = new QuranApp();
});