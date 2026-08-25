-- 연차 잔여일수: 본인 수정 허용
-- 배경: leave_balance 쓰기가 is_team_admin() 전용이라
--   (1) 신규 팀원은 leave_balance 행이 없어 연차 등록 자체가 실패
--   (2) 기존 팀원은 차감 UPDATE 가 막혀 연차 수정 실패
-- 자동 재계산(트리거) 방식은 시도했다가 폐기했다.
--   leaves 기록이 불완전해(앱에 등록 누락) 합계로 재계산하면 실사용분이 날아간다.
-- 결론: 차감은 클라이언트가 델타 방식으로 하고, 본인 행 수정을 허용한다.

drop policy if exists lb_upd on public.leave_balance;
create policy lb_upd on public.leave_balance for update
to authenticated
using (auth.uid() = user_id or is_team_admin())
with check (auth.uid() = user_id or is_team_admin());

drop policy if exists lb_ins on public.leave_balance;
create policy lb_ins on public.leave_balance for insert
to authenticated
with check (auth.uid() = user_id or is_team_admin());

-- 폐기된 트리거 정리
drop trigger if exists trg_sync_leave_balance on public.leaves;
drop function if exists public.sync_leave_balance();

-- leave_days() 는 유지 — 타입별 차감 일수 계산에 쓸 수 있다
create or replace function public.leave_days(p_type text)
returns numeric language sql immutable as $$
  select case p_type
    when '연차' then 1.0
    when '반차' then 0.5
    when '오전반차' then 0.5
    when '오후반차' then 0.5
    when '오전반반차' then 0.25
    when '오후반반차' then 0.25
    when '외출' then 0
    else 0 end::numeric;
$$;
