import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // 1. The Experiment Configuration (Uploaded by Admin)
  tests: defineTable({
    teacherId: v.string(),
    title: v.string(),         // <--- الحقل الجديد: عنوان الاختبار المخصص
    isPublished: v.boolean(),  // <--- الحقل الجديد: حالة النشر (متاح للطلاب أم مخفي)
    module: v.union(v.literal("Emphatic"), v.literal("Guttural")),
    taskType: v.union(
      v.literal("Identification"),
      v.literal("Same-Different"),
      v.literal("AXB")
    ),
    totalTrials: v.number(),
    breakDuration: v.number(),
    createdAt: v.number(),
  }).index("by_teacher", ["teacherId"]),

  // Add/Update this in convex/schema.ts
  trials: defineTable({
    testId: v.id("tests"),
    trialNumber: v.number(),
    // We change driveFileId to audioFiles to support 1, 2, or 3 sounds
    audioFiles: v.array(v.string()), 
    correctAnswer: v.string(),
    options: v.optional(v.array(v.string())),
    // Optional: Add metadata for research analysis
    pair: v.optional(v.string()), 
    vowel: v.optional(v.string()),
  }).index("by_test", ["testId"]),

  // 3. The Student's Testing Session (Created when they enter Name/Email)
  submissions: defineTable({
    testId: v.id("tests"),
    studentName: v.string(),
    studentEmail: v.string(),
    status: v.union(v.literal("in-progress"), v.literal("completed")),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_test", ["testId"])
    .index("by_email", ["studentEmail"]),

  // 4. The Granular Answers (Recorded instantly after every question)
  responses: defineTable({
    submissionId: v.id("submissions"),
    trialId: v.id("trials"),
    studentAnswer: v.string(),
    isCorrect: v.boolean(),
    responseTimeMs: v.number(), // Captured in milliseconds for precise analysis
  })
    .index("by_submission", ["submissionId"])
    .index("by_trial", ["trialId"]), // Useful for checking which questions students struggle with most
});