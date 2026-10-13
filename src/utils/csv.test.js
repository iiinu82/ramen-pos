import { describe, test, expect } from "vitest";
import { toCsv, productsToCsv } from "./csv";

describe("toCsv", () => {
  test("ふつうの値は、カンマでつなぎ、行は改行でつなぐ", () => {
    expect(
      toCsv([
        ["a", 1],
        ["b", 2],
      ]),
    ).toBe("a,1\r\nb,2");
  });

  test("カンマを含む値は、ダブルクォートで囲む", () => {
    expect(toCsv([["醤油,大盛り", 950]])).toBe('"醤油,大盛り",950');
  });

  test('ダブルクォートを含む値は、囲んで、中の " を2つ重ねる', () => {
    expect(toCsv([['5" 皿']])).toBe('"5"" 皿"');
  });

  test("改行を含む値も、囲む", () => {
    expect(toCsv([["a\nb"]])).toBe('"a\nb"');
  });

  test("undefined と null は空欄になり、0 は 0 のまま残る", () => {
    expect(toCsv([[undefined, null, 0]])).toBe(",,0");
  });
});

describe("productsToCsv", () => {
  test("見出しの行のあとに、商品ごとの行が続く", () => {
    const products = [
      { productId: "shoyu", name: "醤油ラーメン", quantity: 3, sales: 2550 },
    ];
    expect(productsToCsv("2026-10-11", products)).toBe(
      "日付,商品名,個数,売上\r\n2026-10-11,醤油ラーメン,3,2550",
    );
  });

  test("商品がないときは、見出しの行だけ", () => {
    expect(productsToCsv("2026-10-11", [])).toBe("日付,商品名,個数,売上");
  });
});
