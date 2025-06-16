import { supabase } from '@/lib/supabase';

export interface CustomerContext {
  id: string;
  name: string;
  email: string;
  phone: string;
  pendingAmount: number;
  overduePayments: number;
  trafficFines: number;
  relatedCompany: string | null;
}

export interface LegalLetterRequest {
  type: string; // Allow any letter type, not just predefined ones
  customerId?: string; // Make customer ID optional
  contractId?: string;
  reason: string;
  language: 'ar' | 'en';
  customPrompt?: string; // For custom letter requests
}

export interface GeneratedLetter {
  id: string;
  title: string;
  content: string;
  type: string;
  customerId: string;
  generatedAt: string;
}

export class LegalAIService {
  private readonly DEEPSEEK_API_KEY = 'sk-472efaefda684958b9596e03f235789c';
  private readonly USE_AI_ENHANCEMENT = true; // AI features now enabled with DeepSeek!

  // Company information
  private readonly COMPANY_INFO = {
    name: 'العراف لتأجير السيارات ذ.م.م',
    registrationNumber: '146832',
    address: 'منطقة أم صلال علي، الدوحة، قطر',
    poBox: 'ص.ب 36126',
    fullDescription: 'شركة العراف لتأجير السيارات ذ.م.م، وهي شركة محدودة المسؤولية مسجلة أصولاً طبقاً لقوانين دولة قطر، سجل تجاري رقم 146832 ومقرها الكائن في منطقة أم صلال علي، الدوحة، قطر، ص.ب 36126'
  };

  // Enhanced vehicle brand to company mapping with details
  private readonly VEHICLE_COMPANY_MAPPING = {
    'MG': {
      company: 'الأولى للتمويل',
      fullName: 'شركة الأولى للتمويل',
      context: 'شركة تمويل متخصصة في تمويل السيارات'
    },
    'CHANGAN': {
      company: 'العطية للسيارات',
      fullName: 'شركة العطية للسيارات',
      context: 'وكيل معتمد لسيارات شانجان في قطر'
    },
    'BESTUNE': {
      company: 'الريادة للسيارات',
      fullName: 'شركة الريادة للسيارات',
      context: 'وكيل معتمد لسيارات بيستون في قطر'
    },
    'DONGFENG': {
      company: 'الطالب للسيارات',
      fullName: 'شركة الطالب للسيارات',
      context: 'وكيل معتمد لسيارات دونغ فنغ في قطر'
    },
    'GAC': {
      company: 'دماسكو',
      fullName: 'شركة دماسكو',
      context: 'وكيل معتمد لسيارات جي إيه سي في قطر'
    }
  };

  private getCompanyByVehicleBrand(carType: string): { company: string; fullName: string; context: string } | null {
    // Extract brand from car_type (assuming format like "MG HS 2023" or "CHANGAN CS55")
    const upperCarType = carType.toUpperCase();
    
    for (const [brand, details] of Object.entries(this.VEHICLE_COMPANY_MAPPING)) {
      if (upperCarType.includes(brand)) {
        return details;
      }
    }
    
    return null; // No specific company found
  }

  // Enhanced method to detect vehicle brand from reason text
  private detectVehicleBrandFromReason(reason: string): { company: string; fullName: string; context: string } | null {
    const upperReason = reason.toUpperCase();
    
    for (const [brand, details] of Object.entries(this.VEHICLE_COMPANY_MAPPING)) {
      if (upperReason.includes(brand)) {
        return details;
      }
    }
    
    return null;
  }

  async gatherCustomerContext(customerId: string): Promise<CustomerContext> {
    // Handle case where no customer is selected (general letters)
    if (!customerId) {
      return {
        id: '',
        name: 'غير محدد',
        email: '',
        phone: '',
        pendingAmount: 0,
        overduePayments: 0,
        trafficFines: 0,
        relatedCompany: null // No specific company for general letters
      };
    }

    const { data: customer, error: customerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', customerId)
      .eq('role', 'customer')
      .single();

    if (customerError) {
      console.error('Error fetching customer:', customerError);
      throw new Error(`Customer not found: ${customerError.message}`);
    }

    // Get customer's active rental agreements to find vehicle information
    const { data: leases } = await supabase
      .from('leases')
      .select('*, vehicles(make, model)')
      .eq('customer_id', customerId)
      .in('status', ['active', 'pending']);

    // Get pending payments from car installments (if they exist)
    const { data: payments } = await supabase
      .from('car_installment_payments')
      .select('*')
      .in('status', ['pending', 'overdue']);

    const { data: fines } = await supabase
      .from('traffic_fines')
      .select('*')
      .eq('customer_id', customerId)
      .eq('status', 'unpaid');

    // Determine related company from customer's vehicle
    let relatedCompany: string | null = null;
    if (leases && leases.length > 0) {
      // Use the first active lease's vehicle to determine company
      const firstLease = leases[0];
      if (firstLease?.vehicles?.make) {
        const carType = `${firstLease.vehicles.make} ${firstLease.vehicles.model || ''}`.trim();
        relatedCompany = this.getCompanyByVehicleBrand(carType)?.company || null;
      }
    }

    const pendingAmount = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const overduePayments = payments?.filter(p => p.status === 'overdue').length || 0;
    const trafficFines = fines?.reduce((sum, f) => sum + f.amount, 0) || 0;

    return {
      id: customer.id,
      name: customer.full_name || '',
      email: customer.email || '',
      phone: customer.phone_number || '',
      pendingAmount,
      overduePayments,
      trafficFines,
      relatedCompany
    };
  }

  async generateLegalLetter(request: LegalLetterRequest): Promise<GeneratedLetter> {
    try {
      console.log('🚀 Starting legal letter generation...');
      console.log('📋 Request details:', {
        type: request.type,
        customerId: request.customerId,
        reason: request.reason,
        customPrompt: request.customPrompt,
        isCustomType: request.customPrompt ? 'Yes' : 'No'
      });
      
      const context = await this.gatherCustomerContext(request.customerId || '');
      console.log('👤 Customer context gathered:', {
        name: context.name,
        pendingAmount: context.pendingAmount,
        trafficFines: context.trafficFines,
        overduePayments: context.overduePayments
      });
      
      const content = await this.generateLetterContent(request, context);

      const letter: GeneratedLetter = {
        id: crypto.randomUUID(),
        title: this.generateTitle(request, context),
        content,
        type: request.type,
        customerId: request.customerId || '',
        generatedAt: new Date().toISOString()
      };

      this.saveLetter(letter);
      console.log('✅ Letter generated successfully:', {
        id: letter.id,
        title: letter.title,
        contentLength: letter.content.length,
        type: letter.type
      });
      return letter;
    } catch (error) {
      console.error('❌ Error generating legal letter:', error);
      throw new Error(`Failed to generate letter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateLetterContent(request: LegalLetterRequest, context: CustomerContext): Promise<string> {
    if (this.USE_AI_ENHANCEMENT) {
      return await this.generateWithAI(request, context);
    } else {
      // Fallback to template system
      return this.generateWithTemplate(request, context);
    }
  }

  private async generateWithAI(request: LegalLetterRequest, context: CustomerContext): Promise<string> {
    try {
      const prompt = this.buildAIPrompt(request, context);
      const aiResponse = await this.callDeepSeek(prompt);
      
      // Validate AI response and ensure it contains required information
      if (this.validateAIResponse(aiResponse, context)) {
        return aiResponse;
      } else {
        console.log('AI response validation failed, using template fallback');
        return this.generateWithTemplate(request, context);
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      return this.generateWithTemplate(request, context);
    }
  }

  private buildAIPrompt(request: LegalLetterRequest, context: CustomerContext): string {
    const letterTypeInstructions = this.getLetterTypeInstructions(request.type);
    const additionalContext = this.getLetterTypeContext(request.type, request.reason || '');
    
    // Detect company from reason if not found in customer context
    const reasonBasedCompany = this.detectVehicleBrandFromReason(request.reason || '');
    const targetCompany = reasonBasedCompany || (context.relatedCompany ? { 
      company: context.relatedCompany, 
      fullName: `شركة ${context.relatedCompany}`, 
      context: '' 
    } : null);
    
    const customerInfo = context.id ? `
بيانات العميل:
- الاسم: ${context.name}
- الهاتف: ${context.phone}
- البريد الإلكتروني: ${context.email}
- المبلغ المستحق: ${context.pendingAmount.toLocaleString()} ريال قطري
- عدد الأقساط المتأخرة: ${context.overduePayments}
- قيمة المخالفات المرورية: ${context.trafficFines.toLocaleString()} ريال قطري
${targetCompany ? `- الشركة المختصة: ${targetCompany.fullName}` : ''}
` : 'هذا خطاب عام بدون عميل محدد';

    const recipientInfo = targetCompany 
      ? `**مهم جداً**: هذا الخطاب يجب أن يكون موجهاً إلى "${targetCompany.fullName}" وليس إلى العميل. ابدأ الخطاب بـ "إلى السادة ${targetCompany.fullName} المحترمين"`
      : 'يمكن توجيه هذا الخطاب للجهة المناسبة حسب نوع الخطاب';
    
    return `أنت محامي متخصص يعمل لدى ${this.COMPANY_INFO.name} ولديك خبرة عميقة في القوانين القطرية والمعاملات التجارية. مهمتك إنشاء خطاب قانوني احترافي باللغة العربية.

معلومات شركتنا:
${this.COMPANY_INFO.fullDescription}

معلومات القوانين القطرية المهمة:
- القانون المدني القطري رقم 22 لسنة 2004
- قانون المرور القطري رقم 19 لسنة 2007 والمعدل بالقانون رقم 15 لسنة 2016
- قانون التجارة القطري رقم 27 لسنة 2006
- قانون الشركات التجارية رقم 11 لسنة 2015

${customerInfo}

معلومات الشركات المختصة بالسيارات:
- MG → شركة الأولى للتمويل (شركة تمويل متخصصة)
- CHANGAN → شركة العطية للسيارات (وكيل معتمد)
- BESTUNE → شركة الريادة للسيارات (وكيل معتمد)
- DONGFENG → شركة الطالب للسيارات (وكيل معتمد)
- GAC → شركة دماسكو (وكيل معتمد)

${recipientInfo}

نوع الخطاب المطلوب: ${request.type}
${letterTypeInstructions}

السبب المحدد: ${request.reason}
${request.customPrompt ? `طلب خاص: ${request.customPrompt}` : ''}

${additionalContext}

متطلبات الخطاب (يجب اتباعها بدقة):
1. استخدم لغة قانونية احترافية ومقنعة
2. ابدأ بـ "بسم الله الرحمن الرحيم"
3. ${targetCompany ? `وجه الخطاب إلى "${targetCompany.fullName}" مع الاحترام والتقدير المناسب` : 'حدد المستقبل المناسب حسب نوع الخطاب'}
4. اذكر المراجع القانونية القطرية ذات الصلة
5. اكتب مقدمة مهذبة ومهنية
6. اذكر الأسباب القانونية والمنطقية بوضوح
7. تضمين البيانات المالية والشخصية إذا كانت متوفرة
8. استخدم تاريخ اليوم: ${new Date().toLocaleDateString('ar-QA')}
9. **مهم جداً**: يجب أن تتضمن نص التفويض التالي قبل التوقيع مباشرة:

"وقد فوضنا السيد / أسامة أحمد البشرى عبد المنعم رقم شخصي : 29273601820 لمتابعة وإنهاء كافة الإجراءات المتعلقة لدى إدارتكم"

10. اختتم بـ "مع فائق الاحترام والتقدير، ${this.COMPANY_INFO.name}"
11. اجعل الخطاب مقنعاً ومهنياً وملزماً قانونياً مع أسلوب محترف

تعليمات خاصة للمحامي:
- تصرف كمحامي الشركة المتخصص
- استخدم الحجج القانونية المقنعة
- اذكر الفوائد المتبادلة من قبول الطلب
- تجنب اللغة الضعيفة أو غير المؤكدة
- اجعل الطلب معقولاً ومبرراً قانونياً

أنشئ الخطاب كاملاً:`;
  }

  private getLetterTypeInstructions(type: string): string {
    const instructions: { [key: string]: string } = {
      'طلب انهاء تعاقد': `
        - اذكر أسباب إنهاء التعاقد بوضوح
        - ارجع للمادة 648 من القانون المدني القطري
        - حدد فترة إشعار مناسبة (عادة 30 يوم)
        - اذكر الالتزامات المالية المتبقية`,
      
      'طلب افراج عن مركبة': `
        - اطلب الإفراج عن المركبة المحجوزة
        - اذكر أسباب الحجز وكيفية معالجتها
        - ارجع لقانون المرور القطري
        - حدد الوثائق المطلوبة للإفراج`,
      
      'طلب تحويل مخالفات مرورية': `
        - اطلب تحويل المخالفات من العميل للشركة أو العكس
        - اذكر قانون المرور القطري رقم 19 لسنة 2007
        - حدد قائمة المخالفات المطلوب تحويلها
        - اذكر المبررات القانونية للتحويل`,
      
      'contract_cancellation': `
        - اذكر أسباب إلغاء العقد
        - ارجع للمادة 648 من القانون المدني القطري
        - حدد المدة للاستجابة (عادة 7 أيام)`,
      
      'payment_reminder': `
        - ذكّر بالمستحقات المالية
        - اذكر عواقب عدم السداد
        - حدد مدة زمنية للسداد`,
      
      'traffic_fine_notice': `
        - أشعر بالمخالفات المرورية المستحقة
        - اذكر قانون المرور القطري
        - حدد طريقة السداد والمدة المطلوبة`
    };

    return instructions[type] || `
      - اكتب خطاباً قانونياً مناسباً لهذا النوع: ${type}
      - استخدم المراجع القانونية القطرية المناسبة
      - اجعل الخطاب واضحاً ومحدداً`;
  }

  private async callDeepSeek(prompt: string): Promise<string> {
          console.log('🤖 Calling DeepSeek for legal letter generation...');
    
          const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
                  model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `أنت خبير قانوني قطري متخصص في القانون المدني وقانون المرور والتجارة. 

خبرتك تشمل:
- القانون المدني القطري رقم 22 لسنة 2004
- قانون المرور القطري رقم 19 لسنة 2007  
- قانون التجارة القطري رقم 27 لسنة 2006
- اللغة العربية القانونية الرسمية
- صياغة الخطابات والوثائق القانونية

مهمتك كتابة خطابات قانونية رسمية دقيقة ومقنعة باللغة العربية الفصحى.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.2, // Even lower for more consistent legal language
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API Error:', response.status, response.statusText, errorData);
      throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ OpenAI response received successfully');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }

    return data.choices[0].message.content;
  }

  private validateAIResponse(response: string, context: CustomerContext): boolean {
    // Check if response contains required elements
    const requiredElements = [
      context.name,
      'بسم الله الرحمن الرحيم',
      'شركة حلول الإيجار',
      'ريال قطري'
    ];

    return requiredElements.every(element => response.includes(element));
  }

  private generateWithTemplate(request: LegalLetterRequest, context: CustomerContext): string {
    // Original template system as fallback
    if (request.type === 'contract_cancellation' || request.type === 'طلب انهاء تعاقد') {
      return this.generateCancellationLetterAr(request, context);
    }
    
    // Detect company from reason if not available in context
    const reasonBasedCompany = this.detectVehicleBrandFromReason(request.reason || '');
    const targetCompany = reasonBasedCompany || (context.relatedCompany ? { 
      company: context.relatedCompany, 
      fullName: `شركة ${context.relatedCompany}`, 
      context: '' 
    } : null);
    
    const recipient = targetCompany 
      ? `إلى السادة ${targetCompany.fullName} المحترمين` 
      : context.id ? `السيد/السيدة: ${context.name}` : 'إلى من يهمه الأمر';

    const customerSection = context.id ? `
المتعلق بالعميل: ${context.name}

البيانات المالية:
• المبلغ المستحق: ${context.pendingAmount.toLocaleString()} ريال قطري
• المخالفات المرورية: ${context.trafficFines.toLocaleString()} ريال قطري` : '';

    const legalContext = this.getLetterTypeContext(request.type, request.reason || '');

    // Enhanced template for other types
    return `بسم الله الرحمن الرحيم

${recipient}

الموضوع: ${request.type}

تحية طيبة وبعد،

نحن ${this.COMPANY_INFO.name}، نتشرف بمراسلتكم بخصوص ${request.reason || request.type}.

${customerSection}

${legalContext}

نرجو من سيادتكم التكرم بالنظر في طلبنا والموافقة عليه لما فيه من مصلحة مشتركة.

وقد فوضنا السيد / أسامة أحمد البشرى عبد المنعم رقم شخصي : 29273601820 لمتابعة وإنهاء كافة الإجراءات المتعلقة لدى إدارتكم

مع فائق الاحترام والتقدير،
${this.COMPANY_INFO.name}
السجل التجاري: ${this.COMPANY_INFO.registrationNumber}
${this.COMPANY_INFO.address}
${this.COMPANY_INFO.poBox}

التاريخ: ${new Date().toLocaleDateString('ar-QA')}`;
  }

  private generateCancellationLetterAr(request: LegalLetterRequest, context: CustomerContext): string {
    // Detect company from reason if not available in context
    const reasonBasedCompany = this.detectVehicleBrandFromReason(request.reason || '');
    const targetCompany = reasonBasedCompany || (context.relatedCompany ? { 
      company: context.relatedCompany, 
      fullName: `شركة ${context.relatedCompany}`, 
      context: '' 
    } : null);
    
    const recipient = targetCompany 
      ? `إلى السادة ${targetCompany.fullName} المحترمين` 
      : context.id ? `السيد/السيدة: ${context.name}` : 'إلى من يهمه الأمر';

    const customerReference = context.id && targetCompany 
      ? `المتعلق بالعميل: ${context.name}` 
      : '';

    const financialSection = context.id ? `
التفاصيل المالية:
• المبلغ المستحق: ${context.pendingAmount.toLocaleString()} ريال قطري
• الأقساط المتأخرة: ${context.overduePayments}
• المخالفات المرورية: ${context.trafficFines.toLocaleString()} ريال قطري

المطلوب تسديد المبالغ خلال 7 أيام من تاريخ هذا الإشعار.` : '';

    const legalContext = this.getLetterTypeContext(request.type, request.reason || '');

    return `بسم الله الرحمن الرحيم

${recipient}

${customerReference}

الموضوع: إشعار بإلغاء عقد الإيجار

تحية طيبة وبعد،

نحن ${this.COMPANY_INFO.name}، نشير إلى العقد المبرم ${targetCompany ? 'معكم' : 'بيننا'} بخصوص تأجير المركبة.

نظراً للأسباب التالية:
${context.id ? this.generateReasons(context) : request.reason || 'الأسباب المبينة في الطلب'}

${legalContext}

وعليه، ووفقاً للقانون المدني القطري رقم 22 لسنة 2004، المادة 648، نبلغكم بإلغاء العقد.

${financialSection}

نرجو من سيادتكم التعاون معنا لإنهاء الإجراءات اللازمة.

وقد فوضنا السيد / أسامة أحمد البشرى عبد المنعم رقم شخصي : 29273601820 لمتابعة وإنهاء كافة الإجراءات المتعلقة لدى إدارتكم

مع فائق الاحترام والتقدير،
${this.COMPANY_INFO.name}
السجل التجاري: ${this.COMPANY_INFO.registrationNumber}
${this.COMPANY_INFO.address}
${this.COMPANY_INFO.poBox}

التاريخ: ${new Date().toLocaleDateString('ar-QA')}`;
  }

  private generateReasons(context: CustomerContext): string {
    const reasons = [];
    if (context.pendingAmount > 0) {
      reasons.push(`• مستحقات مالية متأخرة: ${context.pendingAmount.toLocaleString()} ريال`);
    }
    if (context.trafficFines > 0) {
      reasons.push(`• مخالفات مرورية غير مسددة: ${context.trafficFines.toLocaleString()} ريال`);
    }
    return reasons.join('\n');
  }

  private generateTitle(request: LegalLetterRequest, context: CustomerContext): string {
    if (request.language === 'ar') {
      return `إشعار ${request.type === 'contract_cancellation' ? 'إلغاء عقد' : 'قانوني'} - ${context.name}`;
    }
    return `Legal Notice - ${context.name}`;
  }

  private saveLetter(letter: GeneratedLetter): void {
    const stored = localStorage.getItem('legal_letters') || '[]';
    const letters = JSON.parse(stored);
    letters.push(letter);
    localStorage.setItem('legal_letters', JSON.stringify(letters));
  }

  async getLetterHistory(): Promise<GeneratedLetter[]> {
    const stored = localStorage.getItem('legal_letters') || '[]';
    return JSON.parse(stored);
  }

  // Enhanced legal reasoning for different letter types
  private getLetterTypeContext(letterType: string, reason: string): string {
    const lowerType = letterType.toLowerCase();
    const lowerReason = reason.toLowerCase();
    
    if (lowerReason.includes('اعادة جدول') || lowerReason.includes('إعادة جدول') || lowerReason.includes('جدولة')) {
      return `
أسباب طلب إعادة الجدولة المقترحة:
1. تغيير الظروف المالية للعميل
2. الحاجة لمرونة في سداد الأقساط
3. الرغبة في تحسين العلاقة التجارية طويلة الأمد
4. الحفاظ على جودة الخدمة المقدمة للعميل

المرجع القانوني: وفقاً للمادة 171 من القانون المدني القطري رقم 22 لسنة 2004، والتي تنص على إمكانية تعديل شروط العقد بالتراضي بين الطرفين.
`;
    }
    
    if (lowerType.includes('payment') || lowerReason.includes('سداد') || lowerReason.includes('دفع')) {
      return `
المرجع القانوني: المادة 648 من القانون المدني القطري رقم 22 لسنة 2004 بشأن التزامات المدين في السداد.
`;
    }
    
    if (lowerType.includes('traffic') || lowerReason.includes('مرور') || lowerReason.includes('مخالف')) {
      return `
المرجع القانوني: قانون المرور القطري رقم 19 لسنة 2007 والمعدل بالقانون رقم 15 لسنة 2016.
`;
    }
    
    return '';
  }
}

export const legalAIService = new LegalAIService(); 