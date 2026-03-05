import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';

export default function PaymentFail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message') || '결제가 취소되었거나 실패했습니다.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-8 max-w-sm w-full text-center"
      >
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-lg font-bold mb-2">결제 실패</h2>
        <p className="text-sm text-muted-foreground mb-2">{decodeURIComponent(errorMessage)}</p>
        {errorCode && (
          <p className="text-xs text-muted-foreground/60 mb-6">오류 코드: {errorCode}</p>
        )}
        <button
          onClick={() => navigate('/')}
          className="w-full py-3 rounded-xl font-semibold bg-primary text-primary-foreground"
        >
          홈으로 돌아가기
        </button>
      </motion.div>
    </div>
  );
}
