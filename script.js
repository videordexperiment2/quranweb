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

            // Coba beberapa kemungkinan URL untuk mendapatkan data yang benar
            const urls = [
                'https://raw.githubusercontent.com/urangbandung/quran/main/data/quran.json',
                'https://raw.githubusercontent.com/urangbandung/quran/master/data/quran.json',
                'https://api.github.com/repos/urangbandung/quran/contents/data/quran.json'
            ];

            let rawData = null;
            let success = false;

            for (let url of urls) {
                try {
                    console.log('Trying URL:', url);
                    const response = await fetch(url);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    rawData = await response.json();
                    console.log('Data fetched from:', url);
                    console.log('Raw data:', rawData);
                    success = true;
                    break;
                } catch (error) {
                    console.log('Failed to fetch from:', url, error.message);
                    continue;
                }
            }

            if (!success) {
                throw new Error('Failed to fetch data from all URLs');
            }

            // Jika data berasal dari GitHub API, kita perlu decode base64
            if (rawData.content && rawData.encoding === 'base64') {
                const decodedContent = atob(rawData.content);
                rawData = JSON.parse(decodedContent);
                console.log('Decoded data:', rawData);
            }

            this.surahs = this.processQuranData(rawData);
            this.filteredSurahs = [...this.surahs];
            
            console.log('Processed surahs:', this.surahs);
            
        } catch (error) {
            console.error('Error loading Quran data:', error);
            this.loadDummyData();
        }
    }

    processQuranData(rawData) {
        try {
            console.log('Processing raw data:', rawData);
            
            let surahsData = [];
            
            // Coba berbagai kemungkinan struktur data
            if (Array.isArray(rawData)) {
                surahsData = rawData;
            } else if (rawData.surahs) {
                surahsData = rawData.surahs;
            } else if (rawData.data) {
                surahsData = rawData.data;
            } else if (rawData.chapters) {
                surahsData = rawData.chapters;
            } else {
                // Jika rawData adalah objek tunggal dengan struktur surah
                surahsData = Object.values(rawData).filter(item => 
                    item && (item.number || item.nomor || item.id)
                );
            }

            console.log('Surahs data found:', surahsData.length, 'surahs');

            return surahsData.map((surah, index) => {
                // Debug setiap surah
                console.log(`Processing surah ${index}:`, surah);
                
                // Normalisasi properti surah
                const number = this.getSurahProperty(surah, ['number', 'nomor', 'id', 'chapter_id']) || (index + 1);
                const name = this.getSurahProperty(surah, ['name', 'englishName', 'title', 'nama']) || `Surah ${number}`;
                const name_arabic = this.getSurahProperty(surah, ['name_arabic', 'arabic_name', 'arabic', 'nama_arab']) || 'القرآن';
                
                // Coba dapatkan terjemahan
                let translation_id = this.getSurahProperty(surah, ['translation', 'arti', 'translation_id', 'name_translations.id']) || 'Terjemahan tidak tersedia';

                // Tentukan tipe surah
                let type_id = 'Makkiyah';
                const type = this.getSurahProperty(surah, ['type', 'revelationType', 'revelation_place']);
                if (type) {
                    if (typeof type === 'string') {
                        type_id = type.toLowerCase().includes('madani') || type.toLowerCase().includes('madinah') ? 'Madaniyah' : 'Makkiyah';
                    } else if (type.id) {
                        type_id = type.id.toLowerCase().includes('madani') ? 'Madaniyah' : 'Makkiyah';
                    }
                }

                // Jumlah ayat
                let ayah_count = this.getSurahProperty(surah, ['number_of_ayah', 'numberOfAyahs', 'verses_count', 'ayahs_count']) || 0;
                if (!ayah_count && surah.verses) {
                    ayah_count = surah.verses.length;
                } else if (!ayah_count && surah.ayahs) {
                    ayah_count = surah.ayahs.length;
                }

                // Proses ayat-ayat
                let verses = [];
                const ayahs = surah.verses || surah.ayahs || surah.ayat || [];
                if (Array.isArray(ayahs)) {
                    verses = ayahs.map((ayah, ayahIndex) => ({
                        number: this.getAyahProperty(ayah, ['number', 'ayah_number', 'verse_number']) || (ayahIndex + 1),
                        text: this.getAyahProperty(ayah, ['text', 'arabic_text', 'arabic']) || '',
                        translation_id: this.getAyahProperty(ayah, ['translation', 'translation_id', 'indo', 'text_id']) || ''
                    }));
                }

                return {
                    number: parseInt(number),
                    name: name,
                    name_arabic: name_arabic,
                    name_translations: {
                        id: translation_id,
                        en: name
                    },
                    number_of_ayah: parseInt(ayah_count) || 0,
                    type: {
                        id: type_id,
                        en: type_id === 'Madaniyah' ? 'Medinan' : 'Meccan'
                    },
                    verses: verses
                };
            }).filter(surah => surah.number > 0); // Filter surah yang valid
        } catch (error) {
            console.error('Error processing data:', error);
            return this.getDummySurahs();
        }
    }

    getSurahProperty(obj, properties) {
        for (let prop of properties) {
            if (obj[prop] !== undefined) return obj[prop];
            // Coba nested properties
            if (prop.includes('.')) {
                const parts = prop.split('.');
                let current = obj;
                for (let part of parts) {
                    if (current && current[part] !== undefined) {
                        current = current[part];
                    } else {
                        current = undefined;
                        break;
                    }
                }
                if (current !== undefined) return current;
            }
        }
        return undefined;
    }

    getAyahProperty(obj, properties) {
        return this.getSurahProperty(obj, properties);
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
            },
            {
                number: 114,
                name: "An-Nas",
                name_arabic: "الناس",
                name_translations: { id: "Umat Manusia", en: "Mankind" },
                number_of_ayah: 6,
                type: { id: "Makkiyah", en: "Meccan" },
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
                (surah.name_translations && surah.name_translations.id.toLowerCase().includes(searchTerm)) ||
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

        // Jika belum ada ayat, coba load dari API terpisah
        if (!this.currentSurah.verses || this.currentSurah.verses.length === 0) {
            await this.loadSurahVerses(surahNumber);
        }

        this.displayVerses();
    }

    async loadSurahVerses(surahNumber) {
        try {
            // Coba load ayat dari endpoint terpisah jika tersedia
            const verseUrls = [
                `https://raw.githubusercontent.com/urangbandung/quran/main/data/surah/${surahNumber}.json`,
                `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,id.indonesian`
            ];

            for (let url of verseUrls) {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        const verseData = await response.json();
                        
                        if (verseData.data && verseData.data.ayahs) {
                            // Format dari API alquran.cloud
                            this.currentSurah.verses = verseData.data.ayahs.map(ayah => ({
                                number: ayah.numberInSurah,
                                text: ayah.text,
                                translation_id: ayah.translation ? ayah.translation.text : ''
                            }));
                        } else if (Array.isArray(verseData)) {
                            // Format dari file JSON lokal
                            this.currentSurah.verses = verseData;
                        }
                        break;
                    }
                } catch (error) {
                    console.log('Failed to load verses from:', url);
                }
            }
        } catch (error) {
            console.error('Error loading verses:', error);
        }
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
                <div class="verse-text-id">${verse.translation_id || 'Terjemahan tidak tersedia'}</div>
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
    }
}

// Initialize the app
let quranApp;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Quran App...');
    quranApp = new QuranApp();
});