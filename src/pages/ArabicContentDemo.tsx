import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { ArabicTextEditor } from '../components/ui/arabic-text-editor';
import { ArabicSearch, ArabicSearchResults } from '../components/ui/arabic-search';
import { ArabicTranslationManagerComponent } from '../components/ui/arabic-translation-manager';
import { ArabicTextValidator, arabicContentManagement } from '../utils/arabic-content-management';

/**
 * Sample data for search demo
 */
const sampleVehicles = [
  {
    id: 1,
    name: 'تويوتا كامري',
    description: 'سيارة عائلية فاخرة مع محرك قوي واقتصادي في استهلاك الوقود',
    category: 'سيارات عائلية',
    brand: 'تويوتا',
    year: 2023,
    price: 150000,
  },
  {
    id: 2,
    name: 'نيسان التيما',
    description: 'سيارة أنيقة ومريحة مناسبة للاستخدام اليومي والسفر',
    category: 'سيارات عائلية',
    brand: 'نيسان',
    year: 2022,
    price: 135000,
  },
  {
    id: 3,
    name: 'بي إم دبليو X5',
    description: 'سيارة دفع رباعي فاخرة مع تقنيات متقدمة وأداء استثنائي',
    category: 'سيارات دفع رباعي',
    brand: 'بي إم دبليو',
    year: 2023,
    price: 350000,
  },
  {
    id: 4,
    name: 'مرسيدس بنز C-Class',
    description: 'سيارة فاخرة بتصميم أنيق وتقنيات حديثة للراحة والأمان',
    category: 'سيارات فاخرة',
    brand: 'مرسيدس بنز',
    year: 2023,
    price: 280000,
  },
  {
    id: 5,
    name: 'هوندا أكورد',
    description: 'سيارة موثوقة واقتصادية مع مساحة واسعة ومواصفات عالية',
    category: 'سيارات عائلية',
    brand: 'هوندا',
    year: 2022,
    price: 125000,
  },
];

/**
 * Sample translations for demo
 */
const sampleTranslations = {
  ar: {
    'common.welcome': 'مرحباً بكم',
    'common.search': 'البحث',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'vehicles.title': 'المركبات',
    'vehicles.add': 'إضافة مركبة',
    'vehicles.edit': 'تعديل المركبة',
    'customers.title': 'العملاء',
    'customers.add': 'إضافة عميل',
    'agreements.title': 'الاتفاقيات',
    'agreements.new': 'اتفاقية جديدة',
  },
  en: {
    'common.welcome': 'Welcome',
    'common.search': 'Search',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'vehicles.title': 'Vehicles',
    'vehicles.add': 'Add Vehicle',
    'vehicles.edit': 'Edit Vehicle',
    'customers.title': 'Customers',
    'customers.add': 'Add Customer',
    'agreements.title': 'Agreements',
    'agreements.new': 'New Agreement',
  },
};

/**
 * Arabic Content Management Demo Page
 */
export const ArabicContentDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'editor' | 'search' | 'translation' | 'validation'>('editor');
  const [editorText, setEditorText] = useState('مرحباً بكم في نظام إدارة المحتوى العربي المتقدم. يمكنكم استخدام هذا المحرر لكتابة النصوص العربية مع التحقق من الإملاء والتحقق من صحة النص.');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [validationResults, setValidationResults] = useState<any>(null);

  /**
   * Handle text validation
   */
  const handleValidation = (text: string) => {
    const validation = ArabicTextValidator.validateArabicStructure(text);
    const spellCheck = ArabicTextValidator.spellCheck(text);
    const readability = arabicContentManagement.processor.calculateReadabilityScore(text);
    const keywords = arabicContentManagement.processor.extractKeywords(text);

    setValidationResults({
      validation,
      spellCheck,
      readability,
      keywords,
    });
  };

  /**
   * Render vehicle search result
   */
  const renderVehicleResult = (vehicle: any, matches: any[]) => (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{vehicle.name}</h3>
        <span className="text-sm text-gray-500">{vehicle.year}</span>
      </div>
      <p className="text-gray-600 mb-3">{vehicle.description}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
          {vehicle.category}
        </span>
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
          {vehicle.brand}
        </span>
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
          {vehicle.price.toLocaleString('ar-QA')} ر.ق
        </span>
      </div>
    </div>
  );

  return (
    <PageContainer>
      <PageHeader
        title="إدارة المحتوى العربي"
        subtitle="نظام شامل لإدارة النصوص العربية مع التحقق من الإملاء والبحث المتقدم وإدارة الترجمات"
      />

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" dir="rtl">
            <button
              onClick={() => setActiveTab('editor')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'editor'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              محرر النصوص العربية
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              البحث المتقدم
            </button>
            <button
              onClick={() => setActiveTab('translation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'translation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              إدارة الترجمات
            </button>
            <button
              onClick={() => setActiveTab('validation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'validation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              التحقق من النصوص
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Arabic Text Editor Tab */}
        {activeTab === 'editor' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                محرر النصوص العربية المتقدم
              </h3>
              <p className="text-gray-600 mb-6">
                محرر نصوص متقدم مع دعم كامل للغة العربية، التحقق من الإملاء، التحقق من صحة النص، 
                وحساب مستوى سهولة القراءة.
              </p>

              <ArabicTextEditor
                value={editorText}
                onChange={setEditorText}
                showSpellCheck={true}
                showValidation={true}
                showWordCount={true}
                showReadabilityScore={true}
                autoCorrect={true}
                language="ar"
                minHeight={200}
                onValidationChange={(validation) => console.log('Validation:', validation)}
              />

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">الميزات المتاحة:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• التحقق من الإملاء مع اقتراحات التصحيح</li>
                  <li>• التحقق من صحة بنية النص العربي</li>
                  <li>• حساب مستوى سهولة القراءة</li>
                  <li>• عد الكلمات والأحرف</li>
                  <li>• التصحيح التلقائي لعلامات الترقيم العربية</li>
                  <li>• دعم كامل لاتجاه النص من اليمين إلى اليسار</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Arabic Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                البحث المتقدم مع دعم التشكيل
              </h3>
              <p className="text-gray-600 mb-6">
                نظام بحث متقدم يدعم البحث في النصوص العربية مع إمكانية تجاهل التشكيل، 
                البحث التقريبي، وتمييز النتائج.
              </p>

              <ArabicSearch
                data={sampleVehicles}
                searchFields={['name', 'description', 'category', 'brand']}
                onResults={setSearchResults}
                placeholder="ابحث في المركبات..."
                showFilters={true}
                showAdvancedOptions={true}
                enableFuzzySearch={true}
                enableDiacriticsToggle={true}
                enableHighlighting={true}
                className="mb-6"
              />

              <ArabicSearchResults
                results={searchResults}
                renderItem={renderVehicleResult}
                showScore={true}
                showMatches={true}
              />

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">ميزات البحث:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• البحث مع تجاهل التشكيل (الحركات)</li>
                  <li>• البحث التقريبي للكلمات المتشابهة</li>
                  <li>• البحث المتقدم متعدد الحقول</li>
                  <li>• تمييز النتائج المطابقة</li>
                  <li>• حفظ تاريخ البحث واقتراح المصطلحات</li>
                  <li>• دعم العمليات المنطقية (و، أو)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Translation Management Tab */}
        {activeTab === 'translation' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                إدارة الترجمات
              </h3>
              <p className="text-gray-600 mb-6">
                نظام شامل لإدارة الترجمات مع دعم متعدد اللغات، التحقق من صحة الترجمات، 
                والاستيراد والتصدير.
              </p>

              <ArabicTranslationManagerComponent
                initialTranslations={sampleTranslations}
                languages={['ar', 'en']}
                defaultLanguage="ar"
                showValidation={true}
                showImportExport={true}
                onTranslationsChange={(translations) => {
                  console.log('Translations updated:', translations);
                }}
                onLanguageChange={(language) => {
                  console.log('Language changed:', language);
                }}
              />

              <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">ميزات إدارة الترجمات:</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• إدارة الترجمات متعددة اللغات</li>
                  <li>• التحقق من صحة الترجمات العربية</li>
                  <li>• تتبع حالة الترجمات (مسودة، مراجعة، معتمد)</li>
                  <li>• البحث والتصفية في الترجمات</li>
                  <li>• الاستيراد والتصدير بصيغ JSON و CSV</li>
                  <li>• إحصائيات مفصلة لكل لغة</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Text Validation Tab */}
        {activeTab === 'validation' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                التحقق من النصوص العربية
              </h3>
              <p className="text-gray-600 mb-6">
                أدوات متقدمة للتحقق من صحة النصوص العربية، استخراج الكلمات المفتاحية، 
                وحساب مستوى سهولة القراءة.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    النص للتحقق منه:
                  </label>
                  <textarea
                    value={editorText}
                    onChange={(e) => setEditorText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right"
                    dir="rtl"
                    rows={4}
                    placeholder="أدخل النص العربي هنا..."
                  />
                </div>

                <button
                  onClick={() => handleValidation(editorText)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  تحليل النص
                </button>

                {validationResults && (
                  <div className="space-y-4">
                    {/* Validation Results */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">نتائج التحقق:</h4>
                      
                      {validationResults.validation.errors.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-red-800 mb-2">الأخطاء:</h5>
                          <ul className="text-sm text-red-700 space-y-1">
                            {validationResults.validation.errors.map((error: string, index: number) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {validationResults.validation.warnings.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-yellow-800 mb-2">التحذيرات:</h5>
                          <ul className="text-sm text-yellow-700 space-y-1">
                            {validationResults.validation.warnings.map((warning: string, index: number) => (
                              <li key={index}>• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {validationResults.validation.isValid && (
                        <div className="text-sm text-green-700">
                          ✓ النص صحيح ولا يحتوي على أخطاء
                        </div>
                      )}
                    </div>

                    {/* Spell Check Results */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">التحقق من الإملاء:</h4>
                      {validationResults.spellCheck.misspelledCount > 0 ? (
                        <div>
                          <p className="text-sm text-red-700 mb-2">
                            عدد الأخطاء الإملائية: {validationResults.spellCheck.misspelledCount}
                          </p>
                          <div className="space-y-2">
                            {validationResults.spellCheck.suggestions.map((suggestion: any, index: number) => (
                              <div key={index} className="text-sm">
                                <span className="text-red-600 font-medium">{suggestion.word}</span>
                                {suggestion.suggestions.length > 0 && (
                                  <span className="text-gray-600">
                                    {' ← اقتراحات: '}
                                    {suggestion.suggestions.join('، ')}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-green-700">
                          ✓ لا توجد أخطاء إملائية
                        </div>
                      )}
                    </div>

                    {/* Readability Score */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">سهولة القراءة:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold text-blue-600 mb-1">
                            {Math.round(validationResults.readability.score)}
                          </div>
                          <div className={`text-sm font-medium ${
                            validationResults.readability.level === 'easy' ? 'text-green-600' :
                            validationResults.readability.level === 'medium' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {validationResults.readability.level === 'easy' ? 'سهل' :
                             validationResults.readability.level === 'medium' ? 'متوسط' : 'صعب'}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>متوسط الكلمات في الجملة: {Math.round(validationResults.readability.metrics.averageWordsPerSentence)}</div>
                          <div>متوسط الأحرف في الكلمة: {Math.round(validationResults.readability.metrics.averageLettersPerWord)}</div>
                          <div>نسبة الكلمات المعقدة: {Math.round(validationResults.readability.metrics.complexWordsPercentage)}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Keywords */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">الكلمات المفتاحية:</h4>
                      <div className="flex flex-wrap gap-2">
                        {validationResults.keywords.map((keyword: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-2">ميزات التحقق:</h4>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• التحقق من بنية النص العربي</li>
                  <li>• اكتشاف الأخطاء الإملائية الشائعة</li>
                  <li>• حساب مستوى سهولة القراءة</li>
                  <li>• استخراج الكلمات المفتاحية</li>
                  <li>• التحقق من علامات الترقيم العربية</li>
                  <li>• اكتشاف خلط النصوص العربية واللاتينية</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default ArabicContentDemo; 