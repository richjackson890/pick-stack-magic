-- 연차 잔여일수 자동 동기화
-- 2026-08-25 Supabase 대시보드에서 실행됨. 기록/재현용.
--
-- 배경: 클라이언트가 leave_balance.used_days 를 직접 차감하던 구조에서
--   (1) 삭제 시 미복원, (2) 수정 시 중복 차감, (3) RLS상 leave_balance 쓰기는
--       is_team_admin() 전용이라 일반 팀원은 항상 실패
--   세 문제가 겹쳐 used_days 가 실제 leaves 합계의 3배까지 부풀어 있었다(95.5 → 30.25).
--   차감 책임을 DB 트리거로 이관하고 클라이언트 쓰기는 전부 제거했다.
--   RLS 정책은 변경하지 않는다.

-- 연차 타입별 차감 일수
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

-- year 보정 (leave_balance 는 (user_id, year) unique 로 연도별 관리)
update public.leave_balance
set year = extract(year from current_date)::int
where year is null;

alter table public.leave_balance
  alter column year set not null,
  alter column year set default extract(year from current_date)::int;

-- leaves 변경 시 leave_balance.used_days 재계산
-- security definer: leave_balance 쓰기는 is_team_admin() 전용이므로
--                   일반 팀원 세션에서도 동작하도록 RLS 우회
-- is_deleted: deleteLeave 가 소프트 삭제라 UPDATE 경로로 들어온다. 삭제분은 집계 제외.
-- 연도 배열: 연도를 걸친 수정/삭제도 처리하기 위해 new/old 양쪽 연도를 재계산
create or replace function public.sync_leave_balance()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare
  target uuid := coalesce(new.user_id, old.user_id);
  yrs int[];
  y int;
  total numeric;
begin
  yrs := array_remove(array[
    extract(year from new.leave_date)::int,
    extract(year from old.leave_date)::int
  ], null);

  foreach y in array yrs loop
    select coalesce(sum(public.leave_days(l.type)), 0)
      into total
    from public.leaves l
    where l.user_id = target
      and coalesce(l.is_deleted, false) = false
      and extract(year from l.leave_date)::int = y;

    insert into public.leave_balance (user_id, total_days, used_days, year)
    values (target, 15, total, y)
    on conflict (user_id, year) do update
      set used_days = excluded.used_days, updated_at = now();
  end loop;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_sync_leave_balance on public.leaves;
create trigger trg_sync_leave_balance
after insert or update or delete on public.leaves
for each row execute function public.sync_leave_balance();

-- 활성 팀원 전원에게 leave_balance 행 보장 (신규 가입자 대응)
insert into public.leave_balance (user_id, total_days, used_days, year)
select tm.user_id, 15, 0, extract(year from current_date)::int
from public.team_members tm
where tm.status = 'active'
  and not exists (
    select 1 from public.leave_balance lb
    where lb.user_id = tm.user_id
      and lb.year = extract(year from current_date)::int
  );

-- 전원 used_days 재계산 (연도별, 오염값 정리)
update public.leave_balance lb
set used_days = coalesce((
  select sum(public.leave_days(l.type))
  from public.leaves l
  where l.user_id = lb.user_id
    and coalesce(l.is_deleted, false) = false
    and extract(year from l.leave_date)::int = lb.year
), 0), updated_at = now();
