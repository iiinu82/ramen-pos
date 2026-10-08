import React from "react";
import styles from "./HistoryModal.module.css";
function HistoryModal({ history, onClose }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.historyModalContent}>
        <div className={styles.historyModalHeader}>
          <h3 className={styles.historyModalTitle}>ご自身の注文履歴</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.historyModalBody}>
          {history.length === 0 ? (
            <p className={styles.noHistory}>過去の注文履歴はありません</p>
          ) : (
            history.map((order, index) => (
              <div className={styles.historyCard} key={index}>
                <span className={styles.historyNum}>
                  {order.seatNumber || "?"}席#{order.orderNumber}
                </span>
                <span className={styles.historyTime}>
                  {new Date(order.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  注文
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoryModal;
