alter table public.team_members
  add column if not exists leave_tracked boolean not null default true;

-- 부설연구소 소속 3명은 연차 관리 대상이 아니다 (팁/프로젝트 접근은 유지)
update public.team_members tm
set leave_tracked = false
from auth.users u
where u.id = tm.user_id
  and u.email in ('jongwoo@aumlee.com', 'sdcoby99@gmail.com', 'towyssl@aumlee.com');
