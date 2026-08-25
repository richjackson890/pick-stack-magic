# CLAUDE.md

## RLS 규칙 (필수)
- 새 정책 추가 금지. 권한 문제 발생 시 기존 정책을 수정할 것.
- using(true), with_check(true), to public 사용 금지.
- 협업 테이블(tips, projects, tasks, events, leaves 등): to authenticated + public.is_team_member()
- 관리 기능(멤버 삭제, 팀 수정): public.is_team_admin()
- 개인 데이터(notifications, bookmarks, weekly_snapshots): auth.uid() = user_id
- leave_balance(lb_upd/lb_ins): auth.uid() = user_id or is_team_admin() — 본인 행은 본인이 수정
- team_members를 정책 안에서 직접 조회 금지 — SECURITY DEFINER 함수 경유 (무한 재귀 발생)
- 정책 변경 시 supabase/migrations/ 에 마이그레이션 파일로 남길 것
- 2026-07-24 전체 정책 재작성 완료. 이 구조를 임의로 변경하지 말 것.

## Supabase 프로젝트
- byrcijoczsgsksvooelk (Seoul)
- 관리자 판정 기준: teams.created_by (believe0me77@gmail.com)
- team_members(v1)가 실제 멤버십 소스. team_members_v2는 레거시 1행.
- service key는 서버 사이드 전용. VITE_ 접두사 절대 금지 (브라우저 번들 노출).
- 헬퍼 함수: public.is_team_member(), public.is_team_admin() — 둘 다 SECURITY DEFINER

## 설계 규칙 (중요)
- **leaves 기록은 불완전하다.** 팀원이 앱에 연차를 빼먹고 등록하는 일이 있다.
  따라서 leaves 합계로 used_days를 재계산하면 안 된다 — 실사용분이 날아간다.
  차감은 반드시 델타 방식(등록 +, 삭제 -)으로만 한다.
- 연차 회계연도는 1~12월, 미사용분은 다음 해 2월 말일까지 소진 가능(3월 1일 소멸).
  1~2월 연차는 전년도 잔여에서 먼저 차감하고, 부족분만 당해년도로 넘긴다.
  차감 내역은 leaves.deducted_years (jsonb) 에 기록한다. 예: [{"year":2026,"days":0.5}]
- leaves 삭제는 소프트 삭제(is_deleted=true)다. 집계 시 항상 제외할 것.
- 스키마를 추측하지 말 것. 제약은 pg_constraint 로 확인한다.
- 직급 정렬 기준: 소장>실장>팀장/책임>팀장>대리>소원, 동일 직급은 seniority 오름차순,
  seniority 가 같거나 없으면 가나다순. seniority 는 profiles 컬럼이며
  신규 입사자는 SQL 로 값을 넣어야 한다.
  ProfileSetupModal 의 선택지와 정렬 배열(src/utils/sortMembers.ts)은 항상 일치해야 한다.
- team_members.leave_tracked=false 는 연차 화면에서만 제외한다.
  팁/프로젝트 등 다른 기능에서는 제외하지 않는다.

## 해결됨
- 신규 팀원 연차 등록 실패 / 기존 팀원 연차 수정 실패
  → 원인은 leave_balance 쓰기가 is_team_admin() 전용이었던 것.
    RLS를 본인 행 수정 허용으로 변경해 해결 (20260825000001)
- used_days 자동 재계산 트리거(trg_sync_leave_balance)는 도입했다가 폐기.
  leaves 기록이 불완전해 합계 재계산이 성립하지 않는다. 위 설계 규칙 참고.

## 알려진 미해결 이슈
- team_members INSERT 정책이 auth.uid()=user_id라 자가 가입 가능. Edge Function으로 이전 필요.
- Members 화면에 email/last_sign_in_at 미표시 → 계정↔이름 매칭 불가
- team_members v1/v2 이중 구조 미정리
- teams INSERT 정책 없음 → 새 팀 생성 불가 (의도된 상태, UI에 버튼 있으면 제거)
- 퇴사자 2명(1999alswo, chun1995)의 leave_balance 행이 남아 있음
- 표시명 '부설연구소 김은주' 정리 필요
- balance_deducted 컬럼은 죽은 플래그. 쓰기만 하고 읽지 않음. 정리 대상
- 관리자가 팀원의 직급·seniority 를 수정할 UI 가 없다.
  ProfileSetupModal 에서 본인이 최초 1회 고르는 것이 전부라
  승진·오타 정정은 SQL 로만 가능하다
- leave_balance.total_days/used_days 수동 보정이 유일한 교정 수단.
  델타 차감이 네트워크 실패로 어긋나도 자동 복구되지 않는다.
