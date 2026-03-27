"use client";

interface StudentInstructionsProps {
  taskType: string;
  onStart: () => void;
}

export default function StudentInstructions({ taskType, onStart }: StudentInstructionsProps) {
  
  const renderInstructions = () => {
    switch (taskType) {
      case "Same-Different":
        return (
          <>
            <h2 className="text-3xl font-bold text-primary mb-6">تعليمات اختبار التطابق والاختلاف</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              في هذا الاختبار، ستستمع إلى <strong>صوتين متتاليين</strong> بينهما فاصل زمني قصير.
              مهمتك هي تحديد ما إذا كان هذان الصوتان <strong>متماثلين</strong> أم <strong>مختلفين</strong>.
            </p>
            
            <div className="flex justify-center gap-12 mb-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full bg-green-100 text-green-700 border-4 border-green-500 flex items-center justify-center text-5xl shadow-md">✓</div>
                <span className="font-semibold text-accent-foreground">إذا كانا متماثلين</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full bg-red-100 text-red-700 border-4 border-red-500 flex items-center justify-center text-5xl shadow-md">✗</div>
                <span className="font-semibold text-accent-foreground">إذا كانا مختلفين</span>
              </div>
            </div>
          </>
        );

      case "AXB":
        return (
          <>
            <h2 className="text-3xl font-bold text-primary mb-6">تعليمات اختبار المقارنة (AXB)</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              في هذا الاختبار، ستستمع إلى <strong>ثلاثة أصوات متتالية</strong> (الأول، ثم الأوسط، ثم الثالث).<br/><br/>
              الصوت <strong>الأوسط</strong> سيكون مطابقاً تماماً إما للصوت <strong>الأول</strong> أو <strong>الثالث</strong>. 
              مهمتك هي تحديد أي منهما يطابق الصوت الأوسط.
            </p>

            <div className="flex justify-center gap-12 mb-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground border-4 border-border flex items-center justify-center text-5xl font-mono font-black shadow-md">1</div>
                <span className="font-semibold text-center text-accent-foreground">إذا كان الأوسط<br/>يطابق الأول</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground border-4 border-border flex items-center justify-center text-5xl font-mono font-black shadow-md">3</div>
                <span className="font-semibold text-accent-foreground text-center">إذا كان الأوسط<br/>يطابق الثالث</span>
              </div>
            </div>
          </>
        );

      default: // Identification
        return (
          <>
            <h2 className="text-3xl font-bold text-primary mb-6">تعليمات اختبار التحديد</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              في هذا الاختبار، ستستمع إلى <strong>صوت واحد</strong> في كل محاولة.
              مهمتك هي الاستماع بعناية، ثم اختيار الكلمة أو الحرف الذي يعبر عن الصوت الذي سمعته من بين الخيارات المتاحة.
            </p>

            <div className="flex justify-center gap-8 mb-10">
              <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground border-4 border-primary/50 flex items-center justify-center text-2xl font-bold shadow-md">خيار أ</div>
              <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground border-4 border-primary/50 flex items-center justify-center text-2xl font-bold shadow-md">خيار ب</div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-foreground" dir="rtl">
      <div className="w-full max-w-2xl bg-card text-card-foreground border border-border rounded-xl shadow-xl p-10 text-center relative overflow-hidden">
        
        {/* Decorative top border */}
        <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>

        {renderInstructions()}

        <div className="bg-muted/50 p-4 rounded-lg mb-8 border border-border">
          <p className="text-sm font-semibold text-secondary-foreground">
            💡 ملاحظة هامة: يرجى الإجابة <strong>بأسرع ما يمكن وبأكبر قدر من الدقة</strong>. سيتم حساب وقت استجابتك.
          </p>
        </div>

        <button
          onClick={onStart}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-4 rounded-full font-bold text-xl shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          فهمت التعليمات، ابدأ الاختبار
        </button>

      </div>
    </div>
  );
}