import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: Record<string, Language> = {
  en: { code: 'en', name: 'English', nativeName: 'English (US)', flag: '🇺🇸', dir: 'ltr' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
};

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    storefront_title: 'Global Retail & Tech Storefront',
    search_placeholder: 'Search global catalog by SKU, name or brand...',
    add_to_cart: 'Add to Cart',
    checkout: 'Proceed to Checkout',
    reviews_title: 'Customer Reviews & Ratings',
    write_review: 'Write a Review',
    return_policy: '30-Day Easy Global Returns',
    rma_portal: 'Self-Service Returns Portal',
    currency_label: 'Currency',
    language_label: 'Language',
    payment_method: 'Payment Gateway',
    order_summary: 'Order Summary',
  },
  es: {
    storefront_title: 'Tienda Global de Tecnología y Comercio',
    search_placeholder: 'Buscar en el catálogo global por SKU, nombre o marca...',
    add_to_cart: 'Añadir al Carrito',
    checkout: 'Proceder al Pago',
    reviews_title: 'Opiniones y Calificaciones de Clientes',
    write_review: 'Escribir una Opinión',
    return_policy: 'Devoluciones Fáciles de 30 Días',
    rma_portal: 'Portal de Devoluciones de Autoservicio',
    currency_label: 'Moneda',
    language_label: 'Idioma',
    payment_method: 'Pasarela de Pago',
    order_summary: 'Resumen del Pedido',
  },
  fr: {
    storefront_title: 'Boutique Mondiale de Technologie et Commerce',
    search_placeholder: 'Rechercher dans le catalogue global par UGS, nom ou marque...',
    add_to_cart: 'Ajouter au Panier',
    checkout: 'Passer à la Caisse',
    reviews_title: 'Avis et Évaluations des Clients',
    write_review: 'Rédiger un Avis',
    return_policy: 'Retours Faciles sous 30 Jours',
    rma_portal: 'Portail de Retour Libre-Service',
    currency_label: 'Devise',
    language_label: 'Langue',
    payment_method: 'Passerelle de Paiement',
    order_summary: 'Récapitulatif de la Commande',
  },
  ar: {
    storefront_title: 'متجر التكنولوجيا والتجزئة العالمي',
    search_placeholder: 'ابحث في الكتالوج العالمي بالاسم أو العلامة التجارية...',
    add_to_cart: 'إضافة إلى السلة',
    checkout: 'متابعة الدفع',
    reviews_title: 'تقييمات وآراء العملاء',
    write_review: 'كتابة مراجعة',
    return_policy: 'إرجاع سهل خلال 30 يومًا',
    rma_portal: 'بوابة الإرجاع الذاتي',
    currency_label: 'العملة',
    language_label: 'اللغة',
    payment_method: 'بوابة الدفع',
    order_summary: 'ملخص الطلب',
  }
};

interface LanguageContextType {
  language: string;
  setLanguage: (code: string) => void;
  dir: 'ltr' | 'rtl';
  t: (key: string) => string;
  languages: Record<string, Language>;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  dir: 'ltr',
  t: (key) => key,
  languages: SUPPORTED_LANGUAGES,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    return localStorage.getItem('storeai_lang') || 'en';
  });

  const activeLang = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.en;

  useEffect(() => {
    document.documentElement.dir = activeLang.dir;
    document.documentElement.lang = language;
  }, [language, activeLang]);

  const setLanguage = (code: string) => {
    setLanguageState(code);
    localStorage.setItem('storeai_lang', code);
  };

  const t = (key: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir: activeLang.dir, t, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
