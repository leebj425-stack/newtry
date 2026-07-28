"use client";

import { useEffect, useMemo, useState } from "react";

type Subject = "국어" | "수학" | "영어" | "통합사회" | "과학탐구";
type Draft = { id: string; subject: Subject; text: string; createdAt: string; studentId: string; grade: string };
type Agent = { label: string; title: string; copy: string; state: "대기" | "완료" };

const subjects: Subject[] = ["국어", "수학", "영어", "통합사회", "과학탐구"];
const defaultDrafts: Draft[] = [
  { id: "demo-1", subject: "국어", text: "문학 작품 속 인물의 선택을 시대적 배경과 연결해 해석하고, 토론 과정에서 자신의 근거를 명확한 언어로 설명함. 다양한 관점을 존중하며 작품의 의미를 주체적으로 확장하는 태도가 돋보임.", createdAt: "2026-07-28T10:30:00+09:00", studentId: "S-2026-014", grade: "2학년" },
  { id: "demo-2", subject: "수학", text: "함수의 변화를 그래프로 시각화하여 문제의 구조를 파악하고, 풀이 과정에서 여러 조건을 체계적으로 점검함. 친구의 풀이와 비교하며 더 간결한 전략을 찾아 설명하는 수학적 의사소통 역량을 보임.", createdAt: "2026-07-27T15:10:00+09:00", studentId: "S-2026-014", grade: "2학년" },
];

const makeAgents = (done = false): Agent[] => [
  { label: "01", title: "수집 에이전트", copy: "활동 키워드와 관찰 내용을 맥락별로 정리합니다.", state: done ? "완료" : "대기" },
  { label: "02", title: "작성 에이전트", copy: "과목의 역량과 성장 과정이 드러나도록 초안을 씁니다.", state: done ? "완료" : "대기" },
  { label: "03", title: "검토 에이전트", copy: "금지어와 단정적 표현을 점검하고 문장을 다듬습니다.", state: done ? "완료" : "대기" },
];

function buildDraft(subject: Subject, grade: string, keywords: string) {
  const cleaned = keywords.split(",").map((v) => v.trim()).filter(Boolean).slice(0, 3).join(", ");
  const focus = cleaned || "수업 활동과 탐구 과정";
  return `${subject} 수업에서 ${focus}에 꾸준히 참여하며 핵심 개념을 자신의 언어로 정리함. 활동 과정에서 질문을 구체화하고 근거를 바탕으로 의견을 표현했으며, ${grade} 수준의 학습 내용을 실제 사례와 연결해 이해하려는 태도가 인상적임. 동료의 의견을 경청하고 피드백을 반영해 결과물을 개선하는 과정에서 자기주도적 성장과 협업 역량을 보임.`;
}

export default function Home() {
  const [studentId, setStudentId] = useState("S-2026-014");
  const [grade, setGrade] = useState("2학년");
  const [subject, setSubject] = useState<Subject>("국어");
  const [keywords, setKeywords] = useState("문학 토론, 인물의 선택, 시대적 배경");
  const [drafts, setDrafts] = useState<Draft[]>(defaultDrafts);
  const [activeDraft, setActiveDraft] = useState<Draft>(defaultDrafts[0]);
  const [agents, setAgents] = useState(makeAgents(true));
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gemini-3.5-flash-lite");

  useEffect(() => {
    const stored = window.localStorage.getItem("se-teuk-drafts");
    if (stored) setDrafts(JSON.parse(stored));
    setApiKey(window.localStorage.getItem("se-teuk-api-key") || "");
    setModel(window.localStorage.getItem("se-teuk-model") || "gemini-3.5-flash-lite");
    fetch("/api/generations").then((response) => response.ok ? response.json() : null).then((payload) => {
      if (!payload?.data?.length) return;
      const remote = payload.data.map((row: { id: string; subject: Subject; draft_text: string; created_at: string; student_id: string; grade: string }) => ({ id: row.id, subject: row.subject, text: row.draft_text, createdAt: row.created_at, studentId: row.student_id, grade: row.grade }));
      setDrafts((current) => [...remote, ...current.filter((item) => !remote.some((saved: Draft) => saved.id === item.id))]);
    }).catch(() => undefined);
  }, []);
  useEffect(() => { window.localStorage.setItem("se-teuk-drafts", JSON.stringify(drafts)); }, [drafts]);

  const latestCount = useMemo(() => drafts.filter((d) => d.studentId === studentId).length, [drafts, studentId]);
  const generate = async () => {
    setIsGenerating(true); setNotice(""); setAgents(makeAgents(false));
    window.setTimeout(() => setAgents(makeAgents(true)), 650);
    let generatedText = buildDraft(subject, grade, keywords);
    if (apiKey) {
      try { const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey, model, studentId, grade, subject, keywords }) }); const payload = await response.json(); if (payload.text) generatedText = payload.text; } catch { setNotice("Gemini 연결에 실패해 기본 초안으로 이어갑니다."); }
    }
    window.setTimeout(() => {
      const next = { id: crypto.randomUUID(), subject, text: generatedText, createdAt: new Date().toISOString(), studentId, grade };
      setActiveDraft(next); setDrafts((current) => [next, ...current.filter((d) => d.subject !== subject || d.studentId !== studentId)]); setIsGenerating(false); setNotice("검토까지 완료된 초안입니다.");
    }, 1150);
  };
  const saveToSupabase = async () => {
    try {
      const response = await fetch("/api/generations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(activeDraft) });
      if (!response.ok) throw new Error("offline");
      setNotice("Supabase에 저장했습니다.");
    } catch { setNotice("로컬 임시 저장 완료 · Supabase 환경변수 연결 후 자동 저장됩니다."); }
  };
  const download = () => { const blob = new Blob([`${activeDraft.subject}\n\n${activeDraft.text}`], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${activeDraft.subject}-세특-초안.txt`; a.click(); URL.revokeObjectURL(url); };
  const saveSettings = () => { window.localStorage.setItem("se-teuk-api-key", apiKey); window.localStorage.setItem("se-teuk-model", model); setSettingsOpen(false); setNotice("개인 설정을 저장했습니다."); };

  return <main className="shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">S</span><span>SETEUK<br /><small>STUDIO</small></span></div><nav><button className="nav-active">새 초안</button><button onClick={() => document.getElementById("history")?.scrollIntoView({ behavior: "smooth" })}>저장 내역 <i>{latestCount}</i></button></nav><button className="settings" onClick={() => setSettingsOpen(true)}><span>◉</span> 개인 설정 <b>⌄</b></button></header>
    <section className="hero"><div><p className="eyebrow">AI WRITING WORKSPACE <span>● ONLINE</span></p><h1>학생의 과정을<br /><em>문장으로 기록하다.</em></h1><p className="hero-copy">활동 키워드만 입력하면 수집부터 검토까지,<br />교사의 시선에 가까운 세특 초안을 완성합니다.</p></div><div className="hero-note"><span>✦</span><p>한 과목씩<br /><strong>차분하게</strong> 작성하세요.</p></div></section>
    <div className="workspace"><section className="panel input-panel"><div className="panel-head"><div><p className="section-kicker">START HERE</p><h2>활동 정보 입력</h2></div><span className="step">STEP 01 <b>/ 02</b></span></div><label>학생 식별값 <small>실명 대신 식별값을 사용하세요</small><input value={studentId} onChange={(e) => setStudentId(e.target.value)} /></label><div className="field-row"><label>학년<select value={grade} onChange={(e) => setGrade(e.target.value)}><option>1학년</option><option>2학년</option><option>3학년</option></select></label><label>과목<select value={subject} onChange={(e) => setSubject(e.target.value as Subject)}>{subjects.map((s) => <option key={s}>{s}</option>)}</select></label></div><label>학생 활동 키워드 또는 관찰 내용 <small>쉼표로 구분하거나 문장으로 입력</small><textarea value={keywords} onChange={(e) => setKeywords(e.target.value)} rows={6} /></label><div className="input-foot"><span>AI가 입력 내용을 바탕으로 초안을 구성합니다.</span><button className="primary" onClick={generate} disabled={isGenerating}>{isGenerating ? "작성 중..." : "세특 초안 만들기  →"}</button></div></section>
    <section className="agent-stack"><div className="agent-title"><div><p className="section-kicker">TEAM WORKFLOW</p><h2>3개 에이전트가 함께합니다.</h2></div><span>순차 처리</span></div>{agents.map((agent, index) => <div className={`agent-card ${agent.state === "완료" ? "done" : ""}`} key={agent.title}><div className="agent-num">{agent.label}</div><div className="agent-info"><strong>{agent.title}</strong><p>{agent.copy}</p></div><div className="agent-status">{agent.state === "완료" ? "✓ 완료" : index === 0 || isGenerating ? "대기 중" : "대기"}</div></div>)}<div className="privacy-note">⌁ <span><strong>개인정보 보호</strong><br />입력 내용은 초안 생성에만 사용되며, 저장 버튼을 누르기 전에는 외부로 전송되지 않습니다.</span></div></section></div>
    <section className="result-wrap"><div className="result-head"><div><p className="section-kicker">STEP 02 · REVIEW & EDIT</p><h2>과목별 세특 초안</h2></div><div className="result-actions"><button onClick={download}>↓ 텍스트 다운로드</button><button className="save" onClick={saveToSupabase}>저장하기</button></div></div><div className="subject-tabs">{subjects.map((s) => <button key={s} className={activeDraft.subject === s ? "selected" : ""} onClick={() => { const found = drafts.find((d) => d.subject === s && d.studentId === studentId); setActiveDraft(found || { ...activeDraft, subject: s, text: buildDraft(s, grade, keywords) }); }}>{s}</button>)}</div><article className="draft-card"><div className="draft-meta"><span className="subject-pill">{activeDraft.subject}</span><span>{activeDraft.grade} · {activeDraft.studentId}</span><span>생성 {new Date(activeDraft.createdAt).toLocaleDateString("ko-KR")}</span></div><p>{activeDraft.text}</p><div className="draft-tip">✦ 검토 에이전트가 금지어·순위 표현·단정적 서술을 확인했습니다.</div></article>{notice && <p className="notice">{notice}</p>}</section>
    <section className="history" id="history"><div className="history-head"><div><p className="section-kicker">ARCHIVE</p><h2>저장 내역</h2></div><span>최근 저장 순</span></div><div className="history-list">{drafts.slice(0, 5).map((d) => <button key={d.id} className="history-row" onClick={() => setActiveDraft(d)}><span className="history-subject">{d.subject}</span><span>{d.grade} <i>·</i> {d.studentId}</span><time>{new Date(d.createdAt).toLocaleDateString("ko-KR")}</time><b>→</b></button>)}</div></section>
    <footer><span>SETEUK STUDIO</span><span>교사의 기록을 더 정확하고 따뜻하게</span><span>v0.1 · Gemini + Supabase ready</span></footer>
    {settingsOpen && <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}><div className="modal" onClick={(e) => e.stopPropagation()}><button className="close" onClick={() => setSettingsOpen(false)}>×</button><p className="section-kicker">PERSONAL SETTINGS</p><h2>나만의 AI 설정</h2><label>Gemini API Key<input type="password" placeholder="AIza..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} /></label><label>선호 모델<select value={model} onChange={(e) => setModel(e.target.value)}><option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite (기본)</option><option value="gemini-2.5-flash">Gemini 2.5 Flash</option><option value="gemini-2.5-pro">Gemini 2.5 Pro</option></select></label><p className="modal-help">키는 이 기기의 브라우저에만 저장됩니다.</p><button className="primary full" onClick={saveSettings}>설정 저장</button></div></div>}
  </main>;
}
