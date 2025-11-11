import React, { useEffect, useState } from "react";
import Head from "next/head";

type FontSize = "text-xl" | "text-2xl" | "text-3xl";

type Ayah = {
  numberInSurah: number;
  arabic: string;
  translation: string;
};

type Surah = {
  number: number;
  name: string;
  englishName: string;
  revelationPlace: "Makkah" | "Madinah" | string;
  ayahs: Ayah[];
};

type Bookmark = {
  surah: number;
  ayah: number;
};

const quranData: Surah[] = [
  {
    number: 1,
    name: "Al-Fatihah",
    englishName: "The Opening",
    revelationPlace: "Makkah",
    ayahs: [
      {
        numberInSurah: 1,
        arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        translation: "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.",
      },
      {
        numberInSurah: 2,
        arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
        translation: "Segala puji bagi Allah, Tuhan seluruh alam,",
      },
      {
        numberInSurah: 3,
        arabic: "الرَّحْمَٰنِ الرَّحِيمِ",
        translation: "Yang Maha Pengasih, Maha Penyayang,",
      },
      {
        numberInSurah: 4,
        arabic: "مَالِكِ يَوْمِ الدِّينِ",
        translation: "Pemilik hari pembalasan.",
      },
      {
        numberInSurah: 5,
        arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
        translation:
          "Hanya kepada Engkaulah kami menyembah dan hanya kepada Engkaulah kami mohon pertolongan.",
      },
      {
        numberInSurah: 6,
        arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
        translation: "Tunjukilah kami jalan yang lurus,",
      },
      {
        numberInSurah: 7,
        arabic:
          "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
        translation:
          "(yaitu) jalan orang-orang yang telah Engkau beri nikmat kepada mereka; bukan (jalan) mereka yang dimurkai, dan bukan (pula jalan) mereka yang sesat.",
      },
    ],
  },
  {
    number: 2,
    name: "Al-Baqarah",
    englishName: "The Cow",
    revelationPlace: "Madinah",
    ayahs: [
      {
        numberInSurah: 1,
        arabic: "الم",
        translation: "Alif Lam Mim.",
      },
      {
        numberInSurah: 2,
        arabic:
          "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِلْمُتَّقِينَ",
        translation:
          "Kitab (Al-Qur'an) ini tidak ada keraguan padanya; petunjuk bagi mereka yang bertakwa,",
      },
      {
        numberInSurah: 3,
        arabic:
          "الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ",
        translation:
          "(yaitu) mereka yang beriman kepada yang gaib, yang mendirikan salat, dan menginfakkan sebagian rezeki yang Kami berikan kepada mereka,",
      },
      {
        numberInSurah: 4,
        arabic:
          "وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنزِلَ إِلَيْكَ وَمَا أُنزِلَ مِن قَبْلِكَ وَبِالْآخِرَةِ هُمْ يُوقِنُونَ",
        translation:
          "dan mereka yang beriman kepada Kitab (Al-Qur'an) yang diturunkan kepadamu dan Kitab-kitab yang diturunkan sebelum engkau, serta mereka yakin akan adanya akhirat.",
      },
      {
        numberInSurah: 5,
        arabic:
          "أُولَٰئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ",
        translation:
          "Mereka itulah yang mendapat petunjuk dari Tuhannya, dan merekalah orang-orang yang beruntung.",
      },
    ],
  },
  {
    number: 3,
    name: "Ali 'Imran",
    englishName: "Family of Imran",
    revelationPlace: "Madinah",
    ayahs: [],
  },
  {
    number: 4,
    name: "An-Nisa'",
    englishName: "The Women",
    revelationPlace: "Madinah",
    ayahs: [],
  },
  {
    number: 5,
    name: "Al-Ma'idah",
    englishName: "The Table Spread",
    revelationPlace: "Madinah",
    ayahs: [],
  },
  {
    number: 6,
    name: "Al-An'am",
    englishName: "The Cattle",
    revelationPlace: "Makkah",
    ayahs: [],
  },
  {
    number: 7,
    name: "Al-A'raf",
    englishName: "The Heights",
    revelationPlace: "Makkah",
    ayahs: [],
  },
  {
    number: 8,
    name: "Al-Anfal",
    englishName: "The Spoils of War",
    revelationPlace: "Madinah",
    ayahs: [],
  },
  {
    number: 9,
    name: "At-Tawbah",
    englishName: "The Repentance",
    revelationPlace: "Madinah",
    ayahs: [],
  },
  {
    number: 10,
    name: "Yunus",
    englishName: "Jonah",
    revelationPlace: "Makkah",
    ayahs: [],
  },
];

const Home: React.FC = () => {
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(
    quranData[0]?.number ?? 1
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showTranslation, setShowTranslation] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<FontSize>("text-2xl");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedTheme = window.localStorage.getItem("webquran-theme");
      const storedBookmarks = window.localStorage.getItem("webquran-bookmarks");
      const storedSurah = window.localStorage.getItem("webquran-last-surah");
      const storedFontSize = window.localStorage.getItem("webquran-font-size");
      const storedShowTranslation = window.localStorage.getItem(
        "webquran-show-translation"
      );

      if (storedTheme === "dark" || storedTheme === "light") {
        setTheme(storedTheme);
      }

      if (storedBookmarks) {
        const parsedBookmarks = JSON.parse(storedBookmarks) as Bookmark[];
        if (Array.isArray(parsedBookmarks)) {
          setBookmarks(parsedBookmarks);
        }
      }

      if (storedSurah) {
        const numberValue = Number(storedSurah);
        const exists = quranData.some((s) => s.number === numberValue);
        if (exists) {
          setSelectedSurahNumber(numberValue);
        }
      }

      if (
        storedFontSize === "text-xl" ||
        storedFontSize === "text-2xl" ||
        storedFontSize === "text-3xl"
      ) {
        setFontSize(storedFontSize);
      }

      if (storedShowTranslation === "true" || storedShowTranslation === "false") {
        setShowTranslation(storedShowTranslation === "true");
      }
    } catch {
      // ignore parsing errors
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("webquran-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("webquran-bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("webquran-last-surah", String(selectedSurahNumber));
  }, [selectedSurahNumber]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("webquran-font-size", fontSize);
  }, [fontSize]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "webquran-show-translation",
      showTranslation ? "true" : "false"
    );
  }, [showTranslation]);

  const filteredSurahs = quranData.filter((surah) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      surah.name.toLowerCase().includes(term) ||
      surah.englishName.toLowerCase().includes(term) ||
      String(surah.number).includes(term)
    );
  });

  const selectedSurah =
    quranData.find((s) => s.number === selectedSurahNumber) ?? quranData[0];

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const toggleTranslation = () => {
    setShowTranslation((prev) => !prev);
  };

  const handleFontSizeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value as FontSize;
    setFontSize(value);
  };

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchTerm(event.target.value);
  };

  const handleSelectSurah = (number: number) => {
    setSelectedSurahNumber(number);
    setIsSidebarOpen(false);
  };

  const handleToggleBookmark = (surahNumber: number, ayahNumber: number) => {
    setBookmarks((prev) => {
      const exists = prev.some(
        (b) => b.surah === surahNumber && b.ayah === ayahNumber
      );
      if (exists) {
        return prev.filter(
          (b) => !(b.surah === surahNumber && b.ayah === ayahNumber)
        );
      }
      return [...prev, { surah: surahNumber, ayah: ayahNumber }];
    });
  };

  const isAyahBookmarked = (surahNumber: number, ayahNumber: number): boolean => {
    return bookmarks.some((b) => b.surah === surahNumber && b.ayah === ayahNumber);
  };

  const getSurahName = (number: number): string => {
    const surah = quranData.find((s) => s.number === number);
    return surah ? surah.name : `Surat ${number}`;
  };

  const fontSizeLabel = (value: FontSize): string => {
    if (value === "text-xl") return "Kecil";
    if (value === "text-2xl") return "Sedang";
    return "Besar";
  };

  const rootClassName =
    "min-h-screen " +
    (theme === "dark"
      ? "bg-gray-900 text-gray-100"
      : "bg-gray-100 text-gray-900");

  const panelClassName =
    theme === "dark" ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900";

  const borderColorClassName =
    theme === "dark" ? "border-gray-700" : "border-gray-200";

  const subtleTextClassName =
    theme === "dark" ? "text-gray-300" : "text-gray-500";

  return (
    <div className={rootClassName}>
      <Head>
        <title>WebQuran</title>
        <meta
          name="description"
          content="WebQuran sederhana dengan teks Arab dan terjemahan Indonesia."
        />
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">WebQuran</h1>
            <p className={`mt-1 text-sm ${subtleTextClassName}`}>
              Baca Al-Qur&apos;an dengan teks Arab dan terjemahan Indonesia. Data lengkap
              dapat Anda tambahkan sendiri.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${panelClassName} shadow`}
            >
              <span>{theme === "dark" ? "🌙 Mode Gelap" : "☀️ Mode Terang"}</span>
            </button>
            <button
              type="button"
              onClick={toggleTranslation}
              className={`px-3 py-2 rounded-lg text-sm font-medium border ${borderColorClassName} ${
                showTranslation
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : panelClassName
              }`}
            >
              {showTranslation ? "Terjemahan: ON" : "Terjemahan: OFF"}
            </button>
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${borderColorClassName} ${panelClassName}`}
            >
              <span className={subtleTextClassName}>Ukuran teks</span>
              <select
                value={fontSize}
                onChange={handleFontSizeChange}
                className="bg-transparent outline-none focus:ring-0 text-sm"
              >
                <option value="text-xl">{fontSizeLabel("text-xl")}</option>
                <option value="text-2xl">{fontSizeLabel("text-2xl")}</option>
                <option value="text-3xl">{fontSizeLabel("text-3xl")}</option>
              </select>
            </div>
          </div>
        </header>

        <div className="md:hidden mb-4">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className={`w-full px-4 py-3 rounded-lg font-medium border ${borderColorClassName} ${panelClassName} flex items-center justify-between`}
          >
            <span>
              {selectedSurah
                ? `Surat: ${selectedSurah.number}. ${selectedSurah.name}`
                : "Pilih Surat"}
            </span>
            <span className={subtleTextClassName}>Daftar Surat ▾</span>
          </button>
        </div>

        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-20 flex">
            <div
              className="flex-1 bg-black bg-opacity-50"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div
              className={`w-64 h-full ${panelClassName} p-4 border-l ${borderColorClassName} overflow-y-auto`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Daftar Surat</h2>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className={`text-sm ${subtleTextClassName}`}
                >
                  Tutup ✕
                </button>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Cari nama / nomor..."
                className={`w-full px-3 py-2 rounded-lg text-sm border ${borderColorClassName} bg-transparent mb-3`}
              />
              <div className="space-y-1">
                {filteredSurahs.map((surah) => (
                  <button
                    key={surah.number}
                    type="button"
                    onClick={() => handleSelectSurah(surah.number)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                      surah.number === selectedSurahNumber
                        ? "bg-indigo-600 text-white"
                        : theme === "dark"
                        ? "hover:bg-gray-700"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">
                        {surah.number}. {surah.name}
                      </span>
                      <span className={`text-xs ${subtleTextClassName}`}>
                        {surah.englishName}
                      </span>
                    </div>
                    <span className={`text-xs ${subtleTextClassName}`}>
                      {surah.revelationPlace}
                    </span>
                  </button>
                ))}
              </div>

              {bookmarks.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold mb-2">Ayat tersimpan</h3>
                  <div className="flex flex-wrap gap-2">
                    {bookmarks.map((bookmark) => (
                      <button
                        key={`${bookmark.surah}-${bookmark.ayah}`}
                        type="button"
                        onClick={() => handleSelectSurah(bookmark.surah)}
                        className={`px-2 py-1 rounded-full text-xs border ${borderColorClassName} ${
                          theme === "dark"
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {getSurahName(bookmark.surah)}:{bookmark.ayah}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          <aside className="hidden md:block md:w-72 flex-shrink-0">
            <div
              className={`${panelClassName} rounded-xl shadow border ${borderColorClassName} p-4`}
            >
              <h2 className="font-semibold mb-3">Daftar Surat</h2>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Cari nama / nomor..."
                className={`w-full px-3 py-2 rounded-lg text-sm border ${borderColorClassName} bg-transparent`}
              />
              <div className="mt-3 h-96 overflow-y-auto pr-1 space-y-1">
                {filteredSurahs.map((surah) => (
                  <button
                    key={surah.number}
                    type="button"
                    onClick={() => handleSelectSurah(surah.number)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                      surah.number === selectedSurahNumber
                        ? "bg-indigo-600 text-white"
                        : theme === "dark"
                        ? "hover:bg-gray-700"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">
                        {surah.number}. {surah.name}
                      </span>
                      <span className={`text-xs ${subtleTextClassName}`}>
                        {surah.englishName}
                      </span>
                    </div>
                    <span className={`text-xs ${subtleTextClassName}`}>
                      {surah.revelationPlace}
                    </span>
                  </button>
                ))}
              </div>

              {bookmarks.length > 0 && (
                <div
                  className={`mt-4 border-t pt-3 border-dashed ${borderColorClassName}`}
                >
                  <h3 className="text-sm font-semibold mb-2">Ayat tersimpan</h3>
                  <div className="flex flex-wrap gap-2">
                    {bookmarks.map((bookmark) => (
                      <button
                        key={`${bookmark.surah}-${bookmark.ayah}`}
                        type="button"
                        onClick={() => handleSelectSurah(bookmark.surah)}
                        className={`px-2 py-1 rounded-full text-xs border ${borderColorClassName} ${
                          theme === "dark"
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {getSurahName(bookmark.surah)}:{bookmark.ayah}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          <main className="flex-1">
            <div
              className={`${panelClassName} rounded-xl shadow border ${borderColorClassName} p-4 md:p-6`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wide mb-1 text-indigo-500">
                    Surat ke-{selectedSurah.number}
                  </div>
                  <h2 className="text-xl md:text-2xl font-semibold">
                    {selectedSurah.name}
                  </h2>
                  <p className={`text-sm mt-1 ${subtleTextClassName}`}>
                    {selectedSurah.englishName} • {selectedSurah.revelationPlace}
                  </p>
                </div>
                <div className="text-right text-xs md:text-sm">
                  <p className={subtleTextClassName}>Demo data</p>
                  <p className={subtleTextClassName}>
                    Hanya beberapa surat yang berisi teks lengkap.
                  </p>
                </div>
              </div>

              {selectedSurah.ayahs.length === 0 && (
                <div
                  className={`mt-6 rounded-lg border ${borderColorClassName} p-4 text-sm ${subtleTextClassName}`}
                >
                  Teks surat ini belum dimasukkan dalam demo. Silakan lengkapi dengan
                  data Al-Qur&apos;an lengkap sesuai kebutuhan proyek Anda.
                </div>
              )}

              {selectedSurah.ayahs.length > 0 && (
                <div className="mt-6 space-y-4">
                  {selectedSurah.ayahs.map((ayah) => (
                    <div
                      key={ayah.numberInSurah}
                      className={`border-b ${borderColorClassName} pb-4 last:border-b-0 last:pb-0`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`inline-flex items-center justify-center rounded-full text-xs px-2 py-1 border ${borderColorClassName} ${subtleTextClassName}`}
                        >
                          Ayat {ayah.numberInSurah}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleBookmark(
                              selectedSurah.number,
                              ayah.numberInSurah
                            )
                          }
                          className={`text-xs px-2 py-1 rounded-full border ${borderColorClassName} ${
                            isAyahBookmarked(
                              selectedSurah.number,
                              ayah.numberInSurah
                            )
                              ? "bg-yellow-400 text-gray-900 border-yellow-400"
                              : theme === "dark"
                              ? "hover:bg-gray-700"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {isAyahBookmarked(
                            selectedSurah.number,
                            ayah.numberInSurah
                          )
                            ? "★ Disimpan"
                            : "☆ Simpan"}
                        </button>
                      </div>
                      <p className={`text-right ${fontSize} leading-relaxed`}>
                        {ayah.arabic}
                      </p>
                      {showTranslation && (
                        <p
                          className={`mt-2 text-sm md:text-base ${subtleTextClassName}`}
                        >
                          {ayah.translation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Home;
