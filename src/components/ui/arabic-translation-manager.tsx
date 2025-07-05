import React, { useState, useEffect, useCallback } from 'react';
import { ArabicTranslationManager, ArabicTextValidator } from '../../utils/arabic-content-management';

/**
 * Translation Manager Props
 */
interface ArabicTranslationManagerProps {
  initialTranslations?: Record<string, Record<string, string>>;
  languages?: string[];
  defaultLanguage?: string;
  onTranslationsChange?: (translations: Record<string, Record<string, string>>) => void;
  onLanguageChange?: (language: string) => void;
  showValidation?: boolean;
  showImportExport?: boolean;
  showCollaboration?: boolean;
  className?: string;
}

/**
 * Translation Entry Interface
 */
interface TranslationEntry {
  key: string;
  ar: string;
  en?: string;
  context?: string;
  category?: string;
  lastUpdated?: Date;
  status?: 'draft' | 'review' | 'approved';
  author?: string;
  comments?: Array<{
    author: string;
    text: string;
    timestamp: Date;
  }>;
}

/**
 * Translation Statistics
 */
interface TranslationStats {
  total: number;
  translated: number;
  missing: number;
  needsReview: number;
  approved: number;
  completionPercentage: number;
}

/**
 * Arabic Translation Manager Component
 */
export const ArabicTranslationManagerComponent: React.FC<ArabicTranslationManagerProps> = ({
  initialTranslations = {},
  languages = ['ar', 'en'],
  defaultLanguage = 'ar',
  onTranslationsChange,
  onLanguageChange,
  showValidation = true,
  showImportExport = true,
  showCollaboration = false,
  className = '',
}) => {
  const [translationManager] = useState(() => new ArabicTranslationManager());
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);
  const [entries, setEntries] = useState<TranslationEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TranslationEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingEntry, setEditingEntry] = useState<TranslationEntry | null>(null);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [stats, setStats] = useState<Record<string, TranslationStats>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [importData, setImportData] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);

  /**
   * Initialize translation manager
   */
  useEffect(() => {
    translationManager.loadTranslations(initialTranslations);
    translationManager.setLanguage(currentLanguage);
    loadEntries();
    calculateStats();
  }, [initialTranslations, currentLanguage]);

  /**
   * Load translation entries
   */
  const loadEntries = useCallback(() => {
    const allEntries: TranslationEntry[] = [];
    const baseTranslations = translationManager.exportTranslations('ar');
    
    for (const [key, arValue] of Object.entries(baseTranslations)) {
      const entry: TranslationEntry = {
        key,
        ar: arValue,
        en: translationManager.exportTranslations('en')[key] || '',
        context: '',
        category: key.split('.')[0] || 'general',
        lastUpdated: new Date(),
        status: 'approved',
      };
      
      // Add translations for other languages
      for (const lang of languages) {
        if (lang !== 'ar' && lang !== 'en') {
          (entry as any)[lang] = translationManager.exportTranslations(lang)[key] || '';
        }
      }
      
      allEntries.push(entry);
    }
    
    setEntries(allEntries);
    setFilteredEntries(allEntries);
  }, [translationManager, languages]);

  /**
   * Calculate translation statistics
   */
  const calculateStats = useCallback(() => {
    const newStats: Record<string, TranslationStats> = {};
    
    for (const lang of languages) {
      const langTranslations = translationManager.exportTranslations(lang);
      const baseTranslations = translationManager.exportTranslations('ar');
      const missing = translationManager.getMissingTranslations(lang);
      
      const total = Object.keys(baseTranslations).length;
      const translated = total - missing.length;
      const needsReview = entries.filter(e => e.status === 'review').length;
      const approved = entries.filter(e => e.status === 'approved').length;
      
      newStats[lang] = {
        total,
        translated,
        missing: missing.length,
        needsReview,
        approved,
        completionPercentage: total > 0 ? (translated / total) * 100 : 0,
      };
    }
    
    setStats(newStats);
  }, [translationManager, languages, entries]);

  /**
   * Filter entries based on search and filters
   */
  useEffect(() => {
    let filtered = entries;
    
    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(entry =>
        entry.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.ar.includes(searchQuery) ||
        (entry.en && entry.en.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (entry.context && entry.context.includes(searchQuery))
      );
    }
    
    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(entry => entry.category === selectedCategory);
    }
    
    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(entry => entry.status === selectedStatus);
    }
    
    setFilteredEntries(filtered);
  }, [entries, searchQuery, selectedCategory, selectedStatus]);

  /**
   * Handle language change
   */
  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    translationManager.setLanguage(language);
    onLanguageChange?.(language);
  };

  /**
   * Save translation entry
   */
  const saveEntry = (entry: TranslationEntry) => {
    // Update translation manager
    for (const lang of languages) {
      const value = (entry as any)[lang];
      if (value) {
        translationManager.addTranslation(entry.key, lang, value);
      }
    }
    
    // Update entries
    setEntries(prev =>
      prev.map(e => (e.key === entry.key ? { ...entry, lastUpdated: new Date() } : e))
    );
    
    // Notify parent
    const allTranslations: Record<string, Record<string, string>> = {};
    for (const lang of languages) {
      allTranslations[lang] = translationManager.exportTranslations(lang);
    }
    onTranslationsChange?.(allTranslations);
    
    setEditingEntry(null);
    calculateStats();
  };

  /**
   * Add new translation entry
   */
  const addEntry = (key: string, arValue: string, category: string = 'general') => {
    const newEntry: TranslationEntry = {
      key,
      ar: arValue,
      en: '',
      context: '',
      category,
      lastUpdated: new Date(),
      status: 'draft',
    };
    
    // Add to translation manager
    translationManager.addTranslation(key, 'ar', arValue);
    
    // Add to entries
    setEntries(prev => [...prev, newEntry]);
    
    setShowAddDialog(false);
    calculateStats();
  };

  /**
   * Delete translation entry
   */
  const deleteEntry = (key: string) => {
    setEntries(prev => prev.filter(e => e.key !== key));
    calculateStats();
  };

  /**
   * Validate translations
   */
  const validateTranslations = () => {
    const results = translationManager.validateTranslations();
    setValidationResults(results);
  };

  /**
   * Export translations
   */
  const exportTranslations = (format: 'json' | 'csv') => {
    const allTranslations: Record<string, Record<string, string>> = {};
    for (const lang of languages) {
      allTranslations[lang] = translationManager.exportTranslations(lang);
    }
    
    if (format === 'json') {
      const dataStr = JSON.stringify(allTranslations, null, 2);
      downloadFile(dataStr, 'translations.json', 'application/json');
    } else if (format === 'csv') {
      const csvData = convertToCSV(allTranslations);
      downloadFile(csvData, 'translations.csv', 'text/csv');
    }
  };

  /**
   * Import translations
   */
  const importTranslations = () => {
    try {
      const data = JSON.parse(importData);
      translationManager.loadTranslations(data);
      loadEntries();
      calculateStats();
      setShowImportDialog(false);
      setImportData('');
    } catch (error) {
      alert('خطأ في تحليل البيانات المستوردة');
    }
  };

  /**
   * Get unique categories
   */
  const categories = Array.from(new Set(entries.map(e => e.category))).filter(Boolean);

  return (
    <div className={`arabic-translation-manager ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">إدارة الترجمات</h2>
          
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <select
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>
                  {lang === 'ar' ? 'العربية' : lang === 'en' ? 'English' : lang}
                </option>
              ))}
            </select>

            {/* Add Entry Button */}
            <button
              onClick={() => setShowAddDialog(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              إضافة ترجمة
            </button>

            {/* Import/Export */}
            {showImportExport && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImportDialog(true)}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  استيراد
                </button>
                <div className="relative group">
                  <button className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    تصدير
                  </button>
                  <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-300 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <button
                      onClick={() => exportTranslations('json')}
                      className="block w-full px-4 py-2 text-right hover:bg-gray-50"
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => exportTranslations('csv')}
                      className="block w-full px-4 py-2 text-right hover:bg-gray-50"
                    >
                      CSV
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Validation */}
            {showValidation && (
              <button
                onClick={validateTranslations}
                className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                التحقق
              </button>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(stats).map(([lang, stat]) => (
            <div key={lang} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-1">
                {lang === 'ar' ? 'العربية' : lang === 'en' ? 'English' : lang}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {Math.round(stat.completionPercentage)}%
              </div>
              <div className="text-xs text-gray-500">
                {stat.translated} من {stat.total} مترجمة
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${stat.completionPercentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث في الترجمات..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
            dir="rtl"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">جميع الفئات</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">جميع الحالات</option>
          <option value="draft">مسودة</option>
          <option value="review">مراجعة</option>
          <option value="approved">معتمد</option>
        </select>
      </div>

      {/* Validation Results */}
      {validationResults && !validationResults.isValid && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-medium text-red-800 mb-2">أخطاء في الترجمة:</h3>
          <ul className="space-y-1">
            {validationResults.errors.map((error: any, index: number) => (
              <li key={index} className="text-sm text-red-700">
                {error.key} ({error.language}): {error.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Translation Entries */}
      <div className="space-y-4">
        {filteredEntries.map((entry) => (
          <div key={entry.key} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="font-medium text-gray-900 mb-1">{entry.key}</div>
                <div className="text-sm text-gray-500">
                  الفئة: {entry.category} | 
                  الحالة: <span className={`px-2 py-1 rounded text-xs ${
                    entry.status === 'approved' ? 'bg-green-100 text-green-800' :
                    entry.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {entry.status === 'approved' ? 'معتمد' :
                     entry.status === 'review' ? 'مراجعة' : 'مسودة'}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingEntry(entry)}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  تعديل
                </button>
                <button
                  onClick={() => deleteEntry(entry.key)}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                >
                  حذف
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {languages.map(lang => (
                <div key={lang}>
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    {lang === 'ar' ? 'العربية' : lang === 'en' ? 'English' : lang}
                  </div>
                  <div className={`p-3 bg-gray-50 rounded border ${
                    lang === 'ar' ? 'text-right' : 'text-left'
                  }`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    {(entry as any)[lang] || (
                      <span className="text-gray-400 italic">غير مترجم</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {entry.context && (
              <div className="mt-3 p-3 bg-blue-50 rounded">
                <div className="text-sm font-medium text-blue-800 mb-1">السياق:</div>
                <div className="text-sm text-blue-700">{entry.context}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingEntry && (
        <EditTranslationDialog
          entry={editingEntry}
          languages={languages}
          categories={categories}
          onSave={saveEntry}
          onClose={() => setEditingEntry(null)}
        />
      )}

      {/* Add Dialog */}
      {showAddDialog && (
        <AddTranslationDialog
          onAdd={addEntry}
          onClose={() => setShowAddDialog(false)}
          categories={categories}
        />
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <ImportTranslationDialog
          importData={importData}
          onImportDataChange={setImportData}
          onImport={importTranslations}
          onClose={() => setShowImportDialog(false)}
        />
      )}
    </div>
  );
};

/**
 * Edit Translation Dialog Component
 */
interface EditTranslationDialogProps {
  entry: TranslationEntry;
  languages: string[];
  categories: string[];
  onSave: (entry: TranslationEntry) => void;
  onClose: () => void;
}

const EditTranslationDialog: React.FC<EditTranslationDialogProps> = ({
  entry,
  languages,
  categories,
  onSave,
  onClose,
}) => {
  const [editingEntry, setEditingEntry] = useState<TranslationEntry>(entry);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">تعديل الترجمة: {editingEntry.key}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {languages.map(lang => (
            <div key={lang}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === 'ar' ? 'العربية' : lang === 'en' ? 'English' : lang}
              </label>
              <textarea
                value={(editingEntry as any)[lang] || ''}
                onChange={(e) => setEditingEntry(prev => ({
                  ...prev,
                  [lang]: e.target.value
                }))}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                  lang === 'ar' ? 'text-right' : 'text-left'
                }`}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                rows={3}
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">السياق</label>
            <textarea
              value={editingEntry.context || ''}
              onChange={(e) => setEditingEntry(prev => ({
                ...prev,
                context: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right"
              dir="rtl"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الفئة</label>
              <select
                value={editingEntry.category || ''}
                onChange={(e) => setEditingEntry(prev => ({
                  ...prev,
                  category: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">اختر الفئة</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
              <select
                value={editingEntry.status || 'draft'}
                onChange={(e) => setEditingEntry(prev => ({
                  ...prev,
                  status: e.target.value as any
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="draft">مسودة</option>
                <option value="review">مراجعة</option>
                <option value="approved">معتمد</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            onClick={() => onSave(editingEntry)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Add Translation Dialog Component
 */
interface AddTranslationDialogProps {
  onAdd: (key: string, arValue: string, category: string) => void;
  onClose: () => void;
  categories: string[];
}

const AddTranslationDialog: React.FC<AddTranslationDialogProps> = ({
  onAdd,
  onClose,
  categories,
}) => {
  const [key, setKey] = useState('');
  const [arValue, setArValue] = useState('');
  const [category, setCategory] = useState('general');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim() && arValue.trim()) {
      onAdd(key.trim(), arValue.trim(), category);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">إضافة ترجمة جديدة</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المفتاح
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="مثال: common.welcome"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              النص العربي
            </label>
            <textarea
              value={arValue}
              onChange={(e) => setArValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right"
              dir="rtl"
              rows={3}
              placeholder="النص العربي..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الفئة
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="general">عام</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              إضافة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Import Translation Dialog Component
 */
interface ImportTranslationDialogProps {
  importData: string;
  onImportDataChange: (data: string) => void;
  onImport: () => void;
  onClose: () => void;
}

const ImportTranslationDialog: React.FC<ImportTranslationDialogProps> = ({
  importData,
  onImportDataChange,
  onImport,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">استيراد الترجمات</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              بيانات JSON
            </label>
            <textarea
              value={importData}
              onChange={(e) => onImportDataChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              rows={10}
              placeholder='{"ar": {"key1": "value1"}, "en": {"key1": "value1"}}'
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            onClick={onImport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            استيراد
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Utility functions
 */
function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function convertToCSV(translations: Record<string, Record<string, string>>): string {
  const languages = Object.keys(translations);
  const allKeys = new Set<string>();
  
  // Collect all keys
  for (const langTranslations of Object.values(translations)) {
    for (const key of Object.keys(langTranslations)) {
      allKeys.add(key);
    }
  }
  
  // Create CSV
  const headers = ['Key', ...languages];
  const rows = [headers.join(',')];
  
  for (const key of Array.from(allKeys).sort()) {
    const row = [key];
    for (const lang of languages) {
      const value = translations[lang][key] || '';
      row.push(`"${value.replace(/"/g, '""')}"`);
    }
    rows.push(row.join(','));
  }
  
  return rows.join('\n');
}

export default ArabicTranslationManagerComponent; 