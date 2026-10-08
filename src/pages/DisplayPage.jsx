import { useState, useEffect } from "react";
import styles from "./DisplayPage.module.css";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function DisplayPage() {
  const [orders, setOrders] = useState([]);

  // 1. Firebaseからリアルタイムで注文を監視・取得
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "orders"), (snapshot) => {
      const orderList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(orderList);
    });
    return () => unsubscribe();
  }, []);

  // 2. ステータスごとに注文番号をフィルタリング
  const waitOrders = orders
    .filter((o) => o.status === "pending")
    .sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeA - timeB; // 古い順（昇順）
    });
  const readyOrders = orders
    .filter((o) => o.status === "ready")
    .sort((a, b) => {
      // readyAt があればそれを優先、なければ createdAt を使う安全設計
      const timeA = (a.readyAt || a.createdAt)?.toMillis
        ? (a.readyAt || a.createdAt).toMillis()
        : 0;
      const timeB = (b.readyAt || b.createdAt)?.toMillis
        ? (b.readyAt || b.createdAt).toMillis()
        : 0;
      return timeA - timeB; // 古い順（先に準備できたものが上）
    });

  return (
    <>
      <h1 className={styles.title}>オーダー表 (Display)</h1>
      <div className={styles.container}>
        <div className={styles.stateTitleArea}>
          <div className={`${styles.stateTitle} ${styles.waitTitle}`}>
            オーダー
          </div>
          <div className={`${styles.stateTitle} ${styles.okTitle}`}>未会計</div>
        </div>
        <div className={styles.orderNumArea}>
          <div className={`${styles.orderNum} ${styles.waitNum}`}>
            {waitOrders.map((order) => (
              <p key={order.id}>{String(order.orderNumber).padStart(3, "0")}</p>
            ))}
          </div>
          <div className={`${styles.orderNum} ${styles.okNum}`}>
            {readyOrders.map((order) => (
              <p key={order.id}>{String(order.orderNumber).padStart(3, "0")}</p>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
