-- 연차 차감 대상 연도 기록
-- 배경: 연차 회계연도는 1~12월이고 미사용 잔여분은 다음 해 2월 말일까지만 소진 가능하다.
--   따라서 1~2월 연차는 전년도 잔여에서 먼저 빼고 모자란 만큼 당해년도에서 뺀다.
--   한 건이 두 연도로 분할될 수 있어 (연도, 일수) 쌍을 배열로 저장한다.
--   예: [{"year": 2026, "days": 0.5}, {"year": 2027, "days": 0.5}]
--   삭제/복원은 이 값을 그대로 되돌린다. 비어 있으면 아무것도 가감하지 않는다.
--
-- 백필하지 않는다: 현재 leave_balance.used_days 는 leaves 와 무관하다(앱 밖에서 쓴 분이 대부분).
--   어느 leaves 행이 balance 에 반영됐는지 알 수 없으므로 백필은 근거 없는 추정이고,
--   추정으로 채운 뒤 그 행을 삭제하면 없던 잔여일수가 생긴다.
--   기존 행은 빈 배열로 남겨 삭제/복원 시 balance 를 건드리지 않게 한다.
--   (leaves.balance_deducted 는 전 행이 true 인 죽은 플래그라 근거로 쓰지 않는다.)

alter table public.leaves
  add column if not exists deducted_years jsonb not null default '[]'::jsonb;
