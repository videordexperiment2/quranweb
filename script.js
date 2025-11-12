document.addEventListener('DOMContentLoaded', () => {
    // === ELEMEN DOM ===
    const loadingOverlay = document.getElementById('loading-overlay');
    const surahListContainer = document.getElementById('surah-list');
    const surahHeader = document.getElementById('surah-header');
    const ayahContainer = document.getElementById('ayah-container');
    const audioPlayer = document.getElementById('audio-player');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    const imamSelect = document.getElementById('imam-select');
    const playerInfo = document.getElementById('player-info');

    // === STATE APLIKASI ===
    let quranData = [];
    let imamData = [];
    let bookmarks = JSON.parse(localStorage.getItem('quranBookmarks')) || [];
    let currentSurahNumber = 1;
    let currentAyahIndex = -1;
    let selectedImamId = 'alafasy'; // Default Imam
    let repeatMode = 'none'; // 'none', 'one', 'all'
    const audio = new Audio();

    // === INISIALISASI APLIKASI ===
    async function initializeApp() {
        try {
            const [quranResponse, imamResponse] = await Promise.all([
                fetch('https://raw.githubusercontent.com/urangbandung/quran/main/data/quran.json'),
                fetch('https://raw.githubusercontent.com/urangbandung/quran/main/data/imam.json')
            ]);
            
            if (!quranResponse.ok || !imamResponse.ok) {
                throw new Error('Gagal memuat data.');
            }

            quranData = await quranResponse.json();
            imamData = await imamResponse.json();
            
            renderImamList();
            renderSurahList();
            renderSurah(currentSurahNumber);

            loadingOverlay.style.opacity = '0';
            setTimeout(() => loadingOverlay.style.display = 'none', 500);

        } catch (error) {
            loadingOverlay.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    }

    // === FUNGSI RENDER ===
    function renderImamList() {
        imamData.forEach(imam => {
            const option = document.createElement('option');
            option.value = imam.id;
            option.textContent = imam.name;
            if (imam.id === selectedImamId) {
                option.selected = true;
            }
            imamSelect.appendChild(option);
        });
    }

    function renderSurahList() {
        surahListContainer.innerHTML = '';
        quranData.forEach(surah => {
            const surahItem = document.createElement('div');
            surahItem.className = 'surah-item';
            surahItem.dataset.surahNumber = surah.number;
            if (surah.number === currentSurahNumber) {
                surahItem.classList.add('active');
            }
            surahItem.innerHTML = `
                <div class="surah-number">${surah.number}</div>
                <div class="surah-info">
                    <strong>${surah.asma.id.short}</strong>
                    <small>${surah.asma.translation.id} - ${surah.ayahCount} ayat</small>
                </div>
            `;
            surahItem.addEventListener('click', () => {
                currentSurahNumber = surah.number;
                renderSurah(currentSurahNumber);
                updateActiveSurahItem();
            });
            surahListContainer.appendChild(surahItem);
        });
    }

    function renderSurah(surahNumber) {
        const surah = quranData[surahNumber - 1];
        if (!surah) return;
        
        const bismillah = surah.preBismillah ? `<img src="https://i.imgur.com/2A215sN.png" alt="Bismillah" style="display:block; margin: 20px auto; width: 300px;"/>` : '';

        surahHeader.innerHTML = `
            <h1>${surah.asma.ar.short}</h1>
            <p>${surah.asma.id.long} • ${surah.ayahCount} Ayat</p>
        `;

        ayahContainer.innerHTML = bismillah;
        surah.ayahs.forEach((ayah, index) => {
            const isBookmarked = bookmarks.some(b => b.surah === surah.number && b.ayah === ayah.number.insurah);
            const ayahEl = document.createElement('div');
            ayahEl.className = 'ayah';
            ayahEl.id = `ayah-${surah.number}-${ayah.number.insurah}`;
            ayahEl.dataset.ayahIndex = index;
            ayahEl.innerHTML = `
                <div class="ayah-header">
                    <span class="ayah-number">${surah.number}:${ayah.number.insurah}</span>
                    <div class="ayah-actions">
                        <button class="play-ayah-btn" title="Play Ayat Ini"><i class="fas fa-play-circle"></i></button>
                        <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" title="Bookmark"><i class="fas fa-bookmark"></i></button>
                    </div>
                </div>
                <p class="arabic-text">${ayah.text.ar}</p>
                <p class="translation-text">${ayah.translation.id}</p>
            `;
            ayahContainer.appendChild(ayahEl);
        });
    }

    // === LOGIKA AUDIO PLAYER ===
    function playAyah(surahNum, ayahIndex) {
        currentSurahNumber = surahNum;
        currentAyahIndex = ayahIndex;
        const surah = quranData[surahNum - 1];
        const ayah = surah.ayahs[ayahIndex];
        
        const imam = imamData.find(i => i.id === selectedImamId);
        const audioUrl = `${imam.url}/${String(surah.number).padStart(3,'0')}${String(ayah.number.insurah).padStart(3,'0')}.mp3`;
        
        audio.src = audioUrl;
        audio.play();

        updatePlayerUI(surah, ayah);
        updateActiveAyahUI();
    }
    
    function updatePlayerUI(surah, ayah) {
        playerInfo.textContent = `S: ${surah.asma.id.short}, A: ${ayah.number.insurah}`;
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }

    function updateActiveAyahUI() {
        document.querySelectorAll('.ayah.playing').forEach(el => el.classList.remove('playing'));
        const ayah = quranData[currentSurahNumber-1].ayahs[currentAyahIndex];
        const el = document.getElementById(`ayah-${currentSurahNumber}-${ayah.number.insurah}`);
        if(el) {
            el.classList.add('playing');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    function togglePlayPause() {
        if(audio.paused) {
            if (currentAyahIndex === -1) { // Jika belum ada yg di play, play dari ayat pertama
                playAyah(currentSurahNumber, 0);
            } else {
                audio.play();
            }
        } else {
            audio.pause();
        }
    }

    audio.onplay = () => playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    audio.onpause = () => playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    
    audio.onended = () => {
        if (repeatMode === 'one') {
            playAyah(currentSurahNumber, currentAyahIndex);
        } else if (repeatMode === 'all') {
            playNext();
        } else {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    };

    function playNext() {
        const surah = quranData[currentSurahNumber - 1];
        if (currentAyahIndex < surah.ayahs.length - 1) {
            playAyah(currentSurahNumber, currentAyahIndex + 1);
        } else if (repeatMode === 'all') { // jika sudah di akhir surah dan mode repeat all
            playAyah(currentSurahNumber, 0); // kembali ke ayat 1
        }
    }

    function playPrev() {
        if (currentAyahIndex > 0) {
            playAyah(currentSurahNumber, currentAyahIndex - 1);
        }
    }
    
    function toggleRepeatMode() {
        repeatBtn.classList.remove('one'); // hapus class 'one' dulu
        if (repeatMode === 'none') {
            repeatMode = 'all';
            repeatBtn.classList.add('active');
            repeatBtn.title = "Ulangi Semua";
        } else if (repeatMode === 'all') {
            repeatMode = 'one';
            repeatBtn.classList.add('one'); // tambahkan class 'one'
            repeatBtn.title = "Ulangi Satu";
        } else {
            repeatMode = 'none';
            repeatBtn.classList.remove('active');
            repeatBtn.title = "Mode Ulangi";
        }
    }

    // === LOGIKA BOOKMARK ===
    function toggleBookmark(surahNum, ayahNum) {
        const bookmarkIndex = bookmarks.findIndex(b => b.surah === surahNum && b.ayah === ayahNum);
        if (bookmarkIndex > -1) {
            bookmarks.splice(bookmarkIndex, 1);
        } else {
            bookmarks.push({ surah: surahNum, ayah: ayahNum });
        }
        localStorage.setItem('quranBookmarks', JSON.stringify(bookmarks));
    }
    
    // === EVENT LISTENERS ===
    ayahContainer.addEventListener('click', (e) => {
        const playBtn = e.target.closest('.play-ayah-btn');
        const bookmarkBtn = e.target.closest('.bookmark-btn');
        const ayahEl = e.target.closest('.ayah');
        
        if (playBtn && ayahEl) {
            const ayahIndex = parseInt(ayahEl.dataset.ayahIndex);
            playAyah(currentSurahNumber, ayahIndex);
        }
        
        if (bookmarkBtn && ayahEl) {
            const ayah = quranData[currentSurahNumber - 1].ayahs[parseInt(ayahEl.dataset.ayahIndex)];
            toggleBookmark(currentSurahNumber, ayah.number.insurah);
            bookmarkBtn.classList.toggle('bookmarked');
        }
    });

    playPauseBtn.addEventListener('click', togglePlayPause);
    nextBtn.addEventListener('click', playNext);
    prevBtn.addEventListener('click', playPrev);
    repeatBtn.addEventListener('click', toggleRepeatMode);
    imamSelect.addEventListener('change', (e) => {
        selectedImamId = e.target.value;
        if (!audio.paused) { // Jika sedang play, langsung putar ulang dengan imam baru
            playAyah(currentSurahNumber, currentAyahIndex);
        }
    });
    
    function updateActiveSurahItem() {
        document.querySelectorAll('.surah-item.active').forEach(item => item.classList.remove('active'));
        const activeItem = document.querySelector(`.surah-item[data-surah-number="${currentSurahNumber}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
            activeItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    }

    // === JALANKAN APLIKASI ===
    initializeApp();
});