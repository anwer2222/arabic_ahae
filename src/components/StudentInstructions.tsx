"use client";

import { useState, useRef, ReactNode } from "react";

interface StudentInstructionsProps {
  taskType: string;
  module: string;
  onStart: () => void;
}

// ------------------------------------------------------------------
// HARDCODED PRACTICE DATA
// ------------------------------------------------------------------
const PRACTICE_TRIALS: Record<string, any[]> = {
  "Identification": [
    { audioFiles: ["prac_fab.wav"], options: ["ف", "ك"], correct: "ف" },
    { audioFiles: ["prac_fuub.wav"], options: ["ف", "ك"], correct: "ف" },
    { audioFiles: ["prac_kiib.wav"], options: ["ف", "ك"], correct: "ك" }
  ],
  "Same-Different": [
    { audioFiles: ["prac_kuub.wav", "prac_kuub.wav"], options: ["متماثلان", "مختلفان"], correct: "متماثلان" },
    { audioFiles: ["prac_fiib.wav", "prac_kiib.wav"], options: ["متماثلان", "مختلفان"], correct: "مختلفان" },
    { audioFiles: ["prac_fab.wav", "prac_fab.wav"], options: ["متماثلان", "مختلفان"], correct: "متماثلان" }
  ],
  "AXB": [
    { audioFiles: ["prac_kiib.wav", "prac_fiib.wav", "prac_fiib.wav"], options: ["1", "3"], correct: "3" },
    { audioFiles: ["prac_kuub.wav", "prac_kuub.wav", "prac_fuub.wav"], options: ["1", "3"], correct: "1" },
    { audioFiles: ["prac_fab.wav", "prac_fab.wav", "prac_kab.wav"], options: ["1", "3"], correct: "1" }
  ]
};

export default function StudentInstructions({ taskType, module, onStart }: StudentInstructionsProps) {
  // Practice State
  const [practiceStatus, setPracticeStatus] = useState<"idle" | "running" | "completed">("idle");
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  // Audio Player State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isReadyToPlay, setIsReadyToPlay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAudioIndex, setActiveAudioIndex] = useState<number | null>(null);
  const [audioEndedAt, setAudioEndedAt] = useState<number | null>(null);

  const currentPracticeTrials = PRACTICE_TRIALS[taskType] || PRACTICE_TRIALS["Identification"];
  const currentTrial = currentPracticeTrials[practiceIndex];

  // ------------------------------------------------------------------
  // Practice Player Logic (Bulletproof)
  // ------------------------------------------------------------------
  const playPracticeSequence = async () => {
    if (!audioRef.current || isPlaying) return;

    setIsPlaying(true);
    setAudioEndedAt(null);
    setFeedback(null);

    const files = currentTrial.audioFiles;
    const moduleFolder = "practice"//(module || "emphatic").toLowerCase();

    try {
      for (let i = 0; i < files.length; i++) {
        setActiveAudioIndex(i);
        
        const fileName = files[i].endsWith('.wav') ? files[i] : `${files[i]}.wav`;
        audioRef.current.src = `/audio/${moduleFolder}/${fileName}`;
        audioRef.current.load();

        await new Promise<void>((resolve, reject) => {
          if (!audioRef.current) return reject(new Error("المشغل غير متاح"));

          audioRef.current.onended = () => resolve();
          audioRef.current.onerror = () => reject(new Error(`الملف غير موجود: ${fileName}`));

          audioRef.current.play().catch((err) => {
            reject(new Error(`تعذر تشغيل (${fileName}). تأكد من وجوده في المجلد.`));
          });
        });

        if (i < files.length - 1) {
          setActiveAudioIndex(null); 
          await new Promise((resolve) => setTimeout(resolve, 600)); // 600ms practice gap
        }
      }

      setIsPlaying(false);
      setActiveAudioIndex(null);
      setAudioEndedAt(Date.now()); 

    } catch (err: any) {
      console.error("Practice Playback Error:", err);
      alert(err.message);
      setIsPlaying(false);
      setActiveAudioIndex(null);
      setAudioEndedAt(Date.now()); 
    }
  };

  const handlePracticeAnswer = (answer: string) => {
    if (feedback !== null || !audioEndedAt) return;

    const isCorrect = answer === currentTrial.correct;
    setFeedback(isCorrect ? "correct" : "wrong");

    setTimeout(() => {
      setFeedback(null);
      if (practiceIndex < currentPracticeTrials.length - 1) {
        setPracticeIndex(prev => prev + 1);
        setAudioEndedAt(null);
        setIsReadyToPlay(false);
      } else {
        setPracticeStatus("completed");
        setPracticeIndex(0);
      }
    }, 1500);
  };

  // ------------------------------------------------------------------
  // UI Helpers (For Practice Buttons)
  // ------------------------------------------------------------------
  const getDisplayContent = (option: string): ReactNode => {
    if (taskType === "Same-Different") {
      if (option === "متماثل") return <span className="text-7xl">✓</span>;
      if (option === "مختلفان") return <span className="text-7xl">✗</span>;
    }
    if (taskType === "AXB") {
      if (option === "الأول") return <span className="font-mono font-black text-8xl">1</span>;
      if (option === "الثالث") return <span className="font-mono font-black text-8xl">3</span>;
    }
    return <span className="text-3xl font-bold">{option}</span>;
  };

  const getButtonDesignClasses = (option: string): string => {
    if (taskType === "Same-Different") {
      return option === "متماثل"
        ? "bg-green-100 text-green-700 border-4 border-green-500"
        : "bg-red-100 text-red-700 border-4 border-red-500";
    }
    if (taskType === "AXB") {
      return "bg-primary text-primary-foreground border-4 border-border";
    }
    return "bg-primary text-primary-foreground border-4 border-primary/50";
  };

  // ------------------------------------------------------------------
  // Render: Practice Test Mode (Running)
  // ------------------------------------------------------------------
  if (practiceStatus === "running") {
    return (
      <div className="min-h-screen flex flex-col items-center pt-20 p-6 bg-background text-foreground" dir="rtl">
        <div className="w-full max-w-3xl">
          <div className="mb-8 flex justify-between text-sm font-bold text-primary">
            <span>وضع التدريب (لن يتم حساب درجاتك)</span>
            <span>{practiceIndex + 1} / {currentPracticeTrials.length}</span>
          </div>

          <div className="bg-card text-card-foreground border-4 border-dashed border-primary/40 rounded-xl shadow-lg p-10 text-center relative min-h-[450px] flex flex-col justify-center">
            
            <h2 className="text-xl font-bold mb-12 text-muted-foreground">تدريب: استمع ثم اختر الإجابة</h2>
            
            <audio ref={audioRef} onCanPlay={() => setIsReadyToPlay(true)} />

            {/* Play Button & Feedback Area */}
            <div className="mb-14 flex flex-col items-center justify-center min-h-[120px]">
              {feedback ? (
                <div className={`text-3xl font-black p-6 rounded-xl animate-in zoom-in duration-300 ${
                  feedback === "correct" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {feedback === "correct" ? "إجابة صحيحة! 👏" : "إجابة خاطئة! ❌"}
                </div>
              ) : (
                <div className="relative">
                  {currentTrial.audioFiles.length > 1 && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-3 h-4 items-center">
                      {currentTrial.audioFiles.map((_:any, idx:number) => (
                        <div key={idx} className={`w-3 h-3 rounded-full transition-all duration-200 ${
                            activeAudioIndex === idx ? "bg-primary scale-150" : "bg-secondary"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  
                  <button
                    onClick={playPracticeSequence}
                    disabled={isPlaying || audioEndedAt !== null}
                    className={`w-24 h-24 rounded-full flex flex-col items-center justify-center mx-auto transition-all shadow-md ${
                      isPlaying ? "bg-accent text-accent-foreground animate-pulse" 
                        : audioEndedAt ? "bg-secondary text-secondary-foreground cursor-not-allowed opacity-50"
                        : "bg-primary text-primary-foreground hover:scale-105"
                    }`}
                  >
                    <span className="text-3xl">{isPlaying ? "⏳" : audioEndedAt ? "✓" : "▶"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Options */}
            <div className={`transition-opacity duration-300 ${!audioEndedAt || feedback !== null ? "pointer-events-none" : "opacity-100"}`}>
              <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-20">
                {currentTrial.options.map((option: string, idx: number) => {
                  let activeHighlight = "";
                  if (taskType === "AXB" && !audioEndedAt) {
                    if (option === "الأول" && activeAudioIndex === 0) activeHighlight = "ring-8 ring-primary/60 scale-110 opacity-100 z-10";
                    else if (option === "الثالث" && activeAudioIndex === 2) activeHighlight = "ring-8 ring-primary/60 scale-110 opacity-100 z-10";
                    else activeHighlight = "opacity-30 grayscale"; 
                  } else if (!audioEndedAt) {
                    activeHighlight = "opacity-30";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handlePracticeAnswer(option)}
                      className={`transition-all duration-300 ${getButtonDesignClasses(option)} ${activeHighlight} w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center shadow-xl hover:scale-110 disabled:opacity-50`}
                    >
                      {getDisplayContent(option)}
                    </button>
                  );
                })}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Render: Static Instructions Screen (Idle or Completed)
  // ------------------------------------------------------------------

  // Helper to render the specific instruction text and visual examples
  const renderInstructionContent = () => {
    switch (taskType) {
      case "Same-Different":
        return (
          <>
            <h2 className="text-3xl font-bold text-primary mb-6">تعليمات اختبار التمييز (التماثل والاختلاف)</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              في هذا الاختبار، ستستمع إلى <strong>كلمتين متتاليين</strong> بينهما فاصل زمني قصير.<br/>
              ستكون مهمتك تحديد ما إذا كانت الكلمتين <strong>متماثلتين</strong> أم <strong>مختلفتين</strong> بناء على الصوت الأول.
            </p>
            <div className="flex justify-center gap-12 mb-10">
              <div className="flex flex-col items-center gap-4">
                <div className="w-28 h-28 rounded-full bg-green-100 text-green-700 border-4 border-green-500 flex items-center justify-center text-6xl shadow-md">✓</div>
                <span className="font-semibold text-accent-foreground">إذا كانتا متماثلتين</span>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="w-28 h-28 rounded-full bg-red-100 text-red-700 border-4 border-red-500 flex items-center justify-center text-6xl shadow-md">✗</div>
                <span className="font-semibold text-accent-foreground">إذا كانتا مختلفتين</span>
              </div>
            </div>
          </>
        );

      case "AXB":
        return (
          <>
            <h2 className="text-3xl font-bold text-primary mb-6">تعليمات اختبار المقارنة (AXB)</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              في هذا الاختبار، سوف تستمع إلى <strong>ثلاث كلمات متتالية</strong>.<br/>
              ستكون الكلمة <strong>الثانية</strong> مطابقة تماما إم للكلمة الأولى أو الكلمة الثالثة.<br/>
              ستكون مهمتك تحديد أي من الكلمتين تتطابق الكلمة الوسطى.
            </p>
            <div className="flex justify-center gap-12 mb-10">
              <div className="flex flex-col items-center gap-4">
                <div className="w-28 h-28 rounded-full bg-primary text-primary-foreground border-4 border-border flex items-center justify-center text-6xl font-mono font-black shadow-md">1</div>
                <span className="font-semibold text-accent-foreground text-center">إذا كانت الوسطى<br/>تطابق الأولى</span>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="w-28 h-28 rounded-full bg-primary text-primary-foreground border-4 border-border flex items-center justify-center text-6xl font-mono font-black shadow-md">3</div>
                <span className="font-semibold text-accent-foreground text-center">إذا كانت الوسطى<br/>تطابق الثالثة</span>
              </div>
            </div>
          </>
        );

      default: // Identification
        return (
          <>
            <h2 className="text-3xl font-bold text-primary mb-6">تعليمات اختبار التعرف</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              في هذا الاختبار سوف تستمع إلى <strong>كلمة واحدة</strong> في كل سؤال.<br/>
             ستكون مهمتك الاستماع بتركيز كامل، ثم تحدد الصوت الذي تبدأ به الكلمة من بين الخيارين الظاهري.
            </p>
            <div className="flex justify-center gap-12 mb-10">
              <div className="w-28 h-28 rounded-full bg-primary text-primary-foreground border-4 border-primary/50 flex items-center justify-center text-3xl font-bold shadow-md">أ</div>
              <div className="w-28 h-28 rounded-full bg-primary text-primary-foreground border-4 border-primary/50 flex items-center justify-center text-3xl font-bold shadow-md">ب</div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-foreground" dir="rtl">
      <div className="w-full max-w-2xl bg-card text-card-foreground border border-border rounded-xl shadow-xl p-10 text-center relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>

        {/* Dynamic Instructional Content with Visuals */}
        {renderInstructionContent()}

        {/* Reminder Box */}
        <div className="bg-muted/50 p-4 rounded-lg mb-8 border border-border">
             {practiceStatus === "idle" 
                 ? <p className="text-sm font-semibold text-secondary-foreground">💡 يجب عليك إكمال التدريب القصير أولاً قبل أن تتمكن من بدء الاختبار الفعلي.</p>
                 : <p className="text-sm font-semibold text-secondary-foreground">💡 ملاحظة هامة: في الاختبار الفعلي، يرجى الإجابة <strong>بأسرع ما يمكن وبدقة</strong> . سيتم حساب وقت استجابتك.</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {practiceStatus === "idle" && (
            <button
              onClick={() => setPracticeStatus("running")}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-8 py-3 rounded-full font-bold text-lg shadow-sm transition-transform hover:scale-105"
            >
              🎧 بدء التدريب المبدئي
            </button>
          )}

          {practiceStatus === "completed" && (
            <div className="flex flex-col items-center gap-4 w-full">
              <span className="text-green-600 font-bold flex items-center gap-2">
                <span>✅</span> اكتمل التدريب بنجاح، أنت جاهز!
              </span>
              <button
                onClick={onStart}
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-4 rounded-full font-bold text-xl shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                بدء الاختبار الفعلي
              </button>
            </div>
          )}

          {practiceStatus === "idle" && (
            <button disabled className="bg-muted text-muted-foreground px-8 py-3 rounded-full font-bold text-lg cursor-not-allowed opacity-50">
              بدء الاختبار الفعلي (مغلق)
            </button>
          )}
        </div>

      </div>
    </div>
  );
}