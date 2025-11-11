import { useState, useEffect, useMemo, FC } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { Search, BookOpen, Hash, ChevronsRight, Loader2 } from 'lucide-react';

// --- TYPE DEFINITIONS ---
type SurahSimple = {
  number: number;
  name: {
    transliteration: {
      id: string;
    };
    translation: {
      id: string;
    };
  };
  revelation: {
    id: string;
  };
  numberOfVerses: number;
};

type Ayah = {
  number: {
    inSurah: number;
  };
  text: {
    arab: string;
    transliteration: {
      en: string;
    };
  };
  translation: {
    id: string;
  };
};

type SurahDetail = {
  number: number;
  name: {
    transliteration: {
      id: string;
    };
    translation: {
      id: string;
    };
  };
  revelation: {
    id: string;
  };
  numberOfVerses: number;
  verses: Ayah[];
};

// --- API HELPER ---
const API_BASE_URL = 'https://api.quran.gading.dev';

// --- UI COMPONENTS ---

const SurahListItem: FC<{ surah: SurahSimple; onSelect: () => void; isActive: boolean }> = ({ surah, onSelect, isActive }) => (
  <li
    onClick={onSelect}
    className={`flex items-center justify-between p-4 cursor-pointer rounded-lg transition-colors duration-200 ${isActive ? 'bg-sky-100 dark:bg-sky-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
  >
    <div className="flex items-center space-x-4">
      <div className={`flex items-center justify-center w-10 h-10 rounded-md ${isActive ? 'bg-sky-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
        <span className="font-bold text-sm">{surah.number}</span>
      </div>
      <div>
        <p className={`font-semibold ${isActive ? 'text-sky-700 dark:text-sky-300' : 'text-gray-800 dark:text-gray-200'}`}>{surah.name.transliteration.id}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{surah.name.translation.id}</p>
      </div>
    </div>
    <div className="text-right">
        <p className="text-xs text-gray-500 dark:text-gray-400">{surah.numberOfVerses} verses</p>
    </div>
  </li>
);

const AyahView: FC<{ ayah: Ayah }> = ({ ayah }) => (
  <div className="py-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
    <div className="flex justify-between items-center">
        <span className="text-sm font-semibold bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300 px-3 py-1 rounded-full">{ayah.number.inSurah}</span>
    </div>
    <p dir="rtl" className="text-3xl text-right font-serif text-gray-800 dark:text-gray-200 leading-relaxed">
      {ayah.text.arab}
    </p>
    <p className="text-gray-600 dark:text-gray-400 italic text-sm">
      {ayah.text.transliteration.en}
    </p>
    <p className="text-gray-700 dark:text-gray-300">
      {ayah.translation.id}
    </p>
  </div>
);

const SkeletonLoader: FC = () => (
    <div className="animate-pulse space-y-8 p-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4"></div>
        <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-1/4"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-5/6"></div>
                </div>
            ))}
        </div>
    </div>
);

const WelcomeScreen: FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <BookOpen className="w-24 h-24 text-sky-500 mb-6" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Welcome to Quran Web</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Select a Surah from the list to begin reading.</p>
    </div>
);

// --- MAIN PAGE COMPONENT ---

const QuranReaderPage: NextPage = () => {
  const [surahs, setSurahs] = useState<SurahSimple[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<SurahDetail | null>(null);
  const [activeSurahNumber, setActiveSurahNumber] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSurahList = async () => {
      try {
        setIsLoadingList(true);
        const response = await fetch(`${API_BASE_URL}/surah`);
        if (!response.ok) throw new Error('Failed to fetch surah list');
        const data = await response.json();
        setSurahs(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoadingList(false);
      }
    };
    fetchSurahList();
  }, []);

  const handleSelectSurah = async (surahNumber: number) => {
    if (activeSurahNumber === surahNumber) return;
    
    setActiveSurahNumber(surahNumber);
    setIsLoadingDetail(true);
    setSelectedSurah(null);
    try {
      const response = await fetch(`${API_BASE_URL}/surah/${surahNumber}`);
      if (!response.ok) throw new Error(`Failed to fetch details for surah ${surahNumber}`);
      const data = await response.json();
      setSelectedSurah(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const filteredSurahs = useMemo(() =>
    surahs.filter(surah =>
      surah.name.transliteration.id.toLowerCase().includes(searchTerm.toLowerCase())
    ), [surahs, searchTerm]);

  return (
    <>
      <Head>
        <title>Quran Web Reader</title>
        <meta name="description" content="Read the Holy Quran with translations." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="bg-white dark:bg-gray-900 min-h-screen font-sans">
        <main className="flex flex-col md:flex-row h-screen">
          {/* Left Pane: Surah List */}
          <aside className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">Quran Reader</h1>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Surah..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-sky-500 focus:outline-none text-gray-800 dark:text-gray-200"
                />
              </div>
            </div>
            <div className="flex-grow overflow-y-auto">
              {isLoadingList ? (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
                </div>
              ) : error ? (
                <div className="p-4 text-red-500">{error}</div>
              ) : (
                <ul className="p-2 space-y-1">
                  {filteredSurahs.map(surah => (
                    <SurahListItem
                      key={surah.number}
                      surah={surah}
                      onSelect={() => handleSelectSurah(surah.number)}
                      isActive={activeSurahNumber === surah.number}
                    />
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* Right Pane: Surah Detail */}
          <section className="w-full md:w-2/3 lg:w-3/4 overflow-y-auto h-full">
            {isLoadingDetail ? (
              <SkeletonLoader />
            ) : selectedSurah ? (
              <div className="p-6 sm:p-8">
                <div className="pb-6 mb-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedSurah.name.transliteration.id}</h2>
                  <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">{selectedSurah.name.translation.id}</p>
                  <div className="flex items-center space-x-4 mt-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center space-x-2">
                          <Hash className="w-4 h-4" />
                          <span>Surah {selectedSurah.number}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                          <BookOpen className="w-4 h-4" />
                          <span>{selectedSurah.numberOfVerses} Verses</span>
                      </div>
                      <div className="flex items-center space-x-2">
                          <ChevronsRight className="w-4 h-4" />
                          <span>{selectedSurah.revelation.id}</span>
                      </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {selectedSurah.verses.map(ayah => (
                    <AyahView key={ayah.number.inSurah} ayah={ayah} />
                  ))}
                </div>
              </div>
            ) : (
              <WelcomeScreen />
            )}
          </section>
        </main>
      </div>
    </>
  );
};

export default QuranReaderPage;
