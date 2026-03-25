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
  
  // 1. Unwrap Route Params
  const resolvedParams = use(params);
  const rawSubmissionId = resolvedParams.submissionId;

  // Safeguard: Prevent Convex error if the URL is /test/success
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

  // 3. Test Progress State
  const [currentIndex, setCurrentIndex] = useState<number>(-1); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 4. Audio Sequence State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isReadyToPlay, setIsReadyToPlay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAudioIndex, setActiveAudioIndex] = useState<number | null>(null);
  const [audioEndedAt, setAudioEndedAt] = useState<number | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  // 5. Break Time State
  const [isBreak, setIsBreak] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(0);

  // ------------------------------------------------------------------
  // A. Auto-Resume Logic
  // ------------------------------------------------------------------
  useEffect(() => {
    if (answersCount !== undefined && currentIndex === -1) {
      setCurrentIndex(answersCount);
    }
  }, [answersCount, currentIndex]);

  // Fallback if student enters an already completed test
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
  // C. Audio Preloader (Ensures the first file is ready)
  // ------------------------------------------------------------------
  const currentTrial = testData?.trials[currentIndex];

  useEffect(() => {
    if (currentTrial && audioRef.current && !isPlaying && currentTrial.audioFiles?.length > 0) {
      setIsReadyToPlay(false);
      const firstFile = currentTrial.audioFiles[0];
      const fileName = firstFile.endsWith('.wav') ? firstFile : `${firstFile}.wav`;
      const moduleFolder = testData?.module.toLowerCase();
      
      // Load the first audio file into the player to trigger onCanPlay
      audioRef.current.src = `/audio/${moduleFolder}/${fileName}`;
      audioRef.current.load();
    }
  }, [currentTrial, testData?.module, isPlaying]);

  // ------------------------------------------------------------------
  // D. Loading & Success Screens
  // ------------------------------------------------------------------
  if (isSuccessRoute || (currentIndex !== -1 && testData && currentIndex >= testData.trials.length)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-foreground">
        <div className="bg-card text-card-foreground p-8 rounded-xl shadow-lg border border-border text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✓</div>
          <h2 className="text-2xl font-bold text-primary mb-4">اكتمل الاختبار بنجاح!</h2>
          <p className="text-muted-foreground mb-8">شكراً لمشاركتك. تم حفظ جميع إجاباتك ووقت استجابتك بدقة في قاعدة البيانات.</p>
          <button onClick={() => router.push("/")} className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-md hover:bg-primary/90 transition-colors shadow-sm w-full">
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

  // ------------------------------------------------------------------
  // E. Sequence Player Logic (The Core Engine)
  // ------------------------------------------------------------------
  const playSequence = async () => {
    if (!audioRef.current || !isReadyToPlay || isPlaying || !currentTrial) return;

    setIsPlaying(true);
    setAudioError(null);
    setAudioEndedAt(null);

    const files = currentTrial.audioFiles;
    const moduleFolder = testData.module.toLowerCase();

    try {
      for (let i = 0; i < files.length; i++) {
        setActiveAudioIndex(i);
        
        const fileName = files[i].endsWith('.wav') ? files[i] : `${files[i]}.wav`;
        audioRef.current.src = `/audio/${moduleFolder}/${fileName}`;
        audioRef.current.load();

        await audioRef.current.play();

        // Wait for the current audio file to finish
        await new Promise<void>((resolve, reject) => {
          if (!audioRef.current) return reject();
          audioRef.current.onended = () => resolve();
          audioRef.current.onerror = () => reject(new Error(`تعذر العثور على: ${fileName}`));
        });

        // Inter-Stimulus Interval (ISI) - 500ms gap between sounds
        if (i < files.length - 1) {
          setActiveAudioIndex(null); 
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      // Sequence complete
      setIsPlaying(false);
      setActiveAudioIndex(null);
      setAudioEndedAt(Date.now()); // Start the reaction time clock exactly here

    } catch (err: any) {
      console.error("Sequence Playback Error:", err);
      setAudioError(err.message || "حدث خطأ أثناء تشغيل التتابع الصوتي.");
      setIsPlaying(false);
      setActiveAudioIndex(null);
      setAudioEndedAt(Date.now()); // Enable buttons as a fallback
    }
  };

  // ------------------------------------------------------------------
  // F. Answer Submission
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
      
      if (nextIndex === Math.floor(testData.trials.length / 2) && testData.breakDuration > 0) {
        setIsBreak(true);
        setBreakTimeLeft(testData.breakDuration);
      }

      setIsReadyToPlay(false); 
      setAudioEndedAt(null);
      setAudioError(null);
      setCurrentIndex(nextIndex);

    } catch (error) {
      console.error("Error saving answer:", error);
      alert("حدث خطأ أثناء حفظ الإجابة، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------------------------------
  // G. Render UI
  // ------------------------------------------------------------------
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

  const progressPercentage = (currentIndex / testData.trials.length) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center pt-20 p-6 bg-background text-foreground">
      <div className="w-full max-w-2xl">
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>التقدم</span>
            <span>{currentIndex + 1} من {testData.trials.length}</span>
          </div>
          <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progressPercentage}%` }} />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-lg p-8 text-center relative overflow-hidden min-h-[400px] flex flex-col justify-center">
          
          <h2 className="text-xl font-bold mb-6">استمع بعناية ثم اختر الإجابة الصحيحة</h2>
          
          {/* Hidden Audio Tag */}
          <audio 
            ref={audioRef} 
            preload="auto"
            onCanPlay={() => setIsReadyToPlay(true)} 
          />

          {audioError && (
            <div className="bg-destructive/10 text-destructive border border-destructive p-3 rounded-md mb-6 text-sm">
              {audioError}
            </div>
          )}

          {/* Sequence Indicators (Dots) */}
          {currentTrial && currentTrial.audioFiles.length > 1 && (
            <div className="flex justify-center gap-3 mb-6 h-4 items-center">
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

          {/* Play Button */}
          <div className="mb-10 flex flex-col items-center justify-center min-h-[140px]">
            {!isReadyToPlay && !audioError && audioEndedAt === null ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm text-muted-foreground font-medium">جاري تحضير المقطع...</p>
              </div>
            ) : (
              <>
                <button
                  onClick={playSequence}
                  disabled={isPlaying || audioEndedAt !== null}
                  className={`w-28 h-28 rounded-full flex flex-col items-center justify-center mx-auto transition-all shadow-md ${
                    isPlaying 
                      ? "bg-accent text-accent-foreground" 
                      : audioEndedAt 
                        ? "bg-secondary text-secondary-foreground cursor-not-allowed opacity-50"
                        : "bg-primary text-primary-foreground hover:scale-105 hover:shadow-lg"
                  }`}
                >
                  <span className="text-3xl">{isPlaying ? "⏳" : audioEndedAt ? "✓" : "▶"}</span>
                  {isPlaying && currentTrial && currentTrial.audioFiles.length > 1 && (
                    <span className="text-[11px] mt-1 font-bold">
                      {activeAudioIndex !== null ? `صوت ${activeAudioIndex + 1}` : "فصل..."}
                    </span>
                  )}
                </button>
                <p className="text-sm text-muted-foreground mt-4 h-5 font-medium">
                  {isPlaying ? "جاري التشغيل..." : audioEndedAt ? "حدد إجابتك الآن" : "جاهز! اضغط للتشغيل"}
                </p>
              </>
            )}
          </div>

          {/* Options Grid */}
          <div className={`grid gap-4 transition-opacity duration-300 ${!audioEndedAt ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
            {currentTrial?.options?.map((option, idx) => (
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