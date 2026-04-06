import { useState } from "react";
import { X, Download } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export function PwaInstallBanner() {
  const { installable, isDismissed, promptInstall, dismiss } = usePwaInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (!installable || isDismissed) return null;

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      setShowGuide(true);
    }
  };

  if (showGuide) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
          <p className="mb-4 text-center text-lg font-bold text-foreground">
            ✅ 설치 완료!
          </p>
          <p className="mb-5 text-sm text-muted-foreground leading-relaxed text-center">
            컴퓨터 시작 시 자동으로 열리게 하려면:
          </p>
          <ol className="mb-6 space-y-3 text-sm text-foreground">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">1</span>
              <span><strong>Windows 키</strong>를 눌러 시작 메뉴 열기</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">2</span>
              <span><strong>'시작 프로그램'</strong> 검색</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">3</span>
              <span><strong>앱 → 시작프로그램</strong> 열기</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">4</span>
              <span><strong>DLab Archi Tips</strong> 켜기</span>
            </li>
          </ol>
          <button
            onClick={() => setShowGuide(false)}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-lg dark:border-blue-800 dark:bg-blue-950">
        <Download className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <p className="flex-1 text-sm text-blue-900 dark:text-blue-100">
          💻 DLab Archi Tips를 컴퓨터에 설치하세요
        </p>
        <button
          onClick={handleInstall}
          className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          설치하기
        </button>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
