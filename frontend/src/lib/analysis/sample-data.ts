import type { AnalysisRecord } from "@/lib/analysis/types";

export const sampleAnalyses: AnalysisRecord[] = [
  {
    id: "sample-1",
    source_type: "direct",
    image_path: null,
    image_url: null,
    subject: "수학",
    unit: "분수의 나눗셈",
    question_title: "분수 나눗셈 계산",
    problem_statement: "3/4 ÷ 1/2의 값을 구하시오.",
    wrong_answer:
      "3/4 ÷ 1/2 문제에서 분모끼리, 분자끼리 바로 나누어 3/8로 계산했습니다.",
    correct_answer: "3/4 × 2/1 = 3/2",
    explanation: "나눗셈을 역수의 곱셈으로 바꾸는 과정을 놓쳤습니다.",
    pattern: "개념 혼동",
    confidence: 91,
    correct_solution:
      "나눗셈을 역수의 곱셈으로 바꾼 뒤 계산합니다. 3/4 ÷ 1/2는 3/4 × 2/1이 되고, 계산 결과는 6/4 = 3/2입니다.",
    detailed_explanation:
      "이 오답은 분수 나눗셈의 의미를 곱셈 변환과 연결하지 못해서 생긴 것입니다. 분수 나눗셈은 바로 분자끼리, 분모끼리 나누는 문제가 아니라 '몇 배가 되는가'를 묻는 구조입니다. 그래서 두 번째 분수를 역수로 바꿔 곱해야 합니다.",
    mistake_reason:
      "분수 나눗셈에서 역수로 바꾸는 개념을 놓치고, 보이는 숫자끼리 바로 계산했습니다.",
    review_direction:
      "역수 변환의 의미를 먼저 확인하고 유사 문항 3개를 연속으로 풀어봅니다.",
    review_topics: ["역수의 의미", "분수 나눗셈", "곱셈 변환"],
    solution_steps: [
      "나눗셈 기호 뒤의 분수를 역수로 바꿉니다.",
      "분자끼리, 분모끼리 곱합니다.",
      "계산 결과를 약분하고 원래 문제에 대입해 확인합니다.",
    ],
    solution_strategy:
      "나눗셈을 바로 계산하지 말고 역수의 곱셈으로 바꾼 뒤 처리합니다.",
    status: "pending",
    created_at: "2026-07-22T09:00:00.000Z",
  },
  {
    id: "sample-2",
    source_type: "direct",
    image_path: null,
    image_url: null,
    subject: "수학",
    unit: "일차방정식",
    question_title: "이항 후 계수 계산",
    problem_statement: "3x - 4 = x + 4일 때 x의 값을 구하시오.",
    wrong_answer: "x항을 이항한 뒤 부호를 바꾸지 않아 답을 다르게 냈습니다.",
    correct_answer: "2x = 8, x = 4",
    explanation: "이항 과정에서 부호 변화 검산이 필요합니다.",
    pattern: "계산 실수",
    confidence: 84,
    correct_solution:
      "문자 항과 숫자 항을 분리한 뒤 계수를 나누어 x 값을 구합니다. 마지막에는 원래 식에 대입해 양변이 같은지 확인합니다.",
    detailed_explanation:
      "풀이 방향은 맞았지만 이항 과정에서 부호 변화를 놓쳤습니다. 방정식에서는 항을 등호 반대편으로 넘길 때 부호가 바뀌므로, 이 순간을 표시하지 않으면 답이 달라질 수 있습니다.",
    mistake_reason:
      "이항할 때 부호를 유지해서 중간식이 원래 식과 다른 의미가 되었습니다.",
    review_direction: "이항 단계마다 부호 변경을 표시하고 마지막에 대입 검산합니다.",
    review_topics: ["이항", "부호 변화", "대입 검산"],
    solution_steps: [
      "문자의 항과 숫자 항을 양쪽으로 분리합니다.",
      "항을 넘길 때 부호가 바뀌는지 표시합니다.",
      "구한 값을 원래 방정식에 넣어 양변이 같은지 확인합니다.",
    ],
    solution_strategy:
      "이항하는 순간을 표시하고, 마지막에는 반드시 원래 식으로 돌아가 검산합니다.",
    status: "done",
    created_at: "2026-07-21T12:30:00.000Z",
  },
  {
    id: "sample-3",
    source_type: "upload",
    image_path: null,
    image_url: null,
    subject: "수학",
    unit: "함수 그래프",
    question_title: "정의역 조건 확인",
    problem_statement:
      "함수 그래프에서 정의역이 -1 이상 3 이하일 때 최댓값을 구하시오.",
    wrong_answer: "그래프 모양만 보고 정의역 제한 조건을 반영하지 않았습니다.",
    correct_answer: "정의역 범위를 먼저 제한한 뒤 그래프를 해석합니다.",
    explanation: "문제의 범위 조건을 풀이 중 사용하지 않았습니다.",
    pattern: "조건 누락",
    confidence: 79,
    correct_solution:
      "그래프를 해석하기 전에 정의역과 제한 조건을 먼저 적고, 해당 구간 안에서만 답을 찾습니다.",
    detailed_explanation:
      "그래프 문제에서는 모양만 보고 답을 고르면 조건을 놓치기 쉽습니다. 정의역이나 범위 제한은 답 후보를 걸러내는 기준이므로 풀이 첫 단계에서 따로 표시해야 합니다.",
    mistake_reason:
      "그래프의 전체 모양에 집중해 문제에서 제한한 정의역 조건을 적용하지 않았습니다.",
    review_direction: "조건에 밑줄을 긋고 풀이 첫 줄에 범위를 다시 적습니다.",
    review_topics: ["정의역", "범위 조건", "그래프 해석"],
    solution_steps: [
      "정의역과 제한 조건을 먼저 적습니다.",
      "그래프에서 조건에 맞는 구간만 확인합니다.",
      "답이 조건 범위를 벗어나지 않는지 검토합니다.",
    ],
    solution_strategy:
      "그래프 모양을 보기 전에 정의역 조건으로 볼 수 있는 영역을 먼저 제한합니다.",
    status: "reviewing",
    created_at: "2026-07-20T15:10:00.000Z",
  },
];
