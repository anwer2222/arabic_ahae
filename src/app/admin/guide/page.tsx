import Link from "next/link";
import Image from "next/image";

export default function TeacherGuidePage() {
  return (
    <div className="min-h-screen bg-background p-6 lg:p-10 text-foreground" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
          <h1 className="text-3xl font-bold text-primary">دليل المعلم: إعداد الاختبارات</h1>
          <Link href="/admin" className="text-sm bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition">
            العودة للوحة التحكم
          </Link>
        </div>

        {/* Section 1: Audio Files */}
        <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span>📂</span> الخطوة الأولى: تجهيز الملفات الصوتية
          </h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            قبل رفع أي إكسل، تأكد من نقل جميع ملفات الصوت (بصيغة .wav) إلى مجلدات المشروع المحلية المخصصة لها. هذا يضمن تشغيل الصوت بدون أي تأخير للطلاب.
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm font-medium">
            <li>الأصوات المفخمة (Emphatic) توضع في: <code className="bg-muted px-2 py-1 rounded" dir="ltr">public/audio/emphatic/</code></li>
            <li>الأصوات الحلقية (Guttural) توضع في: <code className="bg-muted px-2 py-1 rounded" dir="ltr">public/audio/guttural/</code></li>
          </ul>
          <div className="flex items-center justify-center pt-10">
               <Image src="/guide/audio_path.jpg" alt="" width={200} height={200}/>
          </div>
        </section>

        {/* Section 2: Excel Formatting */}
        <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span>📊</span> الخطوة الثانية: تنسيق ملف الإكسل (Excel)
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            يعتمد النظام على أسماء الأعمدة (Columns) لقراءة البيانات بشكل صحيح. يرجى تصميم ملف الإكسل بناءً على نوع الاختبار الذي ترغب في إنشائه:
          </p>

          <div className="space-y-8">
            {/* Identification */}
            <div>
              <h3 className="text-lg font-bold text-primary mb-2">1. اختبار التعرف (Identification)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm border border-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 border border-border">Trial</th>
                      <th className="p-2 border border-border">Pair</th>
                      <th className="p-2 border border-border">Vowel</th>
                      <th className="p-2 border border-border">Audio</th>
                      <th className="p-2 border border-border">Options</th>
                      <th className="p-2 border border-border">Correct</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-border">1</td>
                      <td className="p-2 border border-border">س-ص</td>
                      <td className="p-2 border border-border">i</td>
                      <td className="p-2 border border-border" dir="ltr">emph_001.wav</td>
                      <td className="p-2 border border-border">تِيب, طِيب</td>
                      <td className="p-2 border border-border">طِيب</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Same-Different */}
            <div>
              <h3 className="text-lg font-bold text-primary mb-2">2. تعليمات اختبار التمييز (التماثل والاختلاف) (Same-Different)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm border border-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 border border-border">Trial</th>
                      <th className="p-2 border border-border">Pair</th>
                      <th className="p-2 border border-border">Vowel</th>
                      <th className="p-2 border border-border">Audio 1</th>
                      <th className="p-2 border border-border">Audio 2</th>
                      <th className="p-2 border border-border">Correct</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-border">1</td>
                      <td className="p-2 border border-border">س-ص</td>
                      <td className="p-2 border border-border">i</td>
                      <td className="p-2 border border-border" dir="ltr">emph_005.wav</td>
                      <td className="p-2 border border-border" dir="ltr">emph_013.wav</td>
                      <td className="p-2 border border-border">مختلفان</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-border">2</td>
                      <td className="p-2 border border-border">س-ص</td>
                      <td className="p-2 border border-border">i</td>
                      <td className="p-2 border border-border" dir="ltr">emph_005.wav</td>
                      <td className="p-2 border border-border" dir="ltr">emph_005.wav</td>
                      <td className="p-2 border border-border">متماثلان</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* AXB */}
            <div>
              <h3 className="text-lg font-bold text-primary mb-2">3. اختبار المقارنة (AXB)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm border border-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 border border-border">Trial</th>
                      <th className="p-2 border border-border">Pair</th>
                      <th className="p-2 border border-border">Vowel</th>
                      <th className="p-2 border border-border">Audio A</th>
                      <th className="p-2 border border-border">Audio X</th>
                      <th className="p-2 border border-border">Audio B</th>
                      <th className="p-2 border border-border">Correct</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-border">1</td>
                      <td className="p-2 border border-border">س-ص</td>
                      <td className="p-2 border border-border">i</td>
                      <td className="p-2 border border-border" dir="ltr">emph_015.wav</td>
                      <td className="p-2 border border-border" dir="ltr">emph_015.wav</td>
                      <td className="p-2 border border-border" dir="ltr">emph_004.wav</td>
                      <td className="p-2 border border-border">الأول</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Time Settings */}
        <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span>⏱️</span> الخطوة الثالثة: إعدادات الاختبار
          </h2>
          <p className="text-muted-foreground leading-relaxed pb-8">
            أثناء رفع الإكسل، يمكنك تحديد <strong>إعدادات الاختبار</strong> و <strong>وقت الاستراحة</strong>. 
            يمكن تحديد الخيارات التالية
          </p>
          <ol>
              <li>عنوان الاختبار: مثال - أصوات حلقية - المجموعة A</li>
            <li>ملف الإكسل (.xlsx)</li>
            <li>اختر ورقة العمل (Sheet)</li>
            <li>مفتاح تبديل حالة النشر (Toggle)</li>
            <li>الوحدة (Module): مفخمة (Emphatic), حلقية (Guttural)</li>
            <li>نوع المهمة (Task Type): تحديد (Identification), تطابق واختلاف (Same-Different), مقارنة (AXB) </li>
            <li>وقت الراحة (بالثواني): الوقت المستقطع بعد منتصف الاختبار (ضع 0 لإلغائه)</li>
            <li>وقت الفصل قبل الاستراحة (ms): الفاصل الزمني بين الأصوات في النصف الأول من الاختبار (بالميلي ثانية)</li>
            <li>وقت الفصل بعد الاستراحة (ms): الفاصل الزمني بين الأصوات في النصف الثاني من الاختبار (بالميلي ثانية)</li>
          </ol>
          <div className="flex items-center justify-center pt-10">
               <Image src="/guide/test_creation.jpg" alt="" width={800} height={500}/>
          </div>
        </section>

      </div>
    </div>
  );
}