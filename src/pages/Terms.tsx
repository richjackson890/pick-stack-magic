import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex items-center h-14 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="ml-2 font-semibold">이용약관</h1>
        </div>
      </header>

      <main className="container py-8 px-4 max-w-3xl">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <h1>서비스 이용약관</h1>
          <p className="text-muted-foreground">최종 업데이트: 2024년 1월</p>

          <h2>제1조 (목적)</h2>
          <p>본 약관은 PickStack(이하 "서비스")의 이용에 관한 기본적인 사항을 규정함을 목적으로 합니다.</p>

          <h2>제2조 (정의)</h2>
          <ul>
            <li><strong>"서비스"</strong>란 사용자가 다양한 플랫폼의 콘텐츠를 저장하고 관리할 수 있도록 제공하는 AI 기반 콘텐츠 큐레이션 서비스를 말합니다.</li>
            <li><strong>"사용자"</strong>란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.</li>
          </ul>

          <h2>제3조 (서비스의 제공)</h2>
          <p>서비스는 다음의 기능을 제공합니다:</p>
          <ul>
            <li>URL, 텍스트, 이미지 저장</li>
            <li>AI 자동 분류 및 요약</li>
            <li>카테고리 관리</li>
            <li>건강 콘텐츠 종합 리포트</li>
          </ul>

          <h2>제4조 (사용자의 의무)</h2>
          <p>사용자는 다음 행위를 하여서는 안 됩니다:</p>
          <ul>
            <li>타인의 정보를 도용하는 행위</li>
            <li>서비스의 정상적인 운영을 방해하는 행위</li>
            <li>불법적인 콘텐츠를 저장하는 행위</li>
            <li>서비스를 상업적 목적으로 무단 이용하는 행위</li>
          </ul>

          <h2>제5조 (건강 정보 면책)</h2>
          <p className="font-semibold text-destructive">중요: 본 서비스에서 제공하는 건강 관련 정보 및 요약은 의료 조언이 아닙니다.</p>
          <ul>
            <li>서비스는 사용자가 저장한 건강 관련 콘텐츠를 정리하고 요약하는 기능만을 제공합니다.</li>
            <li>건강 관련 결정은 반드시 전문 의료인과 상담 후 내리시기 바랍니다.</li>
            <li>서비스는 건강 정보의 정확성, 완전성, 적시성을 보장하지 않습니다.</li>
          </ul>

          <h2>제6조 (지적재산권)</h2>
          <p>서비스에서 저장된 콘텐츠의 원본 저작권은 해당 저작권자에게 있습니다. 서비스는 사용자의 개인적인 콘텐츠 정리를 돕는 도구입니다.</p>

          <h2>제7조 (서비스 변경 및 중단)</h2>
          <p>서비스는 필요에 따라 서비스의 전부 또는 일부를 변경하거나 중단할 수 있습니다.</p>

          <h2>제8조 (약관의 개정)</h2>
          <p>본 약관은 법령 변경 또는 서비스 정책 변경에 따라 수정될 수 있으며, 변경 시 서비스 내 공지합니다.</p>
        </div>
      </main>
    </div>
  );
};

export default Terms;
