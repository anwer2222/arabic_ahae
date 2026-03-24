"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  
  const availableTests = useQuery(api.tests.listAvailableTests);
  const startOrResume = useMutation(api.submissions.startOrResume); // استخدام الدالة الجديدة

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  
  const [isStarting, setIsStarting] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false); // حالة جديدة للتحقق من الاكتمال

  const handleStartTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !selectedTestId) return;

    setIsStarting(true);
    setAlreadyCompleted(false);

    try {
      // إرسال البيانات للخادم والتحقق
      const result = await startOrResume({
        testId: selectedTestId as Id<"tests">,
        studentName: name,
        studentEmail: email.toLowerCase().trim(), // تنظيف الإيميل لضمان التطابق
      });

      if (result.status === "completed") {
        // إذا كان الاختبار مكتملاً مسبقاً، نظهر الرسالة التحذيرية
        setAlreadyCompleted(true);
        setIsStarting(false);
      } else {
        // إذا كان جديداً أو (قيد التقدم)، نوجهه لصفحة الاختبار فوراً
        router.push(`/test/${result.submissionId}`);
      }
    } catch (error) {
      console.error("Failed to start session:", error);
      alert("حدث خطأ أثناء بدء الاختبار. يرجى المحاولة مرة أخرى.");
      setIsStarting(false);
    }
  };

  // دالة لإعادة تعيين النموذج واختيار اختبار آخر
  const resetForm = () => {
    setAlreadyCompleted(false);
    setSelectedTestId(""); // تصفير الاختبار المختار فقط ليختار غيره
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-background text-foreground">
      <div className="w-full max-w-md bg-card text-card-foreground border border-border rounded-xl shadow-lg p-8">
        
        {/* إذا كان الطالب قد أكمل الاختبار مسبقاً، نعرض هذه الشاشة */}
        {alreadyCompleted ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              ✓
            </div>
            <h2 className="text-xl font-bold mb-2">لقد أكملت هذا الاختبار مسبقاً!</h2>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
              عذراً، لا يمكنك إعادة تقديم نفس الاختبار مرتين باستخدام نفس البريد الإلكتروني (<strong>{email}</strong>). لقد تم حفظ إجاباتك بنجاح مسبقاً.
            </p>
            <button
              onClick={resetForm}
              className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-md hover:bg-primary/90 transition-colors shadow-sm"
            >
              العودة واختيار اختبار آخر
            </button>
          </div>
        ) : (
          /* الشاشة الافتراضية للنموذج (Form) */
          <>
            <h1 className="text-2xl font-bold text-center mb-2">
              تجربة الإدراك السمعي
            </h1>
            <p className="text-muted-foreground text-center mb-6 text-sm">
              الرجاء إدخال بياناتك للبدء في التجربة.
            </p>

            <form onSubmit={handleStartTest} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">الاسم الكامل</label>
                <input
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-input border border-border text-accent-foreground rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="مثال: أحمد محمد" dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">البريد الإلكتروني</label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-input border border-border text-accent-foreground rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-ring text-left"
                  placeholder="student@example.com" dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">اختر الاختبار</label>
                <select
                  required value={selectedTestId} onChange={(e) => setSelectedTestId(e.target.value)}
                  className="w-full bg-input border border-border text-accent-foreground rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="" disabled>-- اختر الاختبار --</option>
                  {availableTests === undefined ? (
                    <option disabled>جاري تحميل الاختبارات...</option>
                  ) : (
                    availableTests.map((test) => (
                      <option key={test._id} value={test._id}>
                        {test.title || `${test.module} - ${test.taskType}`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <button
                type="submit"
                disabled={isStarting || !selectedTestId}
                className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isStarting ? "جاري التحقق والتحضير..." : "بدء التجربة"}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-border pt-4">
              <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                دخول المعلم / الإدارة
              </Link>
            </div>
          </>
        )}

      </div>
    </main>
  );
}