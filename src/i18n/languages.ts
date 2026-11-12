import { Language } from '../types';

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  script: string;
  isRTL?: boolean;
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    script: 'Latin',
    region: 'Default / Pan-India',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'Devanagari',
    region: 'North & Central India',
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    script: 'Bengali',
    region: 'West Bengal, Tripura, Assam',
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    script: 'Devanagari',
    region: 'Maharashtra, Goa',
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telugu',
    region: 'Andhra Pradesh, Telangana',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'Tamil',
    region: 'Tamil Nadu, Puducherry',
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    script: 'Gujarati',
    region: 'Gujarat, Daman & Diu',
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    script: 'Nastaliq / Arabic',
    isRTL: true,
    region: 'Pan-India, Telangana, J&K',
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'Kannada',
    region: 'Karnataka',
  },
  {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    script: 'Odia',
    region: 'Odisha',
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    script: 'Malayalam',
    region: 'Kerala, Lakshadweep',
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    script: 'Gurmukhi',
    region: 'Punjab, Delhi, Haryana',
  },
  {
    code: 'bho',
    name: 'Bhojpuri',
    nativeName: 'भोजपुरी',
    script: 'Devanagari',
    region: 'Bihar, Eastern UP, Jharkhand',
  },
  {
    code: 'raj',
    name: 'Rajasthani',
    nativeName: 'राजस्थानी',
    script: 'Devanagari',
    region: 'Rajasthan',
  },
  {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    script: 'Bengali-Assamese',
    region: 'Assam, Northeast',
  },
  {
    code: 'mag',
    name: 'Magahi',
    nativeName: 'मगही',
    script: 'Devanagari',
    region: 'Central Bihar, Jharkhand',
  },
  {
    code: 'mai',
    name: 'Maithili',
    nativeName: 'मैथिली',
    script: 'Devanagari / Tirhuta',
    region: 'Mithila, Bihar, Jharkhand',
  },
  {
    code: 'hne',
    name: 'Chhattisgarhi',
    nativeName: 'छत्तीसगढ़ी',
    script: 'Devanagari',
    region: 'Chhattisgarh',
  },
  {
    code: 'bgc',
    name: 'Haryanvi',
    nativeName: 'हरियाणवी',
    script: 'Devanagari',
    region: 'Haryana, Delhi NCR',
  },
  {
    code: 'mwr',
    name: 'Marwari',
    nativeName: 'मारवाड़ी',
    script: 'Devanagari',
    region: 'Western Rajasthan',
  },
  {
    code: 'sat',
    name: 'Santali',
    nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ (संताली)',
    script: 'Ol Chiki / Devanagari',
    region: 'Jharkhand, Odisha, West Bengal',
  },
];

export const DEFAULT_LANGUAGE: Language = 'en';

export function getLanguageInfo(code: Language): LanguageInfo {
  return (
    SUPPORTED_LANGUAGES.find((lang) => lang.code === code) ||
    SUPPORTED_LANGUAGES[0]
  );
}
