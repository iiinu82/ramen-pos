import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { summarizeOrders, summarizeByProduct } from "../utils/sales";
import { productsToCsv } from "../utils/csv";
import styles from "./SalesPage.module.css";
import { getDayRange, getMonthRange } from "../utils/dateRange";

// 今日の日付を "2026-10-11" の形で返す（日本時間のまま）
const getTodayString = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// 今月を "2026-10" の形で返す
const getThisMonthString = () => getTodayString().slice(0, 7);

const MODES = [
  { id: "day", label: "日別" },
  { id: "month", label: "月別" },
];

export default function SalesPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [mode, setMode] = useState("day"); // "day" か "month"
  const [selectedMonth, setSelectedMonth] = useState(getThisMonthString());

  const selectedValue = mode === "day" ? selectedDate : selectedMonth;
  const periodLabel = mode === "day" ? "この日" : "この月";

  // その日の会計済み商品(orders)の売上合計、会計済み商品数、キャンセル商品数、客単価=>(summary)
  const summary = summarizeOrders(orders);
  // その日に売った商品ごとの個数と金額
  const products = summarizeByProduct(orders);

  const summaryItems = [
    { label: "売上合計", value: `¥${summary.totalSales.toLocaleString()}` },
    { label: "会計済み", value: `${summary.completedCount}件` },
    { label: "客単価", value: `¥${summary.averagePerOrder.toLocaleString()}` },
    { label: "キャンセル", value: `${summary.cancelledCount}件` },
  ];

  // CSVに書き出す関数
  const handleDownloadCsv = () => {
    const csv = productsToCsv(selectedValue, products);
    // 先頭の \uFEFF は、Excel が日本語を正しく読むための目印（BOM）
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-${selectedValue}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!selectedValue) return; // 入力が空になったときは何もしない

    let ignore = false;

    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const { start, end } =
          mode === "day"
            ? getDayRange(selectedValue)
            : getMonthRange(selectedValue);

        const q = query(
          collection(db, "orders"),
          where("createdAt", ">=", start),
          where("createdAt", "<", end),
        );
        const snapshot = await getDocs(q);
        if (ignore) return; // 古い読み込みの結果は捨てる
        setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error("注文の読み込みに失敗しました: ", e);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    fetchOrders();
    return () => {
      ignore = true;
    };
  }, [mode, selectedValue]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>売上</h1>

      <div className={styles.toolbar}>
        {/* 日別、月別のボタン 押された方はmodeBtnActiveが付く */}
        <div className={styles.modeTabs}>
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`${styles.modeBtn} ${mode === m.id ? styles.modeBtnActive : ""}`}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* カレンダー */}
        <label className={styles.dateLabel}>
          {mode === "day" ? "日付" : "月"}
          {mode === "day" ? (
            // 日別カレンダー
            <input
              type="date"
              className={styles.dateInput}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          ) : (
            // 月別カレンダー
            <input
              type="month"
              className={styles.dateInput}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          )}
        </label>
      </div>

      {isLoading ? (
        <p className={styles.message}>読み込み中...</p>
      ) : (
        <>
          <div className={styles.summary}>
            {summaryItems.map((item) => (
              <div className={styles.summaryItem} key={item.label}>
                <span className={styles.summaryLabel}>{item.label}</span>
                <span className={styles.summaryValue}>{item.value}</span>
              </div>
            ))}
          </div>

          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>商品別</h2>
            <button
              className={styles.csvButton}
              onClick={handleDownloadCsv}
              disabled={products.length === 0}
            >
              CSVでダウンロード
            </button>
          </div>

          {products.length === 0 ? (
            <p className={styles.message}>
              {periodLabel}の会計済みの注文はありません
            </p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>商品</th>
                    <th className={styles.num}>個数</th>
                    <th className={styles.num}>売上</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.productId}>
                      <td>{p.name}</td>
                      <td className={styles.num}>{p.quantity}</td>
                      <td className={styles.num}>
                        ¥{p.sales.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
