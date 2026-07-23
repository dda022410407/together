import type { AnalysisRecord } from "@/lib/analysis/types";

export const analysisTableName = "wrong_answer_analyses";
export const analysisImageBucketName = "wrong-answer-images";
export const analysisSettingsTableName = "user_analysis_settings";

export type AnalysisInsert = Omit<AnalysisRecord, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};
