import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { apiKey, model, studentId, grade, subject, keywords } = await request.json();
  if (!apiKey) return NextResponse.json({ configured: false });
  const prompt = `당신은 한국 고등학교 교사의 세부능력 및 특기사항 작성 보조자입니다. 학생 식별값 ${studentId}, ${grade}, 과목 ${subject}의 활동 관찰 내용을 바탕으로 350자 이내 한 문단 초안을 작성하세요. 학생을 평가하거나 순위를 매기는 표현, 단정적 표현, 금지어는 피하고 실제 활동 과정·근거·성장을 중심으로 씁니다. 관찰 내용: ${keywords}`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-3.5-flash-lite"}:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
  if (!response.ok) return NextResponse.json({ configured: true, error: await response.text() }, { status: response.status });
  const data = await response.json();
  return NextResponse.json({ configured: true, text: data.candidates?.[0]?.content?.parts?.[0]?.text || "" });
}
