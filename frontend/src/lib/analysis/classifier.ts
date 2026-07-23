import type { AnalysisDraft } from "@/lib/analysis/types";

const patternRules = [
  {
    pattern: "개념 혼동",
    keywords: ["개념", "공식", "정의", "원리", "역수", "함수", "분수"],
    reviewDirection:
      "문제 풀이 전에 핵심 개념과 조건을 한 문장으로 다시 설명한 뒤 유사 문항을 풀어봅니다.",
    mistakeReason:
      "오답의 핵심은 계산 능력보다 개념을 적용하는 출발점이 흔들린 데 있습니다.",
    detailedExplanation:
      "이 유형은 풀이 방법을 외운 것처럼 보여도, 왜 그 방법을 써야 하는지 연결이 약할 때 자주 나옵니다. 먼저 문제에서 어떤 개념을 요구하는지 확인하고, 그 개념이 적용되는 조건을 말로 설명해야 합니다. 그런 다음 정답 풀이와 오답 풀이가 처음 갈라진 지점을 찾으면 같은 실수를 반복할 가능성이 줄어듭니다.",
    correctSolution:
      "문제의 조건을 읽고 필요한 개념을 먼저 고릅니다. 그 개념의 정의나 공식을 한 줄로 적은 뒤, 각 계산 단계가 그 개념과 어떻게 연결되는지 확인하면서 풀이를 진행합니다.",
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
    mistakeReason:
      "풀이 방향은 맞았지만 중간 계산을 확인하지 않아 작은 실수가 답 전체를 바꾼 경우입니다.",
    detailedExplanation:
      "계산 실수는 단순히 더 많이 풀어서 해결되기보다, 실수가 생기는 위치를 고정해서 확인하는 습관이 필요합니다. 중간식을 생략하면 어디서 틀렸는지 찾기 어렵기 때문에 한 줄에 한 연산만 처리하는 방식이 좋습니다. 특히 부호, 괄호, 약분, 이항처럼 값이 바뀌는 순간을 표시하면 검산이 쉬워집니다.",
    correctSolution:
      "식을 한 줄씩 정리하고, 각 줄에서 바뀐 부분만 확인합니다. 마지막 답을 원래 문제에 다시 넣어 성립하는지 검산합니다.",
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
    mistakeReason:
      "문제에 있는 단서 중 일부를 사용하지 않아 답이 조건과 어긋난 경우입니다.",
    detailedExplanation:
      "조건 누락은 풀이 실력보다 문제를 정리하는 순서에서 생기는 경우가 많습니다. 문제를 읽자마자 바로 계산하기보다, 조건을 목록으로 나누고 각각을 풀이에 어떻게 사용할지 표시해야 합니다. 답을 구한 뒤에도 모든 조건을 사용했는지 확인하면 조건을 빠뜨린 답을 줄일 수 있습니다.",
    correctSolution:
      "주어진 조건을 먼저 모두 적고, 풀이 과정에서 사용한 조건에 표시합니다. 마지막에 답이 모든 조건을 만족하는지 하나씩 대조합니다.",
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
    mistakeReason:
      "계산 전 단계에서 문제의 요구 사항을 다르게 이해해 풀이 목표가 어긋난 경우입니다.",
    detailedExplanation:
      "문제 해석 오류는 풀이를 시작하기 전에 이미 답의 방향이 달라진 상태입니다. 그래서 계산을 고치기보다 먼저 질문이 무엇을 요구하는지 다시 확인해야 합니다. 구해야 하는 값, 주어진 값, 비교해야 하는 대상이 무엇인지 분리해서 적으면 문제의 의도를 놓칠 가능성이 줄어듭니다.",
    correctSolution:
      "문제를 한 문장으로 다시 말하고, 구해야 하는 값을 먼저 적습니다. 그 다음 주어진 정보를 식이나 표로 정리한 뒤 질문에 맞는 답 형태인지 확인합니다.",
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

function gcd(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);

  while (b !== 0) {
    const next = a % b;
    a = b;
    b = next;
  }

  return a || 1;
}

function simplifyFraction(numerator: number, denominator: number) {
  const sign = denominator < 0 ? -1 : 1;
  const normalizedNumerator = numerator * sign;
  const normalizedDenominator = denominator * sign;
  const divisor = gcd(normalizedNumerator, normalizedDenominator);

  return {
    numerator: normalizedNumerator / divisor,
    denominator: normalizedDenominator / divisor,
  };
}

function formatFraction(numerator: number, denominator: number) {
  return denominator === 1 ? `${numerator}` : `${numerator}/${denominator}`;
}

function parseSignedNumber(value: string) {
  const normalized = value.replace(/\s+/g, "");

  if (normalized === "" || normalized === "+") {
    return 1;
  }

  if (normalized === "-") {
    return -1;
  }

  return Number(normalized);
}

function buildFractionDivisionSolution(problemStatement: string) {
  const match = problemStatement.match(
    /(-?\d+)\s*\/\s*(-?\d+)\s*(?:÷|\/)\s*(-?\d+)\s*\/\s*(-?\d+)/,
  );

  if (!match) {
    return null;
  }

  const [, firstNumerator, firstDenominator, secondNumerator, secondDenominator] =
    match.map(Number);

  if (
    firstDenominator === 0 ||
    secondNumerator === 0 ||
    secondDenominator === 0
  ) {
    return null;
  }

  const multipliedNumerator = firstNumerator * secondDenominator;
  const multipliedDenominator = firstDenominator * secondNumerator;
  const simplified = simplifyFraction(multipliedNumerator, multipliedDenominator);

  return [
    `1. 나눗셈 뒤의 분수 ${formatFraction(
      secondNumerator,
      secondDenominator,
    )}를 역수 ${formatFraction(secondDenominator, secondNumerator)}로 바꿉니다.`,
    `2. 그래서 식은 ${formatFraction(
      firstNumerator,
      firstDenominator,
    )} x ${formatFraction(secondDenominator, secondNumerator)}가 됩니다.`,
    `3. 분자끼리, 분모끼리 곱하면 ${formatFraction(
      multipliedNumerator,
      multipliedDenominator,
    )}입니다.`,
    `4. 약분하면 ${formatFraction(
      simplified.numerator,
      simplified.denominator,
    )}입니다.`,
  ].join("\n");
}

function buildLinearEquationSolution(problemStatement: string) {
  const match = problemStatement
    .replace(/\s+/g, "")
    .match(/^([+-]?\d*)x([+-]\d+)?=([+-]?\d*)x([+-]\d+)?/);

  if (!match) {
    return null;
  }

  const leftCoefficient = parseSignedNumber(match[1]);
  const leftConstant = Number(match[2] ?? 0);
  const rightCoefficient = parseSignedNumber(match[3]);
  const rightConstant = Number(match[4] ?? 0);
  const coefficient = leftCoefficient - rightCoefficient;
  const constant = rightConstant - leftConstant;

  if (coefficient === 0) {
    return null;
  }

  const solution = simplifyFraction(constant, coefficient);
  const formattedSolution = formatFraction(solution.numerator, solution.denominator);

  return [
    "1. 문자 x가 있는 항은 왼쪽으로, 숫자만 있는 항은 오른쪽으로 모읍니다.",
    `2. x항을 정리하면 ${coefficient}x가 되고, 숫자항을 정리하면 ${constant}가 됩니다.`,
    `3. 양변을 ${coefficient}로 나누면 x = ${formattedSolution}입니다.`,
    "4. 구한 값을 원래 식에 대입해 양변이 같은지 확인합니다.",
  ].join("\n");
}

function buildProblemSolution(
  draft: AnalysisDraft,
  rule: (typeof patternRules)[number],
) {
  const problemStatement = draft.problem_statement.trim();
  const targetAnswer = draft.correct_answer.trim();
  const wrongAnswer = draft.wrong_answer.trim();
  const computedSolution =
    buildFractionDivisionSolution(problemStatement) ??
    buildLinearEquationSolution(problemStatement);
  const solutionBody =
    computedSolution ??
    [
      "1. 문제에서 구해야 하는 값을 먼저 표시합니다.",
      "2. 주어진 조건과 숫자, 보기, 제한 범위를 따로 정리합니다.",
      `3. ${rule.correctSolution}`,
      "4. 풀이 중간마다 사용한 조건을 확인하고, 계산이 필요한 경우 한 줄에 한 연산만 적습니다.",
      targetAnswer
        ? `5. 마지막 결과가 "${targetAnswer}"와 같은지 확인합니다.`
        : "5. 마지막 결과가 문제에서 요구한 답의 형태인지 확인합니다.",
    ].join("\n");

  return [
    problemStatement ? `문제: ${problemStatement}` : "",
    targetAnswer ? `정답: ${targetAnswer}` : "",
    `풀이:\n${solutionBody}`,
    wrongAnswer
      ? `내 풀이와 비교: "${wrongAnswer}"에서 정답 풀이와 달라지는 첫 지점을 찾아 표시합니다. 그 지점이 이번 오답의 복습 포인트입니다.`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function classifyWrongAnswer(draft: AnalysisDraft) {
  const joinedText = [
    draft.subject,
    draft.unit,
    draft.question_title,
    draft.problem_statement,
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
  const targetAnswer = draft.correct_answer.trim();
  const problemStatement = draft.problem_statement.trim();
  const correctSolution = buildProblemSolution(draft, matchedRule);
  const mistakeReason = draft.explanation.trim()
    ? `${matchedRule.mistakeReason}\n\n추가 메모 기준: ${draft.explanation.trim()}`
    : matchedRule.mistakeReason;
  const detailedExplanation = [
    matchedRule.detailedExplanation,
    problemStatement
      ? `이 문제를 풀 때는 먼저 "${problemStatement}"에서 구해야 하는 값과 조건을 분리해야 합니다.`
      : "",
    draft.wrong_answer.trim()
      ? `이번 오답에서는 "${draft.wrong_answer.trim()}" 부분을 기준으로, 풀이가 어디서 정답 방향과 달라졌는지 확인해야 합니다.`
      : "",
    draft.correct_answer.trim()
      ? `정답 "${targetAnswer}"으로 가는 풀이와 비교할 때는 답 자체보다 첫 번째로 달라진 풀이 단계를 찾는 것이 중요합니다.`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    confidence,
    correct_solution: correctSolution,
    detailed_explanation: detailedExplanation,
    mistake_reason: mistakeReason,
    pattern: matchedRule.pattern,
    review_direction: matchedRule.reviewDirection,
    review_topics: matchedRule.reviewTopics,
    solution_steps: targetAnswer
      ? [
          "문제 내용을 읽고 구해야 하는 값을 표시합니다.",
          ...matchedRule.solutionSteps,
          `마지막 결과가 "${targetAnswer}"인지 확인합니다.`,
        ]
      : ["문제 내용을 읽고 구해야 하는 값을 표시합니다.", ...matchedRule.solutionSteps],
    solution_strategy: matchedRule.solutionStrategy,
  };
}
