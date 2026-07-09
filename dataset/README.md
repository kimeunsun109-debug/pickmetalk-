# PickmeTalk 대화 데이터셋

연인형 AI 대화를 **분석·태그·점수**하여 축적하는 자산입니다. 원문 전체가 아닌 **문장 단위 분류**로 저장합니다.

## 구조

```
dataset/
  daily_logs/YYYY-MM-DD.json
  best_lines.json
  best_lines/{empathy,humor,kick_lines,...}.json
  patterns/{conversation_patterns,user_style_patterns}.json
  statistics/score.json
```

## 일일 수집 (30턴+)

```bash
npm run dataset:daily              # 오늘 아침·점심·저녁 × 10턴
npm run dataset:daily -- --date 2026-07-03 --turns 10
```

## Supabase 저널

```bash
npm run supabase:db-push           # 007 chat_voice_journal
```

## 태그

상황 · 감정 · 공감 · 센스 · 드립 · 생활밀착 · 관심 · 질문 · 마무리 · 행동유도 · 명대사 · 리액션

★★★★★ 문장만 `best_lines.json` 및 카테고리별 JSON에 추가됩니다.
