import { useState, useEffect } from "react";
import styles from "./KitchenPage.module.css";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // 画面を開いた時にfirebaseから注文リストの呼び出し
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

  // 注文履歴（モーダルに表示する用。completedとcancelledのものを振り分ける）
  const historyOrders = orders
    .filter((o) => o.status === "completed" || o.status === "cancelled")
    .sort((a, b) => {
      // createdAt がまだサーバーから返ってきていない（null等の）場合のガード処理
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;

      // （降順）
      return timeB - timeA;
    });
  // 該当する商品の isCompleted を反転させる
  const toggleItemComplete = async (orderId, itemIndex, currentItems) => {
    const updatedItems = currentItems.map((item, idx) => {
      if (idx === itemIndex) {
        return { ...item, isCompleted: !item.isCompleted };
      }
      return item;
    });

    // Firestoreのデータを更新
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { items: updatedItems });
  };

  // 「準備OK」ボタンを押したとき（ステータスを "ready" にする。準備完了時間を保存）
  const handleReadyOrder = async (orderId) => {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status: "ready", readyAt: serverTimestamp() });
  };

  // 「受け渡し完了」ボタンを押したとき（statusをcompletedにして履歴で読み取れるようにする）
  const [finishingIds, setFinishingIds] = useState([]); // ボタンを赤く光らせるためのState
  const handleCompleteOrder = (orderId) => {
    // まずボタンを赤く光らせる（完了状態の見た目にする）
    setFinishingIds((prev) => [...prev, orderId]);

    // 1.5秒後にステータスを "completed" に更新して画面から消す
    setTimeout(async () => {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: "completed" });
      setFinishingIds((prev) => prev.filter((id) => id !== orderId));
    }, 1500);
  };

  // 未調理（pending）の注文と、調理完了（ready）の注文に分ける
  const pendingOrders = orders
    .filter((o) => o.status === "pending")
    .sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeA - timeB; // 古い順（昇順）
    });
  // 調理完了（ready）注文が準備OKになった時の時間(readyAt)で並び替える(古いものが上)
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
      return timeA - timeB;
    });

  // キャンセルの関数
  const handleCancelOrder = async (orderId, orderNumber) => {
    //「はい / いいえ」の確認ダイアログ
    const isConfirmed = window.confirm(
      `注文 #${orderNumber} をキャンセルしますか？`,
    );

    if (isConfirmed) {
      try {
        const orderRef = doc(db, "orders", orderId);
        // ステータスを "cancelled" に更新する
        await updateDoc(orderRef, { status: "cancelled" });
        console.log(`注文 #${orderNumber} をキャンセルしました`);
      } catch (e) {
        console.error("キャンセルの更新に失敗しました: ", e);
        alert("キャンセルの処理に失敗しました。");
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>スタッフ用画面</h1>
        <button
          className={styles.historyButton}
          onClick={() => setIsHistoryOpen(true)}
        >
          注文履歴 ({historyOrders.length})
        </button>
      </div>
      <div className={styles.orderDisplay}>
        {/* -------------------------ここから左側エリア----------------------------------------------------------------------------------------- */}
        <div className={styles.cookArea}>
          <h2>未調理 ({pendingOrders.length})</h2>
          {pendingOrders.map((order) => {
            const allCompleted = order.items.every((item) => item.isCompleted);
            return (
              <div className={styles.orderCard} key={order.id}>
                {/* 注文番号 ＆ 席番号の表示 */}
                <div className={styles.orderNum}>
                  {order.seatNumber || "?"}席 <br /> {order.orderNumber}
                </div>

                {/* メニュー一覧エリア */}
                <div className={styles.cardArea}>
                  {order.items.map((item, index) => (
                    <div className={styles.menuCard} key={index}>
                      {/* サムネイル画像 */}
                      <img
                        src={item.imageUrl || item.thumbnail}
                        alt={item.name}
                        className={styles.thumbnail}
                      />

                      {/* 略称 ＋ オプションが詰まったキッチン表示用文字列 ＆ 個数 */}
                      <div className={styles.menuInfo}>
                        <div className={styles.kitchenDisplayString}>
                          {item.kitchenDisplayString || item.name}
                        </div>
                        <div className={styles.itemQuantity}>
                          × {item.quantity || 1}個
                        </div>
                      </div>

                      {/* 調理完了トグルボタン */}
                      <button
                        className={`${styles.menuStateBtn} ${
                          item.isCompleted ? styles.ready : styles.notReady
                        }`}
                        onClick={() =>
                          toggleItemComplete(order.id, index, order.items)
                        }
                      >
                        {item.isCompleted ? "完成" : "未"}
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  className={`${styles.confirmBtn} ${
                    allCompleted ? styles.ready : ""
                  }`}
                  disabled={!allCompleted}
                  onClick={() => handleReadyOrder(order.id)}
                >
                  {allCompleted ? "準備OK" : "未完了"}
                </button>
                <button
                  className={styles.cancelBtn}
                  onClick={() => handleCancelOrder(order.id, order.orderNumber)}
                >
                  キャンセル
                </button>
              </div>
            );
          })}
        </div>

        {/* --------------------ここから右側エリア------------------------------------------------------------------------------------------------------------------------- */}

        {/* 右側の準備完了（お渡し待ち / 会計待ち）エリア */}
        <div className={styles.readyArea}>
          <h2>会計待ち ({readyOrders.length})</h2>
          {readyOrders.map((order) => {
            const isFinishing = finishingIds.includes(order.id);

            // 注文全体の合計金額を計算
            const orderTotalPrice = order.items.reduce(
              (sum, item) =>
                sum + (item.totalPrice || item.price * (item.quantity || 1)),
              0,
            );

            return (
              <div className={styles.orderCard} key={order.id}>
                {/* ① 左側：席番号 # 注文番号 (例: 3 # 456) */}
                <div className={styles.orderNum}>
                  {order.seatNumber || "?"}席 <br /> {order.orderNumber}
                </div>

                <div className={styles.orderInfoArea}>
                  <div className={styles.orderMenuArea}>
                    {order.items.map((item, index) => (
                      <div className={styles.orderMenuInfo} key={index}>
                        <img
                          src={item.thumbnail || item.imageUrl}
                          alt={item.name}
                          className={styles.thumbnail}
                        />

                        {/* 商品名と数量 */}
                        <div style={{ flex: 1 }}>
                          <div
                            className={styles.menuName}
                            style={{
                              fontWeight: "bold",
                              fontSize: "14px",
                              color: "#333",
                            }}
                          >
                            {item.kitchenDisplayString ||
                              item.shortName ||
                              item.name}
                          </div>
                          <div className={styles.itemQuantity}>
                            × {item.quantity || 1}個
                          </div>
                        </div>

                        {/* 各商品の小計金額 */}
                        <div className={styles.totalPrice}>
                          ¥
                          {(
                            item.totalPrice || item.price * (item.quantity || 1)
                          ).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 合計金額表示 */}
                  <div className={styles.orderTotalPrice}>
                    <span className={styles.orderTotalPriceText}>
                      合計金額:
                    </span>
                    <span className={styles.orderTotalPriceNum}>
                      ¥{orderTotalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* ③ 右側：完了ボタン */}
                <div>
                  <button
                    className={`${styles.finishBtn} ${
                      isFinishing ? styles.finishingRed : ""
                    }`}
                    onClick={() => handleCompleteOrder(order.id)}
                  >
                    {isFinishing ? "会計完了" : "未会計"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {/* ------------ここまで右側エリア------------------------------------------------------------------------------------- */}
      </div>

      {/* --- 履歴モーダル --- */}
      {isHistoryOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>過去の注文履歴</h2>
              <button
                className={styles.closeButton}
                onClick={() => setIsHistoryOpen(false)}
              >
                閉じる
              </button>
            </div>

            <div className={styles.historyList}>
              {historyOrders.length === 0 ? (
                <p>履歴はまだありません</p>
              ) : (
                historyOrders.map((order) => (
                  <div className={styles.historyItem} key={order.id}>
                    <div className={styles.historyMenu}>
                      <span>
                        {order.seatNumber || "?"}席#{order.orderNumber}
                      </span>
                      <span>{order.items.map((i) => i.name).join(", ")}</span>
                    </div>
                    <div className={styles.historyState}>
                      {order.status === "completed" ? (
                        <span className={styles.historyBadgeCompleted}>
                          完了
                        </span>
                      ) : (
                        <span className={styles.historyBadgeCancelled}>
                          キャンセル
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
