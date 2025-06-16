
export interface ArabicContent {
  ar: string;
  en: string;
}

export interface ContentManagement {
  getText: (key: string, language?: string) => string;
  setContent: (key: string, content: ArabicContent) => void;
  getContent: (key: string) => ArabicContent | null;
}

class ArabicContentManager implements ContentManagement {
  private content: Map<string, ArabicContent> = new Map();

  getText(key: string, language: string = 'ar'): string {
    const content = this.content.get(key);
    if (!content) return key;
    return language === 'ar' ? content.ar : content.en;
  }

  setContent(key: string, content: ArabicContent): void {
    this.content.set(key, content);
  }

  getContent(key: string): ArabicContent | null {
    return this.content.get(key) || null;
  }
}

export const arabicContentManager = new ArabicContentManager();

// Default content setup
export const setupDefaultContent = () => {
  const defaultContent: Record<string, ArabicContent> = {
    'app.title': {
      ar: 'نظام إدارة الأسطول',
      en: 'Fleet Management System'
    },
    'nav.dashboard': {
      ar: 'لوحة التحكم',
      en: 'Dashboard'
    },
    'nav.vehicles': {
      ar: 'المركبات',
      en: 'Vehicles'
    },
    'nav.customers': {
      ar: 'العملاء',
      en: 'Customers'
    }
  };

  Object.entries(defaultContent).forEach(([key, content]) => {
    arabicContentManager.setContent(key, content);
  });
};

export default arabicContentManager;
