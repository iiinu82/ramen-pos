import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import UserPage from "./pages/UserPage";
import KitchenPage from "./pages/KitchenPage";
import DisplayPage from "./pages/DisplayPage";
import { useState } from "react";
function App() {
  const [useNewDesign, setUseNewDesign] = useState(false);
  return (
    <BrowserRouter>
      {/* 開発時の画面切り替えを楽にするための簡易ナビゲーションバー */}
      <nav
        style={{
          display: "flex",
          gap: "0px 20px",
          flexWrap: "wrap",
          alignContent: "flex-start",
        }}
      >
        <span>POSシステム開発用ナビ:</span>
        <button onClick={() => setUseNewDesign(!useNewDesign)}>
          デザイン切替（{useNewDesign ? "オリジナルに" : "AIデザインに"}）
        </button>
        <Link to="/">顧客用 (/)</Link>
        <span>席シミュ:</span>
        <Link
          to="/?seat=1"
          style={{ color: "#0066cc" }}
          useNewDesign={useNewDesign}
        >
          1番席
        </Link>
        <Link
          to="/?seat=2"
          style={{ color: "#0066cc" }}
          useNewDesign={useNewDesign}
        >
          2番席
        </Link>
        <Link
          to="/?seat=3"
          style={{ color: "#0066cc" }}
          useNewDesign={useNewDesign}
        >
          3番席
        </Link>
        <Link
          to="/?seat=4"
          style={{ color: "#0066cc" }}
          useNewDesign={useNewDesign}
        >
          4番席
        </Link>
        <Link
          to="/?seat=5"
          style={{ color: "#0066cc" }}
          useNewDesign={useNewDesign}
        >
          5番席
        </Link>
        <Link to="/kitchen">キッチン (/kitchen)</Link>
        <Link to="/display">ディスプレイ (/display)</Link>
      </nav>

      {/* ルーティング設定 */}
      <Routes>
        <Route path="/" element={<UserPage useNewDesign={useNewDesign} />} />
        <Route path="/kitchen" element={<KitchenPage />} />
        <Route path="/display" element={<DisplayPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
