import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex items-center h-14 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="ml-2 font-semibold">개인정보처리방침</h1>
        </div>
      </header>

      <main className="container py-8 px-4 max-w-3xl">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <h1>개인정보처리방침</h1>
          <p className="text-muted-foreground">최종 업데이트: 2024년 1월</p>

          <h2>1. 개인정보의 수집 및 이용 목적</h2>
          <p>PickStack(이하 "서비스")은 다음의 목적을 위해 개인정보를 수집합니다:</p>
          <ul>
            <li>회원 가입 및 관리</li>
            <li>서비스 제공 및 운영</li>
            <li>사용자 맞춤 콘텐츠 제공</li>
          </ul>

          <h2>2. 수집하는 개인정보 항목</h2>
          <ul>
            <li><strong>필수 항목:</strong> 이메일 주소</li>
            <li><strong>선택 항목:</strong> 프로필 이름, 프로필 이미지</li>
            <li><strong>자동 수집 항목:</strong> 서비스 이용 기록, 저장된 콘텐츠</li>
          </ul>

          <h2>3. 개인정보의 보유 및 이용 기간</h2>
          <p>회원 탈퇴 시까지 보유하며, 탈퇴 후 즉시 파기합니다. 단, 관계 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.</p>

          <h2>4. 개인정보의 제3자 제공</h2>
          <p>서비스는 사용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 법령에 의한 요청이 있는 경우 예외로 합니다.</p>

          <h2>5. 이용자의 권리</h2>
          <p>사용자는 언제든지 자신의 개인정보에 대해 다음의 권리를 행사할 수 있습니다:</p>
          <ul>
            <li>개인정보 열람 요청</li>
            <li>개인정보 수정 요청</li>
            <li>개인정보 삭제 요청</li>
            <li>회원 탈퇴</li>
          </ul>

          <h2>6. 개인정보 보호책임자</h2>
          <p>개인정보 관련 문의는 서비스 내 문의 기능을 통해 연락해 주세요.</p>

          <h2>7. 개정 이력</h2>
          <p>본 개인정보처리방침은 법령 변경 또는 서비스 정책 변경에 따라 수정될 수 있습니다.</p>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
