"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function ExcelUploader({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const createTest = useMutation(api.tests.createTestWithTrials);

  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  
  // إعدادات الاختبار
  const [title, setTitle] = useState("");
  const [selectedSheet, setSelectedSheet] = useState("");
  const [module, setModule] = useState<"Emphatic" | "Guttural">("Emphatic");
  const [taskType, setTaskType] = useState<"Identification" | "Same-Different" | "AXB">("Identification");
  const [breakDuration, setBreakDuration] = useState(120);
  const [gapTimeBefore, setGapTimeBefore] = useState(800);
  const [gapTimeAfter, setGapTimeAfter] = useState(400);
  const [isPublished, setIsPublished] = useState(true);

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  // قراءة ملف الإكسل عند اختياره
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError("");

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        setSelectedSheet(wb.SheetNames[0]);
      } catch (err) {
        setError("فشل في قراءة ملف الإكسل. تأكد من أنه بصيغة .xlsx صالحة.");
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // معالجة البيانات ورفعها لقاعدة البيانات
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workbook || !selectedSheet) {
      setError("الرجاء تعبئة جميع الحقول المطلوبة (الملف وورقة العمل).");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      // 1. قراءة البيانات من الورقة المحددة
      const worksheet = workbook.Sheets[selectedSheet];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (jsonData.length === 0) throw new Error("ورقة العمل المحددة فارغة.");

      // 2. تجهيز الأسئلة (Trials) باستخدام اسم الملف مباشرة
      const trials1 = jsonData.map((row, index) => {
        // البحث عن اسم الملف في الأعمدة الشائعة في الإكسل
        const fileName = String(row["Audio File Name"] || row["Audio"] || row["File"] || "").trim();
        
        const optionsStr = String(row["Options"] || row["Choices"] || "");
        const options = optionsStr ? optionsStr.split(",").map(s => s.trim()) : [];

        return {
          trialNumber: Number(row["Trial"] || row["Question"] || index + 1),
          driveFileId: fileName, // نمرر اسم الملف مباشرة (مثل emp_001.wav)
          correctAnswer: String(row["Answer"] || row["Correct"] || "").trim(),
          options: options.length > 0 ? options : undefined,
        };
      });

      // Inside handleSubmit in ExcelUploader.tsx
      const trials = jsonData.map((row, index) => {
        let audioFiles: string[] = [];
        const optionsStr = String(row["Options"] || row["Choices"] || "");
        let options: string[] = optionsStr ? optionsStr.split(",").map(s => s.trim()) : [];
    
        if (taskType === "Identification") {
        audioFiles = [String(row["Audio File Name"] || row["Audio"] || "").trim()];
        } else if (taskType === "Same-Different") {
            audioFiles = [
                String(row["Audio 1"] || "").trim(),
                String(row["Audio 2"] || "").trim()
            ];
            options = ["متماثل", "مختلف"] 
        } else if (taskType === "AXB") {
            audioFiles = [
                String(row["Audio A"] || "").trim(),
                String(row["Audio X"] || "").trim(),
                String(row["Audio B"] || "").trim()
            ];
            options = ["الأول", "الثالث"]
        }
    
        return {
        trialNumber: index + 1,
        audioFiles, // Save as array
        correctAnswer: String(row["Correct"] || row["Answer"] || "").trim(),
        options: options,
        // Additional research metadata
        pair: String(row["Pair"] || ""),
        vowel: String(row["Vowel"] || ""),
        };
      });

      // 3. حفظ الاختبار والأسئلة في Convex
      await createTest({
        title: title || `${module} - ${taskType}`,
        isPublished,
        module,
        taskType,
        breakDuration,
        gapTimeBefore,
        gapTimeAfter,
        trials,
      });

      alert("تم رفع الاختبار بنجاح!");
      onUploadSuccess(); // إغلاق نافذة الرفع وتحديث القائمة

    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ أثناء معالجة البيانات.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm mb-8">
      <h3 className="text-xl font-bold mb-4 text-accent-foreground">إنشاء اختبار جديد</h3>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* الصف الأول: العنوان والملف */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-accent-foreground">عنوان الاختبار</label>
            <input 
              type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-border p-2.5 rounded-md bg-input focus:ring-2 focus:ring-primary focus:outline-none text-accent-foreground"
              placeholder="مثال: أصوات حلقية - المجموعة A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-accent-foreground">ملف الإكسل (.xlsx)</label>
            <input 
              type="file" accept=".xlsx, .xls" onChange={handleFileChange} required
              className="w-full border border-border p-2 rounded-md bg-input file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors cursor-pointer"
            />
          </div>
        </div>

        {/* إعدادات الاختبار تظهر بعد اختيار الملف */}
        {sheetNames.length > 0 && (
          <div className="space-y-4 border-t border-border pt-5 mt-2">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-accent-foreground">اختر ورقة العمل (Sheet)</label>
                <select 
                  value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)}
                  className="w-full border border-border p-2.5 rounded-md bg-input text-accent-foreground"
                >
                  {sheetNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>

              {/* مفتاح تبديل حالة النشر (Toggle) */}
              <div>
                <label className="block text-sm font-medium mb-1 text-accent-foreground"> حالة الاختبار (Test Status)</label>
                <div className="flex items-center justify-between bg-muted/30 p-3.5 rounded-md mb-4 h-9 border border-border">
                  <strong className={isPublished ? "text-green-600" : "text-muted-foreground"}>
                      {isPublished ? "متاح للطلاب (منشور)" : "مخفي (مسودة)"}
                    </strong>
                  
                  <button
                    type="button" // هذا السطر هو السحر الذي يمنع إرسال النموذج (Form Submit)
                    onClick={() => setIsPublished(!isPublished)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background cursor-pointer ${
                      isPublished ? 'bg-green-500' : 'bg-secondary'
                    }`}
                    dir="ltr"
                    aria-pressed={isPublished}
                    >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm ${
                        isPublished ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-accent-foreground">الوحدة (Module)</label>
                <select 
                  value={module} onChange={(e) => setModule(e.target.value as any)}
                  className="w-full border border-border p-2.5 rounded-md bg-input text-accent-foreground"
                >
                  <option value="Emphatic">مفخمة (Emphatic)</option>
                  <option value="Guttural">حلقية (Guttural)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-accent-foreground">نوع المهمة (Task Type)</label>
                <select 
                  value={taskType} onChange={(e) => setTaskType(e.target.value as any)}
                  className="w-full border border-border p-2.5 rounded-md bg-input text-accent-foreground"
                >
                  <option value="Identification">تحديد (Identification)</option>
                  <option value="Same-Different">تطابق واختلاف (Same-Different)</option>
                  <option value="AXB">مقارنة (AXB)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-accent-foreground">وقت الراحة (بالثواني)</label>
                <input 
                  type="number" min="0" value={breakDuration} onChange={(e) => setBreakDuration(Number(e.target.value))}
                  className="w-full border border-border p-2.5 rounded-md bg-input text-accent-foreground"
                  title="الوقت المستقطع بعد منتصف الاختبار (ضع 0 لإلغائه)"
                />
              </div>

              {/* New Row for ISI (Gap Times) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-accent-foreground">وقت الفصل قبل الاستراحة (ms)</label>
                <input 
                  type="number" min="0" step="50" 
                  value={gapTimeBefore} onChange={(e) => setGapTimeBefore(Number(e.target.value))}
                  className="w-full border border-border p-2.5 rounded-md bg-input text-accent-foreground"
                  title="الفاصل الزمني بين الأصوات في النصف الأول من الاختبار (بالميلي ثانية)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-accent-foreground">وقت الفصل بعد الاستراحة (ms)</label>
                <input 
                  type="number" min="0" step="50" 
                  value={gapTimeAfter} onChange={(e) => setGapTimeAfter(Number(e.target.value))}
                  className="w-full border border-border p-2.5 rounded-md bg-input text-accent-foreground"
                  title="الفاصل الزمني بين الأصوات في النصف الثاني من الاختبار (بالميلي ثانية)"
                />
              </div>
            </div>
            </div>

            {/* زر الحفظ */}
            {error && <p className="text-destructive text-sm font-semibold">{error}</p>}
            <button 
              type="submit" disabled={isUploading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-bold w-full disabled:opacity-50 transition-colors shadow-sm mt-4"
            >
              {isUploading ? "جاري معالجة البيانات والرفع..." : "حفظ وإنشاء الاختبار"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}