document.addEventListener('DOMContentLoaded', () => {
    // === Elemen DOM ===
    const surahSelect = document.getElementById('surah-select');
    const surahDetails = document.getElementById('surah-details');
    const ayahContainer = document.getElementById('ayah-container');
    const loadingIndicator = document.getElementById('loading');
    const headerElement = document.querySelector('header');

    // Variabel untuk menyimpan semua data Quran
    let quranData = [];

    // Sembunyikan konten utama sampai data dimuat
    headerElement.style.display = 'none';

    // === Fungsi Utama: Muat semua data Quran sekali saja ===
    async function loadAllQuranData() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/urangbandung/quran/main/data/quran.json');
            if (!response.ok) {
                throw new Error('Gagal memuat data utama Al-Qur\'an.');
            }
            quranData = await response.json();
            
            // Setelah data dimuat, jalankan fungsi-fungsi berikutnya
            populateSurahList();
            loadingIndicator.style.display = 'none';
            headerElement.style.display = 'block'; // Tampilkan kembali konten

        } catch (error) {
            loadingIndicator.textContent = `Error: ${error.message} Silakan coba muat ulang halaman.`;
            console.error('Error memuat quran.json:', error);
        }
    }

    // === Fungsi untuk mengisi dropdown surah ===
    function populateSurahList() {
        quranData.forEach(surah => {
            const option = document.createElement('option');
            option.value = surah.number;
            option.textContent = `${surah.number}. ${surah.asma.id.short}`;
            surahSelect.appendChild(option);
        });
    }

    // === Fungsi untuk menampilkan surah yang dipilih ===
    function displaySurah(surahNumber) {
        // Cari surah di dalam data yang sudah kita simpan (array 0-indexed)
        const surah = quranData[surahNumber - 1];

        if (!surah) return;

        // Tampilkan detail surah dari struktur data baru
        surahDetails.innerHTML = `
            <h2>${surah.asma.ar.short}</h2>
            <p><strong>${surah.asma.id.short}</strong> (${surah.asma.translation.id})</p>
            <p>${surah.type.id} - ${surah.ayahCount} Ayat</p>
        `;

        // Kosongkan container ayat sebelum mengisi yang baru
        ayahContainer.innerHTML = '';

        // Tampilkan setiap ayat (sekarang dari array surah.ayahs)
        surah.ayahs.forEach(ayah => {
            const arabicText = ayah.text.ar;
            const translationText = ayah.translation.id;
            const ayahNumberInSurah = ayah.number.insurah;

            const ayahElement = document.createElement('div');
            ayahElement.className = 'ayah';
            ayahElement.innerHTML = `
                <div class="ayah-number">${ayahNumberInSurah}</div>
                <p class="arabic-text">${arabicText}</p>
                <p class="translation-text">${translationText}</p>
            `;
            ayahContainer.appendChild(ayahElement);
        });
    }

    // === Event Listener untuk dropdown ===
    surahSelect.addEventListener('change', () => {
        const surahNumber = surahSelect.value;
        if (surahNumber) {
            displaySurah(surahNumber);
        } else {
            surahDetails.innerHTML = '';
            ayahContainer.innerHTML = '';
        }
    });

    // === Mulai aplikasi dengan memuat data ===
    loadAllQuranData();
});