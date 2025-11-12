/* -----------------------------------------------------------
   Quran Digital Profesional – script (v1.1)
   ----------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {

    /* -----  Tajwid helpers  ----- */
    const SUKUN = '\u0652';
    const TASHDID = '\u0651';
    const TANWIN_REGEX = /[\u064b\u064d\u064c]/;
    const HURUQ_QALQALAH = 'قطبجد';
    const HURUQ_IDGHAM_BIGHUNNAH = 'ينمو';
    const HURUQ_IDGHAM_BILAGHUNNAH = 'لر';
    const HURUQ_IKHFA = 'تثجذزسشصضطظفقك';
    const HURUQ_IQLAB = 'ب';
    const HURUQ_IDGHAM_TOTAL = HURUQ_IDGHAM_BIGHUNNAH + HURUQ_IDGHAM_BILAGHUNNAH;

    /* -----  DOM elements  ----- */
    const loadingOverlay = document.getElementById('loading-overlay');
    const appContainer = document.getElementById('app-container');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const sidebar = document.getElementById('sidebar');

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

    /* -----  floating unhide button  ----- */
    const sidebarUnhideBtn = document.getElementById('sidebar-unhide-btn');

    /* -----  App state  ----- */
    let quranData = [], imamData = [];
    const audio = new Audio();

    let bookmarks = JSON.parse(localStorage.getItem('quranBookmarks')) || [];
    let readingHistory = JSON.parse(localStorage.getItem('quranReadingHistory')) || {};
    let currentSurahNumber = 1,
        currentAyahIndex = -1,
        isPlayingFullSurah = false;

    let selectedImamId = localStorage.getItem('selectedImam') || 1;
    let repeatMode = 'none';

    /* -----------------------------------------------------------
       1️⃣  INITIALISE APP
    ----------------------------------------------------------- */
    async function initializeApp() {
        try {
            const [quranRes, imamRes] = await Promise.all([
                fetch('./data/quran.json'),
                fetch('./data/imam.json')
            ]);
            if (!quranRes.ok || !imamRes.ok) throw new Error('Gagal memuat file data lokal.');

            quranData = await quranRes.json();
            imamData = await imamRes.json();

            renderImamList();
            renderSurahList();
            renderSurah(currentSurahNumber);
            initTheme();
            initSidebar();
            initOrientationDefaults();

            loadingOverlay.style.opacity = '0';
            setTimeout(() => (loadingOverlay.style.display = 'none'), 500);
        } catch (err) {
            loadingOverlay.innerHTML = `<p style="color:red">Error: ${err.message}</p>`;
        }
    }

    /* -----------------------------------------------------------
       2️⃣  TAJWID COLORING (simple but fast)
    ----------------------------------------------------------- */
    function applyTajwidColoring(text) {
        const words = text.split(' ');
        const result = [];

        for (let i = 0; i < words.length; i++) {
            let w = words[i];
            const next = words[i + 1] || '';
            const nextFirst = next.charAt(0);
            let ruleApplied = false;

            // Idgham / Ikhfa / Iqlab
            if ((w.endsWith(SUKUN) && w.charAt(w.length - 2) === 'ن') || TANWIN_REGEX.test(w.slice(-1))) {
                if (HURUQ_IDGHAM_TOTAL.includes(nextFirst) || HURUQ_IQLAB.includes(nextFirst)) {
                    w = `<span class="tajwid-idgham">${w}</span>`;
                    ruleApplied = true;
                } else if (HURUQ_IKHFA.includes(nextFirst)) {
                    w = `<span class="tajwid-ikhfa">${w}</span>`;
                    ruleApplied = true;
                }
            }
            if (!ruleApplied) {
                // Lafz al‑Jalalah
                w = w.replace(/(ٱللَّهِ|ٱللَّهَ|ٱللَّهُ)/g, '<span class="tajwid-lafsalah">$1</span>');
                // Madd (alif + hamza, long vowels)
                w = w.replace(/(آ|[^\s]+\u0653[^\s]*)/g, '<span class="tajwid-madd">$1</span>');
                // Ghunnah (nun / meem with shadda)
                w = w.replace(/([نم])\u0651/g, '<span class="tajwid-ghunnah">$1' + TASHDID + '</span>');
                // Qalqalah
                w = w.replace(new RegExp(`([${HURUQ_QALQALAH}])${SUKUN}`, 'g'),
                    '<span class="tajwid-qalqalah">$1' + SUKUN + '</span>');
            }
            result.push(w);
        }
        return result.join(' ');
    }

    /* -----------------------------------------------------------
       3️⃣  AUDIO UTILITIES
    ----------------------------------------------------------- */
    function getPerAyahAudioUrl(surahNum, ayahNumInSurah) {
        const imam = imamData.find(i => i.id == selectedImamId);
        if (!imam) return null;
        const sp = String(surahNum).padStart(3, '0');
        const ap = String(ayahNumInSurah).padStart(3, '0');
        return `https://everyayah.com/data/${imam.path}/${sp}${ap}.mp3`;
    }

    /* -----------------------------------------------------------
       4️⃣  RENDER FUNCTIONS
    ----------------------------------------------------------- */
    function renderImamList() {
        imamSelect.innerHTML = '';
        imamData.forEach(im => {
            const opt = document.createElement('option');
            opt.value = im.id;
            opt.textContent = im.name;
            if (im.id == selectedImamId) opt.selected = true;
            imamSelect.appendChild(opt);
        });
    }

    function renderSurahList() {
        surahListContainer.innerHTML = '';
        quranData.forEach(s => {
            const el = document.createElement('div');
            el.className = 'surah-item';
            el.dataset.surahNumber = s.number;
            if (s.number === currentSurahNumber) el.classList.add('active');
            el.innerHTML = `
                <div class="surah-number">${s.number}</div>
                <div class="surah-info">
                    <strong>${s.asma.id.short}</strong>
                    <small>${s.asma.translation.id} – ${s.ayahCount} ayat</small>
                </div>
            `;
            surahListContainer.appendChild(el);
        });
    }

    function renderSurah(num) {
        const s = quranData[num - 1];
        if (!s) return;
        const bismillah = (s.preBismillah && s.preBismillah.text)
            ? `<p class="bismillah-text">${s.preBismillah.text.ar}</p>` : '';

        // Header (Arabic title + Indonesian subtitle)
        surahHeader.innerHTML = `
            <button id="sidebar-toggle-btn" class="icon-btn" title="Tampilkan/Sembunyikan Daftar Surah">
                <i class="fas fa-bars"></i>
            </button>
            <button id="play-full-surah-btn" class="icon-btn" title="Play Seluruh Surah">
                <i class="fas fa-play-circle"></i>
            </button>
            <h1>${s.asma.ar.short}</h1>
            <p>${s.asma.id.long} • ${s.ayahCount} Ayat</p>
        `;

        // Attach listeners (the same function will toggle the sidebar on all devices)
        document.getElementById('sidebar-toggle-btn').addEventListener('click', toggleSidebar);
        document.getElementById('play-full-surah-btn').addEventListener('click', playFullSurah);

        // Verses
        ayahContainer.innerHTML = bismillah;
        s.ayahs.forEach((a, idx) => {
            const isBm = bookmarks.some(b => b.surah === s.number && b.ayah === a.number.insurah);
            const ay = document.createElement('div');
            ay.className = 'ayah';
            ay.id = `ayah-${s.number}-${a.number.insurah}`;
            ay.dataset.ayahIndex = idx;
            ay.innerHTML = `
                <div class="ayah-header">
                    <span class="ayah-number">${s.number}:${a.number.insurah}</span>
                    <div class="ayah-actions">
                        <button class="play-ayah-btn" title="Play Ayat Ini">
                            <i class="fas fa-play-circle"></i>
                        </button>
                        <button class="bookmark-btn ${isBm ? 'bookmarked' : ''}" title="Bookmark">
                            <i class="fas fa-bookmark"></i>
                        </button>
                    </div>
                </div>
                <p class="arabic-text">${applyTajwidColoring(a.text.ar)}</p>
                <p class="latin-text">${a.text.read}</p>
                <p class="translation-text">${a.translation.id}</p>
            `;
            ayahContainer.appendChild(ay);
        });

        // Scroll to the last‑read ayah (if any)
        const last = readingHistory[num];
        if (last) {
            const target = document.getElementById(`ayah-${num}-${last}`);
            if (target) {
                setTimeout(() => {
                    target.scrollIntoView({ behavior: 'auto', block: 'start' });
                    target.classList.add('playing');
                    setTimeout(() => target.classList.remove('playing'), 2000);
                }, 100);
            }
        }

        // Update active item in the list
        updateActiveSurahItem();
    }

    /* -----------------------------------------------------------
       5️⃣  SIDEBAR TOGGLE (unified for desktop & mobile)
    ----------------------------------------------------------- */
    function toggleSidebar() {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (isMobile) {
            appContainer.classList.toggle('sidebar-open');
        } else {
            appContainer.classList.toggle('sidebar-collapsed');
        }
        // keep the floating button in sync
        updateSidebarUnhideButton();
    }

    function updateSidebarUnhideButton() {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const hidden = isMobile
            ? !appContainer.classList.contains('sidebar-open')
            : appContainer.classList.contains('sidebar-collapsed');

        sidebarUnhideBtn.innerHTML = hidden
            ? '<i class="fas fa-eye"></i>'
            : '<i class="fas fa-eye-slash"></i>';
        sidebarUnhideBtn.title = hidden
            ? 'Tampilkan Daftar Surah'
            : 'Sembunyikan Daftar Surah';
    }

    /* -----------------------------------------------------------
       6️⃣  THEME & SIDEBAR PERSISTENCE
    ----------------------------------------------------------- */
    function initTheme() {
        if (localStorage.getItem('theme') === 'light') {
            document.body.classList.add('light-theme');
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            document.body.classList.remove('light-theme');
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
    function toggleTheme() {
        document.body.classList.toggle('light-theme');
        localStorage.setItem('theme',
            document.body.classList.contains('light-theme') ? 'light' : 'dark');
        initTheme();
    }

    function initSidebar() {
        // desktop: restore collapsed state if user saved it
        if (localStorage.getItem('sidebarState') === 'collapsed')
            appContainer.classList.add('sidebar-collapsed');
        updateSidebarUnhideButton();
    }

    function initOrientationDefaults() {
        // Mobile: portrait → sidebar hidden; landscape → sidebar shown
        if (window.matchMedia('(max-width: 768px)').matches) {
            if (window.matchMedia('(orientation: landscape)').matches)
                appContainer.classList.add('sidebar-open');
            else
                appContainer.classList.remove('sidebar-open');
        }
    }

    /* -----------------------------------------------------------
       7️⃣  BOOKMARK & READING‑HISTORY
    ----------------------------------------------------------- */
    function saveReadingHistory(s, a) {
        readingHistory[s] = a;
        localStorage.setItem('quranReadingHistory', JSON.stringify(readingHistory));
    }
    function toggleBookmark(s, a, btn) {
        const idx = bookmarks.findIndex(b => b.surah === s && b.ayah === a);
        if (idx > -1) {
            bookmarks.splice(idx, 1);
            btn.classList.remove('bookmarked');
        } else {
            bookmarks.push({ surah: s, ayah: a });
            btn.classList.add('bookmarked');
        }
        localStorage.setItem('quranBookmarks', JSON.stringify(bookmarks));
    }

    /* -----------------------------------------------------------
       8️⃣  AUDIO PLAYER LOGIC
    ----------------------------------------------------------- */
    function playFullSurah() {
        audio.pause(); isPlayingFullSurah = true;
        const s = quranData[currentSurahNumber - 1];
        const startAyah = readingHistory[currentSurahNumber] || 1;
        const startIdx = s.ayahs.findIndex(x => x.number.insurah === startAyah);
        playAyah(currentSurahNumber, Math.max(startIdx, 0), false);
    }

    function playAyah(sNum, aIdx, manual = false) {
        if (manual) isPlayingFullSurah = false;
        currentSurahNumber = sNum;
        currentAyahIndex = aIdx;
        const s = quranData[sNum - 1];
        const a = s.ayahs[aIdx];

        const url = getPerAyahAudioUrl(sNum, a.number.insurah);
        if (!url) {
            playerInfo.textContent = 'Gagal mendapatkan URL audio';
            return;
        }
        audio.src = url;
        audio.play().catch(console.error);

        playerInfo.textContent = isPlayingFullSurah
            ? `Memutar Surah: ${s.asma.id.short}`
            : `S: ${s.asma.id.short}, A: ${a.number.insurah}`;

        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        updateActiveAyahUI();
        saveReadingHistory(sNum, a.number.insurah);
    }

    function updateActiveAyahUI() {
        document.querySelectorAll('.ayah.playing').forEach(el => el.classList.remove('playing'));
        const a = quranData[currentSurahNumber - 1]?.ayahs[currentAyahIndex];
        if (!a) return;
        const el = document.getElementById(`ayah-${currentSurahNumber}-${a.number.insurah}`);
        if (el) {
            el.classList.add('playing');
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function togglePlayPause() {
        if (!audio.src) playAyah(currentSurahNumber, 0, true);
        else if (audio.paused) audio.play();
        else audio.pause();
    }
    audio.onplay = () => playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    audio.onpause = () => playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    audio.onerror = () => (playerInfo.textContent = 'Gagal memuat audio.');

    audio.onended = () => {
        if (isPlayingFullSurah) {
            const s = quranData[currentSurahNumber - 1];
            if (currentAyahIndex < s.ayahs.length - 1) {
                playNext(true);
            } else if (currentSurahNumber < 114) {
                const next = currentSurahNumber + 1;
                currentSurahNumber = next;
                renderSurah(next);
                updateActiveSurahItem();
                playerInfo.textContent = `Memutar Surah: ${quranData[next - 1].asma.id.short}`;
                setTimeout(() => playAyah(next, 0), 500);
            } else {
                isPlayingFullSurah = false;
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                playerInfo.textContent = 'Selesai memutar seluruh Al‑Qur’an';
            }
        } else {
            if (repeatMode === 'one') playAyah(currentSurahNumber, currentAyahIndex, true);
            else if (repeatMode === 'all') playNext(false);
            else playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    };

    function playNext(keepFull) {
        if (!keepFull) isPlayingFullSurah = false;
        const s = quranData[currentSurahNumber - 1];
        if (currentAyahIndex < s.ayahs.length - 1)
            playAyah(currentSurahNumber, currentAyahIndex + 1);
        else if (repeatMode === 'all' && !isPlayingFullSurah)
            playAyah(currentSurahNumber, 0);
    }
    function playPrev() {
        isPlayingFullSurah = false;
        if (currentAyahIndex > 0)
            playAyah(currentSurahNumber, currentAyahIndex - 1);
    }
    function toggleRepeatMode() {
        repeatBtn.classList.remove('one');
        if (repeatMode === 'none') {
            repeatMode = 'all';
            repeatBtn.classList.add('active');
            repeatBtn.title = 'Ulangi Semua';
        } else if (repeatMode === 'all') {
            repeatMode = 'one';
            repeatBtn.classList.add('one');
            repeatBtn.title = 'Ulangi Satu';
        } else {
            repeatMode = 'none';
            repeatBtn.classList.remove('active');
            repeatBtn.title = 'Mode Ulangi';
        }
    }

    /* -----------------------------------------------------------
       9️⃣  EVENT LISTENERS
    ----------------------------------------------------------- */
    // Select a Surah from the list
    surahListContainer.addEventListener('click', (e) => {
        const item = e.target.closest('.surah-item');
        if (!item) return;
        const n = parseInt(item.dataset.surahNumber);
        if (n === currentSurahNumber) return;
        currentSurahNumber = n; audio.pause(); currentAyahIndex = -1; isPlayingFullSurah = false;
        renderSurah(currentSurahNumber);
        updateActiveSurahItem();

        // On mobile: close the list after a selection
        if (window.matchMedia('(max-width: 768px)').matches)
            appContainer.classList.remove('sidebar-open');
    });

    // Play / bookmark a single ayah
    ayahContainer.addEventListener('click', (e) => {
        const playBtn = e.target.closest('.play-ayah-btn');
        if (playBtn) {
            const aIdx = parseInt(playBtn.closest('.ayah').dataset.ayahIndex);
            playAyah(currentSurahNumber, aIdx, true);
        }
        const bmBtn = e.target.closest('.bookmark-btn');
        if (bmBtn) {
            const a = quranData[currentSurahNumber - 1].ayahs[parseInt(bmBtn.closest('.ayah').dataset.ayahIndex)];
            toggleBookmark(currentSurahNumber, a.number.insurah, bmBtn);
        }
    });

    // Player controls
    playPauseBtn.addEventListener('click', togglePlayPause);
    nextBtn.addEventListener('click', () => playNext(false));
    prevBtn.addEventListener('click', playPrev);
    repeatBtn.addEventListener('click', toggleRepeatMode);

    // Theme
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Unhide button (floating)
    sidebarUnhideBtn.addEventListener('click', toggleSidebar);

    // Click backdrop to close the mobile sidebar
    sidebarBackdrop.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 768px)').matches) {
            appContainer.classList.remove('sidebar-open');
        }
    });

    // Imam change
    imamSelect.addEventListener('change', (e) => {
        selectedImamId = e.target.value;
        localStorage.setItem('selectedImam', selectedImamId);
        if (!audio.paused) playAyah(currentSurahNumber, currentAyahIndex, !isPlayingFullSurah);
    });

    // Keep the active Surah item highlighted
    function updateActiveSurahItem() {
        document.querySelectorAll('.surah-item.active').forEach(el => el.classList.remove('active'));
        const active = document.querySelector(`.surah-item[data-surah-number="${currentSurahNumber}"]`);
        if (active) {
            active.classList.add('active');
            active.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
        updateSidebarUnhideButton();   // make sure the floating button reflects current state
    }

    // Respond to orientation changes (mobile) & window resize
    window.addEventListener('resize', () => {
        initOrientationDefaults();
        updateSidebarUnhideButton();
    });

    // Optional: observe class changes on the container (so we can react instantly)
    const observer = new MutationObserver(updateSidebarUnhideButton);
    observer.observe(appContainer, { attributes: true, attributeFilter: ['class'] });

    /* -----------------------------------------------------------
       🚀 START
    ----------------------------------------------------------- */
    initializeApp();
});