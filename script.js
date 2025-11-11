document.addEventListener('DOMContentLoaded', () => {
    const surahSelect = document.getElementById('surah-select');
    const surahDetails = document.getElementById('surah-details');
    const ayahContainer = document.getElementById('ayah-container');
    const loadingIndicator = document.getElementById('loading');

    const surahList = [
        { number: 1, name: "Al-Fatihah" }, { number: 2, name: "Al-Baqarah" }, { number: 3, name: "Ali 'Imran" },
        { number: 4, name: "An-Nisa'" }, { number: 5, name: "Al-Ma'idah" }, { number: 6, name: "Al-An'am" },
        { number: 7, name: "Al-A'raf" }, { number: 8, name: "Al-Anfal" }, { number: 9, name: "At-Tawbah" },
        { number: 10, name: "Yunus" }, { number: 11, name: "Hud" }, { number: 12, name: "Yusuf" },
        { number: 13, name: "Ar-Ra'd" }, { number: 14, name: "Ibrahim" }, { number: 15, name: "Al-Hijr" },
        { number: 16, name: "An-Nahl" }, { number: 17, name: "Al-Isra'" }, { number: 18, name: "Al-Kahf" },
        { number: 19, name: "Maryam" }, { number: 20, name: "Taha" }, { number: 21, name: "Al-Anbiya'" },
        { number: 22, name: "Al-Hajj" }, { number: 23, name: "Al-Mu'minun" }, { number: 24, name: "An-Nur" },
        { number: 25, name: "Al-Furqan" }, { number: 26, name: "Asy-Syu'ara'" }, { number: 27, name: "An-Naml" },
        { number: 28, name: "Al-Qasas" }, { number: 29, name: "Al-'Ankabut" }, { number: 30, name: "Ar-Rum" },
        { number: 31, name: "Luqman" }, { number: 32, name: "As-Sajdah" }, { number: 33, name: "Al-Ahzab" },
        { number: 34, name: "Saba'" }, { number: 35, name: "Fatir" }, { number: 36, name: "Ya-Sin" },
        { number: 37, name: "As-Saffat" }, { number: 38, name: "Sad" }, { number: 39, name: "Az-Zumar" },
        { number: 40, name: "Ghafir" }, { number: 41, name: "Fussilat" }, { number: 42, name: "Asy-Syura" },
        { number: 43, name: "Az-Zukhruf" }, { number: 44, name: "Ad-Dukhan" }, { number: 45, name: "Al-Jasiyah" },
        { number: 46, name: "Al-Ahqaf" }, { number: 47, name: "Muhammad" }, { number: 48, name: "Al-Fath" },
        { number: 49, name: "Al-Hujurat" }, { number: 50, name: "Qaf" }, { number: 51, name: "Az-Zariyat" },
        { number: 52, name: "At-Tur" }, { number: 53, name: "An-Najm" }, { number: 54, name: "Al-Qamar" },
        { number: 55, name: "Ar-Rahman" }, { number: 56, name: "Al-Waqi'ah" }, { number: 57, name: "Al-Hadid" },
        { number: 58, name: "Al-Mujadilah" }, { number: 59, name: "Al-Hasyr" }, { number: 60, name: "Al-Mumtahanah" },
        { number: 61, name: "As-Saff" }, { number: 62, name: "Al-Jumu'ah" }, { number: 63, name: "Al-Munafiqun" },
        { number: 64, name: "At-Tagabun" }, { number: 65, name: "At-Talaq" }, { number: 66, name: "At-Tahrim" },
        { number: 67, name: "Al-Mulk" }, { number: 68, name: "Al-Qalam" }, { number: 69, name: "Al-Haqqah" },
        { number: 70, name: "Al-Ma'arij" }, { number: 71, name: "Nuh" }, { number: 72, name: "Al-Jinn" },
        { number: 73, name: "Al-Muzzammil" }, { number: 74, name: "Al-Muddassir" }, { number: 75, name: "Al-Qiyamah" },
        { number: 76, name: "Al-Insan" }, { number: 77, name: "Al-Mursalat" }, { number: 78, name: "An-Naba'" },
        { number: 79, name: "An-Nazi'at" }, { number: 80, "'Abasa" }, { number: 81, "At-Takwir" },
        { number: 82, "Al-Infitar" }, { number: 83, "Al-Mutaffifin" }, { number: 84, "Al-Insyiqaq" },
        { number: 85, "Al-Buruj" }, { number: 86, "At-Tariq" }, { number: 87, "Al-A'la" },
        { number: 88, "Al-Ghasyiyah" }, { number: 89, "Al-Fajr" }, { number: 90, "Al-Balad" },
        { number: 91, "Asy-Syams" }, { number: 92, "Al-Lail" }, { number: 93, "Ad-Duha" },
        { number: 94, "Asy-Syarh" }, { number: 95, "At-Tin" }, { number: 96, "Al-'Alaq" },
        { number: 97, "Al-Qadr" }, { number: 98, "Al-Bayyinah" }, { number: 99, "Az-Zalzalah" },
        { number: 100, "Al-'Adiyat" }, { number: 101, "Al-Qari'ah" }, { number: 102, "At-Takasur" },
        { number: 103, "Al-'Asr" }, { number: 104, "Al-Humazah" }, { number: 105, "Al-Fil" },
        { number: 106, "Quraisy" }, { number: 107, "Al-Ma'un" }, { number: 108, "Al-Kausar" },
        { number: 109, "Al-Kafirun" }, { number: 110, "An-Nasr" }, { number: 111, "Al-Masad" },
        { number: 112, "Al-Ikhlas" }, { number: 113, "Al-Falaq" }, { number: 114, "An-Nas" }
    ];

    // 1. Mengisi dropdown dengan daftar surah
    surahList.forEach(surah => {
        const option = document.createElement('option');
        option.value = surah.number;
        option.textContent = `${surah.number}. ${surah.name}`;
        surahSelect.appendChild(option);
    });

    // 2. Event listener ketika surah dipilih
    surahSelect.addEventListener('change', () => {
        const surahNumber = surahSelect.value;
        if (surahNumber) {
            loadSurah(surahNumber);
        } else {
            // Kosongkan jika tidak ada yang dipilih
            surahDetails.innerHTML = '';
            ayahContainer.innerHTML = '';
        }
    });

    // 3. Fungsi untuk memuat dan menampilkan surah
    function loadSurah(surahNumber) {
        // Tampilkan loading dan kosongkan konten lama
        loadingIndicator.style.display = 'block';
        surahDetails.innerHTML = '';
        ayahContainer.innerHTML = '';

        fetch(`data/${surahNumber}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Gagal memuat data surah.');
                }
                return response.json();
            })
            .then(data => {
                loadingIndicator.style.display = 'none';
                displaySurah(data);
            })
            .catch(error => {
                loadingIndicator.style.display = 'none';
                ayahContainer.innerHTML = `<p style="text-align:center; color:red;">${error.message}</p>`;
                console.error('Error fetching surah:', error);
            });
    }

    // 4. Fungsi untuk merender data surah ke halaman
    function displaySurah(surahData) {
        // Tampilkan detail surah
        surahDetails.innerHTML = `
            <h2>${surahData.name}</h2>
            <p><strong>${surahData.name_latin}</strong> (${surahData.translations.id.name})</p>
            <p>${surahData.type} - ${surahData.number_of_ayah} Ayat</p>
        `;

        // Tampilkan setiap ayat
        let ayahsHTML = '';
        for (const ayahNumber in surahData.text) {
            const arabicText = surahData.text[ayahNumber];
            const translationText = surahData.translations.id.text[ayahNumber];

            ayahsHTML += `
                <div class="ayah">
                    <div class="ayah-number">${ayahNumber}</div>
                    <p class="arabic-text">${arabicText}</p>
                    <p class="translation-text">${translationText}</p>
                </div>
            `;
        }
        ayahContainer.innerHTML = ayahsHTML;
    }
});