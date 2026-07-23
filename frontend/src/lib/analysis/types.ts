export type InputSource = "direct" | "upload" | "database";

export type ReviewStatus = "pending" | "reviewing" | "done";

export type AnalysisRecord = {
  id: string;
  user_id?: string;
  source_type: InputSource;
  image_path?: string | null;
  image_url?: string | null;
  subject: string;
  unit: string;
  question_title: string;
  wrong_answer: string;
  correct_answer: string;
  explanation: string;
  pattern: string;
  confidence: number;
  review_direction: string;
  review_topics: string[];
  solution_steps: string[];
  solution_strategy: string;
  status: ReviewStatus;
  created_at: string;
};

export type AnalysisDraft = {
  source_type: InputSource;
  subject: string;
  unit: string;
  question_title: string;
  wrong_answer: string;
  correct_answer: string;
  explanation: string;
};
