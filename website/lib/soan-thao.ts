// Cấu hình trình soạn thảo bài viết, dùng chung cho trang admin và cho bộ chuyển Markdown ↔ nội dung
// (AI viết bằng Markdown; script nạp dữ liệu đọc file .md).
import {
  convertLexicalToMarkdown,
  convertMarkdownToLexical,
  editorConfigFactory,
  EXPERIMENTAL_TableFeature,
  HeadingFeature,
  type FeatureProviderServer,
} from "@payloadcms/richtext-lexical";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import type { Payload } from "payload";

// Tiêu đề trong bài chỉ cấp 2–4 (cấp 1 là tiêu đề trang). Có bảng.
export const tinhNang = ({ defaultFeatures }: { defaultFeatures: FeatureProviderServer[] }) => [
  ...defaultFeatures.filter((f) => f.key !== "heading"),
  HeadingFeature({ enabledHeadingSizes: ["h2", "h3", "h4"] }),
  EXPERIMENTAL_TableFeature(),
];

const cauHinh = (payload: Payload) => editorConfigFactory.fromFeatures({ config: payload.config, features: tinhNang });

export async function markdownSangNoiDung(payload: Payload, markdown: string) {
  return convertMarkdownToLexical({ editorConfig: await cauHinh(payload), markdown });
}

export async function noiDungSangMarkdown(payload: Payload, data: unknown): Promise<string> {
  if (!data || typeof data !== "object" || !("root" in data)) return "";
  return convertLexicalToMarkdown({ data: data as SerializedEditorState, editorConfig: await cauHinh(payload) });
}
