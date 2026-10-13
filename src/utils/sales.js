import { calculateItemTotal, calculateOrderTotal } from "./price";

// 1件の注文の合計。保存済みの totalPrice があればそれを使い、なければ計算し直す
const getOrderTotal = (order) =>
  order.totalPrice ?? calculateOrderTotal(order.items);

export const summarizeOrders = (orders) => {
  let totalSales = 0;
  let completedCount = 0;
  let cancelledCount = 0;

  orders.forEach((order) => {
    if (order.status === "completed") {
      totalSales += getOrderTotal(order);
      completedCount += 1;
    } else if (order.status === "cancelled") {
      cancelledCount += 1;
    }
    // pending / ready は、まだお金をもらっていないので数えない
  });

  const averagePerOrder =
    completedCount === 0 ? 0 : Math.round(totalSales / completedCount);

  return { totalSales, completedCount, cancelledCount, averagePerOrder };
};

export const summarizeByProduct = (orders) => {
  const byProduct = {};

  orders.forEach((order) => {
    if (order.status !== "completed") return; // 会計済みだけ数える

    order.items.forEach((item) => {
      const key = item.productId ?? item.name;
      if (!byProduct[key]) {
        byProduct[key] = {
          productId: key,
          name: item.name,
          quantity: 0,
          sales: 0,
        };
      }
      byProduct[key].quantity += item.quantity || 1;
      byProduct[key].sales += calculateItemTotal(item);
    });
  });

  // 売れた個数が多い順。同じ個数なら、売上が大きい順
  return Object.values(byProduct).sort(
    (a, b) => b.quantity - a.quantity || b.sales - a.sales,
  );
};
