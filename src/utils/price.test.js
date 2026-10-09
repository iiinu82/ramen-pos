import { describe, test, expect } from "vitest";
import { flattenOptions, calculateTotal } from "./price";

describe("calculateTotal(金額計算)", () => {
  test("オプションなし・1個なら、基準価格のまま", () => {
    const product = { price: 800 };
    expect(calculateTotal(product, [], 1)).toBe(800);
  });

  test("大盛り(+150円)を付けて2個なら、1,900円", () => {
    const product = { price: 800 };
    const optList = [{ label: "大盛り", price: 150 }];
    expect(calculateTotal(product, optList, 2)).toBe(1900);
  });

  test("オプションが空の商品(味玉)を3個なら、360円", () => {
    const product = { price: 120 };
    expect(calculateTotal(product, [], 3)).toBe(360);
  });

  test("複数のオプションの追加料金が全部足される", () => {
    const product = { price: 900 };
    const optList = [
      { label: "大盛り", price: 150 },
      { label: "野菜増", price: 100 },
      { label: "脂増", price: 50 },
    ];
    expect(calculateTotal(product, optList, 1)).toBe(1200);
  });
});

describe("flattenOptions(オプションを1本の配列にする)", () => {
  test("単一選択と複数選択が混ざっていても、1本にまとまる", () => {
    const selectedOptions = {
      noodle_firmness: { label: "固め", price: 0 },
      topping: [
        { label: "野菜増", price: 100 },
        { label: "脂増", price: 50 },
      ],
      empty_group: [],
    };

    expect(flattenOptions(selectedOptions)).toEqual([
      { label: "固め", price: 0 },
      { label: "野菜増", price: 100 },
      { label: "脂増", price: 50 },
    ]);
  });
});
