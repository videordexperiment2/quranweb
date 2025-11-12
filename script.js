document.addEventListener('DOMContentLoaded', () => {
    // === ELEMEN DOM ===
    const loadingOverlay = document.getElementById('loading-overlay');
    const surahListContainer = document.getElementById('surah-list');
    const surahHeader = document.getElementById('surah-header');
    const ayahContainer = document.getElementById('ayah-container');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    const imamSelect = document.getElementById('imam-select');
    const playerInfo = document.getElementById('player-info');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');

    // === STATE APLIKASI ===
    let quranData = [], imamData = [];
    let bookmarks = JSON.parse(localStorage.getItem('quranBookmarks')) || [];
    let currentSurahNumber = 1, currentAyahIndex = -1;
    let selectedImamId = localStorage.getItem('selectedImam') || 'alafasy';
    let repeatMode = 'none'; // 'none', 'one', 'all'
    const audio = new Audio();

    // === FUNGSI UTAMA & INISIALISASI ===
    async function initializeApp() {
        try {
            const [quranResponse, imamResponse] = await Promise.all([
                fetch('https://raw.githubusercontent.com/urangbandung/quran/main/data/quran.json'),
                fetch('https://raw.githubusercontent.com/urangbandung/quran/main/data/imam.json')
            ]);
            
            if (!quranResponse.ok || !imamResponse.ok) throw new Error('Gagal memuat data sumber.');
            
            quranData = await quranResponse.json();
            imamData = await imamResponse.json();
            
            renderImamList();
            renderSurahList();
            renderSurah(currentSurahNumber);
            initTheme();

            loadingOverlay.style.opacity = '0';
            setTimeout(() => loadingOverlay.style.display = 'none', 500);

        } catch (error) {
            loadingOverlay.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    }

    // === FUNGSI PEWARNAAN TAJWID (SIMULASI) ===
    function applyTajwidColoring(text) {
        let coloredText = text;
        coloredText = coloredText.replace(/ٱللَّهِ/g, '<span class="tajwid-lafsalah">ٱللَّهِ</span>');
        coloredText = coloredText.replace(/([ن|م]\u0651)/g, '<span class="tajwid-ghunnah">$1</span>');
        coloredText = coloredText.replace(/([^\s]*\u0653[^\s]*)/g, '<span class="tajwid-madd">$1</span>');
        return coloredText;
    }

    // === FUNGSI RENDER TAMPILAN ===
    function renderImamList() {
        imamData.forEach(imam => {
            const option = document.createElement('option');
            option.value = imam.id;
            option.textContent = imam.name;
            if (imam.id === selectedImamId) option.selected = true;
            imamSelect.appendChild(option);
        });
    }

    function renderSurahList() {
        surahListContainer.innerHTML = '';
        quranData.forEach(surah => {
            const surahItem = document.createElement('div');
            surahItem.className = 'surah-item';
            surahItem.dataset.surahNumber = surah.number;
            if (surah.number === currentSurahNumber) surahItem.classList.add('active');
            surahItem.innerHTML = `<div class="surah-number">${surah.number}</div><div class="surah-info"><strong>${surah.asma.id.short}</strong><small>${surah.asma.translation.id} - ${surah.ayahCount} ayat</small></div>`;
            surahListContainer.appendChild(surahItem);
        });
    }

    function renderSurah(surahNumber) {
        const surah = quranData[surahNumber - 1];
        if (!surah) return;
        
        // ================== PERBAIKAN DI SINI ==================
        const bismillahHtml = (surah.preBismillah && typeof surah.preBismillah === 'object' && surah.preBismillah.text) ? `<p class="bismillah-text">${surah.preBismillah.text.ar}</p>` : '';
        // =======================================================

        surahHeader.innerHTML = `<h1>${surah.asma.ar.short}</h1><p>${surah.asma.id.long} • ${surah.ayahCount} Ayat</p>`;
        ayahContainer.innerHTML = bismillahHtml;

        surah.ayahs.forEach((ayah, index) => {
            const isBookmarked = bookmarks.some(b => b.surah === surah.number && b.ayah === ayah.number.insurah);
            const coloredArabicText = applyTajwidColoring(ayah.text.ar);
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
                <p class="arabic-text">${coloredArabicText}</p>
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
        if (!surah) return;
        const ayah = surah.ayahs[ayahIndex];
        if (!ayah) return;

        const imam = imamData.find(i => i.id === selectedImamId);
        if (!imam) return;

        const audioUrl = `${imam.url}/${String(surah.number).padStart(3, '0')}${String(ayah.number.insurah).padStart(3, '0')}.mp3`;
        
        audio.src = audioUrl;
        audio.play().catch(e => console.error("Audio playback error:", e));

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
        if (!ayah) return;
        const el = document.getElementById(`ayah-${currentSurahNumber}-${ayah.number.insurah}`);
        if(el) {
            el.classList.add('playing');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    function togglePlayPause() {
        if (audio.src && !audio.paused) {
            audio.pause();
        } else if (audio.src && audio.paused) {
            audio.play();
        } else if (currentAyahIndex === -1) {
            playAyah(currentSurahNumber, 0);
        }
    }
    
    audio.onplay = () => playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    audio.onpause = () => playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    audio.onerror = () => playerInfo.textContent = "Gagal memuat audio.";
    
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
        } else if (repeatMode === 'all') {
            playAyah(currentSurahNumber, 0);
        }
    }

    function playPrev() {
        if (currentAyahIndex > 0) playAyah(currentSurahNumber, currentAyahIndex - 1);
    }
    
    function toggleRepeatMode() {
        repeatBtn.classList.remove('one');
        if (repeatMode === 'none') {
            repeatMode = 'all';
            repeatBtn.classList.add('active');
            repeatBtn.title = "Ulangi Semua";
        } else if (repeatMode === 'all') {
            repeatMode = 'one';
            repeatBtn.classList.add('one');
            repeatBtn.title = "Ulangi Satu";
        } else {
            repeatMode = 'none';
            repeatBtn.classList.remove('active');
            repeatBtn.title = "Mode Ulangi";
        }
    }

    // === LOGIKA BOOKMARK & TEMA ===
    function toggleBookmark(surahNum, ayahNum, buttonEl) {
        const bookmarkIndex = bookmarks.findIndex(b => b.surah === surahNum && b.ayah === ayahNum);
        if (bookmarkIndex > -1) {
            bookmarks.splice(bookmarkIndex, 1);
            buttonEl.classList.remove('bookmarked');
        } else {
            bookmarks.push({ surah: surahNum, ayah: ayahNum });
            buttonEl.classList.add('bookmarked');
        }
        localStorage.setItem('quranBookmarks', JSON.stringify(bookmarks));
    }

    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            document.body.classList.remove('light-theme');
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    function toggleTheme() {
        document.body.classList.toggle('light-theme');
        if (document.body.classList.contains('light-theme')) {
            localStorage.setItem('theme', 'light');
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            localStorage.setItem('theme', 'dark');
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
    
    // === EVENT LISTENERS ===
    surahListContainer.addEventListener('click', (e) => {
        const surahItem = e.target.closest('.surah-item');
        if (!surahItem) return;

        const surahNum = parseInt(surahItem.dataset.surahNumber);
        if (surahNum === currentSurahNumber) return;

        currentSurahNumber = surahNum;
        renderSurah(currentSurahNumber);
        updateActiveSurahItem();
    });

    ayahContainer.addEventListener('click', (e) => {
        const playBtn = e.target.closest('.play-ayah-btn');
        const bookmarkBtn = e.target.closest('.bookmark-btn');
        if (playBtn) {
            const ayahIndex = parseInt(playBtn.closest('.ayah').dataset.ayahIndex);
            playAyah(currentSurahNumber, ayahIndex);
        }
        if (bookmarkBtn) {
            const ayahEl = bookmarkBtn.closest('.ayah');
            const ayah = quranData[currentSurahNumber - 1].ayahs[parseInt(ayahEl.dataset.ayahIndex)];
            toggleBookmark(currentSurahNumber, ayah.number.insurah, bookmarkBtn);
        }
    });

    playPauseBtn.addEventListener('click', togglePlayPause);
    nextBtn.addEventListener('click', playNext);
    prevBtn.addEventListener('click', playPrev);
    repeatBtn.addEventListener('click', toggleRepeatMode);
    themeToggleBtn.addEventListener('click', toggleTheme);
    imamSelect.addEventListener('change', (e) => {
        selectedImamId = e.target.value;
        localStorage.setItem('selectedImam', selectedImamId);
        if (!audio.paused) playAyah(currentSurahNumber, currentAyahIndex);
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