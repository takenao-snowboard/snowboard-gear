// js/products.js
// 商品マスタ（ここが唯一の正本）

window.MANUFACTURERS = [
  {
    maker: "BURTON",
    products: [
      { id: "custom", name: "Custom", season: "2025-2026" },
      { id: "process", name: "Process", season: "2024-2025" }
    ]
  },
  {
    maker: "SALOMON",
    products: [
      { id: "assassin", name: "Assassin", season: "2024-2025" },
      { id: "huck-knife", name: "Huck Knife", season: "2025-2026" }
    ]
  },
  {
    maker: "OGASAKA",
    products: [
      { id: "ct", name: "CT", season: "2024-2025" },
      { id: "fc", name: "FC", season: "2025-2026" }
    ]
  },
  {
    maker: "YONEX",
    products: [
      { id: "rev", name: "REV", season: "2024-2025" },
      { id: "smooth", name: "SMOOTH", season: "2025-2026" }
    ]
  }
];

// 便利関数（HomeのTop5/最新で使う）
window.getAllProducts = function getAllProducts() {
  return (window.MANUFACTURERS || []).flatMap(m =>
    (m.products || []).map(p => ({
      maker: m.maker,
      id: p.id,
      name: p.name,
      season: p.season || "2025-2026"
    }))
  );
};