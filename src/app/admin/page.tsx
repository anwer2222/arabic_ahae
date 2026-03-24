"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Authenticated, AuthLoading } from "convex/react";
import Link from "next/link";
import ExcelUploader from "@/components/ExcelUploader";
import { Id } from "../../../convex/_generated/dataModel";

export default function AdminDashboardPage() {
  return (
    <>
      <AuthLoading>
        <div className="min-h-[50vh] flex items-center justify-center text-secondary-foreground animate-pulse">
          جاري التحقق من الصلاحيات والمزامنة...
        </div>
      </AuthLoading>
      <Authenticated>
        <DashboardContent />
      </Authenticated>
    </>
  );
}


function DashboardContent() {
  const tests = useQuery(api.tests.listTeacherTests);
  const togglePublishStatus = useMutation(api.tests.updatePublishStatus); // استدعاء الدالة الجديدة
  
  const [showUploader, setShowUploader] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null); // لتتبع حالة التحميل أثناء التحديث

  // دالة للتعامل مع تغيير حالة النشر
  const handleTogglePublish = async (testId: Id<"tests">, currentStatus: boolean | undefined) => {
    setUpdatingId(testId);
    try {
      // إذا كانت القيمة غير موجودة (للاختبارات القديمة)، نعتبرها false ونعكسها
      const newStatus = currentStatus === undefined ? true : !currentStatus;
      await togglePublishStatus({ testId, isPublished: newStatus });
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("حدث خطأ أثناء تحديث حالة الاختبار.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (tests === undefined || tests === null) {
    return <div className="text-muted-foreground animate-pulse">جاري تحميل البيانات...</div>;
  }

  return (
    <div className="space-y-8">
      {/* قسم الترحيب وزر الرفع (كما هو بدون تغيير) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 border border-border rounded-xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold mb-1 text-accent-foreground">مرحباً بك في لوحة التحكم</h2>
          <p className="text-muted-foreground">من هنا يمكنك إدارة اختباراتك ومتابعة نتائج الطلاب.</p>
        </div>
        
        <button 
          onClick={() => setShowUploader(!showUploader)}
          className={`${showUploader ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'} hover:opacity-90 px-6 py-2.5 rounded-lg font-semibold shadow-sm transition-colors flex items-center gap-2`}
        >
          <span>{showUploader ? '×' : '+'}</span>
          <span>{showUploader ? 'إلغاء الرفع' : 'رفع ملف Excel جديد'}</span>
        </button>
      </div>

      {showUploader && (
        <ExcelUploader onUploadSuccess={() => setShowUploader(false)} />
      )}

      {/* قائمة الاختبارات */}
      <div>
        <h3 className="text-xl font-bold mb-4">اختباراتك الحالية</h3>
        
        {tests.length === 0 ? (
          <div className="bg-card border border-border border-dashed p-12 text-center rounded-xl">
            <p className="text-muted-foreground mb-4">لم تقم برفع أي اختبارات حتى الآن.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div key={test._id} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col relative">
                
                {/* شريط الحالة العلوي (الوحدة والتاريخ) */}
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-secondary text-secondary-foreground text-xs font-bold px-2.5 py-1 rounded-md">
                    {test.module === "Emphatic" ? "مفخمة" : "حلقية"} - {test.taskType}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(test.createdAt).toLocaleDateString("ar-SA")}
                  </span>
                </div>
                
                {/* عنوان الاختبار (الجديد) */}
                <h4 className="text-lg font-bold mb-1 text-secondary-foreground">
                  {test.title || "اختبار بدون عنوان"}
                </h4>
                
                <p className="text-sm text-muted-foreground mb-4">
                  عدد المحاولات: {test.totalTrials} | وقت الراحة: {test.breakDuration} ثانية
                </p>

                {/* مفتاح تبديل حالة النشر (Toggle) */}
                <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg mb-6 border border-border">
                  <span className="text-sm font-semibold text-secondary-foreground">
                    {test.isPublished ? "متاح للطلاب" : "مخفي (مسودة)"}
                  </span> 
                  
                  <button
                    onClick={() => handleTogglePublish(test._id, test.isPublished)}
                    disabled={updatingId === test._id}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      test.isPublished ? 'bg-green-500' : 'bg-gray-300'
                    } ${updatingId === test._id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    dir="ltr"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        test.isPublished ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* زر عرض النتائج */}
                <div className="mt-auto border-t border-border pt-4">
                  <Link href={`/admin/results/${test._id}`} className="text-primary hover:text-primary/80 text-sm font-semibold flex items-center justify-center w-full">
                    عرض نتائج الطلاب
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}