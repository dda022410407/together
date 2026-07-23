import type { AnalysisDraft } from "@/lib/analysis/types";

const patternRules = [
  {
    pattern: "개념 혼동",
    keywords: ["개념", "공식", "정의", "원리", "역수", "함수", "분수"],
    reviewDirection:
      "문제 풀이 전에 핵심 개념과 조건을 한 문장으로 다시 설명한 뒤 유사 문항을 풀어봅니다.",
    reviewTopics: ["핵심 개념 정의", "공식이 성립하는 이유", "유사 개념 비교"],
    solutionSteps: [
      "문제에서 요구하는 값을 먼저 확인합니다.",
      "사용해야 할 개념이나 공식을 풀이 첫 줄에 적습니다.",
      "오답 풀이와 정답 풀이가 갈라진 지점을 비교합니다.",
    ],
    solutionStrategy:
      "계산을 시작하기 전에 개념 적용 조건을 먼저 점검하는 방식으로 풀어야 합니다.",
  },
  {
    pattern: "계산 실수",
    keywords: ["계산", "부호", "덧셈", "뺄셈", "곱셈", "나눗셈", "약분"],
    reviewDirection:
      "풀이 마지막 단계에서 부호, 연산 순서, 약분 여부를 체크리스트로 검산합니다.",
    reviewTopics: ["연산 순서", "부호 처리", "대입 검산"],
    solutionSteps: [
      "식을 한 줄씩 분리해서 전개합니다.",
      "부호와 연산 기호가 바뀌는 지점을 표시합니다.",
      "마지막 답을 원래 식에 대입해 검산합니다.",
    ],
    solutionStrategy:
      "빠르게 암산하기보다 중간식을 남기고 검산 가능한 형태로 풀어야 합니다.",
  },
  {
    pattern: "조건 누락",
    keywords: ["조건", "단서", "범위", "이상", "이하", "그래프", "문장"],
    reviewDirection:
      "문제 조건을 먼저 표시하고, 풀이 과정마다 사용한 조건을 옆에 적어 누락을 줄입니다.",
    reviewTopics: ["조건 표시", "범위 제한", "문장형 문제 해석"],
    solutionSteps: [
      "문제의 조건과 제한 범위에 표시합니다.",
      "각 조건을 풀이에 어떻게 사용할지 짧게 메모합니다.",
      "답을 낸 뒤 모든 조건을 사용했는지 다시 확인합니다.",
    ],
    solutionStrategy:
      "주어진 조건을 목록으로 바꾼 뒤, 조건을 하나씩 소거하듯 적용해야 합니다.",
  },
  {
    pattern: "문제 해석 오류",
    keywords: ["해석", "잘못 읽", "구하", "비교", "무엇", "왜"],
    reviewDirection:
      "구해야 하는 값과 주어진 정보를 분리해 적고, 풀이 전에 문제를 다시 짧게 요약합니다.",
    reviewTopics: ["문제 재진술", "구하는 값 식별", "자료 해석"],
    solutionSteps: [
      "문제 문장을 자기 말로 한 문장 요약합니다.",
      "구해야 하는 값과 주어진 값을 따로 적습니다.",
      "풀이가 질문에 직접 답하는지 마지막에 확인합니다.",
    ],
    solutionStrategy:
      "계산보다 먼저 질문 의도를 확인하고, 답의 형태를 예상한 뒤 풀어야 합니다.",
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
    review_topics: matchedRule.reviewTopics,
    solution_steps: matchedRule.solutionSteps,
    solution_strategy: matchedRule.solutionStrategy,
  };
}
