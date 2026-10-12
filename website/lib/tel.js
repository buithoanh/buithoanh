// Thuần, dùng được cả ở client component: "tel:19001068" từ "1900 1068". Rỗng khi chưa có hotline.
export const telHref = (hotline) => (hotline ? `tel:${hotline.replace(/[^\d+]/g, "")}` : undefined);
