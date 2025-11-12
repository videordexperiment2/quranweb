document.addEventListener('DOMContentLoaded', () => {
    // === Definisi Huruf & Aturan Tajwid ===
    const SUKUN = '\u0652';
    const TASHDID = '\u0651';
    const TANWIN_REGEX = /[\u064b\u064d\u064c]/;
    const HURUQ_QALQALAH = 'قطبجد';
    const HURUQ_IDGHAM_BIGHUNNAH = 'ينمو';
    const HURUQ_IDGHAM_BILAGHUNNAH = 'لر';
    const HURUQ_IKHFA = 'تثجذزسشصضطظفقك';
    const HURUQ_IQLAB = 'ب';
    const HURUQ_IDGHAM_TOTAL = HURUQ_IDGHAM_BIGHUNNAH + HURUQ_IDGHAM_BILAGHUNNAH;

    // === ELEMEN DOM ===
    const loadingOverlay = document.getElementById('loading-overlay');
    const appContainer = document.getElementById('app-container');
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
    const sidebarHideBtn = document.getElementById('sidebar-hide-btn'); // Tombol hide baru

    // === STATE APLIKASI ===
    let quranData = [], imamData = [];
    let bookmarks = JSON.parse(localStorage.getItem('quranBookmarks')) || [];
    let readingHistory = JSON.parse(localStorage.getItem('quranReadingHistory')) || {};
    let currentSurahNumber = 1, currentAyahIndex = -1, isPlayingFullSurah = false;
    let selectedImamId = localStorage.getItem('selectedImam') || 1;
    let repeatMode = 'none';
    const audio = new Audio();

    // === FUNGSI UTAMA & INISIALISASI ===
    async function initializeApp() {
        try {
            const [quranResponse, imamResponse] = await Promise.all([ fetch('./data/quran.json'), fetch('./data/imam.json') ]);
            if (!quranResponse.ok || !imamResponse.ok) throw new Error('Gagal memuat file data lokal.');
            quranData = await quranResponse.json();
            imamData = await imamResponse.json();
            renderImamList();
            renderSurahList();
            renderSurah(currentSurahNumber);
            initTheme();
            initSidebar();
            loadingOverlay.style.opacity = '0';
            setTimeout(() => loadingOverlay.style.display = 'none', 500);
        } catch (error) {
            loadingOverlay.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    }

    // === FUNGSI PEWARNAAN TAJWID (VERSI CERDAS) ===
    function applyTajwidColoring(text) {
        const words = text.split(' ');
        let result = [];
        for (let i = 0; i < words.length; i++) {
            let currentWord = words[i];
            const nextWord = words[i + 1] || '';
            const nextFirstChar = nextWord.charAt(0);
            let ruleApplied = false;
            if ((currentWord.endsWith(SUKUN) && currentWord.charAt(currentWord.length - 2) === 'ن') || TANWIN_REGEX.test(currentWord.slice(-1))) {
                if (HURUQ_IDGHAM_TOTAL.includes(nextFirstChar)) {
                    currentWord = `<span class="tajwid-idgham">${currentWord}</span>`; ruleApplied = true;
                } else if (HURUQ_IQLAB.includes(nextFirstChar)) {
                    currentWord = `<span class="tajwid-idgham">${currentWord}</span>`; ruleApplied = true;
                } else if (HURUQ_IKHFA.includes(nextFirstChar)) {
                    currentWord = `<span class="tajwid-ikhfa">${currentWord}</span>`; ruleApplied = true;
                }
            }
            if (!ruleApplied) {
                currentWord = currentWord.replace(/(ٱللَّهِ|ٱللَّهَ|ٱللَّهُ)/g, '<span class="tajwid-lafsalah">$1</span>');
                currentWord = currentWord.replace(/(آ|[^\s]+\u0653[^\s]*)/g, '<span class="tajwid-madd">$1</span>');
                currentWord = currentWord.replace(/([نم])\u0651/g, '<span class="tajwid-ghunnah">$1' + TASHDID + '</span>');
                currentWord = currentWord.replace(new RegExp(`([${HURUQ_QALQALAH}])${SUKUN}`, 'g'), '<span class="tajwid-qalqalah">$1' + SUKUN + '</span>');
            }
            result.push(currentWord);
        }
        return result.join(' ');
    }
    
    // === FUNGSI PEMBENTUKAN URL AUDIO ===
    function getPerAyahAudioUrl(surahNum, ayahNumInSurah) {
        const imam = imamData.find(i => i.id == selectedImamId);
        if (!imam) return null;
        const surahNumPadded = String(surahNum).padStart(3, '0');
        const ayahNumPadded = String(ayahNumInSurah).padStart(3, '0');
        return `https://everyayah.com/data/${imam.path}/${surahNumPadded}${ayahNumPadded}.mp3`;
    }

    // === FUNGSI RENDER TAMPILAN ===
    function renderImamList() {
        imamData.forEach(imam => {
            const option = document.createElement('option');
            option.value = imam.id;
            option.textContent = imam.name;
            if (imam.id == selectedImamId) option.selected = true;
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
        // Default bookmark ke ayat 1 jika belum ada
        if (!readingHistory[surahNumber]) {
            readingHistory[surahNumber] = 1;
            localStorage.setItem('quranReadingHistory', JSON.stringify(readingHistory));
        }
        const bismillahHtml = (surah.preBismillah && typeof surah.preBismillah === 'object' && surah.preBismillah.text) ? `<p class="bismillah-text">${surah.preBismillah.text.ar}</p>` : '';
        surahHeader.innerHTML = `
            <button id="sidebar-unhide-btn" class="icon-btn" title="Tampilkan Daftar Surah"><i class="fas fa-eye"></i></button> <!-- Tombol unhide -->
            <button id="play-full-surah-btn" class="icon-btn" title="Play Seluruh Surah"><i class="fas fa-play-circle"></i></button>
            <h1>${surah.asma.ar.short}</h1>
            <p>${surah.asma.id.long} • ${surah.ayahCount} Ayat</p>
        `;
        document.getElementById('play-full-surah-btn').addEventListener('click', playFullSurah);
        document.getElementById('sidebar-unhide-btn').addEventListener('click', toggleSidebar);
        ayahContainer.innerHTML = bismillahHtml;
        surah.ayahs.forEach((ayah, index) => {
            const isBookmarked = bookmarks.some(b => b.surah === surah.number && b.ayah === ayah.number.insurah);
            const coloredArabicText = applyTajwidColoring(ayah.text.ar);
            const latinText = ayah.text.read;
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
                <p class="latin-text">${latinText}</p>
                <p class="translation-text">${ayah.translation.id}</p>
            `;
            ayahContainer.appendChild(ayahEl);
        });
        // Scroll ke bookmark aktif dan tandai sebagai active
        const lastReadAyah = readingHistory[surahNumber];
        const targetEl = document.getElementById(`ayah-${surahNumber}-${lastReadAyah}`);
        if (targetEl) {
            setTimeout(() => {
                updateActiveAyahUI(lastReadAyah); // Tandai sebagai active dan scroll
            }, 100);
        }
        updateToggleButtons(); // Update visibility tombol
    }

    // === FUNGSI UNTUK UPDATE ACTIVE AYAH (BOOKMARK) DAN SCROLL KE ATAS ===
    function updateActiveAyahUI(ayahNumInSurah) {
        document.querySelectorAll('.ayah.active').forEach(el => el.classList.remove('active'));
        const el = document.getElementById(`ayah-${currentSurahNumber}-${ayahNumInSurah}`);
        if (el) {
            el.classList.add('active');
            // Scroll ayat ke paling atas viewport dengan smooth
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Penyesuaian manual untuk memastikan tepat di atas (offset untuk padding/header)
            ayahContainer.scrollTop = el.offsetTop - 20; // Adjust offset jika perlu
        }
    }

    // === LOGIKA RIWAYAT, SIDEBAR, TEMA & BOOKMARK ===
    function saveReadingHistory(surahNum, ayahNum) { 
        readingHistory[surahNum] = ayahNum; 
        localStorage.setItem('quranReadingHistory', JSON.stringify(readingHistory)); 
        updateActiveAyahUI(ayahNum); // Update UI active dan scroll
    }
    function toggleSidebar() { 
        appContainer.classList.toggle('sidebar-collapsed'); 
        localStorage.setItem('sidebarState', appContainer.classList.contains('sidebar-collapsed') ? 'collapsed' : 'expanded'); 
        updateToggleButtons(); // Update visibility setelah toggle
    }
    function updateToggleButtons() {
        const isCollapsed = appContainer.classList.contains('sidebar-collapsed');
        sidebarHideBtn.style.display = isCollapsed ? 'none' : 'inline-block';
        const unhideBtn = document.getElementById('sidebar-unhide-btn');
        if (unhideBtn) unhideBtn.style.display = isCollapsed ? 'inline-block' : 'none';
    }
    function initSidebar() { 
        if (localStorage.getItem('sidebarState') === 'collapsed') appContainer.classList.add('sidebar-collapsed'); 
        updateToggleButtons(); // Init visibility
        sidebarHideBtn.addEventListener('click', toggleSidebar); // Event listener untuk tombol hide
    }
    function toggleBookmark(surahNum, ayahNum, buttonEl) {
        const bookmarkIndex = bookmarks.findIndex(b => b.surah === surahNum && b.ayah === ayahNum);
        if (bookmarkIndex > -1) { bookmarks.splice(bookmarkIndex, 1); buttonEl.classList.remove('bookmarked'); }
        else { bookmarks.push({ surah: surahNum, ayah: ayahNum }); buttonEl.classList.add('bookmarked'); }
        localStorage.setItem('quranBookmarks', JSON.stringify(bookmarks));
    }
    function initTheme() {
        if (localStorage.getItem('theme') === 'light') { document.body.classList.add('light-theme'); themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>'; }
        else { document.body.classList.remove('light-theme'); themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>'; }
    }
    function toggleTheme() {
        document.body.classList.toggle('light-theme');
        localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
        initTheme();
    }
    
    // === LOGIKA AUDIO PLAYER ===
    function playFullSurah() {
        audio.pause(); isPlayingFullSurah = true;
        playerInfo.textContent = `Memutar Surah: ${quranData[currentSurahNumber - 1].asma.id.short}`;
        const surah = quranData[currentSurahNumber - 1];
        const lastReadAyahNum = readingHistory[currentSurahNumber] || 1;
        const startIndex = surah.ayahs.findIndex(a => a.number.insurah === lastReadAyahNum);
        playAyah(currentSurahNumber, startIndex >= 0 ? startIndex : 0);
    }
    function playAyah(surahNum, ayahIndex, isManualClick = false) {
        if (isManualClick) isPlayingFullSurah = false;
        currentSurahNumber = surahNum; currentAyahIndex = ayahIndex;
        const surah = quranData[surahNum - 1]; const ayah = surah.ayahs[ayahIndex];
        const audioUrl = getPerAyahAudioUrl(surahNum, ayah.number.insurah);
        if (!audioUrl) { playerInfo.textContent = "Gagal mendapatkan URL audio"; return; }
        audio.src = audioUrl; audio.play().catch(e => console.error("Audio playback error:", e));
        updatePlayerUI(surah, ayah); updateActiveAyahUI(ayah.number.insurah);
        saveReadingHistory(surahNum, ayah.number.insurah); // Update bookmark saat play
    }
    function updatePlayerUI(surah, ayah) { if (!isPlayingFullSurah) playerInfo.textContent = `S: ${surah.asma.id.short}, A: ${ayah.number.insurah}`; playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; }
    function togglePlayPause() { if (!audio.src) playAyah(currentSurahNumber, 0, true); else if (audio.paused) audio.play(); else audio.pause(); }
    audio.onplay = () => playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    audio.onpause = () => playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    audio.onerror = () => playerInfo.textContent = "Gagal memuat audio.";
    audio.onended = () => {
        if (isPlayingFullSurah) {
            const surah = quranData[currentSurahNumber - 1];
            if (currentAyahIndex < surah.ayahs.length - 1) {
                playNext(true);
            } else if (currentSurahNumber < 114) {
                const nextSurahNumber = currentSurahNumber + 1;
                currentSurahNumber = nextSurahNumber;
                renderSurah(nextSurahNumber); updateActiveSurahItem();
                saveReadingHistory(nextSurahNumber, 1); // Set bookmark ayat 1 untuk surah baru
                playerInfo.textContent = `Memutar Surah: ${quranData[nextSurahNumber - 1].asma.id.short}`;
                if (repeatMode === 'all') {
                    // Lanjut play di repeat all
                    setTimeout(() => playAyah(nextSurahNumber, 0), 500);
                } else {
                    // Stop play, hanya pindah surah
                    isPlayingFullSurah = false;
                    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                    playerInfo.textContent = `Selesai Surah, Pindah ke Surah Berikutnya`;
                }
            } else {
                isPlayingFullSurah = false;
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                playerInfo.textContent = `Selesai memutar seluruh Al-Qur'an`;
            }
        } else {
            if (repeatMode === 'one') playAyah(currentSurahNumber, currentAyahIndex, true);
            else if (repeatMode === 'all') playNext(false);
            else playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    };
    function playNext(keepFullSurahMode = false) {
        if (!keepFullSurahMode) isPlayingFullSurah = false;
        const surah = quranData[currentSurahNumber - 1];
        if (currentAyahIndex < surah.ayahs.length - 1) playAyah(currentSurahNumber, currentAyahIndex + 1);
        else if (repeatMode === 'all' && !isPlayingFullSurah) playAyah(currentSurahNumber, 0);
    }
    function playPrev() { isPlayingFullSurah = false; if (currentAyahIndex > 0) playAyah(currentSurahNumber, currentAyahIndex - 1); }
    function toggleRepeatMode() {
        repeatBtn.classList.remove('one');
        if (repeatMode === 'none') { repeatMode = 'all'; repeatBtn.classList.add('active'); repeatBtn.title = "Ulangi Semua"; }
        else if (repeatMode === 'all') { repeatMode = 'one'; repeatBtn.classList.add('one'); repeatBtn.title = "Ulangi Satu"; }
        else { repeatMode = 'none'; repeatBtn.classList.remove('active'); repeatBtn.title = "Mode Ulangi"; }
    }
    
    // === EVENT LISTENERS ===
    surahListContainer.addEventListener('click', (e) => {
        const surahItem = e.target.closest('.surah-item'); if (!surahItem) return;
        const surahNum = parseInt(surahItem.dataset.surahNumber); if (surahNum === currentSurahNumber) return;
        currentSurahNumber = surahNum; audio.pause(); currentAyahIndex = -1; isPlayingFullSurah = false;
        renderSurah(currentSurahNumber); updateActiveSurahItem();
        // Auto hide sidebar setelah memilih surah (jika saat ini expanded)
        if (!appContainer.classList.contains('sidebar-collapsed')) {
            toggleSidebar();
        }
    });
    ayahContainer.addEventListener('click', (e) => {
        const ayahEl = e.target.closest('.ayah');
        if (!ayahEl) return;
        const ayahIndex = parseInt(ayahEl.dataset.ayahIndex);
        const target = e.target;
        if (target.closest('.play-ayah-btn')) {
            playAyah(currentSurahNumber, ayahIndex, true);
            return;
        }
        if (target.closest('.bookmark-btn')) {
            const ayah = quranData[currentSurahNumber - 1].ayahs[ayahIndex];
            toggleBookmark(currentSurahNumber, ayah.number.insurah, target.closest('.bookmark-btn'));
            return;
        }
        // Klik pada ayat: Aktifkan dan pindah bookmark
        saveReadingHistory(currentSurahNumber, quranData[currentSurahNumber - 1].ayahs[ayahIndex].number.insurah);
    });
    playPauseBtn.addEventListener('click', togglePlayPause);
    nextBtn.addEventListener('click', () => playNext(false));
    prevBtn.addEventListener('click', playPrev);
    repeatBtn.addEventListener('click', toggleRepeatMode);
    themeToggleBtn.addEventListener('click', toggleTheme);
    imamSelect.addEventListener('change', (e) => {
        selectedImamId = e.target.value; localStorage.setItem('selectedImam', selectedImamId);
        if (!audio.paused) playAyah(currentSurahNumber, currentAyahIndex, !isPlayingFullSurah);
    });
    function updateActiveSurahItem() {
        document.querySelectorAll('.surah-item.active').forEach(item => item.classList.remove('active'));
        const activeItem = document.querySelector(`.surah-item[data-surah-number="${currentSurahNumber}"]`);
        if (activeItem) { activeItem.classList.add('active'); activeItem.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    }

    // === JALANKAN APLIKASI ===
    initializeApp();
});