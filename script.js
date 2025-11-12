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
    const imamSelect = document.getElementById('imam-select');
    const playerInfo = document.getElementById('player-info');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const sidebarHideBtn = document.getElementById('sidebar-hide-btn'); // Tombol hide baru
    const surahSearch = document.getElementById('surah-search'); // Input search baru

    // === STATE APLIKASI ===
    let quranData = [], imamData = [];
    let readingHistory = JSON.parse(localStorage.getItem('quranReadingHistory')) || {};
    let currentSurahNumber = 1, currentAyahIndex = -1, isPlayingFullSurah = false;
    let selectedImamId = localStorage.getItem('selectedImam') || 1;
    let repeatMode = 'none';
    const audio = new Audio();
    let currentPlayingAyahEl = null; // Track ayat yang sedang playing untuk update ikon

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
            adjustLayout(); // Init layout adjustment
            playerInfo.textContent = ''; // Hilangkan teks default

            // Event listener untuk search surah
            surahSearch.addEventListener('input', (e) => filterSurahList(e.target.value));
        } catch (error) {
            loadingOverlay.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    }

    // === FUNGSI BARU: FILTER DAFTAR SURAH ===
    function filterSurahList(query) {
        const lowerQuery = query.toLowerCase();
        document.querySelectorAll('.surah-item').forEach(item => {
            const surahNumber = item.dataset.surahNumber;
            const surahName = item.querySelector('strong').textContent.toLowerCase();
            if (surahNumber.includes(lowerQuery) || surahName.includes(lowerQuery)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // === FUNGSI ADJUST LAYOUT UNTUK MOBILE RESIZE (ADDRESS BAR) ===
    function adjustLayout() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        appContainer.style.height = `calc(var(--vh, 1vh) * 100 - 60px)`; // Adjust height dinamis
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
        // Terapkan filter jika ada query aktif
        const query = surahSearch.value;
        if (query) filterSurahList(query);
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
            <button id="repeat-btn" class="control-btn" title="Mode Ulangi"><i class="fas fa-sync"></i></button> <!-- Tombol repeat dipindah ke sini -->
            <button id="play-full-surah-btn" class="icon-btn" title="Play Seluruh Surah"><i class="fas fa-play-circle"></i></button>
            <h1>${surah.asma.ar.short}</h1>
            <p>${surah.asma.id.long} • ${surah.ayahCount} Ayat</p>
        `;
        document.getElementById('play-full-surah-btn').addEventListener('click', togglePlayFull);
        document.getElementById('sidebar-unhide-btn').addEventListener('click', toggleSidebar);
        document.getElementById('repeat-btn').addEventListener('click', toggleRepeatMode); // Event listener untuk repeat
        ayahContainer.innerHTML = bismillahHtml;
        surah.ayahs.forEach((ayah, index) => {
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
            // Scroll ayat ke paling atas viewport dengan smooth, tepat di bawah sticky header
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Penyesuaian manual untuk tepat di bawah header (offset = height header + border width + extra)
            const headerHeight = surahHeader.offsetHeight || 60; // Default 60px jika tidak terdeteksi
            ayahContainer.scrollTop = el.offsetTop - headerHeight - 2 - 5; // -2 untuk border, -5 untuk extra margin rapih
        }
    }

    // === FUNGSI BARU: UPDATE IKON BUTTON DI AYAT YANG PLAYING ===
    function updateAyahButtonIcons() {
        // Reset semua tombol ayat ke play
        document.querySelectorAll('.play-ayah-btn').forEach(btn => {
            btn.innerHTML = '<i class="fas fa-play-circle"></i>';
            btn.title = 'Play Ayat Ini';
        });
        // Jika ada ayat playing, ubah ikonnya ke stop
        if (currentPlayingAyahEl) {
            const btn = currentPlayingAyahEl.querySelector('.play-ayah-btn');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-stop-circle"></i>';
                btn.title = 'Stop Ayat Ini';
            }
        }
    }

    // === FUNGSI BARU: TOGGLE PLAY FULL / STOP ===
    function togglePlayFull() {
        if (audio.paused) {
            playFullSurah();
        } else {
            audio.pause();
            isPlayingFullSurah = false;
            updatePlayFullButton();
        }
    }

    // === FUNGSI BARU: UPDATE IKON TOMBOL PLAY FULL ===
    function updatePlayFullButton() {
        const btn = document.getElementById('play-full-surah-btn');
        if (!btn) return;
        if (!audio.paused) {
            btn.innerHTML = '<i class="fas fa-stop-circle"></i>';
            btn.title = 'Stop Play';
        } else {
            btn.innerHTML = '<i class="fas fa-play-circle"></i>';
            btn.title = 'Play Seluruh Surah';
        }
    }

    // === LOGIKA RIWAYAT, SIDEBAR, TEMA ===
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
        currentPlayingAyahEl = document.getElementById(`ayah-${surahNum}-${ayah.number.insurah}`); // Track ayat playing
        updateAyahButtonIcons(); // Update ikon ayat
        updatePlayFullButton(); // Update ikon play full
    }
    function updatePlayerUI(surah, ayah) { 
        if (!isPlayingFullSurah) playerInfo.textContent = `S: ${surah.asma.id.short}, A: ${ayah.number.insurah}`; 
        else playerInfo.textContent = `Memutar Surah: ${surah.asma.id.short}`;
    }
    audio.onplay = () => {
        updateAyahButtonIcons();
        updatePlayFullButton();
    };
    audio.onpause = () => {
        updateAyahButtonIcons();
        updatePlayFullButton();
    };
    audio.onerror = () => playerInfo.textContent = "Gagal memuat audio.";
    audio.onended = () => {
        currentPlayingAyahEl = null; // Reset tracking
        updateAyahButtonIcons();
        updatePlayFullButton();
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
                    playerInfo.textContent = `Selesai Surah, Pindah ke Surah Berikutnya`;
                }
            } else {
                isPlayingFullSurah = false;
                playerInfo.textContent = `Selesai memutar seluruh Al-Qur'an`;
            }
        } else {
            if (repeatMode === 'one') playAyah(currentSurahNumber, currentAyahIndex, true);
            else if (repeatMode === 'all') playNext(false);
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
        const repeatBtn = document.getElementById('repeat-btn');
        repeatBtn.classList.remove('one');
        if (repeatMode === 'none') { 
            repeatMode = 'all'; 
            repeatBtn.classList.add('active'); 
            repeatBtn.innerHTML = '<i class="fas fa-sync-alt"></i>'; // Icon untuk repeat all
            repeatBtn.title = "Ulangi Semua"; 
        } else if (repeatMode === 'all') { 
            repeatMode = 'one'; 
            repeatBtn.classList.add('one'); 
            repeatBtn.innerHTML = '<i class="fas fa-sync"></i>'; // Icon untuk repeat one dengan "1" after
            repeatBtn.title = "Ulangi Satu"; 
        } else { 
            repeatMode = 'none'; 
            repeatBtn.classList.remove('active'); 
            repeatBtn.innerHTML = '<i class="fas fa-sync"></i>'; // Icon untuk off
            repeatBtn.title = "Mode Ulangi"; 
        }
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
            if (!audio.paused && ayahEl === currentPlayingAyahEl) {
                audio.pause(); // Stop jika klik stop di ayat playing
            } else {
                playAyah(currentSurahNumber, ayahIndex, true);
            }
            return;
        }
        // Klik pada ayat: Aktifkan dan pindah bookmark (tanpa tombol bookmark)
        saveReadingHistory(currentSurahNumber, quranData[currentSurahNumber - 1].ayahs[ayahIndex].number.insurah);
    });
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

    // Event listener untuk resize (address bar hide/show)
    window.addEventListener('resize', adjustLayout);
    window.addEventListener('orientationchange', adjustLayout); // Untuk portrait/landscape

    // === JALANKAN APLIKASI ===
    initializeApp();
});