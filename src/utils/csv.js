// 1つの値を、CSV に入れられる形にする
const escapeCell = (value) => {
  const text = String(value ?? "");
  // カンマ・ダブルクォート・改行を含むときは、全体を " で囲み、中の " は "" にする
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

// 二次元の配列を、CSV の文字列にする
export const toCsv = (rows) =>
  rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");

// 商品別の集計を、CSV の文字列にする
export const productsToCsv = (date, products) =>
  toCsv([
    ["日付", "商品名", "個数", "売上"],
    ...products.map((p) => [date, p.name, p.quantity, p.sales]),
  ]);
