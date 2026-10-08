// Cấu hình trình soạn thảo bài viết, dùng chung cho trang admin và cho bộ chuyển Markdown ↔ nội dung
// (AI viết bằng Markdown; script nạp dữ liệu đọc file .md).
import {
  BlocksFeature,
  convertLexicalToMarkdown,
  convertMarkdownToLexical,
  editorConfigFactory,
  EXPERIMENTAL_TableFeature,
  HeadingFeature,
  type FeatureProviderServer,
} from "@payloadcms/richtext-lexical";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import type { Block, Payload } from "payload";

const YOUTUBE = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/;
export const maYoutube = (url: string) => String(url || "").match(YOUTUBE)?.[5] || null;

// Khối chèn trong bài. Giá trong bài phải lấy từ bảng giá (khối giá), không gõ tay: đổi giá là bài tự đổi theo.
export const KHOI: Block[] = [
  {
    slug: "khoiGia",
    labels: { singular: "Khối giá (từ bảng giá)", plural: "Khối giá" },
    fields: [
      { name: "tieuDe", label: "Tiêu đề khối", type: "text", defaultValue: "Giá tham khảo" },
      { name: "dichVu", label: "Dịch vụ", type: "relationship", relationTo: "danh-muc-dich-vu", required: true },
      {
        name: "hangMuc", label: "Hạng mục (để trống = mọi hạng mục của dịch vụ)", type: "relationship", relationTo: "hang-muc-gia", hasMany: true,
        filterOptions: ({ siblingData }) => {
          const dv = (siblingData as { dichVu?: number | { id: number } })?.dichVu;
          return dv ? { dichVu: { equals: typeof dv === "object" ? dv.id : dv } } : true;
        },
      },
      { name: "kemPhiDiLai", label: "Thêm dòng phí đi lại", type: "checkbox", defaultValue: true },
    ],
  },
  {
    slug: "khoiDatLich",
    labels: { singular: "Khối đặt lịch", plural: "Khối đặt lịch" },
    fields: [
      { name: "tieuDe", label: "Tiêu đề", type: "text", defaultValue: "Cần thợ tới tận nơi?" },
      { name: "moTa", label: "Mô tả", type: "text" },
      { name: "dichVu", label: "Dịch vụ điền sẵn", type: "relationship", relationTo: "danh-muc-dich-vu" },
      { name: "khanCap", label: "Nút gọi gấp (thay cho đặt lịch)", type: "checkbox" },
    ],
  },
  {
    slug: "videoYoutube",
    labels: { singular: "Video YouTube", plural: "Video YouTube" },
    fields: [
      { name: "url", label: "Link YouTube", type: "text", required: true, validate: (v: unknown) => Boolean(maYoutube(String(v || ""))) || "Dán link YouTube (youtube.com/watch?v=… hoặc youtu.be/…)" },
      { name: "tieuDe", label: "Tiêu đề video (cho người khiếm thị)", type: "text", required: true },
    ],
  },
];

// Tiêu đề trong bài chỉ cấp 2–4 (cấp 1 là tiêu đề trang). Có bảng và các khối ở trên.
export const tinhNang = ({ defaultFeatures }: { defaultFeatures: FeatureProviderServer[] }) => [
  ...defaultFeatures.filter((f) => f.key !== "heading"),
  HeadingFeature({ enabledHeadingSizes: ["h2", "h3", "h4"] }),
  EXPERIMENTAL_TableFeature(),
  BlocksFeature({ blocks: KHOI }),
];

const cauHinh = (payload: Payload) => editorConfigFactory.fromFeatures({ config: payload.config, features: tinhNang });

export async function markdownSangNoiDung(payload: Payload, markdown: string) {
  return convertMarkdownToLexical({ editorConfig: await cauHinh(payload), markdown });
}

export async function noiDungSangMarkdown(payload: Payload, data: unknown): Promise<string> {
  if (!data || typeof data !== "object" || !("root" in data)) return "";
  return convertLexicalToMarkdown({ data: data as SerializedEditorState, editorConfig: await cauHinh(payload) });
}
