import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * ✅ 인스타/쓰레드는 "무조건 텍스트 썸네일" 정책
 * - thumbnail_url에 instagram/threads가 포함되면 무조건 true 반환
 * - 단, Supabase Storage에서 업로드한 스크린샷은 예외 (screenshots/, covers/ 경로 포함)
 */
export function isForceTextThumb(url?: string | null) {
  if (!url) return false;
  const u = url.trim().toLowerCase();
  
  // Supabase Storage 경로는 사용자가 업로드한 스크린샷이므로 텍스트 썸네일 강제 적용 안함
  if (u.includes('/screenshots/') || u.includes('/covers/')) {
    return false;
  }
  
  return u.includes("instagram") || u.includes("threads");
}

/**
 * 일반적으로 썸네일이 비었는지 판단
 */
export function isEmptyThumb(url?: string | null) {
  if (!url) return true;
  const u = url.trim().toLowerCase();
  return u === "";
}

/**
 * 키워드 없으면 제목에서 임시 추출
 */
export function fallbackKeywords(title?: string) {
  if (!title) return [];
  return title
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .slice(0, 6);
}

/**
 * 제목 기반으로 일관된 랜덤 배경 그라디언트 생성
 */
const gradientPresets = [
  // Warm tones
  "radial-gradient(circle_at_20%_20%,hsl(25,90%,55%,0.4),transparent_55%),radial-gradient(circle_at_80%_30%,hsl(340,80%,50%,0.35),transparent_55%),radial-gradient(circle_at_50%_90%,hsl(45,85%,60%,0.3),transparent_60%)",
  // Cool blues
  "radial-gradient(circle_at_30%_20%,hsl(210,85%,55%,0.4),transparent_55%),radial-gradient(circle_at_70%_80%,hsl(190,80%,50%,0.35),transparent_55%),radial-gradient(circle_at_90%_40%,hsl(240,70%,60%,0.3),transparent_60%)",
  // Purple vibes
  "radial-gradient(circle_at_10%_80%,hsl(280,75%,55%,0.4),transparent_55%),radial-gradient(circle_at_80%_20%,hsl(320,70%,50%,0.35),transparent_55%),radial-gradient(circle_at_50%_50%,hsl(260,80%,60%,0.3),transparent_60%)",
  // Green nature
  "radial-gradient(circle_at_20%_70%,hsl(140,70%,45%,0.4),transparent_55%),radial-gradient(circle_at_80%_30%,hsl(170,65%,50%,0.35),transparent_55%),radial-gradient(circle_at_40%_10%,hsl(100,60%,55%,0.3),transparent_60%)",
  // Sunset orange
  "radial-gradient(circle_at_80%_80%,hsl(15,90%,55%,0.4),transparent_55%),radial-gradient(circle_at_20%_30%,hsl(45,85%,55%,0.35),transparent_55%),radial-gradient(circle_at_60%_10%,hsl(350,75%,50%,0.3),transparent_60%)",
  // Ocean teal
  "radial-gradient(circle_at_30%_90%,hsl(180,70%,45%,0.4),transparent_55%),radial-gradient(circle_at_70%_20%,hsl(200,80%,55%,0.35),transparent_55%),radial-gradient(circle_at_10%_40%,hsl(160,65%,50%,0.3),transparent_60%)",
  // Pink dreams
  "radial-gradient(circle_at_50%_20%,hsl(330,80%,60%,0.4),transparent_55%),radial-gradient(circle_at_20%_80%,hsl(300,70%,55%,0.35),transparent_55%),radial-gradient(circle_at_90%_60%,hsl(350,75%,50%,0.3),transparent_60%)",
  // Golden hour
  "radial-gradient(circle_at_80%_20%,hsl(40,90%,55%,0.4),transparent_55%),radial-gradient(circle_at_20%_70%,hsl(25,85%,50%,0.35),transparent_55%),radial-gradient(circle_at_50%_40%,hsl(55,80%,60%,0.3),transparent_60%)",
];

function getTitleBasedGradient(title?: string): string {
  if (!title) return gradientPresets[0];
  // 제목 기반으로 일관된 인덱스 생성 (같은 제목은 항상 같은 배경)
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradientPresets[hash % gradientPresets.length];
}

/**
 * ✅ 카드(그리드/리스트)용: 인스타/쓰레드면 무조건 텍스트 썸네일 + 중앙 타이틀
 */
export function ItemCard({ item }: { item: any }) {
  const [imgOk, setImgOk] = useState(true);

  const sourceUrl =
    item?.source_url ||
    item?.url ||
    item?.original_url ||
    item?.link ||
    item?.canonical_url ||
    "";

  const forceText = useMemo(() => {
    return isForceTextThumb(sourceUrl) || isForceTextThumb(item?.thumbnail_url);
  }, [sourceUrl, item?.thumbnail_url]);

  const noThumb = useMemo(() => {
    return isEmptyThumb(item?.thumbnail_url) || !imgOk;
  }, [item?.thumbnail_url, imgOk]);

  const keywords = (item?.keywords?.length ? item.keywords : fallbackKeywords(item?.title)) as string[];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/10 bg-card/5 shadow-lg backdrop-blur-xl">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {/* ✅ 인스타/쓰레드면 여기서 바로 텍스트 썸네일로 고정 */}
        {forceText ? (
          <TextThumbnailCard title={item?.title} keywords={keywords} category={item?.category_name} />
        ) : !noThumb ? (
          <>
            <img
              src={item.thumbnail_url}
              alt={item.title ?? "thumbnail"}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              onError={() => setImgOk(false)}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="pointer-events-none absolute inset-0 grid place-items-center p-4">
              <div className="max-w-[92%] text-center">
                <div className="line-clamp-2 text-lg font-extrabold tracking-tight text-white drop-shadow-[0_6px_18px_rgba(0,0,0,0.65)]">
                  {item?.title || "제목 없음"}
                </div>
                {keywords?.length ? (
                  <div className="mt-2 line-clamp-1 text-xs font-medium text-white/85">
                    {keywords.slice(0, 4).join(" · ")}
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <TextThumbnailCard title={item?.title} keywords={keywords} category={item?.category_name} />
        )}
      </div>
      <div className="p-3">
        <div className="line-clamp-1 text-sm font-semibold text-foreground/90">
          {item?.title || "제목 없음"}
        </div>
      </div>
    </div>
  );
}

/**
 * ✅ 상세 페이지(상단 히어로)용: 인스타/쓰레드면 무조건 텍스트 썸네일
 */
export function DetailHero({ item }: { item: any }) {
  const [imgOk, setImgOk] = useState(true);

  const sourceUrl =
    item?.source_url ||
    item?.url ||
    item?.original_url ||
    item?.link ||
    item?.canonical_url ||
    "";

  const forceText = useMemo(() => {
    return isForceTextThumb(sourceUrl) || isForceTextThumb(item?.thumbnail_url);
  }, [sourceUrl, item?.thumbnail_url]);

  const noThumb = useMemo(() => {
    return isEmptyThumb(item?.thumbnail_url) || !imgOk;
  }, [item?.thumbnail_url, imgOk]);

  const keywords = (item?.keywords?.length ? item.keywords : fallbackKeywords(item?.title)) as string[];

  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-border/10 bg-card/5 shadow-xl">
      {/* ✅ 인스타/쓰레드면 텍스트 썸네일 고정 */}
      {forceText ? (
        <TextThumbnailCard title={item?.title} keywords={keywords} category={item?.category_name} />
      ) : !noThumb ? (
        <>
          <img
            src={item.thumbnail_url}
            alt={item.title ?? "thumbnail"}
            className="h-full w-full object-cover"
            onError={() => setImgOk(false)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-0 grid place-items-center p-6">
            <div className="max-w-[92%] text-center">
              <h1 className="line-clamp-2 text-2xl font-black tracking-tight text-white drop-shadow-[0_10px_24px_rgba(0,0,0,0.7)]">
                {item?.title || "제목 없음"}
              </h1>
              {keywords?.length ? (
                <div className="mt-3 line-clamp-1 text-xs font-medium text-white/80">
                  {keywords.slice(0, 6).join(" · ")}
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <TextThumbnailCard title={item?.title} keywords={keywords} category={item?.category_name} />
      )}
    </div>
  );
}

/**
 * ✅ 텍스트 썸네일: 리퀴드 글라스 + 중앙 큰 제목 + 키워드 한 줄
 */
export function TextThumbnailCard({
  title,
  keywords,
  category,
  className,
}: {
  title?: string;
  keywords?: string[];
  category?: string;
  className?: string;
}) {
  const t = (title || "제목 없음").trim();
  const k = keywords?.length ? keywords : fallbackKeywords(t);
  
  // 제목 기반 랜덤 배경 그라디언트
  const bgGradient = useMemo(() => getTitleBasedGradient(title), [title]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      {/* 배경: 제목 기반 랜덤 그라디언트 */}
      <div 
        className="absolute inset-0" 
        style={{ background: bgGradient }}
      />
      {/* 더 진한 오버레이로 텍스트 대비 향상 */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* 중앙 텍스트 - 제목 강조 (강한 그림자 추가) */}
      <div className="relative flex h-full w-full flex-col items-center justify-center p-4 text-center">
        {category ? (
          <div 
            className="mb-2 rounded-full border border-white/30 bg-black/40 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
          >
            {category}
          </div>
        ) : null}
        <div 
          className="line-clamp-3 text-base font-black leading-snug tracking-tight text-white"
          style={{
            textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 4px 8px rgba(0,0,0,0.7), 0 0 20px rgba(0,0,0,0.5)'
          }}
        >
          {t}
        </div>
        {k?.length ? (
          <div 
            className="mt-2 line-clamp-1 max-w-[95%] text-[10px] font-semibold text-white"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
          >
            {k.slice(0, 6).join(" · ")}
          </div>
        ) : null}
      </div>
      
      {/* 유리 하이라이트 */}
      <div className="pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(circle_at_30%_20%,black,transparent_60%)] bg-white/20" />
    </div>
  );
}
