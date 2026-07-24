import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type SolveImageRequest = {
  correctAnswer?: string;
  imageDataUrl?: string;
  problemStatement?: string;
  subject?: string;
  unit?: string;
  wrongAnswer?: string;
};

const openAiApiKey = process.env.OPENAI_API_KEY ?? "";
const openAiVisionModel = process.env.OPENAI_VISION_MODEL ?? "gpt-5-mini";

function isValidImageDataUrl(value: string) {
  return /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(value);
}

function getOutputText(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "output_text" in value &&
    typeof value.output_text === "string"
  ) {
    return value.output_text.trim();
  }

  return "";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const claimsResult = await supabase?.auth.getClaims();

  if (!claimsResult?.data?.claims || claimsResult.error) {
    return NextResponse.json({ error: "로그인 후 이용할 수 있습니다." }, { status: 401 });
  }

  if (!openAiApiKey) {
    return NextResponse.json(
      { error: "서버에 OPENAI_API_KEY가 설정되어 있지 않습니다." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as SolveImageRequest;
  const imageDataUrl = body.imageDataUrl?.trim() ?? "";
  const correctAnswer = body.correctAnswer?.trim() ?? "";

  if (!imageDataUrl || !isValidImageDataUrl(imageDataUrl)) {
    return NextResponse.json(
      { error: "PNG, JPG, WebP 문제 이미지를 먼저 첨부해주세요." },
      { status: 400 },
    );
  }

  if (!correctAnswer) {
    return NextResponse.json(
      { error: "정답을 먼저 입력해야 풀이를 생성할 수 있습니다." },
      { status: 400 },
    );
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: openAiVisionModel,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "너는 한국어 수학/학습 풀이 튜터다. 문제 이미지와 사용자가 입력한 정답을 보고, 왜 그 정답이 나오는지 풀이만 설명한다. 이미지에서 문제를 읽을 수 없거나 정답이 이미지 내용과 맞는지 판단할 수 없으면 모르는 척하지 말고 정확히 무엇이 부족한지 말한다.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                `과목: ${body.subject?.trim() || "미입력"}`,
                `단원: ${body.unit?.trim() || "미입력"}`,
                `사용자가 적은 문제 내용: ${
                  body.problemStatement?.trim() || "이미지 기준으로 읽어주세요."
                }`,
                `사용자가 쓴 답/풀이: ${body.wrongAnswer?.trim() || "미입력"}`,
                `정답: ${correctAnswer}`,
                "",
                "요청:",
                "1. 이미지 속 문제를 먼저 읽고 핵심 조건을 짧게 정리하세요.",
                "2. 정답이 왜 그 값/선택지인지 풀이 과정을 단계별로 서술하세요.",
                "3. 사용자가 쓴 답/풀이가 있으면, 어느 지점에서 옳은 풀이와 갈라지는지 설명하세요.",
                "4. 답만 반복하거나 일반 공부 조언으로 채우지 마세요.",
              ].join("\n"),
            },
            {
              type: "input_image",
              image_url: imageDataUrl,
              detail: "high",
            },
          ],
        },
      ],
    }),
  });

  const result = (await response.json()) as unknown;

  if (!response.ok) {
    return NextResponse.json(
      { error: "AI 풀이 생성에 실패했습니다.", detail: result },
      { status: response.status },
    );
  }

  const solution = getOutputText(result);

  if (!solution) {
    return NextResponse.json(
      { error: "AI가 풀이 텍스트를 반환하지 않았습니다." },
      { status: 502 },
    );
  }

  return NextResponse.json({ solution });
}
