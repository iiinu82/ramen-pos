import { useState } from "react";
import styles from "./UserPage.module.css";
import { useSearchParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { initialMenus } from "../data/menu";
import HistoryModal from "../components/HistoryModal";

const TABS = [
  { id: "all", label: "すべて" },
  { id: "ramen", label: "ラーメン" },
  { id: "sub", label: "サブメニュー" },
  { id: "drink", label: "ドリンク" },
];

export default function UserPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [currentStep, setCurrentStep] = useState("select");
  const [cart, setCart] = useState([]);
  const [orderNumber, setOrderNumber] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [myHistory, setMyHistory] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);

  const [searchParams] = useSearchParams();
  const seatNumber = searchParams.get("seat") || "不明";

  const filteredMenus =
    activeTab === "all"
      ? initialMenus
      : initialMenus.filter((item) => item.category === activeTab);

  const openMenuModal = (item) => {
    setSelectedProduct(item);
    setQuantity(1);

    // デフォルトのオプション選択初期化（それぞれのグループの最初の選択肢を選ぶなど）
    const initialOpts = {};
    // 基本ラーメンにはある
    if (item.options) {
      // optionsは麺の硬さ、量が基本でメニューによってチャーシューの数などが加わる
      item.options.forEach((group) => {
        // singleとmultipleがある
        // singleの場合
        if (group.type === "single" && group.choices.length > 0) {
          // 一番最初の選択肢
          initialOpts[group.groupId] = group.choices[0];
        } else if (group.type === "multiple") {
          // multipleの場合は空に
          initialOpts[group.groupId] = [];
        }
      });
    }
    setSelectedOptions(initialOpts);
  };

  // オプションを変更した時の処理
  // 麺の硬さ、固め、シングルを渡したとすると、シングルなので、他の選択（麺の量とか）のデータはそのまま、「麺の硬さ：固め」を入れる
  const handleOptionChange = (groupId, choice, type) => {
    if (type === "single") {
      setSelectedOptions({
        ...selectedOptions,
        [groupId]: choice,
      });
    } else if (type === "multiple") {
      const currentChoices = selectedOptions[groupId] || [];
      const exists = currentChoices.some((c) => c.label === choice.label);
      if (exists) {
        setSelectedOptions({
          ...selectedOptions,
          [groupId]: currentChoices.filter((c) => c.label !== choice.label),
        });
      } else {
        setSelectedOptions({
          ...selectedOptions,
          [groupId]: [...currentChoices, choice],
        });
      }
    }
  };

  // カートに追加する関数（オプション・個数を反映してキッチン文字列も作る）
  const handleAddToCartFromModal = () => {
    if (!selectedProduct) return;

    let optList = [];
    Object.values(selectedOptions).forEach((val) => {
      // 配列（複数選択）ならばそれぞれ入れる。単一（ラジオボタン）ならばそのまま入れる
      if (Array.isArray(val)) {
        val.forEach((v) => optList.push(v));
      } else if (val) {
        optList.push(val);
      }
    });

    let extraPrice = optList.reduce((sum, opt) => sum + (opt.price || 0), 0);
    const itemTotalPrice = (selectedProduct.price + extraPrice) * quantity;

    const optionLabels = optList
      .map((opt) => opt.label)
      .filter((label) => label !== "普通" && label !== "並盛");
    const kitchenDisplayString = [
      selectedProduct.shortName,
      ...optionLabels,
    ].join("　");

    const cartItem = {
      productId: selectedProduct.id,
      name: selectedProduct.name,
      shortName: selectedProduct.shortName,
      imageUrl: selectedProduct.imageUrl,
      price: selectedProduct.price,
      selectedOptions: optList,
      optionLabels: optionLabels,
      kitchenDisplayString: kitchenDisplayString,
      quantity: quantity,
      totalPrice: itemTotalPrice,
    };

    setCart([...cart, cartItem]);
    setSelectedProduct(null);
  };

  // 履歴を見る関数
  const openHistoryModal = () => {
    // 過去の履歴をローカルから取り出す
    const savedHistory = JSON.parse(localStorage.getItem("myOrders") || "[]");
    setMyHistory(savedHistory);
    setIsHistoryModalOpen(true);
  };

  // 注文完了する関数
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      // ★カートに入っている各商品のデータをそのままFirebase用にお引渡しする
      const orderItems = cart.map((item) => ({
        productId: item.productId,
        name: item.name,
        shortName: item.shortName, // ← 略称を追加！
        thumbnail: item.imageUrl, // 画像パス
        imageUrl: item.imageUrl,
        price: item.price,
        quantity: item.quantity, // 個数を追加！
        totalPrice: item.totalPrice, // 小計金額を追加！
        selectedOptions: item.selectedOptions, // 選んだオプションを追加！
        optionLabels: item.optionLabels, // オプションのラベルを追加！
        kitchenDisplayString: item.kitchenDisplayString, // キッチン用文字列を追加！
        isCompleted: false,
      }));

      const newOrder = {
        seatNumber: seatNumber,
        items: orderItems,
        status: "pending",
        orderNumber: Math.floor(Math.random() * 900) + 100,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "orders"), newOrder);

      // ローカルに注文番号を保存
      setOrderNumber(newOrder.orderNumber);
      const existingHistory = JSON.parse(
        localStorage.getItem("myOrders") || "[]",
      );

      //「今日の0時0分0秒」の時刻を取得する
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0); // 時間・分・秒・ミリ秒をすべて0にする

      // 既存の履歴から「今日（todayStart）以降のもの」だけをフィルタリングして残す
      const todayHistory = existingHistory.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= todayStart; // 今日作ったものだけ残す
      });

      const newHistory = [
        {
          seatNumber: newOrder.seatNumber,
          orderNumber: newOrder.orderNumber,
          createdAt: new Date().toISOString(),
        },
        ...todayHistory,
      ];
      localStorage.setItem("myOrders", JSON.stringify(newHistory));

      setCurrentStep("completed");
    } catch (e) {
      console.error("注文の保存に失敗しました: ", e);
      alert("注文に失敗しました。コンソールを確認してください。");
    }
  };

  // --- モーダル内で選ばれているオプションと個数から、現在の合計金額を計算する ---
  const calculateModalTotalPrice = () => {
    if (!selectedProduct) return 0;

    let optList = [];
    Object.values(selectedOptions).forEach((val) => {
      if (Array.isArray(val)) {
        val.forEach((v) => optList.push(v));
      } else if (val) {
        optList.push(val);
      }
    });

    // オプションの追加料金の合計
    let extraPrice = optList.reduce((sum, opt) => sum + (opt.price || 0), 0);

    // （基準価格 ＋ オプション追加料金） × 個数
    return (selectedProduct.price + extraPrice) * quantity;
  };

  const currentTotalPrice = calculateModalTotalPrice();

  // カート内の商品の個数を1つ減らす（0になったらカートから削除する）関数
  const handleDecreaseQuantity = (indexToDecrease) => {
    const targetItem = cart[indexToDecrease];

    if (targetItem.quantity > 1) {
      const unitPrice = targetItem.totalPrice / targetItem.quantity;
      const newQuantity = targetItem.quantity - 1;

      const updatedCart = cart.map((item, index) =>
        index === indexToDecrease
          ? {
              ...item,
              quantity: newQuantity,
              totalPrice: unitPrice * newQuantity,
            }
          : item,
      );
      setCart(updatedCart);
    } else {
      setCart(cart.filter((_, index) => index !== indexToDecrease));
    }
  };

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <div className={styles.mobileContainer}>
        {/* ステップ1: 商品選択＝＞カートに入れる画面 */}
        {currentStep === "select" && (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>{seatNumber}番席でご注文</h1>
              <button
                onClick={openHistoryModal}
                className={styles.historyOpenBtn}
              >
                注文履歴
              </button>
            </div>
            {/* カテゴリタブのボタン群 */}
            <div className={styles.tabArea}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* メニューエリア */}
            <div className={styles.menuArea}>
              <div className={styles.cardArea}>
                {filteredMenus.map((item) => (
                  <div
                    className={styles.card}
                    key={item.id}
                    onClick={() => openMenuModal(item)}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className={styles.thumbnail}
                    />
                    <div className={styles.menuTitle}>{item.name}</div>
                    {/* <button
                      className={styles.addCart}
                      onClick={() => handleAddToCart(item)}
                    >
                      カートに入れる
                    </button> */}
                    <div className={styles.menuPrice}>¥{item.price}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* ---------------------------------------------------------------------------------------------------------------------------------------- */}
            {/* 商品オプション選択モーダル */}
            {selectedProduct && (
              <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                  <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>
                      {selectedProduct.name}
                    </h3>
                    <button
                      className={styles.closeBtn}
                      onClick={() => setSelectedProduct(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className={styles.modalBody}>
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className={styles.modalThumbnail}
                    />
                    <p className={styles.modalBasePrice}>
                      基準価格: ¥{selectedProduct.price}
                    </p>

                    {/* オプション選択ループ */}
                    {selectedProduct.options &&
                      selectedProduct.options.map((group) => (
                        <div
                          key={group.groupId}
                          className={styles.optionGroupSection}
                        >
                          {/* 選択タイトル 麺の硬さ、麺の量など*/}
                          <h4 className={styles.optionGroupTitle}>
                            {group.groupName}
                          </h4>
                          <div className={styles.optionButtonContainer}>
                            {group.choices.map((choice) => {
                              const isSelected =
                                group.type === "single"
                                  ? selectedOptions[group.groupId]?.label ===
                                    choice.label
                                  : (selectedOptions[group.groupId] || []).some(
                                      (c) => c.label === choice.label,
                                    );

                              return (
                                // 選択肢ボタン
                                <button
                                  key={choice.label}
                                  type="button"
                                  onClick={() =>
                                    handleOptionChange(
                                      group.groupId,
                                      choice,
                                      group.type,
                                    )
                                  }
                                  className={
                                    isSelected
                                      ? styles.optionBtnSelected
                                      : styles.optionBtn
                                  }
                                >
                                  {/* 普通、硬め、柔らかめなど選択肢 */}
                                  {choice.label} {/* 追加料金があれば表示 */}
                                  {choice.price > 0
                                    ? `(+¥${choice.price})`
                                    : ""}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                    {/* 個数選択 */}
                    <div className={styles.quantitySection}>
                      <span className={styles.quantityLabel}>個数</span>
                      <div className={styles.quantityControls}>
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className={styles.quantityBtn}
                        >
                          -
                        </button>
                        <span className={styles.quantityValue}>{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(quantity + 1)}
                          className={styles.quantityBtn}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={styles.modalFooter}>
                    <button
                      type="button"
                      onClick={handleAddToCartFromModal}
                      className={styles.addToCartModalBtn}
                    >
                      <span>カートに追加する</span>
                      <span className={styles.totalPrice}>
                        ¥{currentTotalPrice.toLocaleString()}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* ----------------------------------------------------------------------------------------------------------------------- */}
            <div className={styles.footerArea}>
              <p>
                カート内に<span>{totalItemCount}品</span>入っています
              </p>
              <button
                className={styles.proceedCheckout}
                onClick={() => setCurrentStep("confirm")}
                disabled={cart.length === 0}
              >
                注文に進む
              </button>
            </div>
          </>
        )}

        {/* ステップ2: 注文確認画面 */}
        {currentStep === "confirm" && (
          <>
            <h2>ご注文内容の確認</h2>
            <div className={styles.confirmOrder}>
              {cart.map((item, index) => (
                <div className={styles.confirmCard} key={index}>
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className={styles.confirmThumbnail}
                  />
                  <div className={styles.confirmItemInfo}>
                    <div className={styles.confirmMenuTitle}>{item.name}</div>

                    {/* 選んだオプションのラベルを並べて表示 */}
                    {item.optionLabels && item.optionLabels.length > 0 && (
                      <div className={styles.confirmOptions}>
                        {item.optionLabels.join(" / ")}
                      </div>
                    )}

                    {/* マイナスボタン付きの数量変更エリア */}
                    <div className={styles.quantityControlArea}>
                      <span className={styles.quantityText}>
                        数量: {item.quantity}個
                      </span>
                      <button
                        type="button"
                        className={styles.decreaseBtn}
                        onClick={() => handleDecreaseQuantity(index)}
                        title="個数を減らす"
                      >
                        1個減らす
                      </button>
                    </div>
                  </div>

                  {/* 小計金額 */}
                  <div className={styles.confirmItemTotal}>
                    ¥{item.totalPrice.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* 全体の合計金額エリア */}
            <div className={styles.totalAmountBox}>
              <span>合計金額</span>
              <span className={styles.totalAmountPrice}>
                ¥
                {cart
                  .reduce((sum, item) => sum + item.totalPrice, 0)
                  .toLocaleString()}
              </span>
            </div>

            <div className={styles.confirmBtnArea}>
              <button
                type="button"
                className={styles.confirmBackBtn}
                onClick={() => setCurrentStep("select")}
              >
                戻る
              </button>
              <button
                type="button"
                className={styles.confirmCheckoutBtn}
                onClick={handleCheckout}
              >
                注文する
              </button>
            </div>
          </>
        )}

        {/* ステップ3: 注文完了画面＝＞注文番号を表示*/}
        {currentStep === "completed" && (
          <>
            <div className={styles.orderNumContainer}>
              <p className={styles.orderNumDesc}>ご注文番号</p>
              <p className={styles.orderNum}>{orderNumber}</p>
              <p className={styles.orderText}>ただいまお作りしております</p>
            </div>
          </>
        )}
      </div>

      {/* 自分の注文履歴モーダル */}
      {isHistoryModalOpen && (
        <HistoryModal
          history={myHistory}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      )}
    </>
  );
}
