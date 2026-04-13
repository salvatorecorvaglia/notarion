import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import it from './it.json';
import en from './en.json';

const browserLng = (navigator.language || 'it').split('-')[0];
const defaultLng = ['it', 'en'].includes(browserLng) ? browserLng : 'it';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            it: { translation: it },
            en: { translation: en },
        },
        lng: defaultLng,
        fallbackLng: 'it',
        interpolation: {
            escapeValue: false, // React already escapes
        },
    });

export default i18n;
