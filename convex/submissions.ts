import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ==========================================
// STUDENT ACTIONS (Public/Guest Access)
// ==========================================

/**
 * Initiates a test session for a student.
 * If the student previously started but didn't finish (e.g., closed the tab),
 * this resumes their existing session to prevent duplicate entries.
 */
export const start = mutation({
  args: {
    testId: v.id("tests"),
    studentName: v.string(),
    studentEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Look for an existing "in-progress" session for this user and test
    const existingSession = await ctx.db
      .query("submissions")
      .withIndex("by_email", (q) => q.eq("studentEmail", args.studentEmail))
      .filter((q) => q.eq(q.field("testId"), args.testId))
      .filter((q) => q.eq(q.field("status"), "in-progress"))
      .first();

    if (existingSession) {
      return existingSession._id;
    }

    // 2. Create a new session if none exists
    return await ctx.db.insert("submissions", {
      testId: args.testId,
      studentName: args.studentName,
      studentEmail: args.studentEmail,
      status: "in-progress",
      startedAt: Date.now(),
    });
  },
});

/**
 * Marks a session as fully completed.
 * Triggered automatically when the student finishes the final task.
 */
export const complete = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.submissionId, { status: "completed",completedAt: Date.now()});
  },
});

// ==========================================
// TEACHER ACTIONS (Protected via Clerk)
// ==========================================

/**
 * Retrieves all completed submissions for a specific test.
 * Automatically calculates the score and average response time so the 
 * frontend doesn't have to process raw data.
 */
export const getDashboardResults = query({
  args: {
    testId: v.id("tests"),
  },
  handler: async (ctx, args) => {
    // 1. Verify Authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Please log in to view results.");
    }

    // 2. Verify Ownership
    const test = await ctx.db.get(args.testId);
    if (!test || test.teacherId !== identity.subject) {
      throw new Error("Unauthorized: You do not have permission to view this test.");
    }

    // 3. Fetch completed submissions
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .order("desc")
      .collect();

    // 4. Aggregate the granular responses for each submission
    const aggregatedResults = await Promise.all(
      submissions.map(async (submission) => {
        // Fetch every answer the student gave for this specific submission
        const answers = await ctx.db
          .query("responses")
          .withIndex("by_submission", (q) => q.eq("submissionId", submission._id))
          .collect();

        // Calculate Metrics
        const correctCount = answers.filter((a) => a.isCorrect).length;
        const totalResponseTimeMs = answers.reduce((acc, a) => acc + a.responseTimeMs, 0);
        const averageResponseTimeMs = answers.length > 0 
          ? Math.round(totalResponseTimeMs / answers.length) 
          : 0;

        return {
          id: submission._id,
          studentName: submission.studentName,
          studentEmail: submission.studentEmail,
          startedAt: submission.startedAt,
          completedAt: submission.completedAt,
          score: correctCount,
          totalQuestionsAnswered: answers.length,
          averageResponseTimeMs,
          // We can optionally return the raw answers here if the teacher 
          // wants to download a detailed CSV later
          detailedAnswers: answers, 
        };
      })
    );

    return aggregatedResults;
  },
});

// أضف هذا في نهاية ملف convex/submissions.ts
export const getById = query({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.submissionId);
  },
});


// دالة لبدء جلسة جديدة أو استئناف جلسة سابقة
export const startOrResume = mutation({
  args: {
    testId: v.id("tests"),
    studentName: v.string(),
    studentEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. البحث عن جلسة سابقة لنفس الطالب (بالبريد الإلكتروني) في نفس الاختبار
    const existingSession = await ctx.db
      .query("submissions")
      .filter((q) =>
        q.and(
          q.eq(q.field("testId"), args.testId),
          q.eq(q.field("studentEmail"), args.studentEmail)
        )
      )
      .first();

    // 2. إذا وجدت جلسة سابقة، نرجع حالتها (مكتملة أم قيد التقدم)
    if (existingSession) {
      return {
        submissionId: existingSession._id,
        status: existingSession.status, // "in-progress" أو "completed"
      };
    }

    // 3. إذا لم توجد جلسة، ننشئ واحدة جديدة
    const newSubmissionId = await ctx.db.insert("submissions", {
      testId: args.testId,
      studentName: args.studentName,
      studentEmail: args.studentEmail,
      status: "in-progress", // حالة البداية
      startedAt: Date.now(),
    });

    return {
      submissionId: newSubmissionId,
      status: "in-progress",
    };
  },
});

// Fetch all results for a specific test (Dashboard View)
// convex/submissions.ts
export const getTestResults = query({
  args: { testId: v.id("tests") },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test) throw new Error("Test not found");

    // USE INDEX
    const trials = await ctx.db
      .query("trials")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .collect();

    // USE INDEX
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .order("desc")
      .collect();

    const submissionsWithResponses = await Promise.all(
      submissions.map(async (sub) => {
        // USE INDEX
        const responses = await ctx.db
          .query("responses")
          .withIndex("by_submission", (q) => q.eq("submissionId", sub._id))
          .collect();

        return {
          ...sub,
          responses,
        };
      })
    );

    return {
      test: { ...test, trials }, 
      submissions: submissionsWithResponses,
    };
  },
});