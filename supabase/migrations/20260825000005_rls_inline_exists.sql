-- 2026-08-25  RLS: inline the team-membership check as an EXISTS subquery
--
-- 배경
-- ----
-- 정책 조건절에 public.is_team_member() 를 직접 호출하면, 함수를 stable +
-- security definer 로 선언하고 인자를 (select auth.uid()) 로 감싸도 플래너가
-- 이를 InitPlan 으로 끌어올리지 못하고 **행마다 재평가**한다.
-- 결과적으로 13행짜리 team_members 가 상위 쿼리의 행 수만큼 스캔된다.
--
-- 조건절을 EXISTS 서브쿼리로 인라인하면 플래너가 상관관계 없는 서브쿼리로
-- 인식해 InitPlan 으로 승격하고, 쿼리당 1회만 평가한다.
--
-- 실측 (tips / tip_comments 의 SELECT 정책만 전환한 뒤)
--   team_members seq_scan  131,197 → 931   (약 140배 감소)
--
-- 누적 피해: 2026-08-25 기준 team_members(13행) seq_scan 6.8억 회.
-- 클라이언트측 무한 루프(tip_comments 카운트 재조회)가 이를 증폭시켰고,
-- 루프는 커밋 5213274 에서 제거됐다.
--
--
-- 주의 — 이 파일은 재구성본이다
-- ----------------------------
-- 2026-07-24 정책 전면 재작성이 마이그레이션 없이 운영 DB 에 직접 적용됐고,
-- is_team_member() 의 본문도 리포지토리에 없다. 아래 조건절은 헬퍼 함수의
-- 의미(= 현재 사용자가 status='active' 인 team_members 행을 가지는가)에서
-- 역으로 구성한 것이다.
--
-- 적용 전 반드시 실제 정의와 대조할 것:
--
--   select polname, cmd, qual, with_check
--     from pg_policies
--    where schemaname = 'public'
--      and tablename in ('tips','tip_comments');
--
-- 조건절이 다르면 이 파일을 실제 정의에 맞춰 고친 뒤 적용한다.
-- ALTER POLICY 는 멱등이므로 운영 DB 가 이미 이 상태라면 무해하다.


-- ---------------------------------------------------------------------------
-- 1. tips_sel
-- ---------------------------------------------------------------------------
ALTER POLICY tips_sel ON public.tips
  USING (
    EXISTS (
      SELECT 1
        FROM public.team_members tm
       WHERE tm.user_id = (select auth.uid())
         AND tm.status  = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- 2. tip_comments_sel
-- ---------------------------------------------------------------------------
ALTER POLICY tip_comments_sel ON public.tip_comments
  USING (
    EXISTS (
      SELECT 1
        FROM public.team_members tm
       WHERE tm.user_id = (select auth.uid())
         AND tm.status  = 'active'
    )
  );


-- ---------------------------------------------------------------------------
-- TODO — 아직 is_team_member() 를 직접 호출하는 정책
-- ---------------------------------------------------------------------------
-- 아래 테이블의 정책은 전환하지 않았다. 하나씩 바꾸고 그때마다
-- pg_stat_user_tables.seq_scan 으로 효과를 확인할 것.
-- (전환 전 수치를 기록해 두어야 비교가 된다.)
--
--   leaves
--   leave_balance
--   projects
--   project_members
--   project_tasks
--   team_events
--
-- 확인 쿼리 — is_team_member() 를 쓰는 정책 전수 조회:
--
--   select tablename, polname, cmd, qual, with_check
--     from pg_policies
--    where schemaname = 'public'
--      and (qual like '%is_team_member%' or with_check like '%is_team_member%')
--    order by tablename, polname;
--
--
-- ⚠ team_members 는 이 방식을 쓸 수 없다
-- --------------------------------------
-- team_members 자신의 정책에서 team_members 를 서브쿼리로 조회하면
-- 정책이 자기 자신을 재귀 호출해 무한 재귀로 실패한다. 이것이 애초에
-- SECURITY DEFINER 헬퍼를 도입한 이유다(CLAUDE.md RLS 규칙 참고).
-- team_members 정책은 반드시 헬퍼 함수 경유를 유지할 것.
--
-- 다른 테이블의 정책이 team_members 를 EXISTS 로 조회하는 것은 안전하다.
-- 재귀가 아니고, 서브쿼리에 걸리는 team_members 자체의 RLS 는
-- 헬퍼 함수(SECURITY DEFINER)가 처리한다.
--
--
-- ⚠ is_team_admin() 은 별개다
-- ---------------------------
-- 관리 기능 정책(멤버 삭제, 팀 수정 등)이 쓰는 is_team_admin() 은
-- 같은 문제를 갖지만, 대상 행 수가 적어 실측 이득이 크지 않을 수 있다.
-- 위 6개 테이블을 먼저 처리한 뒤 수치를 보고 판단할 것.
