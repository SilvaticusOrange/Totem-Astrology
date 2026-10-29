/**
 * TotemAstrology.com / Totem Connections — locale metadata.
 * Flag emoji are conventional associations (language ≠ country).
 */
export const I18N_STORAGE_KEY = 'totem-lang';

/** @typedef {{ code: string, name: string, nativeName: string, flag: string, dir?: 'ltr'|'rtl' }} LocaleInfo */

/** @type {LocaleInfo[]} */
export const LOCALES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'zh', name: 'Chinese (Mandarin)', nativeName: '中文', flag: '🇨🇳' },
  { code: 'yue', name: 'Cantonese', nativeName: '粵語', flag: '🇭🇰' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', dir: 'rtl' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', flag: '🇳🇬' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'km', name: 'Khmer', nativeName: 'ភាសាខ្មែរ', flag: '🇰🇭' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵' },
  { code: 'bho', name: 'Bhojpuri', nativeName: 'भोजपुरी', flag: '🇮🇳' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', flag: '🌺' },
  { code: 'mi', name: 'Māori', nativeName: 'Te Reo Māori', flag: '🇳🇿' },
  { code: 'ty', name: 'Tahitian', nativeName: 'Reo Tahiti', flag: '🇵🇫' },
  { code: 'sm', name: 'Samoan', nativeName: 'Gagana Samoa', flag: '🇼🇸' },
  { code: 'to', name: 'Tongan', nativeName: 'Lea faka-Tonga', flag: '🇹🇴' },
  { code: 'fj', name: 'Fijian', nativeName: 'Na Vosa Vakaviti', flag: '🇫🇯' },
  { code: 'fil', name: 'Tagalog (Filipino)', nativeName: 'Tagalog', flag: '🇵🇭' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', dir: 'rtl' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', flag: '🇷🇸' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', flag: '🇮🇪' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'nv', name: 'Navajo (Diné)', nativeName: 'Diné bizaad', flag: '🇺🇸' },
  { code: 'qu', name: 'Quechua', nativeName: 'Runa Simi', flag: '🇵🇪' },
  { code: 'ay', name: 'Aymara', nativeName: 'Aymar aru', flag: '🇧🇴' },
  { code: 'gn', name: 'Guaraní', nativeName: 'Avañeʼẽ', flag: '🇵🇾' },
  { code: 'kek', name: "Q'eqchi'", nativeName: "Q'eqchi'", flag: '🇬🇹' },
  { code: 'quc', name: "K'iche'", nativeName: "K'iche'", flag: '🇬🇹' },
  { code: 'kl', name: 'Greenlandic (Kalaallisut)', nativeName: 'Kalaallisut', flag: '🇬🇱' },
  { code: 'cr', name: 'Cree', nativeName: 'ᓀᐦᐃᔭᐍᐏᐣ', flag: '🇨🇦' },
  { code: 'dak', name: 'Sioux (Dakota)', nativeName: 'Dakhótiyapi', flag: '🇺🇸' },
  { code: 'chr', name: 'Cherokee', nativeName: 'ᏣᎳᎩ', flag: '🇺🇸' },
  { code: 'dih', name: 'Kumeyaay', nativeName: 'Kumeyaay', flag: '🇺🇸' },
  { code: 'mik', name: 'Mikasuki', nativeName: 'Mikasuki', flag: '🇺🇸' },
  { code: 'lut', name: 'Lushootseed', nativeName: 'dxʷləšucid', flag: '🇺🇸' },
  { code: 'mix', name: 'Mixtec', nativeName: "Tu'un Savi", flag: '🇲🇽' },
  { code: 'nah', name: 'Nahuatl', nativeName: 'Nāhuatl', flag: '🇲🇽' },
];

export const DEFAULT_LOCALE = 'en';

export function getLocaleInfo(code) {
  return LOCALES.find((locale) => locale.code === code) || LOCALES[0];
}

export function isSupportedLocale(code) {
  return LOCALES.some((locale) => locale.code === code);
}

export function normalizeLocaleTag(raw) {
  const tag = String(raw || '').toLowerCase().replace('_', '-');
  if (!tag) return null;
  if (tag === 'yue' || tag.startsWith('yue-') || tag.startsWith('zh-hk') || tag.startsWith('zh-mo')) return 'yue';
  if (tag === 'mri' || tag.startsWith('mri-')) return 'mi';
  if (tag === 'haw' || tag.startsWith('haw-')) return 'haw';
  if (tag === 'tl' || tag.startsWith('tl-') || tag === 'fil' || tag.startsWith('fil-')) return 'fil';
  if (tag === 'iw' || tag.startsWith('iw-')) return 'he';
  if (tag === 'nav' || tag.startsWith('nav-')) return 'nv';
  if (tag === 'que' || tag.startsWith('que-')) return 'qu';
  if (tag === 'aym' || tag.startsWith('aym-')) return 'ay';
  if (tag === 'grn' || tag.startsWith('grn-')) return 'gn';
  if (tag === 'kal' || tag.startsWith('kal-')) return 'kl';
  if (tag === 'cre' || tag.startsWith('cre-')) return 'cr';
  if (tag === 'lkt' || tag.startsWith('lkt-') || tag === 'sio' || tag.startsWith('sio-')) return 'dak';
  if (tag === 'nci' || tag.startsWith('nci-') || tag === 'nhn' || tag.startsWith('nhn-')) return 'nah';
  const code = tag.split('-')[0];
  return isSupportedLocale(code) ? code : null;
}
