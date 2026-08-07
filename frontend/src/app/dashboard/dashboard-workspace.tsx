"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { classifyWrongAnswer } from "@/lib/analysis/classifier";
import { sampleAnalyses } from "@/lib/analysis/sample-data";
import {
  analysisImageBucketName,
  analysisSettingsTableName,
  analysisTableName,
  type AnalysisInsert,
} from "@/lib/analysis/storage";
import type {
  AnalysisDraft,
  AnalysisRecord,
  AnalysisSettings,
  InputSource,
  ReviewStatus,
} from "@/lib/analysis/types";
import { createClient } from "@/lib/supabase/client";

const emptyDraft: AnalysisDraft = {
  source_type: "direct",
  subject: "수학",
  unit: "",
  question_title: "",
  problem_statement: "",
  wrong_answer: "",
  correct_answer: "",
  provided_solution: "",
  explanation: "",
};

const sourceLabels: Record<InputSource, string> = {
  direct: "직접 입력",
  upload: "업로드",
  database: "기존 DB 연동",
};

const statusLabels: Record<ReviewStatus, string> = {
  pending: "복습 대기",
  reviewing: "진행 중",
  done: "완료",
};

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

const defaultSettings: AnalysisSettings = {
  default_subject: "수학",
  default_source_type: "direct",
  auto_select_new_record: true,
  show_sample_records: false,
};

type DashboardWorkspaceProps = {
  userEmail: string | null;
};

export function DashboardWorkspace({ userEmail }: DashboardWorkspaceProps) {
  const [draft, setDraft] = useState<AnalysisDraft>(emptyDraft);
  const [records, setRecords] = useState<AnalysisRecord[]>(sampleAnalyses);
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(
    sampleAnalyses[0],
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingSolution, setIsGeneratingSolution] = useState(false);
  const [settings, setSettings] = useState<AnalysisSettings>(defaultSettings);
  const [schemaReady, setSchemaReady] = useState(false);
  const [syncMessage, setSyncMessage] = useState("동기화 중");
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showReviewSolution, setShowReviewSolution] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadRecords() {
      setIsLoading(true);

      const supabase = createClient();
      const [recordsResult, settingsResult] = await Promise.all([
        supabase
          .from(analysisTableName)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(30),
        supabase.from(analysisSettingsTableName).select("*").maybeSingle(),
      ]);

      if (!isMounted) {
        return;
      }

      if (settingsResult.data) {
        const nextSettings = normalizeSettings(settingsResult.data);
        setSettings(nextSettings);
        setDraft((currentDraft) => ({
          ...currentDraft,
          source_type: nextSettings.default_source_type,
          subject: nextSettings.default_subject,
        }));
      }

      if (recordsResult.error) {
        setSchemaReady(false);
        setSyncMessage("설정 필요");
        setRecords(sampleAnalyses);
        setSelectedRecord(sampleAnalyses[0]);
      } else {
        setSchemaReady(true);
        const loadedRecords = ((recordsResult.data ?? []) as AnalysisRecord[]).map(
          normalizeRecord,
        );
        const shouldUseSamples =
          loadedRecords.length === 0 &&
          (settingsResult.data as AnalysisSettings | null)?.show_sample_records;

        setRecords(shouldUseSamples ? sampleAnalyses : loadedRecords);
        setSelectedRecord(
          shouldUseSamples ? sampleAnalyses[0] : (loadedRecords[0] ?? null),
        );
        setSyncMessage(loadedRecords.length > 0 ? "연결 완료" : "기록 없음");
      }

      setIsLoading(false);
    }

    loadRecords();

    return () => {
      isMounted = false;
    };
  }, []);

  const uniqueUnits = useMemo(() => {
    const units = records.map((r) => r.unit).filter(Boolean);
    return Array.from(new Set(units)).slice(0, 5);
  }, [records]);

  const reviewQueue = useMemo(() => {
    return records.filter((r) => r.status !== "done");
  }, [records]);

  function handleNextReview() {
    setShowReviewSolution(false);
    setReviewIndex((prev) => prev + 1);
  }

  async function handleDelete(recordId: string) {
    if (!window.confirm("정말로 이 오답 기록을 삭제하시겠습니까?")) {
      return;
    }

    setRecords((currentRecords) =>
      currentRecords.filter((record) => record.id !== recordId),
    );

    if (selectedRecord?.id === recordId) {
      setSelectedRecord(null);
    }

    if (recordId.startsWith("sample-") || recordId.startsWith("local-")) {
      setSyncMessage("샘플/임시 기록은 화면에서만 삭제되었습니다.");
      return;
    }

    const supabase = createClient();
    const recordToDelete = records.find((r) => r.id === recordId);
    if (recordToDelete?.image_path) {
      try {
        await supabase.storage
          .from(analysisImageBucketName)
          .remove([recordToDelete.image_path]);
      } catch {
        // Ignore storage delete errors
      }
    }

    const { error } = await supabase
      .from(analysisTableName)
      .delete()
      .eq("id", recordId);

    if (error) {
      setSyncMessage("DB 삭제 중 오류가 발생했습니다.");
    } else {
      setSyncMessage("삭제 완료");
    }
  }

  const stats = useMemo(() => {
    const total = records.length;
    const patternCount = new Map<string, number>();
    const unitCount = new Map<string, number>();
    const pendingCount = records.filter((record) => record.status !== "done")
      .length;
    const confidenceAverage =
      total === 0
        ? 0
        : Math.round(
            records.reduce((sum, record) => sum + record.confidence, 0) / total,
          );

    records.forEach((record) => {
      patternCount.set(record.pattern, (patternCount.get(record.pattern) ?? 0) + 1);
      unitCount.set(record.unit, (unitCount.get(record.unit) ?? 0) + 1);
    });

    return {
      confidenceAverage,
      patternEntries: Array.from(patternCount.entries()),
      pendingCount,
      topUnit: Array.from(unitCount.entries()).sort((a, b) => b[1] - a[1])[0],
      total,
    };
  }, [records]);

  const overviewItems = [
    { label: "분석한 문항", value: String(stats.total), note: "내 기록 기준" },
    {
      label: "감지된 패턴",
      value: String(stats.patternEntries.length),
      note: "분류 결과",
    },
    {
      label: "복습 대기",
      value: String(stats.pendingCount),
      note: "완료 전 기록",
    },
    {
      label: "평균 신뢰도",
      value: `${stats.confidenceAverage}%`,
      note: "평균값",
    },
  ];

  function updateDraft(field: keyof AnalysisDraft, value: string) {
    setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
  }

  function updateSource(sourceType: InputSource) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      source_type: sourceType,
    }));
  }

  function normalizeRecord(record: AnalysisRecord): AnalysisRecord {
    return {
      ...record,
      image_path: record.image_path ?? null,
      image_url: record.image_url ?? null,
      problem_statement: record.problem_statement || record.question_title,
      provided_solution: record.provided_solution || "",
      review_topics: record.review_topics ?? [],
      solution_steps: record.solution_steps ?? [],
      correct_solution: record.correct_solution || "",
      detailed_explanation: record.detailed_explanation || "",
      mistake_reason:
        record.mistake_reason ||
        "정확한 문제 풀이가 만들어진 뒤 오답 원인을 비교할 수 있습니다.",
      solution_strategy: record.solution_strategy || "",
    };
  }

  function normalizeSettings(value: Partial<AnalysisSettings>): AnalysisSettings {
    return {
      ...defaultSettings,
      ...value,
      default_source_type:
        value.default_source_type && value.default_source_type in sourceLabels
          ? value.default_source_type
          : defaultSettings.default_source_type,
    };
  }

  function updateSettings(field: keyof AnalysisSettings, value: string | boolean) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [field]: value,
    }));
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const text = await file.text();
    setDraft((currentDraft) => ({
      ...currentDraft,
      source_type: "upload",
      question_title: currentDraft.question_title || file.name,
      problem_statement: text.slice(0, 1600),
    }));
    setSyncMessage("업로드한 텍스트를 문제 내용에 반영했습니다.");
  }

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!allowedImageTypes.includes(file.type)) {
      setSyncMessage("이미지는 JPG, PNG, WebP 형식만 첨부할 수 있습니다.");
      return;
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setDraft((currentDraft) => ({
      ...currentDraft,
      source_type: "upload",
      question_title: currentDraft.question_title || file.name,
    }));
    setSyncMessage("문제 이미지를 첨부했습니다. 설명을 함께 입력하면 분석 품질이 좋아집니다.");
  }

  function clearImage() {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageFile(null);
    setImagePreviewUrl(null);
  }

  function readImageAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.addEventListener("load", () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("이미지를 읽지 못했습니다."));
        }
      });
      reader.addEventListener("error", () => reject(reader.error));
      reader.readAsDataURL(file);
    });
  }

  async function generateSolutionFromImage() {
    if (!imageFile) {
      setSyncMessage("문제 이미지를 먼저 첨부해주세요.");
      return;
    }

    if (!draft.correct_answer.trim()) {
      setSyncMessage("정답을 먼저 입력해야 AI 풀이를 생성할 수 있습니다.");
      return;
    }

    setIsGeneratingSolution(true);
    setSyncMessage("AI가 문제 이미지를 읽고 풀이를 생성하는 중입니다.");

    try {
      const imageDataUrl = await readImageAsDataUrl(imageFile);
      const response = await fetch("/api/solve-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correctAnswer: draft.correct_answer,
          imageDataUrl,
          problemStatement: draft.problem_statement,
          subject: draft.subject,
          unit: draft.unit,
          wrongAnswer: draft.wrong_answer,
        }),
      });
      const data = (await response.json()) as {
        detail?: string;
        error?: string;
        solution?: string;
      };

      if (!response.ok || !data.solution) {
        setSyncMessage(data.error ?? "AI 풀이 생성에 실패했습니다.");
        return;
      }

      setDraft((currentDraft) => ({
        ...currentDraft,
        provided_solution: data.solution ?? "",
      }));
      setSyncMessage("AI 풀이를 문제의 옳은 풀이 칸에 반영했습니다.");
    } catch {
      setSyncMessage("AI 풀이 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingSolution(false);
    }
  }

  async function uploadImage(userId: string) {
    if (!imageFile) {
      return { imagePath: null, imageUrl: null, uploadError: null };
    }

    const supabase = createClient();
    const extension = imageFile.name.split(".").pop()?.toLowerCase() ?? "png";
    const safeName = imageFile.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9가-힣_-]/g, "-")
      .slice(0, 40);
    const imagePath = `${userId}/${Date.now()}-${safeName}.${extension}`;
    const { error } = await supabase.storage
      .from(analysisImageBucketName)
      .upload(imagePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return { imagePath: null, imageUrl: imagePreviewUrl, uploadError: error };
    }

    const { data } = supabase.storage
      .from(analysisImageBucketName)
      .getPublicUrl(imagePath);

    return {
      imagePath,
      imageUrl: data.publicUrl,
      uploadError: null,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const classification = classifyWrongAnswer(draft);
    const userId = userData.user?.id;
    const { imagePath, imageUrl, uploadError } = userId
      ? await uploadImage(userId)
      : { imagePath: null, imageUrl: imagePreviewUrl, uploadError: null };
    const insertPayload: AnalysisInsert = {
      ...draft,
      ...classification,
      image_path: imagePath,
      image_url: imageUrl,
      status: "pending",
      user_id: userId,
    };

    const { data, error } = await supabase
      .from(analysisTableName)
      .insert(insertPayload)
      .select("*")
      .single();

    const nextRecord: AnalysisRecord = normalizeRecord(
      error
        ? {
            ...insertPayload,
            id: `local-${Date.now()}`,
            created_at: new Date().toISOString(),
          }
        : ((data as AnalysisRecord) ?? {
            ...insertPayload,
            id: `local-${Date.now()}`,
            created_at: new Date().toISOString(),
          }),
    );

    setRecords((currentRecords) => [nextRecord, ...currentRecords]);
    if (settings.auto_select_new_record) {
      setSelectedRecord(nextRecord);
    }
    setDraft({
      ...emptyDraft,
      source_type: settings.default_source_type,
      subject: settings.default_subject,
    });
    clearImage();
    setSyncMessage(
      uploadError
        ? "이미지 Storage 업로드는 실패했지만 분석 기록은 화면에 반영했습니다. Storage 버킷 설정을 확인해주세요."
        : error
        ? "Supabase 저장은 실패해 로컬 화면에만 반영했습니다. SQL 스키마 적용을 확인해주세요."
        : "저장 완료",
    );
    setIsSaving(false);
  }

  async function updateStatus(record: AnalysisRecord, status: ReviewStatus) {
    setRecords((currentRecords) =>
      currentRecords.map((currentRecord) =>
        currentRecord.id === record.id ? { ...currentRecord, status } : currentRecord,
      ),
    );
    setSelectedRecord((currentRecord) =>
      currentRecord?.id === record.id ? { ...currentRecord, status } : currentRecord,
    );

    if (record.id.startsWith("sample-") || record.id.startsWith("local-")) {
      setSyncMessage("샘플/임시 기록은 DB에 저장되지 않습니다.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from(analysisTableName)
      .update({ status })
      .eq("id", record.id);

    setSyncMessage(error ? "상태 저장 실패" : "상태 저장 완료");
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingSettings(true);

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      setSyncMessage("로그인 세션 확인 필요");
      setIsSavingSettings(false);
      return;
    }

    const payload: AnalysisSettings = {
      ...settings,
      user_id: userId,
    };
    const { data, error } = await supabase
      .from(analysisSettingsTableName)
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();

    if (error) {
      setSyncMessage("설정 저장 실패");
    } else {
      const nextSettings = normalizeSettings(data as AnalysisSettings);
      setSettings(nextSettings);
      setDraft((currentDraft) => ({
        ...currentDraft,
        source_type: nextSettings.default_source_type,
        subject: currentDraft.subject || nextSettings.default_subject,
      }));
      setSyncMessage("설정 저장 완료");
    }

    setIsSavingSettings(false);
  }

  return (
  return (
    <div className="flex flex-col flex-1 gap-4 py-4">
      <section className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overviewItems.map((item, idx) => (
            <article
              className="border border-[var(--line)] bg-white p-4 shadow-sm flex flex-col justify-between"
              key={item.label}
            >
              <div>
                <p className="text-sm font-medium text-[var(--muted)]">
                  {item.label}
                </p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <strong className="text-3xl font-bold">{item.value}</strong>
                  <span className="rounded-lg bg-[var(--app-bg)] px-2 py-1 text-xs font-semibold text-[var(--muted)]">
                    {item.note}
                  </span>
                </div>
              </div>
              {idx === 2 && stats.pendingCount > 0 && (
                <button
                  onClick={() => {
                    setReviewIndex(0);
                    setShowReviewSolution(false);
                    setIsReviewMode(true);
                  }}
                  className="mt-3 w-full rounded-lg bg-[var(--accent)] py-1.5 text-xs font-bold text-white hover:bg-[#0c7779] transition"
                  type="button"
                >
                  오늘의 오답 복습 시작
                </button>
              )}
            </article>
          ))}
        </div>

        <div className="border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--muted)] shadow-sm">
          <strong className="text-[var(--app-fg)]">DB</strong>
          <span className="ml-2">{isLoading ? "동기화 중" : syncMessage}</span>
          <span className="ml-2 text-xs">사용자: {userEmail ?? "세션 확인됨"}</span>
        </div>

        <div
          className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]"
          id="분석"
        >
          <section className="border border-[var(--line)] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold">오답 입력/분석</h2>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-[var(--app-bg)] p-1">
              {(["direct", "database"] as const).map((sourceType) => (
                <button
                  className={`rounded-md px-3 py-2 text-sm font-bold ${
                    draft.source_type === sourceType
                      ? "bg-white text-[var(--app-fg)] shadow-sm"
                      : "text-[var(--muted)]"
                  }`}
                  key={sourceType}
                  onClick={() => updateSource(sourceType)}
                  type="button"
                >
                  {sourceLabels[sourceType]}
                </button>
              ))}
            </div>

            {draft.source_type === "database" ? (
              <div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--accent-soft)] p-4 text-sm leading-6 text-[var(--accent)]">
                Supabase 저장 기록을 기준으로 관리합니다.
              </div>
            ) : null}

            <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              {/* 텍스트 파일 가져오기 추가 */}
              <div className="grid gap-3 rounded-lg border border-[var(--line)] bg-[var(--app-bg)] p-4 sm:col-span-2 sm:grid-cols-[220px_1fr]">
                <div className="flex min-h-[96px] items-center justify-center overflow-hidden rounded-lg border border-[var(--line)] bg-white">
                  <span className="px-4 text-center text-sm font-semibold text-[var(--muted)]">
                    텍스트 파일 (.txt, .md)
                  </span>
                </div>
                <div className="flex flex-col justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">텍스트 파일로 문제 채우기</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      파일을 선택하면 문제 파일명은 제목으로, 파일 본문은 문제 내용으로 자동 채워집니다.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-[var(--accent)] ring-1 ring-[var(--line)] cursor-pointer">
                      파일 선택
                      <input
                        accept=".txt,.md"
                        className="sr-only"
                        onChange={handleUpload}
                        type="file"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 rounded-lg border border-[var(--line)] bg-[var(--app-bg)] p-4 sm:col-span-2 sm:grid-cols-[220px_1fr]">
                <div className="flex min-h-36 items-center justify-center overflow-hidden rounded-lg border border-[var(--line)] bg-white">
                  {imagePreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt="첨부한 문제 이미지 미리보기"
                      className="h-full max-h-48 w-full object-contain"
                      src={imagePreviewUrl}
                    />
                  ) : (
                    <span className="px-4 text-center text-sm font-semibold text-[var(--muted)]">
                      문제 이미지 없음
                    </span>
                  )}
                </div>
                <div className="flex flex-col justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">문제 이미지</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      이미지는 Storage에 저장됩니다.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-[var(--accent)] ring-1 ring-[var(--line)]">
                      이미지 선택
                      <input
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={handleImageUpload}
                        type="file"
                      />
                    </label>
                    <button
                      className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-bold text-[var(--muted)]"
                      disabled={!imagePreviewUrl}
                      onClick={clearImage}
                      type="button"
                    >
                      이미지 제거
                    </button>
                  </div>
                </div>
              </div>

              <label className="grid gap-2 text-sm font-semibold">
                과목
                <input
                  className="rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--accent)] focus:bg-white"
                  onChange={(event) => updateDraft("subject", event.target.value)}
                  required
                  value={draft.subject}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold relative">
                단원
                <input
                  className="rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--accent)] focus:bg-white"
                  onChange={(event) => updateDraft("unit", event.target.value)}
                  placeholder="예: 분수의 나눗셈"
                  required
                  value={draft.unit}
                />
                {uniqueUnits.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1 items-center">
                    <span className="text-xs text-[var(--muted)] mr-1">추천 단원:</span>
                    {uniqueUnits.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => updateDraft("unit", u)}
                        className="rounded bg-[var(--accent-soft)] px-2 py-0.5 text-xs text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition"
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                )}
              </label>
              <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
                문항 제목
                <input
                  className="rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--accent)] focus:bg-white"
                  onChange={(event) =>
                    updateDraft("question_title", event.target.value)
                  }
                  placeholder="예: 역수 변환 문제"
                  required
                  value={draft.question_title}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
                문제 내용
                <textarea
                  className="min-h-32 resize-none rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm leading-6 outline-none focus:border-[var(--accent)] focus:bg-white"
                  onChange={(event) =>
                    updateDraft("problem_statement", event.target.value)
                  }
                  placeholder="문제 본문, 조건, 보기, 이미지 속 내용을 적습니다."
                  required
                  value={draft.problem_statement}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
                내가 쓴 답/풀이
                <textarea
                  className="min-h-28 resize-none rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm leading-6 outline-none focus:border-[var(--accent)] focus:bg-white"
                  onChange={(event) => updateDraft("wrong_answer", event.target.value)}
                  placeholder="내가 적은 답, 틀린 풀이 과정, 헷갈린 부분을 적습니다."
                  required
                  value={draft.wrong_answer}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                문제의 정답
                <textarea
                  className="min-h-24 resize-none rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm leading-6 outline-none focus:border-[var(--accent)] focus:bg-white"
                  onChange={(event) =>
                    updateDraft("correct_answer", event.target.value)
                  }
                  placeholder="정답만 적어도 됩니다. 예: 3/2, x=4, ⑤"
                  required
                  value={draft.correct_answer}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  문제의 옳은 풀이
                  <button
                    className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:text-[var(--muted)]"
                    disabled={isGeneratingSolution || !imageFile}
                    onClick={generateSolutionFromImage}
                    type="button"
                  >
                    {isGeneratingSolution ? "생성 중" : "AI 풀이 생성"}
                  </button>
                </span>
                <textarea
                  className="min-h-24 resize-none rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm leading-6 outline-none focus:border-[var(--accent)] focus:bg-white"
                  onChange={(event) =>
                    updateDraft("provided_solution", event.target.value)
                  }
                  placeholder="문제 이미지를 첨부하고 정답을 입력한 뒤 AI 풀이 생성을 누르면 채워집니다."
                  value={draft.provided_solution}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
                교사 메모
                <textarea
                  className="min-h-24 resize-none rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm leading-6 outline-none focus:border-[var(--accent)] focus:bg-white"
                  onChange={(event) => updateDraft("explanation", event.target.value)}
                  value={draft.explanation}
                />
              </label>
              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--muted)]">새 문제 저장 시 결과 패널이 갱신됩니다.</p>
                <button
                  className="rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0c7779]"
                  disabled={isSaving || isGeneratingSolution}
                  type="submit"
                >
                  {isSaving ? "저장 중" : "분석하고 저장"}
                </button>
              </div>
            </form>
          </section>

          <section className="border border-[var(--line)] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">분석 결과</h2>
              </div>
              <div className="flex items-center gap-2">
                {selectedRecord && (
                  <button
                    onClick={() => handleDelete(selectedRecord.id)}
                    className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-100 transition"
                    type="button"
                  >
                    삭제
                  </button>
                )}
                <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                  {selectedRecord ? statusLabels[selectedRecord.status] : "대기"}
                </span>
              </div>
            </div>

            {selectedRecord ? (
              <div className="mt-6 grid gap-4">
                {selectedRecord.image_url ? (
                  <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--app-bg)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={`${selectedRecord.question_title} 문제 이미지`}
                      className="max-h-64 w-full object-contain"
                      src={selectedRecord.image_url}
                    />
                  </div>
                ) : null}
                <div className="rounded-lg border border-[var(--line)] p-4">
                  <p className="text-sm font-semibold text-[var(--muted)]">
                    오답 유형
                  </p>
                  <p className="mt-2 text-2xl font-bold">{selectedRecord.pattern}</p>
                </div>
                <div className="rounded-lg border border-[var(--line)] p-4">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-[var(--muted)]">신뢰도</span>
                    <span>{selectedRecord.confidence}%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-lg bg-[var(--app-bg)]">
                    <div
                      className="h-2 rounded-lg bg-[var(--accent)]"
                      style={{ width: `${selectedRecord.confidence}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--line)] bg-rose-50 p-4">
                  <p className="text-sm font-semibold text-rose-700">
                    왜 틀렸나
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6">
                    {selectedRecord.mistake_reason}
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--line)] p-4">
                  <p className="text-sm font-semibold text-[var(--muted)]">
                    문제 풀이
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6">
                    {selectedRecord.correct_solution}
                  </p>
                </div>
                {selectedRecord.detailed_explanation ? (
                  <div className="rounded-lg border border-[var(--line)] p-4">
                    <p className="text-sm font-semibold text-[var(--muted)]">
                      상세 해설
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6">
                      {selectedRecord.detailed_explanation}
                    </p>
                  </div>
                ) : null}
                <div className="rounded-lg border border-[var(--line)] bg-[var(--accent-soft)] p-4">
                  <p className="text-sm font-semibold text-[var(--accent)]">
                    추천 복습 방향
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    {selectedRecord.review_direction}
                  </p>
                </div>
                {selectedRecord.solution_strategy ? (
                  <div className="rounded-lg border border-[var(--line)] p-4">
                    <p className="text-sm font-semibold text-[var(--muted)]">
                      풀이 전략
                    </p>
                    <p className="mt-2 text-sm leading-6">
                      {selectedRecord.solution_strategy}
                    </p>
                  </div>
                ) : null}
                {selectedRecord.solution_steps.length > 0 ? (
                  <div className="rounded-lg border border-[var(--line)] p-4">
                    <p className="text-sm font-semibold text-[var(--muted)]">
                      풀이 순서
                    </p>
                    <ol className="mt-3 grid list-decimal gap-2 pl-5 text-sm leading-6">
                      {selectedRecord.solution_steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </div>
                ) : null}
                {selectedRecord.review_topics.length > 0 ? (
                  <div className="rounded-lg border border-[var(--line)] p-4">
                    <p className="text-sm font-semibold text-[var(--muted)]">
                      복습할 것
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedRecord.review_topics.map((topic) => (
                        <span
                          className="rounded-lg bg-[var(--app-bg)] px-3 py-2 text-xs font-bold text-[var(--muted)]"
                          key={topic}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-6 text-sm text-[var(--muted)]">
                기록을 선택하거나 새 오답을 저장하면 결과가 표시됩니다.
              </p>
            )}
          </section>
        </div>

        <section
          className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
          id="통계"
        >
          <article className="border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">오답 유형 분포</h2>
            <div className="mt-5 grid gap-4">
              {stats.patternEntries.map(([pattern, count]) => (
                <div key={pattern}>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{pattern}</span>
                    <span className="text-[var(--muted)]">{count}건</span>
                  </div>
                  <div className="mt-2 h-2 rounded-lg bg-[var(--app-bg)]">
                    <div
                      className="h-2 rounded-lg bg-[var(--accent)]"
                      style={{
                        width: `${Math.max(12, (count / stats.total) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">취약 단원</h2>
            <div className="mt-5 rounded-lg border border-[var(--line)] bg-[var(--app-bg)] p-4">
              <p className="text-sm font-semibold text-[var(--muted)]">
                현재 최다 기록 단원
              </p>
              <p className="mt-2 text-2xl font-bold">
                {stats.topUnit?.[0] ?? "아직 없음"}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {stats.topUnit ? `${stats.topUnit[1]}건 누적` : "오답을 저장하면 표시됩니다."}
              </p>
            </div>
          </article>
        </section>

        <section className="border border-[var(--line)] bg-white p-5 shadow-sm" id="기록">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">최근 분석 기록</h2>
            </div>
            <span className="text-sm font-semibold text-[var(--accent)]">
              총 {records.length}건
            </span>
          </div>

          <div className="mt-5 overflow-hidden border border-[var(--line)]">
            <div className="hidden grid-cols-[1fr_0.8fr_0.8fr_90px_180px] bg-[var(--app-bg)] px-4 py-3 text-sm font-bold text-[var(--muted)] md:grid">
              <span>문항</span>
              <span>단원</span>
              <span>패턴</span>
              <span>신뢰도</span>
              <span>상태 및 관리</span>
            </div>
            {records.map((record) => (
              <div
                className="grid gap-3 border-t border-[var(--line)] px-4 py-4 text-sm transition hover:bg-[var(--app-bg)] md:grid-cols-[1fr_0.8fr_0.8fr_90px_180px] md:items-center"
                key={record.id}
              >
                <button
                  className="text-left font-bold"
                  onClick={() => setSelectedRecord(record)}
                  type="button"
                >
                  {record.question_title}
                  {record.image_url ? (
                    <span className="ml-2 rounded bg-[var(--accent-soft)] px-2 py-1 text-xs text-[var(--accent)]">
                      이미지
                    </span>
                  ) : null}
                </button>
                <span className="text-[var(--muted)]">{record.unit}</span>
                <span className="text-[var(--muted)]">{record.pattern}</span>
                <span className="font-semibold">{record.confidence}%</span>
                <div className="flex items-center gap-2">
                  <select
                    className="flex-1 rounded-lg border border-[var(--line)] bg-white px-2 py-2 text-xs font-bold text-[var(--muted)] min-w-[80px]"
                    onChange={(event) =>
                      updateStatus(record, event.target.value as ReviewStatus)
                    }
                    value={record.status}
                  >
                    {Object.entries(statusLabels).map(([status, label]) => (
                      <option key={status} value={status}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition"
                    type="button"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
            {records.length === 0 ? (
              <div className="border-t border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                저장된 문제가 없습니다.
              </div>
            ) : null}
          </div>
        </section>

        <section className="border border-[var(--line)] bg-white p-5 shadow-sm" id="설정">
          <form className="grid gap-4" onSubmit={saveSettings}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">설정</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {schemaReady ? "연결 완료" : "SQL 설정 필요"}
                </p>
              </div>
              <span
                className={`rounded-lg px-3 py-2 text-xs font-bold ${
                  schemaReady
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {schemaReady ? "DB 연결" : "대기"}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                기본 과목
                <input
                  className="rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--accent)] focus:bg-white"
                  onChange={(event) =>
                    updateSettings("default_subject", event.target.value)
                  }
                  value={settings.default_subject}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                기본 입력 방식
                <select
                  className="rounded-lg border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--accent)] focus:bg-white"
                  onChange={(event) =>
                    updateSettings(
                      "default_source_type",
                      event.target.value as InputSource,
                    )
                  }
                  value={settings.default_source_type}
                >
                  {(Object.keys(sourceLabels) as InputSource[]).map((sourceType) => (
                    <option key={sourceType} value={sourceType}>
                      {sourceLabels[sourceType]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--muted)]">
                <input
                  checked={settings.auto_select_new_record}
                  className="h-4 w-4 accent-[var(--accent)]"
                  onChange={(event) =>
                    updateSettings("auto_select_new_record", event.target.checked)
                  }
                  type="checkbox"
                />
                새 문제 저장 후 결과 보기
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--muted)]">
                <input
                  checked={settings.show_sample_records}
                  className="h-4 w-4 accent-[var(--accent)]"
                  onChange={(event) =>
                    updateSettings("show_sample_records", event.target.checked)
                  }
                  type="checkbox"
                />
                기록 없을 때 샘플 표시
              </label>
            </div>

            <div className="flex justify-end">
              <button
                className="rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0c7779]"
                disabled={isSavingSettings}
                type="submit"
              >
                {isSavingSettings ? "저장 중" : "설정 저장"}
              </button>
            </div>
          </form>
        </section>
      </section>

      {/* 복습 모드 모달 추가 */}
      {isReviewMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="flex flex-col w-full max-w-2xl bg-white border border-[var(--line)] rounded-xl shadow-2xl overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[var(--app-bg)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--app-fg)]">오늘의 오답 복습</h3>
                <p className="text-xs text-[var(--muted)]">진행 중인 복습 대상 문항을 학습합니다.</p>
              </div>
              <button
                onClick={() => setIsReviewMode(false)}
                className="text-[var(--muted)] hover:text-[var(--app-fg)] font-bold text-lg p-1"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {reviewQueue.length > 0 && reviewIndex < reviewQueue.length ? (
                (() => {
                  const currentReview = reviewQueue[reviewIndex];
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
                        <span>진행률</span>
                        <span>{reviewIndex + 1} / {reviewQueue.length} 문항</span>
                      </div>
                      <div className="h-1.5 w-full bg-[var(--app-bg)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)] transition-all"
                          style={{ width: `${((reviewIndex + 1) / reviewQueue.length) * 100}%` }}
                        />
                      </div>

                      <div className="rounded-lg border border-[var(--line)] p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-bold text-[var(--accent)]">
                            {currentReview.subject}
                          </span>
                          <span className="text-xs font-semibold text-[var(--muted)]">
                            {currentReview.unit}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold">{currentReview.question_title}</h4>
                      </div>

                      <div className="rounded-lg border border-[var(--line)] p-4 space-y-2">
                        <p className="text-xs font-bold text-[var(--muted)]">문제 내용</p>
                        <p className="text-sm leading-6 whitespace-pre-line bg-[var(--app-bg)] p-3 rounded-lg border border-[var(--line)]">
                          {currentReview.problem_statement}
                        </p>
                        {currentReview.image_url && (
                          <div className="mt-2 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--app-bg)] max-h-48 flex justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              alt="문제 이미지"
                              className="max-h-48 object-contain"
                              src={currentReview.image_url}
                            />
                          </div>
                        )}
                      </div>

                      {!showReviewSolution ? (
                        <div className="flex justify-center py-4">
                          <button
                            onClick={() => setShowReviewSolution(true)}
                            className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white hover:bg-[#0c7779] transition shadow-md"
                            type="button"
                          >
                            정답 및 풀이 확인하기
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4 pt-2 border-t border-[var(--line)]">
                          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                            <p className="text-xs font-bold text-emerald-700">올바른 정답</p>
                            <p className="mt-1 text-sm font-bold text-emerald-900 whitespace-pre-line">
                              {currentReview.correct_answer}
                            </p>
                          </div>

                          <div className="rounded-lg border border-[var(--line)] p-4">
                            <p className="text-xs font-bold text-[var(--muted)]">올바른 풀이</p>
                            <p className="mt-1 text-sm leading-6 whitespace-pre-line">
                              {currentReview.provided_solution || "작성된 정답 풀이가 없습니다."}
                            </p>
                          </div>

                          <div className="rounded-lg border border-rose-100 bg-rose-50 p-4 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-rose-700">오답 원인</span>
                              <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                {currentReview.pattern}
                              </span>
                            </div>
                            <p className="text-sm leading-6 text-rose-950 whitespace-pre-line">
                              {currentReview.mistake_reason}
                            </p>
                          </div>

                          {currentReview.review_topics.length > 0 && (
                            <div className="rounded-lg border border-[var(--line)] p-4">
                              <p className="text-xs font-bold text-[var(--muted)]">복습할 개념</p>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {currentReview.review_topics.map((topic) => (
                                  <span
                                    key={topic}
                                    className="rounded bg-[var(--app-bg)] px-2 py-1 text-xs font-semibold text-[var(--muted)] border border-[var(--line)]"
                                  >
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-3 justify-center py-4">
                            <button
                              onClick={async () => {
                                await updateStatus(currentReview, "reviewing");
                                handleNextReview();
                              }}
                              className="flex-1 rounded-lg border border-amber-200 bg-amber-50 py-3 text-sm font-bold text-amber-700 hover:bg-amber-100 transition"
                              type="button"
                            >
                              아직 부족함 (복습 계속)
                            </button>
                            <button
                              onClick={async () => {
                                await updateStatus(currentReview, "done");
                                handleNextReview();
                              }}
                              className="flex-1 rounded-lg bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                              type="button"
                            >
                              복습 완료! (완료 처리)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                  <div className="text-4xl">🎉</div>
                  <h4 className="text-lg font-bold">복습할 문항이 없습니다!</h4>
                  <p className="text-sm text-[var(--muted)]">
                    오늘 복습해야 할 오답 노트를 모두 완료했습니다. 참 잘하셨습니다!
                  </p>
                  <button
                    onClick={() => setIsReviewMode(false)}
                    className="mt-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white hover:bg-[#0c7779] transition"
                    type="button"
                  >
                    대시보드로 돌아가기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
