import { Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground">PickStack</h1>
        </div>
        <p className="text-xs text-muted-foreground">AI 콘텐츠 큐레이션</p>
      </div>
    </header>
  );
}
