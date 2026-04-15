import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveAnswer = mutation({
  args: {
    submissionId: v.id("submissions"),
    trialId: v.id("trials"),
    studentAnswer: v.string(),
    responseTimeMs: v.number(),
  },
  handler: async (ctx, args) => {
    const trial = await ctx.db.get(args.trialId);
    if (!trial) throw new Error("Trial not found");

    const isCorrect = trial.correctAnswer === args.studentAnswer;

    return await ctx.db.insert("responses", {
      submissionId: args.submissionId,
      trialId: args.trialId,
      studentAnswer: args.studentAnswer,
      isCorrect,
      responseTimeMs: args.responseTimeMs,
    });
  },
});

// دالة جديدة لحساب عدد الإجابات المسجلة لجلسة معينة
// convex/responses.ts
export const getAnswersCount = query({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const answers = await ctx.db
      .query("responses")
      // USE INDEX INSTEAD OF FILTER
      .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
      .collect();
      
    return answers.length;
  },
})