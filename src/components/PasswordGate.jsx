import { useState } from "react";
import styles from "../pages/SalesPage.module.css";

const PASSWORD = import.meta.env.VITE_SALES_PASSWORD;
const STORAGE_KEY = "salesAuthed";

export default function PasswordGate({ children }) {
  const [isAuthed, setIsAuthed] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === "true",
  );
  const [input, setInput] = useState("");
  const [hasError, setHasError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault(); // フォーム送信でページが再読み込みされるのを止める
    if (input === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      setIsAuthed(true);
    } else {
      setHasError(true);
      setInput("");
    }
  };

  if (isAuthed) return <>{children}</>;

  return (
    <div className={styles.gate}>
      <form className={styles.gateForm} onSubmit={handleSubmit}>
        <p className={styles.gateText}>パスワードを入力してください</p>
        <input
          type="password"
          className={styles.gateInput}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setHasError(false);
          }}
          autoFocus
        />
        <button type="submit" className={styles.gateButton}>
          表示
        </button>
        {hasError && <p className={styles.gateError}>パスワードが違います</p>}
      </form>
    </div>
  );
}
