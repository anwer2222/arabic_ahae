import { mutation, query } from "./_generated/server";
import { v } from "convex/values";




// ==========================================
// QUERIES (Reading Data)
// ==========================================


/**
 * Fetches all tests created by a specific teacher (for the Admin Dashboard).
 */
export const listTeacherTests = query({
    args: {},
    handler: async (ctx) => {
      const identity = await ctx.auth.getUserIdentity();
      
      // Instead of throwing an error, we return null. 
      // This gives the frontend time to catch up without crashing the app.
      if (!identity) {
        return null; 
      }
  
      return await ctx.db
        .query("tests")
        .withIndex("by_teacher", (q) => q.eq("teacherId", identity.subject))
        .order("desc")
        .collect();
    },
});

/**
 * Fetches the full details of a specific test, including all of its audio trials.
 * Called when a student begins an assessment.
 */
export const getTestWithTrials = query({
  args: { testId: v.id("tests") },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test) {
      throw new Error("Test not found");
    }

    const trials = await ctx.db
      .query("trials")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .collect();

    // Sort trials by their sequence number to ensure correct order
    trials.sort((a, b) => a.trialNumber - b.trialNumber);

    return {
      ...test,
      trials,
    };
  },
});

// ==========================================
// MUTATIONS (Writing Data)
// ==========================================

/**
 * Creates a new test and inserts all associated trials from the parsed Excel file.
 * Protected route: Only authenticated teachers can call this.
 */
// في ملف convex/tests.ts

// 1. تحديث دالة الإنشاء (Mutation)
export const createTestWithTrials = mutation({
    args: {
      title: v.string(),         // <--- استقبال العنوان
      isPublished: v.boolean(),  // <--- استقبال حالة النشر
      module: v.union(v.literal("Emphatic"), v.literal("Guttural")),
      taskType: v.union(
        v.literal("Identification"),
        v.literal("Same-Different"),
        v.literal("AXB")
      ),
      breakDuration: v.number(),
      gapTimeBefore: v.number(),
      gapTimeAfter: v.number(),
      trials: v.array(
        v.object({
          trialNumber: v.number(),
          audioFiles: v.array(v.string()),
          correctAnswer: v.string(),
          options: v.optional(v.array(v.string())),
          pair: v.string(),
          vowel: v.string(),
        })
      ),
    },
    handler: async (ctx, args) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Unauthorized");
  
      const testId = await ctx.db.insert("tests", {
        teacherId: identity.subject,
        title: args.title,             // <--- حفظ العنوان
        isPublished: args.isPublished, // <--- حفظ حالة النشر
        module: args.module,
        taskType: args.taskType,
        totalTrials: args.trials.length,
        breakDuration: args.breakDuration,
        gapTimeAfter: args.gapTimeAfter,
        gapTimeBefore: args.gapTimeBefore,
        createdAt: Date.now(),
      });
  
      await Promise.all(
        args.trials.map((trial) =>
          ctx.db.insert("trials", {
            testId,
            trialNumber: trial.trialNumber,
            audioFiles: trial.audioFiles,
            correctAnswer: trial.correctAnswer,
            options: trial.options,
            pair: trial.pair,
            vowel: trial.vowel,
          })
        )
      );
  
      return testId;
    },
});

// 2. تحديث دالة جلب الاختبارات للطلاب (Query)
export const listAvailableTests = query({
    args: {},
    handler: async (ctx) => {
        // نجلب فقط الاختبارات التي تم تفعيل خيار النشر لها
        return await ctx.db
        .query("tests")
        .filter((q) => q.eq(q.field("isPublished"), true)) // <--- فلترة الاختبارات المتاحة فقط
        .order("desc")
        .collect();
    },
});


export const updatePublishStatus = mutation({
    args: {
        testId: v.id("tests"),
        isPublished: v.boolean(),
    },
    handler: async (ctx, args) => {
        // 1. التحقق من تسجيل الدخول
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
        throw new Error("غير مصرح لك بالقيام بهذا الإجراء.");
        }

        // 2. التحقق من أن المعلم هو المالك الفعلي لهذا الاختبار
        const test = await ctx.db.get(args.testId);
        if (!test || test.teacherId !== identity.subject) {
        throw new Error("لا تملك صلاحية تعديل هذا الاختبار.");
        }

        // 3. تحديث حالة النشر
        await ctx.db.patch(args.testId, {
        isPublished: args.isPublished,
        });
    },
});