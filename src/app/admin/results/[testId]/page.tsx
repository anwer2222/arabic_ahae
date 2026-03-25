"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import Link from "next/link";
import * as XLSX from "xlsx";

interface PageProps {
  params: Promise<{ testId: string }>;
}

export default function ResultsPage({ params }: PageProps) {
  // 1. Unwrap the Promise for Next.js 15 compatibility
  const resolvedParams = use(params);
  const testId = resolvedParams.testId as Id<"tests">;

  // 2. Fetch all data
  const data = useQuery(api.submissions.getTestResults, { testId });

  // 3. Loading State
  if (data === undefined) {
    return (
      <div className="min-h-screen p-8 bg-background flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl text-muted-foreground font-semibold">جاري تحميل النتائج...</p>
      </div>
    );
  }

  const { test, submissions } = data;

  // 4. Helper maps to quickly check correct answers and get trial details
  const trialsMap = new Map(test.trials.map((t) => [t._id, t]));
  const correctAnswersMap = new Map(test.trials.map((t) => [t._id, t.correctAnswer]));

  // 5. Calculate overall stats for each student
  const processedResults = submissions.map((sub) => {
    let correctCount = 0;
    let totalRt = 0;

    sub.responses.forEach((res) => {
      const isCorrect = res.studentAnswer === correctAnswersMap.get(res.trialId);
      if (isCorrect) correctCount++;
      totalRt += res.responseTimeMs;
    });

    const accuracy = test.trials.length > 0 
      ? Math.round((correctCount / test.trials.length) * 100) 
      : 0;
      
    const avgRt = sub.responses.length > 0 
      ? Math.round(totalRt / sub.responses.length) 
      : 0;

    return {
      ...sub,
      correctCount,
      accuracy,
      avgRt,
      answeredCount: sub.responses.length,
    };
  });

  

  // 6. Export OVERALL Results to Excel
  const exportOverallToExcel = () => {
    const exportData = processedResults.map((res) => ({
      "اسم الطالب": res.studentName,
      "البريد الإلكتروني": res.studentEmail,
      "حالة الاختبار": res.status === "completed" ? "مكتمل" : "قيد التقدم",
      "الأسئلة المجابة": `${res.answeredCount} / ${test.trials.length}`,
      "الإجابات الصحيحة": res.correctCount,
      "الدقة (%)": res.accuracy,
      "متوسط وقت الاستجابة (ms)": res.avgRt,
      "تاريخ البدء": new Date(res.startedAt).toLocaleString("ar-SA"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "General Results");
    
    XLSX.writeFile(workbook, `${test.title || "Test"}_General_Results.xlsx`);
  };

  // 7. NEW: Export INDIVIDUAL Student Results to Excel
  const exportIndividualData = (studentSubmission: typeof processedResults[0]) => {
    const exportData1 = studentSubmission.responses.map((res, index) => {
      const trial = trialsMap.get(res.trialId);
      const isCorrect = res.studentAnswer === trial?.correctAnswer;

      return {
        "رقم المحاولة": trial?.trialNumber || index + 1,
        "الملف الصوتي": trial?.audioFiles || "غير معروف",
        "إجابة الطالب": res.studentAnswer,
        "الإجابة الصحيحة": trial?.correctAnswer || "غير متوفر",
        "النتيجة": isCorrect ? "صحيحة (1)" : "خاطئة (0)",
        "وقت الاستجابة (ms)": res.responseTimeMs,
      };
    });

    // Inside exportIndividualData in ResultsPage
    const exportData = studentSubmission.responses.map((res) => {
        const trial = trialsMap.get(res.trialId);
        return {
        "رقم المحاولة": trial?.trialNumber,
        "الزوج اللغوي": trial?.pair,
        "الحركة (Vowel)": trial?.vowel,
        "الملفات الصوتية": trial?.audioFiles.join(" - "), // e.g. "emph_015.wav - emph_015.wav - emph_004.wav"
        "إجابة الطالب": res.studentAnswer,
        "الإجابة الصحيحة": trial?.correctAnswer,
        "النتيجة": res.studentAnswer === trial?.correctAnswer ? "1" : "0",
        "وقت الاستجابة (ms)": res.responseTimeMs,
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Data");
    
    // Clean student name for safe file naming
    const safeName = studentSubmission.studentName.replace(/[^a-z0-9\u0600-\u06FF]/gi, '_');
    XLSX.writeFile(workbook, `${safeName}_Detailed_Results.xlsx`);
  };
  

  // 8. Render UI
  return (
    <div className="min-h-screen bg-background p-6 lg:p-10 text-foreground" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link href="/admin" className="text-sm text-primary hover:underline mb-2 inline-block">
              &rarr; العودة للوحة التحكم
            </Link>
            <h1 className="text-3xl font-bold">{test.title || "اختبار بدون عنوان"}</h1>
            <p className="text-muted-foreground mt-1">
              {test.module === "Emphatic" ? "مفخمة" : "حلقية"} | {test.taskType} | عدد الأسئلة: {test.trials.length}
            </p>
          </div>
          
          <button 
            onClick={exportOverallToExcel}
            disabled={processedResults.length === 0}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-lg font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <span>📊</span> تصدير النتائج العامة
          </button>
        </div>

        {/* Results Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          {processedResults.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-lg text-muted-foreground">لم يقم أي طالب بإجراء هذا الاختبار حتى الآن.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-muted/50 border-b border-border text-sm">
                  <tr>
                    <th className="p-4 font-semibold text-accent-foreground">الطالب</th>
                    <th className="p-4 font-semibold text-accent-foreground">البريد الإلكتروني</th>
                    <th className="p-4 font-semibold text-accent-foreground">التقدم</th>
                    <th className="p-4 font-semibold text-accent-foreground">الدقة</th>
                    <th className="p-4 font-semibold text-accent-foreground">متوسط الاستجابة</th>
                    <th className="p-4 font-semibold text-accent-foreground text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {processedResults.map((res) => (
                    <tr key={res._id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-accent-foreground">{res.studentName}</div>
                        <div className="text-xs text-accent-foreground mt-1">
                          {res.status === "completed" ? "✅ مكتمل" : "⏳ قيد التقدم"}
                        </div>
                      </td>
                      <td className="p-4 text-accent-foreground text-sm" dir="ltr">{res.studentEmail}</td>
                      <td className="p-4 text-sm font-medium text-accent-foreground">
                        {res.answeredCount} / {test.trials.length}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-accent-foreground">{res.accuracy}%</span>
                          <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden hidden sm:block">
                            <div 
                              className={`h-full ${res.accuracy > 75 ? 'bg-green-500' : res.accuracy > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                              style={{ width: `${res.accuracy}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-sm text-accent-foreground">
                        {res.avgRt > 0 ? `${res.avgRt} ms` : "-"}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => exportIndividualData(res)}
                          disabled={res.answeredCount === 0}
                          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                          title="تحميل الإجابات المفصلة لهذا الطالب"
                        >
                          <span>📥</span> التفاصيل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}