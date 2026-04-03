"use client";

import { useState, useRef, useEffect, use, ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import StudentInstructions from "../../../components/StudentInstructions";

interface PageProps {
  params: Promise<{ submissionId: string }>;
}

export default function TestExecutionPage({ params }: PageProps) {
  const router = useRouter();
  
  // 1. Unwrap Route Params
  const resolvedParams = use(params);
  const rawSubmissionId = resolvedParams.submissionId;

  // Safeguard
  const isSuccessRoute = rawSubmissionId === "success";
  const submissionId = rawSubmissionId as Id<"submissions">;

  // 2. Database Queries
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

  // 3. States
  const [currentIndex, setCurrentIndex] = useState<number>(-1); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  
  // Audio Sequence State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isReadyToPlay, setIsReadyToPlay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAudioIndex, setActiveAudioIndex] = useState<number | null>(null);
  const [audioEndedAt, setAudioEndedAt] = useState<number | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Break Time State
  const [isBreak, setIsBreak] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(0);

  // ------------------------------------------------------------------
  // A. Auto-Resume Logic
  // ------------------------------------------------------------------
  useEffect(() => {
    if (answersCount !== undefined && currentIndex === -1) {
      setCurrentIndex(answersCount);
      if (answersCount > 0) {
        setShowInstructions(false);
      }
    }
  }, [answersCount, currentIndex]);

  useEffect(() => {
    if (currentIndex !== -1 && testData && currentIndex >= testData.trials.length) {
      completeSession({ submissionId }).then(() => {
        router.replace("/test/success");
      });
    }
  }, [currentIndex, testData, router, completeSession, submissionId]);

  // ------------------------------------------------------------------
  // B. Break Timer Logic
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
  // C. Dynamic Break Points Calculation
  // ------------------------------------------------------------------
  // Calculate when breaks should happen based on task type
  let breakPoints: number[] = [];
  let finalBreakPoint = Infinity;

  if (testData) {
    const total = testData.trials.length;
    if (testData.taskType === "AXB") {
      // 3 Breaks (4 parts)
      breakPoints = [Math.floor(total / 4), Math.floor(total / 2), Math.floor((total * 3) / 4)];
    } else if (testData.taskType === "Same-Different") {
      // 2 Breaks (3 parts)
      breakPoints = [Math.floor(total / 3), Math.floor((total * 2) / 3)];
    } else {
      // 1 Break (2 parts) for Identification
      breakPoints = [Math.floor(total / 2)];
    }
    
    // Clean up points (remove duplicates or 0 to handle very small tests safely)
    breakPoints = Array.from(new Set(breakPoints)).filter(p => p > 0 && p < total).sort((a, b) => a - b);
    
    // The point after which we apply the gapTimeAfter
    if (breakPoints.length > 0) {
      finalBreakPoint = breakPoints[breakPoints.length - 1];
    }
  }

  // ------------------------------------------------------------------
  // D. Audio Preloader
  // ------------------------------------------------------------------
  const currentTrial = testData?.trials[currentIndex];

  useEffect(() => {
    if (isBreak || showInstructions) return;

    if (currentTrial && audioRef.current && !isPlaying && currentTrial.audioFiles?.length > 0) {
      setIsReadyToPlay(false);
      const firstFile = currentTrial.audioFiles[0];
      const fileName = firstFile.endsWith('.wav') ? firstFile : `${firstFile}.wav`;
      const moduleFolder = testData?.module.toLowerCase();
      
      audioRef.current.src = `/audio/${moduleFolder}/${fileName}`;
      audioRef.current.load();
    }
  }, [currentTrial, testData?.module, isPlaying, isBreak, showInstructions]);

  // ------------------------------------------------------------------
  // E. Loading & Success & Instructions Screens
  // ------------------------------------------------------------------
  if (isSuccessRoute || (currentIndex !== -1 && testData && currentIndex >= testData.trials.length)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-foreground">
        <div className="bg-card text-card-foreground p-8 rounded-xl shadow-lg border border-border text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✓</div>
          <h2 className="text-2xl font-bold text-primary mb-4">اكتمل الاختبار بنجاح!</h2>
          <p className="text-muted-foreground mb-8">شكراً لمشاركتك. تم حفظ جميع إجاباتك بدقة.</p>
          <button onClick={() => router.push("/")} className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-md hover:bg-primary/90 w-full">
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

  if (showInstructions && currentIndex === 0 && answersCount === 0) {
    return (
      <StudentInstructions 
        taskType={testData.taskType} 
        module={testData.module} 
        onStart={() => setShowInstructions(false)} 
      />
    );
  }

  // ------------------------------------------------------------------
  // F. Sequence Player Logic
  // ------------------------------------------------------------------
  const playSequence = async () => {
    if (!audioRef.current || !isReadyToPlay || isPlaying || !currentTrial) return;

    setIsPlaying(true);
    setAudioError(null);
    setAudioEndedAt(null);

    const files = currentTrial.audioFiles;
    const moduleFolder = testData.module.toLowerCase();

    // NEW LOGIC: Use gapTimeAfter ONLY if we passed the final break point
    const currentGapTime = currentIndex >= finalBreakPoint 
      ? testData.gapTimeAfter 
      : testData.gapTimeBefore;

    try {
      for (let i = 0; i < files.length; i++) {
        setActiveAudioIndex(i);
        
        const fileName = files[i].endsWith('.wav') ? files[i] : `${files[i]}.wav`;
        audioRef.current.src = `/audio/${moduleFolder}/${fileName}`;
        audioRef.current.load();

        await audioRef.current.play();

        await new Promise<void>((resolve, reject) => {
          if (!audioRef.current) return reject();
          audioRef.current.onended = () => resolve();
          audioRef.current.onerror = () => reject(new Error(`تعذر العثور على: ${fileName}`));
        });

        // Apply Inter-Stimulus Interval (ISI)
        if (i < files.length - 1) {
          setActiveAudioIndex(null); 
          await new Promise((resolve) => setTimeout(resolve, currentGapTime));
        }
      }

      setIsPlaying(false);
      setActiveAudioIndex(null);
      setAudioEndedAt(Date.now()); 

    } catch (err: any) {
      console.error("Sequence Playback Error:", err);
      setAudioError(err.message || "حدث خطأ أثناء تشغيل التتابع.");
      setIsPlaying(false);
      setActiveAudioIndex(null);
      setAudioEndedAt(Date.now()); 
    }
  };

  // ------------------------------------------------------------------
  // G. Answer Submission
  // ------------------------------------------------------------------
  const handleAnswer = async (answer: string) => {
    if (isSubmitting || !audioEndedAt || !currentTrial) return;
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
      
      // NEW LOGIC: Check dynamically calculated break points
      if (breakPoints.includes(nextIndex) && testData.breakDuration > 0) {
        setIsBreak(true);
        setBreakTimeLeft(testData.breakDuration);
      }

      setIsReadyToPlay(false); 
      setAudioEndedAt(null);
      setAudioError(null);
      setCurrentIndex(nextIndex);

    } catch (error) {
      console.error("Error saving answer:", error);
      alert("حدث خطأ أثناء حفظ الإجابة، يرجى المحاولة.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------------------------------
  // H. Dynamic UI Helpers
  // ------------------------------------------------------------------
  const getDisplayContent = (option: string): ReactNode => {
    if (testData.taskType === "Same-Different") {
      if (option === "متماثل") return <span className="text-7xl">✓</span>;
      if (option === "مختلف") return <span className="text-7xl">✗</span>;
    }
    if (testData.taskType === "AXB") {
      if (option === "الأول") return <span className="font-mono font-black text-8xl">1</span>;
      if (option === "الثالث") return <span className="font-mono font-black text-8xl">3</span>;
    }
    return <span className="text-3xl font-bold">{option}</span>;
  };

  const getButtonDesignClasses = (option: string): string => {
    if (testData.taskType === "Same-Different") {
      return option === "متماثل"
        ? "bg-green-100 text-green-700 border-4 border-green-500 hover:bg-green-200"
        : "bg-red-100 text-red-700 border-4 border-red-500 hover:bg-red-200";
    }
    if (testData.taskType === "AXB") {
      return "bg-primary text-primary-foreground border-4 border-border";
    }
    return "bg-primary text-primary-foreground border-4 border-primary/50 hover:bg-primary/90";
  };

  // ------------------------------------------------------------------
  // I. Render UI
  // ------------------------------------------------------------------
  if (isBreak) {
    const minutes = Math.floor(breakTimeLeft / 60);
    const seconds = breakTimeLeft % 60;
    
    // Calculate which break we are currently in (e.g. 1 of 3)
    const currentBreakNumber = breakPoints.indexOf(currentIndex) + 1;
    const totalBreaks = breakPoints.length;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-foreground">
        <div className="bg-card text-card-foreground p-8 rounded-xl shadow-lg border border-border text-center max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-primary">استراحة قصيرة</h2>
          {totalBreaks > 1 && (
            <p className="text-sm font-semibold mb-2">
              (الاستراحة {currentBreakNumber} من أصل {totalBreaks})
            </p>
          )}
          <p className="text-muted-foreground mb-6">يرجى إراحة أذنيك لبضع ثوانٍ قبل المتابعة في الجزء التالي.</p>
          <div className="text-5xl font-mono text-primary font-bold mb-8" dir="ltr">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <p className="text-sm text-muted-foreground">سيُستأنف الاختبار تلقائياً...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = (currentIndex / testData.trials.length) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center pt-20 p-6 bg-background text-foreground">
      <div className="w-full max-w-3xl">
        
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>التقدم</span>
            <span>{currentIndex + 1} من {testData.trials.length}</span>
          </div>
          <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progressPercentage}%` }} />
          </div>
        </div>

        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-lg p-10 text-center relative overflow-hidden min-h-[450px] flex flex-col justify-center">
          
          <h2 className="text-xl font-bold mb-12">استمع بعناية ثم اختر الإجابة الصحيحة</h2>
          
          <audio ref={audioRef} preload="auto" onCanPlay={() => setIsReadyToPlay(true)} />

          {audioError && (
            <div className="bg-destructive/10 text-destructive border border-destructive p-3 rounded-md mb-6 text-sm">
              {audioError}
            </div>
          )}

          <div className="mb-14 flex flex-col items-center justify-center min-h-[120px]">
            {!isReadyToPlay && !audioError && audioEndedAt === null ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm text-muted-foreground font-medium">جاري تحضير المقطع...</p>
              </div>
            ) : (
              <div className="relative">
                {currentTrial && currentTrial.audioFiles.length > 1 && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex justify-center gap-3 h-4 items-center">
                    {currentTrial.audioFiles.map((_, idx) => (
                      <div 
                        key={idx}
                        className={`w-3 h-3 rounded-full transition-all duration-200 ${
                          activeAudioIndex === idx ? "bg-primary scale-150 shadow-md" : "bg-secondary"
                        }`}
                      />
                    ))}
                  </div>
                )}
                
                <button
                  onClick={playSequence}
                  disabled={isPlaying || audioEndedAt !== null}
                  className={`w-24 h-24 rounded-full flex flex-col items-center justify-center mx-auto transition-all shadow-md ${
                    isPlaying ? "bg-accent text-accent-foreground animate-pulse" 
                      : audioEndedAt ? "bg-secondary text-secondary-foreground cursor-not-allowed opacity-50"
                      : "bg-primary text-primary-foreground hover:scale-105 hover:shadow-lg"
                  }`}
                >
                  <span className="text-3xl">{isPlaying ? "⏳" : audioEndedAt ? "✓" : "▶"}</span>
                  {isPlaying && currentTrial && currentTrial.audioFiles.length > 1 && (
                    <span className="text-[11px] mt-1 font-bold">
                      {activeAudioIndex !== null ? `${activeAudioIndex + 1}` : "فصل"}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className={`transition-opacity duration-300 ${!audioEndedAt ? "pointer-events-none" : "opacity-100"}`}>
            <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-20">
              {currentTrial?.options?.map((option, idx) => {
                const designClasses = getButtonDesignClasses(option);
                const displayContent = getDisplayContent(option);

                let activeHighlight = "";
                if (testData.taskType === "AXB" && !audioEndedAt) {
                  if (option === "الأول" && activeAudioIndex === 0) activeHighlight = "ring-8 ring-primary/60 scale-110 opacity-100 shadow-2xl z-10";
                  else if (option === "الثالث" && activeAudioIndex === 2) activeHighlight = "ring-8 ring-primary/60 scale-110 opacity-100 shadow-2xl z-10";
                  else activeHighlight = "opacity-30 grayscale"; 
                } else if (!audioEndedAt) {
                  activeHighlight = "opacity-30";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(option)}
                    disabled={isSubmitting || !audioEndedAt}
                    className={`transition-all duration-300 ${designClasses} ${activeHighlight} w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-100 disabled:opacity-50`}
                    title={`اختيار ${option}`}
                  >
                    {displayContent}
                  </button>
                );
              })}
            </div>
            
            <p className="text-sm text-muted-foreground mt-12 font-medium">
              {!isReadyToPlay ? "جاري الاتصال..." : isPlaying ? "جاري التشغيل..." : audioEndedAt ? "حدد إجابتك الآن" : "جاهز! اضغط للتشغيل"}
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}