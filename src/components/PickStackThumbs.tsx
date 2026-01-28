import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * ✅ 인스타/쓰레드는 "무조건 텍스트 썸네일" 정책
 * - thumbnail_url에 instagram/threads가 포함되면 무조건 true 반환
 */
export function isForceTextThumb(url?: string | null) {
  if (!url) return false;
  const u = url.trim().toLowerCase();
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

  return (
    <div className={cn("relative h-full w-full", className)}>
      {/* 배경: 리퀴드/글라스 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.35),transparent_55%),radial-gradient(circle_at_80%_30%,hsl(var(--accent)/0.35),transparent_55%),radial-gradient(circle_at_50%_90%,hsl(var(--secondary)/0.25),transparent_60%)]" />
      <div className="absolute inset-0 bg-background/25" />
      
      {/* 중앙 텍스트 */}
      <div className="relative flex h-full w-full flex-col items-center justify-center p-5 text-center">
        {category ? (
          <div className="mb-3 rounded-full border border-border/15 bg-muted/10 px-3 py-1 text-xs font-semibold text-foreground/85">
            {category}
          </div>
        ) : null}
        <div className="line-clamp-3 text-xl font-black leading-snug tracking-tight text-foreground drop-shadow-[0_10px_24px_hsl(var(--background)/0.7)]">
          {t}
        </div>
        {k?.length ? (
          <div className="mt-3 line-clamp-1 max-w-[92%] text-xs font-medium text-muted-foreground">
            {k.slice(0, 6).join(" · ")}
          </div>
        ) : null}
      </div>
      
      {/* 유리 하이라이트 */}
      <div className="pointer-events-none absolute inset-0 opacity-80 [mask-image:radial-gradient(circle_at_30%_20%,black,transparent_60%)] bg-primary/10" />
    </div>
  );
}
