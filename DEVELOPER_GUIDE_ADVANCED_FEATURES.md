#  دليل المطور - الأنظمة المتقدمة

##  مقدمة

هذا الدليل يوضح كيفية استخدام الأنظمة المتقدمة الجديدة للتواصل ومشاركة الحالة في تطبيق إدارة تأجير السيارات.

---

##  الأنظمة المتاحة

### 1. **Advanced State Sync** - مزامنة الحالة المتقدمة

#### متى تستخدمها؟
- عندما تحتاج لمشاركة البيانات بين مكونات متعددة
- للحفاظ على البيانات عند تحديث المكونات
- لضمان تطابق البيانات في الوقت الفعلي

#### كيفية الاستخدام:
`	ypescript
import { useAdvancedStateSync } from '@/hooks/use-advanced-state-sync';

const MyComponent = () => {
  const stateSync = useAdvancedStateSync({
    key: 'my-component-state',        // مفتاح فريد للمكون
    autoSync: true,                   // مزامنة تلقائية
    syncInterval: 2000,               // كل ثانيتين
    persistToStorage: true,           // حفظ في localStorage
    validation: (data) => data.id     // تحقق من صحة البيانات
  }, initialData);

  // تحديث البيانات
  const updateData = (newData) => {
    stateSync.updateData(newData, 'user-action');
  };

  // الحصول على البيانات
  const currentData = stateSync.data;
  const isStale = stateSync.isStale;
  const version = stateSync.version;

  return (
    <div>
      <p>البيانات: {JSON.stringify(currentData)}</p>
      <p>الإصدار: {version}</p>
      {isStale && <p> البيانات قديمة</p>}
    </div>
  );
};
`

---

### 2. **Smart Cache** - التخزين المؤقت الذكي

#### متى تستخدمه؟
- للبيانات التي يتم طلبها بكثرة
- لتحسين الأداء وتقليل استهلاك الذاكرة
- للبيانات المكلفة في الحصول عليها

#### كيفية الاستخدام:
`	ypescript
import { useSmartCache } from '@/hooks/use-advanced-state-sync';

const MyComponent = () => {
  const cache = useSmartCache('api-responses', {
    maxAge: 5 * 60 * 1000,    // 5 دقائق
    maxSize: 50,              // 50 عنصر كحد أقصى
    autoCleanup: true         // تنظيف تلقائي
  });

  const fetchData = async (id) => {
    // تحقق من وجود البيانات في الكاش
    const cached = cache.get(id);
    if (cached) {
      return cached;
    }

    // جلب البيانات من API
    const data = await api.getData(id);
    
    // حفظ في الكاش
    cache.set(id, data);
    
    return data;
  };

  return (
    <div>
      <p>حجم الكاش: {cache.size()}</p>
      <button onClick={() => cache.clear()}>
        مسح الكاش
      </button>
    </div>
  );
};
`

---

### 3. **Cross-Page Sync** - المزامنة بين الصفحات

#### متى تستخدمها؟
- لمشاركة البيانات بين صفحات مختلفة
- للحفاظ على الحالة عند التنقل
- للتحديثات الفورية عبر النظام

#### كيفية الاستخدام:
`	ypescript
import { useCrossPageSync } from '@/utils/cross-page-sync';

const DashboardPage = () => {
  const crossSync = useCrossPageSync({
    pageKey: 'dashboard',
    syncKeys: ['stats', 'notifications', 'user-settings'],
    bidirectional: true,      // مزامنة ثنائية الاتجاه
    autoRefresh: true,        // تحديث تلقائي
    refreshInterval: 30000    // كل 30 ثانية
  });

  // مزامنة البيانات
  const updateStats = (newStats) => {
    crossSync.syncData('stats', newStats);
  };

  // الحصول على البيانات المزامنة
  const syncedStats = crossSync.getSyncedData('stats');

  // تحديث فوري للبيانات
  const forceRefresh = () => {
    crossSync.triggerRefresh('stats');
  };

  return (
    <div>
      <h1>لوحة التحكم</h1>
      <pre>{JSON.stringify(syncedStats, null, 2)}</pre>
      <button onClick={forceRefresh}>
        تحديث فوري
      </button>
    </div>
  );
};
`

---

### 4. **Virtualized List** - القوائم المحسنة

#### متى تستخدمها؟
- للقوائم التي تحتوي على أكثر من 50 عنصر
- لتحسين أداء العرض والذاكرة
- للقوائم القابلة للبحث والفلترة

#### كيفية الاستخدام:
`	ypescript
import { VirtualizedList } from '@/components/ui/VirtualizedList';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);

  return (
    <VirtualizedList
      items={customers}
      itemHeight={100}                    // ارتفاع كل عنصر
      searchable={true}                   // إمكانية البحث
      searchPlaceholder="البحث في العملاء..."
      searchFields={['name', 'email']}    // الحقول المراد البحث فيها
      multiSelect={true}                  // اختيار متعدد
      showStats={true}                    // عرض الإحصائيات
      cacheKey="customers-list"           // مفتاح التخزين المؤقت
      containerHeight={600}               // ارتفاع الحاوية
      
      renderItem={({ item, isSelected, onSelect }) => (
        <div 
          className={p-4 border-b -Force{isSelected ? 'bg-blue-50' : ''}}
          onClick={() => onSelect()}
        >
          <h3>{item.name}</h3>
          <p>{item.email}</p>
          <p>{item.phone}</p>
        </div>
      )}
      
      onSelectionChange={(selectedItems) => {
        console.log('العناصر المحددة:', selectedItems);
      }}
      
      onItemClick={(item, index) => {
        console.log('تم النقر على:', item);
      }}
    />
  );
};
`

---

##  أمثلة عملية

### **مثال 1: صفحة العملاء محسنة**
`	ypescript
const EnhancedCustomersPage = () => {
  // Advanced State Sync للعملاء
  const customersSync = useAdvancedStateSync({
    key: 'customers-data',
    autoSync: true,
    persistToStorage: true
  }, []);

  // Smart Cache للاستعلامات
  const apiCache = useSmartCache('customers-api', {
    maxAge: 10 * 60 * 1000, // 10 دقائق
    maxSize: 100
  });

  // Cross-Page Sync
  const crossSync = useCrossPageSync({
    pageKey: 'customers',
    syncKeys: ['selected-customers', 'filters'],
    bidirectional: true
  });

  const fetchCustomers = async () => {
    const cacheKey = 'all-customers';
    let customers = apiCache.get(cacheKey);
    
    if (!customers) {
      customers = await api.getCustomers();
      apiCache.set(cacheKey, customers);
    }
    
    customersSync.updateData(customers, 'fetch');
    return customers;
  };

  return (
    <div>
      <h1>إدارة العملاء</h1>
      <VirtualizedList
        items={customersSync.data}
        itemHeight={120}
        searchable={true}
        multiSelect={true}
        renderItem={CustomerCard}
        onSelectionChange={(selected) => {
          crossSync.syncData('selected-customers', selected);
        }}
      />
    </div>
  );
};
`

---

##  نصائح التطوير

### **أفضل الممارسات**

1. **استخدم مفاتيح فريدة** لكل نظام:
   `	ypescript
   //  جيد
   const sync = useAdvancedStateSync({ key: 'dashboard-revenue-2024' }, data);
   
   //  سيء
   const sync = useAdvancedStateSync({ key: 'data' }, data);
   `

2. **تحقق من صحة البيانات**:
   `	ypescript
   const sync = useAdvancedStateSync({
     key: 'user-profile',
     validation: (data) => {
       return data && data.id && data.email;
     }
   }, userData);
   `

3. **استخدم التخزين المؤقت للبيانات الثقيلة**:
   `	ypescript
   // للبيانات التي تستغرق وقتاً في التحميل
   const cache = useSmartCache('heavy-reports', {
     maxAge: 30 * 60 * 1000, // 30 دقيقة
     maxSize: 10             // عدد قليل من التقارير
   });
   `

---

##  خلاصة

هذه الأنظمة المتقدمة ستحسن أداء تطبيقك بشكل كبير. استخدمها بحكمة وتذكر:

- **Advanced State Sync** للبيانات المشتركة
- **Smart Cache** للبيانات المكلفة
- **Cross-Page Sync** للتواصل بين الصفحات  
- **Virtualized List** للقوائم الطويلة

**نصيحة أخيرة:** ابدأ بتطبيق نظام واحد في كل مرة، واختبر جيداً قبل الانتقال للنظام التالي.
