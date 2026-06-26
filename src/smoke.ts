// MCP → 발행 API 통합 스모크. 로컬 API(api/ npm run dev)를 띄우고 실행:
//   KSP_API_URL=http://localhost:8787 npm run smoke
import { health, publishArticle } from './publish.js';

let failures = 0;
const assert = (c: boolean, m: string) => { console.log(`${c ? '✅' : '❌'} ${m}`); if (!c) failures++; };

if (!process.env.KSP_API_URL) {
  console.error('KSP_API_URL 환경변수 필요(예: http://localhost:8787)');
  process.exit(1);
}

console.log('\n=== 1. API health ===');
const h = await health();
assert(h.ok === true, `API 정상 (store=${h.store})`);

console.log('\n=== 2. MCP로 아티클 발행(API 경유) ===');
const article = {
  title: 'MCP→API Smoke Article',
  lang: 'en', tag: 'skincare',
  excerpt: 'End-to-end smoke via MCP client.', read: 2,
  tldr: ['Via MCP to API.'],
  reviewer: { name: 'Dr. Test', cred: 'Cred' },
  sources: [{ n: 1, label: 'Src' }],
  related: [], medicallyReviewedAt: '2025-01-01', body: 'Body.',
};
const r = await publishArticle(article);
assert(r.ok && r.data.ok === true, `발행 성공 (key=${r.data.key})`);

console.log('\n=== 3. 의료 필드 누락 시 API가 거부 ===');
const { reviewer, sources, medicallyReviewedAt, ...bad } = article;
const rb = await publishArticle(bad);
assert(rb.ok === false, `API가 400으로 거부 (HTTP ${rb.status}, errors=${rb.data.errors?.length})`);

console.log(`\n${failures === 0 ? '🎉 MCP↔API 스모크 통과' : `⚠️ ${failures}개 실패`}`);
process.exit(failures === 0 ? 0 : 1);
