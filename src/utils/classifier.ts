import { CustomCategory, ClassificationResult, Platform } from '@/types/pickstack';

interface ClassifyInput {
  platform: Platform;
  url?: string;
  title?: string;
  extractedText?: string;
  tagsHint?: string[];
}

/**
 * Simple keyword-based classifier for demo purposes.
 * In production, this would call an AI endpoint.
 */
export function classifyItem(
  input: ClassifyInput,
  categories: CustomCategory[]
): ClassificationResult {
  const textToAnalyze = [
    input.title || '',
    input.url || '',
    input.extractedText || '',
    ...(input.tagsHint || []),
  ]
    .join(' ')
    .toLowerCase();

  // Calculate scores for each category based on keyword matching
  const scores: { category: CustomCategory; score: number }[] = categories.map((category) => {
    let score = 0;
    
    // Check category name match
    if (textToAnalyze.includes(category.name.toLowerCase())) {
      score += 0.4;
    }

    // Check keywords match
    if (category.keywords) {
      const keywords = category.keywords.split(',').map((k) => k.trim().toLowerCase());
      const matchedKeywords = keywords.filter((keyword) => 
        keyword && textToAnalyze.includes(keyword)
      );
      score += matchedKeywords.length * 0.15;
    }

    // Check icon/emoji semantic match (basic)
    if (category.icon) {
      // Health-related icons
      if (['💪', '🏃', '🧘', '💊'].includes(category.icon) && 
          /운동|건강|영양|비타민|다이어트|헬스/.test(textToAnalyze)) {
        score += 0.2;
      }
      // Investment-related
      if (['📈', '💰', '💵', '📊'].includes(category.icon) && 
          /투자|주식|코인|비트코인|암호화폐|부동산/.test(textToAnalyze)) {
        score += 0.2;
      }
      // Recipe-related
      if (['🍳', '🍽️', '👨‍🍳', '🥗'].includes(category.icon) && 
          /요리|레시피|음식|맛집|베이킹/.test(textToAnalyze)) {
        score += 0.2;
      }
      // Architecture-related
      if (['🏛️', '🏠', '🏗️', '📐'].includes(category.icon) && 
          /건축|인테리어|디자인|설계|공간/.test(textToAnalyze)) {
        score += 0.2;
      }
      // Rendering-related
      if (['🎨', '🖌️', '🖼️', '💻'].includes(category.icon) && 
          /렌더링|3d|blender|sketchup|lumion|d5|나노바나나/.test(textToAnalyze)) {
        score += 0.2;
      }
    }

    // Platform-based hints
    if (input.platform === 'YouTube' && 
        /tutorial|강좌|강의|how to|배우기/.test(textToAnalyze)) {
      // Educational content, slightly boost non-default categories
      if (!category.is_default) score += 0.05;
    }

    // Cap score at 1.0
    return { category, score: Math.min(score, 1.0) };
  });

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  const topCategory = scores[0];
  const defaultCategory = categories.find((c) => c.is_default) || categories[categories.length - 1];

  // If no good match, use default category
  const finalCategory = topCategory.score >= 0.15 ? topCategory.category : defaultCategory;
  const confidence = topCategory.score >= 0.15 ? topCategory.score : 0.3;

  // Generate reason
  let reason = '';
  if (confidence >= 0.6) {
    reason = `키워드 "${finalCategory.name}" 관련 내용 감지`;
  } else if (confidence >= 0.3) {
    reason = `"${finalCategory.name}" 카테고리와 부분 일치`;
  } else {
    reason = '명확한 분류 기준 없음, 기타로 분류';
  }

  return {
    category_id: finalCategory.id,
    confidence,
    top3_candidates: scores.slice(0, 3).map((s) => ({
      category_id: s.category.id,
      score: s.score,
    })),
    reason,
  };
}

/**
 * Get classification prompt for AI (for future LLM integration)
 */
export function getClassificationPrompt(
  categories: CustomCategory[],
  input: ClassifyInput
): { system: string; user: string } {
  const categoriesList = categories
    .map((c) => `- id: ${c.id}, name: ${c.name}, keywords: ${c.keywords || 'none'}`)
    .join('\n');

  const system = `You are a classifier for a personal save app. Classify a saved item into one of the user's categories only.
Return JSON with: category_id, confidence, top3_candidates (array of {category_id, score}), reason.
Use the provided user categories list as the only valid labels. Do not invent categories.`;

  const user = `User categories:
${categoriesList}

Item data:
platform=${input.platform}
url=${input.url || 'N/A'}
title=${input.title || 'N/A'}
extracted_text=${input.extractedText || 'N/A'}
tags_hint=${input.tagsHint?.join(', ') || 'N/A'}

Task:
Choose the best category_id from the user categories list. If unclear, lower confidence and provide top 3 candidates.`;

  return { system, user };
}
