// KoreanSkinpedia MCP → 발행 API 클라이언트.
// 로컬 파일이 아닌 원격 API(KSP_API_URL)로 콘텐츠를 발행. 외부 사용자는 API 키만으로 사용.
// 검증/저장은 API 서버가 수행(단일 진실 = api/src/schema.ts).

const API_URL = process.env.KSP_API_URL;
const API_KEY = process.env.KSP_API_KEY;

export interface ApiResult {
  ok: boolean;
  status: number;
  data: { ok?: boolean; key?: string; slug?: string; store?: string; publicPath?: string; url?: string; contentType?: string; errors?: string[]; error?: string };
}

async function post(path: string, body: unknown): Promise<ApiResult> {
  if (!API_URL) throw new Error('KSP_API_URL 환경변수 필요(발행 API 베이스 URL)');
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(API_KEY ? { authorization: `Bearer ${API_KEY}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, status: res.status, data: (await res.json().catch(() => ({}))) as ApiResult['data'] };
}

export const publishArticle = (body: unknown) => post('/publish/article', body);
export const publishProcedure = (body: unknown) => post('/publish/procedure', body);
export const publishClinic = (body: unknown) => post('/publish/clinic', body);

// 이미지 업로드: { filename, base64 } → { publicPath } (사이트 /images/<id>).
// base64 는 data URL(data:image/png;base64,...) 또는 순수 base64.
export async function uploadImage(filename: string, base64: string): Promise<ApiResult> {
  return post('/publish/image', { filename, base64 });
}

export async function health(): Promise<{ ok: boolean; store?: string; bucket?: string | null }> {
  if (!API_URL) return { ok: false };
  try {
    const res = await fetch(`${API_URL}/health`);
    return (await res.json()) as { ok: boolean; store?: string; bucket?: string | null };
  } catch {
    return { ok: false };
  }
}
