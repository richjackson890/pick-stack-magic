import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, BookOpen, Trophy, RefreshCw, Calendar } from 'lucide-react';
import { Tip } from '@/hooks/useTips';
import { ArchiCategory } from '@/hooks/useArchiCategories';
import { callGroq, parseJsonFromLLM } from '@/lib/groqClient';
import { LiquidSpinner } from '@/components/LiquidSpinner';

interface AIReportTabProps {
  tips: Tip[];
  categories: ArchiCategory[];
  getCategoryById: (id: string | null) => ArchiCategory | undefined;
}

interface ReportData {
  topicAnalysis: string;
  recentTrend: string;
  recommendation: string;
  topTips: { title: string; summary: string }[];
}

export function AIReportTab({ tips, categories, getCategoryById }: AIReportTabProps) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  const generateReport = async () => {
    if (tips.length === 0) {
      setError('분석할 팁이 없습니다. 먼저 팁을 저장해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    // Prepare tip data for prompt (limit to recent 50 for token efficiency)
    const tipData = tips.slice(0, 50).map(tip => ({
      title: tip.title,
      category: getCategoryById(tip.category)?.name || 'Uncategorized',
      tags: tip.tags?.join(', ') || '',
      likes: tip.likes || 0,
      date: tip.created_at.slice(0, 10),
    }));

    const categoryNames = categories.map(c => c.name).join(', ');

    const prompt = `당신은 건축 설계 전문 컨설턴트입니다. 아래는 건축 설계팀이 저장한 팁/레퍼런스 목록입니다.

카테고리 목록: ${categoryNames}

저장된 팁 목록 (총 ${tips.length}개, 최근 50개 표시):
${JSON.stringify(tipData, null, 2)}

위 데이터를 분석하여 다음 4개 섹션으로 리포트를 작성해주세요.
반드시 아래 JSON 형식으로만 응답하세요:

{
  "topicAnalysis": "팀/개인이 가장 많이 저장하는 주제와 패턴 분석 (3-4문장)",
  "recentTrend": "최근 트렌드 분석 - 많이 올라온 카테고리와 주제 변화 (3-4문장)",
  "recommendation": "추천 학습 방향 - 부족한 영역과 보완 제안 (3-4문장, 구체적으로)",
  "topTips": [
    { "title": "가장 인기있는 팁 제목", "summary": "이 팁이 왜 유용한지 1-2문장 요약" },
    { "title": "두번째 인기 팁 제목", "summary": "요약" },
    { "title": "세번째 인기 팁 제목", "summary": "요약" }
  ]
}

분석 관점:
- 건축 실무자 관점에서 실질적인 인사이트 제공
- 한국어로 작성
- 카테고리 간 균형을 고려한 제안
- topTips는 좋아요 수와 내용을 기준으로 선정`;

    try {
      const raw = await callGroq(
        [{ role: 'user', content: prompt }],
        { temperature: 0.4, max_tokens: 1200 },
      );

      const parsed = parseJsonFromLLM<ReportData>(raw);
      if (!parsed || !parsed.topicAnalysis) {
        throw new Error('AI 응답을 파싱할 수 없습니다.');
      }

      setReport(parsed);
      setGeneratedAt(new Date());
    } catch (err: any) {
      setError(err.message || 'AI 리포트 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.1, type: 'spring', stiffness: 300, damping: 24 },
    }),
  };

  const sections = report ? [
    {
      icon: BookOpen,
      title: 'Topic Analysis',
      subtitle: '주제 분석',
      content: report.topicAnalysis,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      icon: TrendingUp,
      title: 'Recent Trends',
      subtitle: '최근 트렌드',
      content: report.recentTrend,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    {
      icon: Sparkles,
      title: 'Recommendations',
      subtitle: '추천 학습 방향',
      content: report.recommendation,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ] : [];

  return (
    <div className="min-h-screen pb-28 px-4 pt-4 space-y-5">
      {/* Generate button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 text-center space-y-3"
      >
        <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center mx-auto neon-glow">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold">AI Insight Report</h2>
          <p className="text-xs text-muted-foreground mt-1">
            저장된 {tips.length}개의 팁을 AI가 분석합니다
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={generateReport}
          disabled={loading}
          className="glass-button px-6 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 gradient-primary text-white disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              분석 중...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {report ? '리포트 재생성' : '리포트 생성'}
            </>
          )}
        </motion.button>

        {generatedAt && (
          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <Calendar className="h-3 w-3" />
            {generatedAt.toLocaleString('ko-KR')}
          </p>
        )}
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-8">
          <LiquidSpinner size="lg" />
          <p className="text-sm text-muted-foreground">AI가 팁을 분석하고 있습니다...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-4 border-destructive/30"
        >
          <p className="text-sm text-destructive">{error}</p>
        </motion.div>
      )}

      {/* Report sections */}
      <AnimatePresence>
        {report && !loading && (
          <>
            {sections.map((section, i) => (
              <motion.div
                key={section.title}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className="glass-card p-5 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${section.bg} flex items-center justify-center`}>
                    <section.icon className={`h-4.5 w-4.5 ${section.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{section.title}</h3>
                    <p className="text-[10px] text-muted-foreground">{section.subtitle}</p>
                  </div>
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed pl-12">
                  {section.content}
                </p>
              </motion.div>
            ))}

            {/* Top 3 Tips */}
            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="glass-card p-5 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <Trophy className="h-4.5 w-4.5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Top Tips</h3>
                  <p className="text-[10px] text-muted-foreground">가장 인기있는 팁 TOP 3</p>
                </div>
              </div>
              <div className="space-y-2.5 pl-12">
                {report.topTips.map((tip, idx) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                      className="p-3 rounded-xl bg-secondary/30 space-y-1"
                    >
                      <p className="text-sm font-medium flex items-center gap-2">
                        <span>{medals[idx]}</span>
                        <span className="line-clamp-1">{tip.title}</span>
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {tip.summary}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
