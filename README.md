# KoreanSkinpedia MCP

**발행 API 클라이언트** MCP 서버. 프로젝트 외부 사용자가 Claude Code에서 이 MCP를 추가하고 API 키로 콘텐츠를 발행. 실제 검증/저장은 발행 API(`api/`)가 수행.

## 도구

| 도구 | 설명 |
|---|---|
| `create_article` | 아티클 발행(API `/publish/article`) |
| `create_procedure` | 시술 발행(API `/publish/procedure`) |
| `upsert_clinic` | 클리닉 생성/수정(API `/publish/clinic`) |
| `health` | 발행 API 상태 |

의료 콘텐츠(article/procedure)는 `reviewer`+`sources`(최소 1)+`medicallyReviewedAt`가 필수. API가 Zod로 검증해 거부.

## 환경변수

| 변수 | 설명 |
|---|---|
| `KSP_API_URL` | 발행 API 베이스 URL(필수). 예: `https://<lambda-function-url>.lambda-url.ap-northeast-2.on.aws` |
| `KSP_API_KEY` | API 키(`Authorization: Bearer`). API가 `API_KEY` 설정 시 필요. |

## 외부 사용자 추가(Claude Code)

```bash
claude mcp add koreanskinpedia -- npx ksp-mcp \
  --env KSP_API_URL=https://<발행-API-URL> --env KSP_API_KEY=<키>
```

또는 `.mcp.json`(프로젝트 루트):
```json
{
  "mcpServers": {
    "koreanskinpedia": {
      "command": "node", "args": ["mcp/dist/server.js"],
      "env": { "KSP_API_URL": "https://...", "KSP_API_KEY": "..." }
    }
  }
}
```

## 개발

```bash
cd mcp && npm install && npm run build
KSP_API_URL=http://localhost:8787 npm run smoke   # api/ 가 로컬 실행 중일 때
```
