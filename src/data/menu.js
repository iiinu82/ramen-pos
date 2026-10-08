// ラーメン屋のメニューデータ（初期データ）

// 共通で使えるオプションの定義
const commonRamenOptions = [
  {
    groupId: "noodle_firmness",
    groupName: "麺の固さ",
    type: "single",
    choices: [
      { label: "普通", price: 0 },
      { label: "固め", price: 0 },
      { label: "柔らかめ", price: 0 },
    ],
  },
  {
    groupId: "noodle_amount",
    groupName: "麺の量",
    type: "single",
    choices: [
      { label: "並盛", price: 0 },
      { label: "大盛り", price: 150 },
    ],
  },
];

export const initialMenus = [
  {
    id: "shoyu",
    name: "醤油ラーメン",
    shortName: "醤油",
    price: 800,
    category: "ramen",
    imageUrl: "/ra-men-ya/r-syoyu.jpg",
    options: commonRamenOptions,
  },
  {
    id: "miso",
    name: "味噌ラーメン",
    shortName: "ミソ",
    price: 850,
    category: "ramen",
    imageUrl: "/ra-men-ya/r-miso.jpg",
    options: commonRamenOptions,
  },
  {
    id: "tonkotsu",
    name: "豚骨ラーメン",
    shortName: "豚骨",
    price: 850,
    category: "ramen",
    imageUrl: "/ra-men-ya/r-tonkotsu.jpg",
    options: commonRamenOptions,
  },
  {
    id: "shio",
    name: "塩ラーメン",
    shortName: "塩",
    price: 800,
    category: "ramen",
    imageUrl: "/ra-men-ya/r-sio.jpg",
    options: commonRamenOptions,
  },
  {
    id: "chashumen",
    name: "チャーシューメン",
    shortName: "チャーシュー",
    price: 1100,
    category: "ramen",
    imageUrl: "/ra-men-ya/r-tya-shu.jpg",
    options: [
      ...commonRamenOptions,
      {
        groupId: "chashu_count",
        groupName: "チャーシュー枚数",
        type: "single",
        choices: [
          { label: "5枚", price: 0 },
          { label: "8枚", price: 150 },
        ],
      },
    ],
  },
  {
    id: "abura_ramen",
    name: "豚脂ラーメン",
    shortName: "豚脂",
    price: 900,
    category: "ramen",
    imageUrl: "/ra-men-ya/r-jiro-kei.jpg",
    options: [
      ...commonRamenOptions,
      {
        groupId: "topping",
        groupName: "トッピング",
        type: "multiple",
        choices: [
          { label: "野菜増", price: 100 },
          { label: "脂増", price: 50 },
          { label: "にんにく増", price: 20 },
        ],
      },
    ],
  },
  {
    id: "kara_negi",
    name: "辛ネギラーメン",
    shortName: "辛ネギ",
    price: 950,
    category: "ramen",
    imageUrl: "/ra-men-ya/r-negi.jpg",
    options: commonRamenOptions,
  },
  {
    id: "gyoza",
    name: "手作り焼き餃子",
    shortName: "餃子",
    price: 400,
    category: "sub",
    imageUrl: "/ra-men-ya/r-gyo-za.jpg",
    options: [
      {
        groupId: "gyoza_count",
        groupName: "個数",
        type: "single",
        choices: [
          { label: "5個", price: 0 },
          { label: "7個", price: 150 },
          { label: "10個", price: 300 },
        ],
      },
    ],
  },
  {
    id: "nitamago",
    name: "味付け煮玉子",
    shortName: "味玉",
    price: 120,
    category: "sub",
    imageUrl: "/ra-men-ya/r-nitamago.jpg",
    options: [],
  },
  {
    id: "tya-shu3mai",
    name: "チャーシュー",
    shortName: "焼豚単品",
    price: 150,
    category: "sub",
    imageUrl: "/ra-men-ya/r-tyashu-3mai.jpg",
    options: [],
  },

  // --- ドリンク カテゴリ ---
  {
    id: "beer",
    name: "生ビール（中ジョッキ）",
    shortName: "ビール",
    price: 600,
    category: "drink",
    imageUrl: "/ra-men-ya/r-tyu-jyokki.jpg",
    options: [],
  },
  {
    id: "cola",
    name: "コカ・コーラ",
    shortName: "コーラ",
    price: 300,
    category: "drink",
    imageUrl: "/ra-men-ya/r-cola.jpg",
    options: [],
  },
  {
    id: "orange",
    name: "オレンジジュース",
    shortName: "オレンジ",
    price: 300,
    category: "drink",
    imageUrl: "/ra-men-ya/r-orange-juice.jpg",
    options: [],
  },
  {
    id: "oolong",
    name: "烏龍茶",
    shortName: "烏龍茶",
    price: 300,
    category: "drink",
    imageUrl: "/ra-men-ya/r-uron-tya.jpg",
    options: [],
  },
];
