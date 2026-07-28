import { NextResponse } from "next/server";

type Generation = { id?: string; studentId: string; grade: string; subject: string; text: string; createdAt?: string };

function supabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY,
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as Generation;
  const { url, key } = supabaseConfig();
  if (!url || !key) return NextResponse.json({ saved: false, reason: "Supabase environment variables are not configured" }, { status: 503 });
  const response = await fetch(`${url}/rest/v1/generations`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ student_id: body.studentId, grade: body.grade, subject: body.subject, draft_text: body.text, created_at: body.createdAt || new Date().toISOString() }) });
  if (!response.ok) return NextResponse.json({ saved: false, detail: await response.text() }, { status: response.status });
  return NextResponse.json({ saved: true, data: await response.json() });
}

export async function GET() {
  const { url, key } = supabaseConfig();
  if (!url || !key) return NextResponse.json({ data: [] });
  const response = await fetch(`${url}/rest/v1/generations?select=*&order=created_at.desc&limit=50`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" });
  if (!response.ok) return NextResponse.json({ data: [] }, { status: response.status });
  return NextResponse.json({ data: await response.json() });
}
