document.addEventListener("DOMContentLoaded", () => {

// 管理者モード（true = 管理者）
const isAdmin = false;

let currentSort = "new"; // new / high / low
let currentAgeFilter = "";
let currentStyleFilter = "";

let indexSortMode = "default"; // default | rating-desc
let currentSeason = "2025-2026"; // indexのシーズン選択

const manufacturers = {
  board: [
    {
      name: "BURTON",
      country: "USA",
      products: [
        { id: "custom", name: "Custom" },
        { id: "process", name: "Process", season: "2024-2025" }
      ]
    },
    {
      name: "SALOMON",
      country: "France",
      products: [
        { id: "assassin", name: "Assassin" },
        { id: "huck-knife", name: "Huck Knife", season: "2024-2025" }
      ]
    },
    {
      name: "OGASAKA",
      country: "Japan",
      products: [
        { id: "ct", name: "CT" },
        { id: "fc", name: "FC", season: "2024-2025" }
      ]
    },
    {
      name: "YONEX",
      country: "Japan",
      products: [
        { id: "rev", name: "REV" },
        { id: "smooth", name: "SMOOTH", season: "2024-2025" }
      ]
    }
  ]
};

// ===== URLから商品IDを取得 =====
const params = new URLSearchParams(window.location.search);
const productId = params.get("product");

const isDetailHtml = location.pathname.endsWith("detail.html");

if (isDetailHtml && !productId) {
  const detailContainer = document.getElementById("product-detail");
  if (detailContainer) {
    detailContainer.innerHTML = `
      <h1>商品が選択されていません</h1>
      <p>Board一覧から商品を選んでください。</p>
      <p><a href="index.html">← Board一覧へ</a></p>
    `;
  }
  return; // ★ ここで以降の処理を止める
}

// ★ 追加：URL優先でseasonを決める（無ければlocalStorage）
const seasonParam = params.get("season");
const activeSeason = seasonParam || localStorage.getItem("currentSeason") || "2025-2026";
const isDetailPage = !!productId;

const sortBtn = document.getElementById("sort-rating-desc");

if (sortBtn) {
  sortBtn.addEventListener("click", () => {
    indexSortMode = "rating-desc";
    renderManufacturerList(); // 一覧を再描画
  });
}


const seasonSelect = document.getElementById("season-select");
if (seasonSelect) {
  // Homeで選んだシーズンがあれば優先
  const savedSeason = localStorage.getItem("currentSeason");
  if (savedSeason) {
    currentSeason = savedSeason;
    seasonSelect.value = savedSeason; // selectの表示も合わせる
  } else {
    // 保存がなければ、HTMLの初期値を使う
    currentSeason = seasonSelect.value || currentSeason;
  }

  seasonSelect.addEventListener("change", () => {
    currentSeason = seasonSelect.value;
    localStorage.setItem("currentSeason", currentSeason); // ★ index側変更も保存
    renderManufacturerList(); // シーズン変更で再描画
  });
}


/* ===== レビュー保存・取得 ===== */
function reviewKey(productId, season) {
  return `reviews_${season}_${productId}`;
}

function getReviews(productId, season) {
  const data = localStorage.getItem(reviewKey(productId, season));
  return data ? JSON.parse(data) : [];
}

function saveReviews(productId, season, reviews) {
  localStorage.setItem(reviewKey(productId, season), JSON.stringify(reviews));
}

function calculateReviewSummary(reviews) {
  if (reviews.length === 0) {
    return {
      average: 0,
      count: 0
    };
  }

  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  const average = total / reviews.length;

  return {
    average: Math.round(average * 10) / 10, // 小数1桁
    count: reviews.length
  };
}

function getProductSummary(productId, season) {
  const reviews = getReviews(productId, season);
  return calculateReviewSummary(reviews);
}


//削除イベント関数
function attachDeleteEvents(productId, season) {
  const reviewList = document.getElementById("review-list");
  if (!reviewList) return;

  reviewList.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', () => {
      const index = button.dataset.index;
      const reviews = getReviews(productId, season);
      reviews.splice(index, 1);
      saveReviews(productId, season, reviews);
      applySortAndRender();
    });
  });
}

//平均評価表示ロジック
function renderReviewSummary(reviews) {
  const summaryEl = document.getElementById("review-summary");
  if (!summaryEl) return;

  const starsEl = summaryEl.querySelector(".stars");
  const ratingTextEl = summaryEl.querySelector(".rating-text");
  const countEl = summaryEl.querySelector(".review-count");

  if (reviews.length === 0) {
    starsEl.textContent = "☆☆☆☆☆";
    ratingTextEl.textContent = " 未評価";
    countEl.textContent = "（レビューなし）";
    return;
  }

  const avg =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const rounded = Math.round(avg * 10) / 10;

  const fullStars = Math.floor(avg);
  const emptyStars = 5 - fullStars;

  starsEl.textContent =
    "★".repeat(fullStars) + "☆".repeat(emptyStars);
  ratingTextEl.textContent = ` ${rounded} / 5`;
  countEl.textContent = `（${reviews.length}件のレビュー）`;
}


//レビュー並び替え
function renderSortedReviews(reviews) {
  const reviewList = document.getElementById("review-list");
  if (!reviewList) return;

  reviewList.innerHTML = "";

  if (reviews.length === 0) {
    reviewList.innerHTML = "<p>該当するレビューはありません</p>";
    return;
  }

  reviews.forEach((review, index) => {
    const dateText = review.createdAt
      ? new Date(review.createdAt).toLocaleDateString("ja-JP")
      : "";

    const div = document.createElement("div");
    div.className = "review-item";
    div.innerHTML = `
      <div class="review-rating">${"⭐︎".repeat(review.rating)}</div>

      <div class="review-meta">
        <span class="review-name">${review.nickname}</span>
        <span class="review-age">・(${review.age})</span>
        <span class="review-style">・${review.style}</span>
        ${dateText ? `<span class="review-date">${dateText}</span>` : ""}
      </div>

      <p class="review-text">${review.text}</p>

      ${isAdmin ? `<button class="delete-btn" data-index="${index}">削除</button>` : ""}
    `;
    reviewList.appendChild(div);
  });

  attachDeleteEvents(productId, activeSeason);
}

function applySortAndRender() {
  let reviews = getReviews(productId, activeSeason);

  // ===== 絞り込み =====
  if (currentAgeFilter) {
    reviews = reviews.filter(r => r.age === currentAgeFilter);
  }

  if (currentStyleFilter) {
    reviews = reviews.filter(r => r.style === currentStyleFilter);
  }

  // ===== 並び替え =====
  if (currentSort === "high") {
    reviews = reviews.slice().sort((a, b) => b.rating - a.rating);
  }

  if (currentSort === "low") {
    reviews = reviews.slice().sort((a, b) => a.rating - b.rating);
  }

  renderReviewSummary(reviews);
  renderSortedReviews(reviews);
}

/* ===== レビュー投稿処理 ===== */
function setupReviewForm(productId, season) {
  const textarea = document.querySelector('textarea');
  const counter = document.querySelector('.char-count');
  const starContainer = document.querySelector('.star-rating');
  const stars = document.querySelectorAll('.star-rating span');

  function highlightStars(rating) {
    stars.forEach(star => {
      star.classList.toggle('active', star.dataset.value <= rating);
    });
  }

  stars.forEach(star => {
    // マウスオーバー
    star.addEventListener('mouseover', () => {
      highlightStars(star.dataset.value);
    });

    // マウスアウト（確定値に戻す）
    star.addEventListener('mouseout', () => {
      highlightStars(starContainer.dataset.rating || 0);
    });

    // クリック確定
    star.addEventListener('click', () => {
      starContainer.dataset.rating = star.dataset.value;
      highlightStars(star.dataset.value);
    });
  });

  textarea.addEventListener('input', () => {
    counter.textContent = `残り ${300 - textarea.value.length} 文字`;
  });

  document.getElementById('submit-review').addEventListener('click', () => {
    const nickname = document.getElementById('nickname').value || '匿名';
    const age = document.getElementById('age').value || '未設定';
    const style = document.getElementById('style').value || '未設定';
    const rating = Number(starContainer.dataset.rating);
    const text = textarea.value.trim();

    if (!rating || !text) return alert("入力不足です");

    const reviews = getReviews(productId, season);
    const createdAt = new Date().toISOString();
    reviews.unshift({ nickname, age, style, rating, text, createdAt });

    saveReviews(productId, season, reviews);
    applySortAndRender();
    //投稿後フォームリセット
    document.getElementById('nickname').value = "";
    document.getElementById('age').selectedIndex = 0;
    document.getElementById('style').selectedIndex = 0;

    textarea.value = "";
    starContainer.dataset.rating = 0;
    highlightStars(0);
    counter.textContent = "残り 300 文字";
  });
}

if (isDetailPage){

  //商品特定
  let currentProduct = null;
  manufacturers.board.forEach(maker => {
    maker.products.forEach(product => {
      if (product.id === productId) {
        currentProduct = {
          ...product,
          maker: maker.name
        };
      }
    });
  });

  //商品詳細表示
  const detailContainer = document.getElementById("product-detail");

  if (detailContainer && currentProduct) {
    detailContainer.innerHTML = `
      <h1>${currentProduct.name}</h1>
      <p>メーカー：${currentProduct.maker}</p>
      <p id="season-label" class="season-label">
        シーズン：${activeSeason}
      </p>

      <div id="review-summary" class="review-summary">
        <span class="stars"></span>
        <span class="rating-text"></span>
        <span class="review-count"></span>
      </div> 
    `;
  }

}






  function renderManufacturerList() {
    const manufacturerList = document.getElementById("manufacturer-list");
    if (!manufacturerList) return;
  
    manufacturerList.innerHTML = ""; // ★再描画のため必須
  
    const emptyEl = document.getElementById("season-empty");
    let visibleProductCount = 0;

    manufacturers.board.forEach((maker) => {
      const section = document.createElement("div");
      section.className = "accordion-item";
  
      let products = [...maker.products];

      // ★ シーズンで絞り込み（season未指定は2025-2026扱い）
      products = products.filter(p => (p.season || "2025-2026") === currentSeason);

      // ★ 0件ならメーカーごと表示しない
      if (products.length === 0) return;

      // ★ ここでカウント（returnの後ではなく、通過した時点で）
      visibleProductCount += products.length;

  
      // ★ 並び替え（評価が高い順）
      if (indexSortMode === "rating-desc") {
        products.sort((a, b) => {
          const aAvg = getProductSummary(a.id, currentSeason).average || 0;
          const bAvg = getProductSummary(b.id, currentSeason).average || 0;
          return bAvg - aAvg;
        });
      }
  
      const productList = products.map(product => {
        const summary = getProductSummary(product.id, currentSeason);
  
        let ratingHtml = "未評価";
        if (summary.count > 0) {
          const fullStars = Math.floor(summary.average);
          const emptyStars = 5 - fullStars;
          ratingHtml =
            "★".repeat(fullStars) +
            "☆".repeat(emptyStars) +
            ` ${summary.average} (${summary.count})`;
        }
  
        return `
          <li class="product-item">
            <a href="detail.html?product=${product.id}&season=${currentSeason}">
              <span class="product-name">${product.name}</span>
              <span class="product-rating">${ratingHtml}</span>
            </a>
          </li>
        `;
      }).join("");
  
      section.innerHTML = `
        <div class="accordion-header">
          ${maker.name}
          ${maker.country === "Japan" ? "🇯🇵" : ""}
        </div>
        <div class="accordion-content">
          <ul class="product-list">
            ${productList}
          </ul>
        </div>
      `;
  
      manufacturerList.appendChild(section);
    });
  
    if (emptyEl) {
      emptyEl.style.display = visibleProductCount === 0 ? "block" : "none";
    }

    // ★ アコーディオン再設定（再描画後は必須）
    document.querySelectorAll('.accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        const content = header.nextElementSibling;
        const open = content.style.display === 'block';
        content.style.display = open ? 'none' : 'block';
      });
    });
  }

  /* ===== アコーディオン ===== */
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const symbol = header.querySelector('span');
      const open = content.style.display === 'block';
      content.style.display = open ? 'none' : 'block';
      symbol.textContent = open ? '＋' : '−';
    });
  });

  // ===== フィルター（年代・スタイル）は1回だけイベント登録 =====
const ageFilter = document.getElementById("filter-age");
const styleFilter = document.getElementById("filter-style");

if (ageFilter) {
  ageFilter.addEventListener("change", () => {
    currentAgeFilter = ageFilter.value;
    applySortAndRender();
  });
}

if (styleFilter) {
  styleFilter.addEventListener("change", () => {
    currentStyleFilter = styleFilter.value;
    applySortAndRender();
  });
}

/* ===== レビュー並び替え ===== */
const sortButtons = document.querySelectorAll('.sort-buttons button');
// 初期状態：新着順を選択中にする
const defaultSortButton =
  document.querySelector('.sort-buttons button[data-sort="new"]');
if (defaultSortButton) {
  defaultSortButton.classList.add('active');
}
sortButtons.forEach(button => {
  button.addEventListener('click', () => {
    currentSort = button.dataset.sort;
    //★activeを全て外す
    sortButtons.forEach(btn => btn.classList.remove("active"));
    //★押したボタンをactiveに
    button.classList.add("active");
    
    applySortAndRender();

  });
});

  if (isDetailPage) {
    applySortAndRender();
    setupReviewForm(productId, activeSeason);
  }

renderManufacturerList();
});