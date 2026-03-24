"use client";

import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-foreground">
      <div className="bg-card text-card-foreground p-8 rounded-xl shadow-lg border border-border text-center max-w-md w-full">
        
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
          ✓
        </div>
        
        <h2 className="text-2xl font-bold text-primary mb-4">اكتمل الاختبار بنجاح!</h2>
        <p className="text-muted-foreground mb-8">
          شكراً لمشاركتك. تم حفظ جميع إجاباتك ووقت استجابتك بدقة في قاعدة البيانات.
        </p>
        
        <button 
          onClick={() => router.push("/")} 
          className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-md hover:bg-primary/90 transition-colors shadow-sm w-full"
        >
          العودة للصفحة الرئيسية
        </button>
      </div>
    </div>
  );
}