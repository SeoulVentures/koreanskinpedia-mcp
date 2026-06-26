#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { publishArticle, publishProcedure, publishClinic, uploadImage, health } from './publish.js';

const tools = [
  {
    name: 'create_article',
    description:
      'KoreanSkinpedia 아티클 발행(API 호출). 의료 필수: reviewer{name,cred}, sources[{n,label,url?}](최소 1), medicallyReviewedAt(ISO). 필드: title, lang(en/ko/zh/ja), tag(skincare/procedures/trends), excerpt, read(분), tldr[], related[], translateNote?, body(마크다운). 발행 즉시 사이트에 반영.',
    inputSchema: { type: 'object', additionalProperties: true },
  },
  {
    name: 'create_procedure',
    description:
      '시술 가이드 발행(API). 의료 필수 동일. 필드: name, lang, tagline, priceRange, duration, recovery, definition, how[{n,text}], goodFor[], tldr[], faqs[{q,a}], clinicsHere[], body(마크다운).',
    inputSchema: { type: 'object', additionalProperties: true },
  },
  {
    name: 'upsert_clinic',
    description:
      '클리닉 생성/수정(API). 필드: name, area, verified, rating?, reviewCount?, procedures[], priceList[{name,time,price}], from, langs[], hours, address, payment[], about, reviews[].',
    inputSchema: { type: 'object', additionalProperties: true },
  },
  {
    name: 'upload_image',
    description:
      '이미지 업로드(API). { filename, base64 }(base64는 data URL 또는 순수) → { publicPath: "/images/<id>.<ext>" }. 아티클 본문에 ![alt](publicPath) 로 삽입.',
    inputSchema: {
      type: 'object',
      properties: { filename: { type: 'string' }, base64: { type: 'string' } },
      required: ['filename', 'base64'],
    },
  },
  {
    name: 'health',
    description: '발행 API 상태 확인(store 모드, 버킷).',
    inputSchema: { type: 'object', properties: {} },
  },
];

function text(t: string) {
  return { content: [{ type: 'text' as const, text: t }] };
}

function fmt(r: { ok: boolean; status: number; data: { ok?: boolean; key?: string; slug?: string; store?: string; errors?: string[]; error?: string } }, what: string): string {
  if (r.ok && r.data.ok) {
    return `✅ ${what} 발행 완료\nkey: ${r.data.key}\nslug: ${r.data.slug}\nstore: ${r.data.store}`;
  }
  const errs = r.data.errors?.length ? `\n- ${r.data.errors.join('\n- ')}` : '';
  return `❌ ${what} 발행 실패 (HTTP ${r.status})${errs}${r.data.error ? `\n${r.data.error}` : ''}`;
}

const server = new Server(
  { name: 'koreanskinpedia', version: '0.2.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    switch (name) {
      case 'create_article':
        return text(fmt(await publishArticle(args), '아티클'));
      case 'create_procedure':
        return text(fmt(await publishProcedure(args), '시술'));
      case 'upsert_clinic':
        return text(fmt(await publishClinic(args), '클리닉'));
      case 'upload_image': {
        const { filename, base64 } = args as { filename: string; base64: string };
        const r = await uploadImage(filename, base64);
        if (r.ok && r.data.ok) {
          return text(`✅ 이미지 업로드\npublicPath: ${r.data.key}\n본문에 사용: ![](${r.data.publicPath})`);
        }
        return text(fmt(r, '이미지'));
      }
      case 'health': {
        const h = await health();
        return text(h.ok ? `✅ API 정상 (store=${h.store}, bucket=${h.bucket})` : '❌ API 응답 없음(KSP_API_URL 확인)');
      }
      default:
        return text(`알 수 없는 도구: ${name}`);
    }
  } catch (e) {
    return text(`ERROR: ${(e as Error).message}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
