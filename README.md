# SETEUK STUDIO

학생 활동 키워드를 과목별 세부능력 및 특기사항 초안으로 정리하는 웹앱입니다.

## Vercel + Supabase 연결

1. Supabase SQL Editor에서 `supabase/schema.sql`을 실행합니다.
2. Vercel 프로젝트 환경변수에 `.env.example`의 `SUPABASE_URL`, `SUPABASE_ANON_KEY`를 등록합니다. 서버 저장이 필요하면 `SUPABASE_SERVICE_ROLE_KEY`도 등록합니다.
3. `npm run build`로 Vercel 배포 빌드를 확인합니다.

Supabase 환경변수가 없는 개발 환경에서는 입력 결과와 저장 내역이 브라우저 localStorage에 보관되어 UI를 먼저 확인할 수 있습니다. 실제 API 생성 연동은 `/api/generations` 라우트와 개인 설정의 Gemini 키 연결 지점에 확장할 수 있습니다.
