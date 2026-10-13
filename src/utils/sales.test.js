import { describe, test, expect } from "vitest";
import { summarizeOrders, summarizeByProduct } from "./sales";

describe("summarizeOrders(売上の集計)", () => {
  test("注文が0件なら、すべて0", () => {
    expect(summarizeOrders([])).toEqual({
      totalSales: 0,
      completedCount: 0,
      cancelledCount: 0,
      averagePerOrder: 0,
    });
  });

  test("会計済みが1件なら、その金額が売上と客単価になる", () => {
    const orders = [{ status: "completed", totalPrice: 800, items: [] }];
    expect(summarizeOrders(orders)).toEqual({
      totalSales: 800,
      completedCount: 1,
      cancelledCount: 0,
      averagePerOrder: 800,
    });
  });

  test("キャンセルは売上に入らず、件数だけ数える", () => {
    const orders = [
      { status: "completed", totalPrice: 800, items: [] },
      { status: "completed", totalPrice: 1200, items: [] },
      { status: "cancelled", totalPrice: 500, items: [] },
    ];
    expect(summarizeOrders(orders)).toEqual({
      totalSales: 2000,
      completedCount: 2,
      cancelledCount: 1,
      averagePerOrder: 1000,
    });
  });

  test("未調理(pending)と会計待ち(ready)は、売上にも件数にも入らない", () => {
    const orders = [
      { status: "pending", totalPrice: 900, items: [] },
      { status: "ready", totalPrice: 700, items: [] },
    ];
    expect(summarizeOrders(orders)).toEqual({
      totalSales: 0,
      completedCount: 0,
      cancelledCount: 0,
      averagePerOrder: 0,
    });
  });

  test("totalPrice がない古い注文は、商品から計算し直す", () => {
    const orders = [
      {
        status: "completed",
        items: [{ price: 800, quantity: 2 }],
      },
    ];
    expect(summarizeOrders(orders).totalSales).toBe(1600);
  });

  test("totalPrice が0なら、計算し直さず0のまま扱う", () => {
    const orders = [
      {
        status: "completed",
        totalPrice: 0,
        items: [{ price: 800, quantity: 1 }],
      },
    ];
    expect(summarizeOrders(orders).totalSales).toBe(0);
  });

  test("客単価は、割り切れないとき四捨五入する", () => {
    const orders = [
      { status: "completed", totalPrice: 300, items: [] },
      { status: "completed", totalPrice: 300, items: [] },
      { status: "completed", totalPrice: 400, items: [] },
    ];
    // 1000 ÷ 3 = 333.33... → 333
    expect(summarizeOrders(orders).averagePerOrder).toBe(333);
  });
});
describe("summarizeByProduct(商品別の集計)", () => {
  test("注文が0件なら、空の配列", () => {
    expect(summarizeByProduct([])).toEqual([]);
  });

  test("同じ商品は、複数の注文をまたいで合算される(オプション違いも同じ商品)", () => {
    const orders = [
      {
        status: "completed",
        items: [
          {
            productId: "shoyu",
            name: "醤油ラーメン",
            price: 800,
            quantity: 2,
            totalPrice: 1600,
          },
          {
            productId: "gyoza",
            name: "手作り焼き餃子",
            price: 400,
            quantity: 1,
            totalPrice: 400,
          },
        ],
      },
      {
        status: "completed",
        items: [
          {
            productId: "shoyu",
            name: "醤油ラーメン",
            price: 800,
            quantity: 1,
            totalPrice: 950,
          }, // 大盛り
        ],
      },
    ];
    expect(summarizeByProduct(orders)).toEqual([
      { productId: "shoyu", name: "醤油ラーメン", quantity: 3, sales: 2550 },
      { productId: "gyoza", name: "手作り焼き餃子", quantity: 1, sales: 400 },
    ]);
  });

  test("会計済み以外(キャンセル・未調理・会計待ち)は数えない", () => {
    const item = {
      productId: "shoyu",
      name: "醤油ラーメン",
      price: 800,
      quantity: 1,
      totalPrice: 800,
    };
    const orders = [
      { status: "cancelled", items: [item] },
      { status: "pending", items: [item] },
      { status: "ready", items: [item] },
    ];
    expect(summarizeByProduct(orders)).toEqual([]);
  });

  test("売れた個数が多い順に並ぶ", () => {
    const orders = [
      {
        status: "completed",
        items: [
          {
            productId: "gyoza",
            name: "餃子",
            price: 400,
            quantity: 1,
            totalPrice: 400,
          },
          {
            productId: "shoyu",
            name: "醤油",
            price: 800,
            quantity: 3,
            totalPrice: 2400,
          },
        ],
      },
    ];
    const result = summarizeByProduct(orders);
    expect(result.map((r) => r.productId)).toEqual(["shoyu", "gyoza"]);
  });

  test("個数が同じなら、売上が大きいほうが先に来る", () => {
    const orders = [
      {
        status: "completed",
        items: [
          {
            productId: "cola",
            name: "コーラ",
            price: 300,
            quantity: 2,
            totalPrice: 600,
          },
          {
            productId: "beer",
            name: "ビール",
            price: 600,
            quantity: 2,
            totalPrice: 1200,
          },
        ],
      },
    ];
    const result = summarizeByProduct(orders);
    expect(result.map((r) => r.productId)).toEqual(["beer", "cola"]);
  });

  test("totalPrice や quantity がない古い形式は、1個・単価で計算する", () => {
    const orders = [
      {
        status: "completed",
        items: [{ productId: "nitamago", name: "味付け煮玉子", price: 120 }],
      },
    ];
    expect(summarizeByProduct(orders)).toEqual([
      { productId: "nitamago", name: "味付け煮玉子", quantity: 1, sales: 120 },
    ]);
  });
});
