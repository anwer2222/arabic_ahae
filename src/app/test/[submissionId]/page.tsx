"use client";

import { useState, useRef, useEffect, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ submissionId: string }>;
}

export default function TestExecutionPage({ params }: PageProps) {
  const router = useRouter();
  
  const resolvedParams = use(params);
  const rawSubmissionId = resolvedParams.submissionId;

  // 1. الحماية المضافة: التحقق مما إذا كان الرابط هو success لمنع إرساله لقاعدة البيانات
  const isSuccessRoute = rawSubmissionId === "success";
  const submissionId = rawSubmissionId as Id<"submissions">;

  // 2. استخدام "skip" لتخطي الاستعلامات إذا كنا في مسار النهاية
  const submission = useQuery(api.submissions.getById, 
    isSuccessRoute ? "skip" : { submissionId }
  );
  const testData = useQuery(api.tests.getTestWithTrials, 
    isSuccessRoute || !submission ? "skip" : { testId: submission.testId }
  );
  const answersCount = useQuery(api.responses.getAnswersCount, 
    isSuccessRoute ? "skip" : { submissionId }
  );
  
  const saveAnswer = useMutation(api.responses.saveAnswer);
  const completeSession = useMutation(api.submissions.complete);

  const [currentIndex, setCurrentIndex] = useState<number>(-1); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isReadyToPlay, setIsReadyToPlay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEndedAt, setAudioEndedAt] = useState<number | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const [isBreak, setIsBreak] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(0);

  // ------------------------------------------------------------------
  // أ. تحديد نقطة بداية الاختبار (الاستئناف)
  // ------------------------------------------------------------------
  useEffect(() => {
    // إذا وصل عدد الإجابات من السيرفر، ولم نقم بتحديث المؤشر بعد
    if (answersCount !== undefined && currentIndex === -1) {
      setCurrentIndex(answersCount);
    }
  }, [answersCount, currentIndex]);

  // احتياطي: إذا دخل الطالب وكان قد أتم جميع الأسئلة بالفعل
  useEffect(() => {
    if (currentIndex !== -1 && testData && currentIndex >= testData.trials.length) {
      completeSession({ submissionId }).then(() => {
        router.replace("/test/success");
      });
    }
  }, [currentIndex, testData, router, completeSession, submissionId]);

  // ------------------------------------------------------------------
  // ب. منطق الاستراحة (Break Time)
  // ------------------------------------------------------------------
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isBreak && breakTimeLeft > 0) {
      timer = setTimeout(() => setBreakTimeLeft((prev) => prev - 1), 1000);
    } else if (isBreak && breakTimeLeft === 0) {
      setIsBreak(false);
    }
    return () => clearTimeout(timer);
  }, [isBreak, breakTimeLeft]);

  // ------------------------------------------------------------------
  // ج. شاشات التحميل (Loading States)
  // ------------------------------------------------------------------
  
  // ------------------------------------------------------------------
  // ج. شاشات التحميل (Loading States) وشاشة النجاح
  // ------------------------------------------------------------------

  // إذا كان الرابط هو success، نعرض شاشة النهاية فوراً وبدون أي استعلامات لقاعدة البيانات
  if (isSuccessRoute) {
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

  if (submission === undefined || testData === undefined || answersCount === undefined || currentIndex === -1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-xl font-semibold text-muted-foreground">جاري تحضير بيئة الاختبار واستعادة تقدمك...</div>
        </div>
      </div>
    );
  }

  const trials = testData.trials;
  const currentTrial = trials[currentIndex];
  const isFinished = currentIndex >= trials.length;

  // ------------------------------------------------------------------
  // د. بناء المسار المحلي للصوت
  // ------------------------------------------------------------------
  let audioLocalUrl = "";
  if (currentTrial) {
    const moduleFolder = testData.module.toLowerCase(); 
    const rawFileName = currentTrial.driveFileId.trim(); 
    const fileName = rawFileName.endsWith('.wav') ? rawFileName : `${rawFileName}.wav`;
    audioLocalUrl = `/audio/${moduleFolder}/${fileName}`;
  }

  // ------------------------------------------------------------------
  // هـ. التفاعل مع الصوت
  // ------------------------------------------------------------------
  const playAudio = async () => {
    if (audioRef.current && isReadyToPlay) {
      try {
        setAudioError(null);
        setIsPlaying(true);
        await audioRef.current.play();
      } catch (err) {
        console.error("Playback Error:", err);
        setIsPlaying(false);
        setAudioError("حدث خطأ أثناء تشغيل الملف.");
        setAudioEndedAt(Date.now());
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioEndedAt(Date.now()); 
  };

  const handleAudioError = () => {
    if (!currentTrial) return;
    console.error("Audio Load Error for Trial:", currentTrial._id, audioLocalUrl);
    setIsReadyToPlay(false);
    setIsPlaying(false);
    const fileName = audioLocalUrl ? audioLocalUrl.split('/').pop() : "غير معروف";
    setAudioError(`تعذر العثور على الملف الصوتي: ${fileName}`);
    setAudioEndedAt(Date.now()); 
  };

  // ------------------------------------------------------------------
  // و. التعامل مع الإجابات والانتقال
  // ------------------------------------------------------------------
  const handleAnswer = async (answer: string) => {
    if (isSubmitting || !audioEndedAt) return;
    setIsSubmitting(true);

    const responseTimeMs = Date.now() - audioEndedAt;

    try {
      await saveAnswer({
        submissionId,
        trialId: currentTrial._id,
        studentAnswer: answer,
        responseTimeMs,
      });

      const nextIndex = currentIndex + 1;
      
      // التوقف للراحة فقط إذا وصل الطالب لنصف الاختبار
      if (nextIndex === Math.floor(trials.length / 2) && testData.breakDuration > 0) {
        setIsBreak(true);
        setBreakTimeLeft(testData.breakDuration);
      }

      if (nextIndex < trials.length) {
        setIsReadyToPlay(false); 
        setAudioEndedAt(null);
        setAudioError(null);
        setCurrentIndex(nextIndex); // التحديث هنا محلي ليصبح الانتقال أسرع
      } else {
        await completeSession({ submissionId });
        router.replace("/test/success"); 
      }
    } catch (error) {
      console.error("Error saving answer:", error);
      alert("حدث خطأ أثناء حفظ الإجابة، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------------------------------
  // ز. واجهة المستخدم (UI)
  // ------------------------------------------------------------------

  if (isFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6 text-foreground">
        <div className="animate-pulse text-xl">جاري حفظ البيانات وإنهائها...</div>
      </div>
    );
  }

  if (isBreak) {
    const minutes = Math.floor(breakTimeLeft / 60);
    const seconds = breakTimeLeft % 60;
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-foreground">
        <div className="bg-card text-card-foreground p-8 rounded-xl shadow-lg border border-border text-center max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">وقت مستقطع لإراحة السمع</h2>
          <p className="text-muted-foreground mb-6">يرجى إراحة أذنيك لبضع ثوانٍ قبل المتابعة.</p>
          <div className="text-5xl font-mono text-primary font-bold mb-8" dir="ltr">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <p className="text-sm text-muted-foreground">سيُستأنف الاختبار تلقائياً...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = (currentIndex / trials.length) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center pt-20 p-6 bg-background text-foreground">
      <div className="w-full max-w-2xl">
        
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>التقدم</span>
            <span>{currentIndex + 1} من {trials.length}</span>
          </div>
          <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-lg p-8 text-center relative overflow-hidden min-h-[400px] flex flex-col justify-center">
          
          <h2 className="text-xl font-bold mb-6">استمع بعناية ثم اختر الإجابة الصحيحة</h2>
          
          {/* تشغيل المقطع من المجلد المحلي */}
          <audio 
            key={currentTrial._id} 
            ref={audioRef} 
            src={audioLocalUrl} 
            preload="auto"
            onCanPlay={() => setIsReadyToPlay(true)} 
            onEnded={handleAudioEnded}
            onError={handleAudioError}
          />

          {audioError && (
            <div className="bg-destructive/10 text-destructive border border-destructive p-3 rounded-md mb-6 text-sm">
              {audioError}
            </div>
          )}

          <div className="mb-10 flex flex-col items-center justify-center min-h-[120px]">
            {!isReadyToPlay && !audioError && audioEndedAt === null ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm text-muted-foreground font-medium">جاري تحضير المقطع...</p>
              </div>
            ) : (
              <>
                <button
                  onClick={playAudio}
                  disabled={isPlaying || audioEndedAt !== null}
                  className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto text-3xl transition-all shadow-md ${
                    isPlaying 
                      ? "bg-accent text-accent-foreground animate-pulse" 
                      : audioEndedAt 
                        ? "bg-secondary text-secondary-foreground cursor-not-allowed opacity-50"
                        : "bg-primary text-primary-foreground hover:scale-105 hover:shadow-lg"
                  }`}
                >
                  {isPlaying ? "🔊" : audioEndedAt ? "✓" : "▶"}
                </button>
                <p className="text-sm text-muted-foreground mt-4 h-5 font-medium">
                  {isPlaying ? "جاري التشغيل..." : audioEndedAt ? "حدد إجابتك الآن" : "جاهز! اضغط للتشغيل"}
                </p>
              </>
            )}
          </div>

          <div className={`grid gap-4 transition-opacity duration-300 ${!audioEndedAt ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
            {currentTrial.options?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                disabled={isSubmitting || !audioEndedAt}
                className="w-full bg-background border-2 border-border text-foreground text-xl py-4 rounded-lg hover:border-primary hover:bg-accent hover:text-accent-foreground transition-all disabled:opacity-50 font-semibold"
              >
                {option}
              </button>
            ))}
          </div>
          
        </div>
      </div>
    </div>
  );
}