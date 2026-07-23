import type { AnalysisDraft } from "@/lib/analysis/types";

const patternRules = [
  {
    pattern: "개념 혼동",
    keywords: ["개념", "공식", "정의", "원리", "역수", "함수", "분수"],
    reviewDirection:
      "문제 풀이 전에 핵심 개념과 조건을 한 문장으로 다시 설명한 뒤 유사 문항을 풀어봅니다.",
  },
  {
    pattern: "계산 실수",
    keywords: ["계산", "부호", "덧셈", "뺄셈", "곱셈", "나눗셈", "약분"],
    reviewDirection:
      "풀이 마지막 단계에서 부호, 연산 순서, 약분 여부를 체크리스트로 검산합니다.",
  },
  {
    pattern: "조건 누락",
    keywords: ["조건", "단서", "범위", "이상", "이하", "그래프", "문장"],
    reviewDirection:
      "문제 조건을 먼저 표시하고, 풀이 과정마다 사용한 조건을 옆에 적어 누락을 줄입니다.",
  },
  {
    pattern: "문제 해석 오류",
    keywords: ["해석", "잘못 읽", "구하", "비교", "무엇", "왜"],
    reviewDirection:
      "구해야 하는 값과 주어진 정보를 분리해 적고, 풀이 전에 문제를 다시 짧게 요약합니다.",
  },
];

export function classifyWrongAnswer(draft: AnalysisDraft) {
  const joinedText = [
    draft.subject,
    draft.unit,
    draft.question_title,
    draft.wrong_answer,
    draft.correct_answer,
    draft.explanation,
  ]
    .join(" ")
    .toLowerCase();

  const matchedRule =
    patternRules.find((rule) =>
      rule.keywords.some((keyword) => joinedText.includes(keyword)),
    ) ?? patternRules[0];

  const filledFields = Object.values(draft).filter(
    (value) => value.trim().length > 0,
  ).length;
  const confidence = Math.min(94, 62 + filledFields * 5);

  return {
    confidence,
    pattern: matchedRule.pattern,
    review_direction: matchedRule.reviewDirection,
  };
}
