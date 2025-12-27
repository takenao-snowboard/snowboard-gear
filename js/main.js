// 管理者モード（true = 管理者）
const isAdmin = true;

const manufacturers = {
  board: [
    {
      name: "BURTON",
      country: "USA",
      products: [
        { id: "custom", name: "Custom" },
        { id: "process", name: "Process" }
      ]
    },
    {
      name: "SALOMON",
      country: "France",
      products: [
        { id: "assassin", name: "Assassin" },
        { id: "huck-knife", name: "Huck Knife" }
      ]
    },
    {
      name: "OGASAKA",
      country: "Japan",
      products: [
        { id: "ct", name: "CT" },
        { id: "fc", name: "FC" }
      ]
    },
    {
      name: "YONEX",
      country: "Japan",
      products: [
        { id: "rev", name: "REV" },
        { id: "smooth", name: "SMOOTH" }
      ]
    }
  ]
};

// ===== URLから商品IDを取得 =====
const params = new URLSearchParams(window.location.search);
const productId = params.get("product");
const isDetailPage = !!productId;

/* ===== レビュー保存・取得 ===== */
function getReviews(productId) {
  const data = localStorage.getItem(`reviews_${productId}`);
  return data ? JSON.parse(data) : [];
}

function saveReviews(productId, reviews) {
  localStorage.setItem(
    `reviews_${productId}`,
    JSON.stringify(reviews)
  );
}

// レビュー表示
function renderReviews(productId) {
  const reviewList = document.getElementById("review-list");
  if (!reviewList) return;

  const reviews = getReviews(productId);
  reviewList.innerHTML = "";

  if (reviews.length === 0) {
    reviewList.innerHTML = "<p>まだレビューはありません</p>";
    return;
  }

  reviews.forEach((review, index) => {
    const div = document.createElement("div");
    div.className = "review-item";
    div.innerHTML = `
      <div class="review-rating">${"★".repeat(review.rating)}</div>
      <div class="review-name">${review.nickname}</div>
      <p>${review.text}</p>
      ${isAdmin ? `<button class="delete-review" data-index="${index}">削除</button>` : ""}
    `;
    reviewList.appendChild(div);
  });
  

  //管理者用：削除イベント
  reviewList.querySelectorAll('.delete-review').forEach(button => {
    button.addEventListener('click', () => {
      const index = button.dataset.index;
      const reviews = getReviews(productId);
      reviews.splice(index, 1);
      saveReviews(productId, reviews);
      renderReviews(productId);
    });
  });
}

//レビュー並び替え
function renderSortedReviews(reviews) {
  const reviewList = document.getElementById("review-list");
  if (!reviewList) return;

  reviewList.innerHTML = "";

  if (reviews.length === 0) {
    reviewList.innerHTML = "<p>まだレビューはありません</p>";
    return;
  }

  reviews.forEach((review, index) => {
    const div = document.createElement("div");
    div.className = "review-item";
    div.innerHTML = `
      <div class="review-rating">${"★".repeat(review.rating)}</div>
      <div class="review-name">${review.nickname}</div>
      <p>${review.text}</p>
      ${isAdmin ? `<button class="delete-review" data-index="${index}">削除</button>` : ""}
    `;
    reviewList.appendChild(div);
  });
}

/* ===== レビュー投稿処理 ===== */
function setupReviewForm(productId) {
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

    const reviews = getReviews(productId);
    reviews.unshift({ nickname, age, style, rating, text });

    saveReviews(productId, reviews);
    renderReviews(productId);
  });
}

if (isDetailPage && !productId) {
  alert("商品IDが取得できません");
}

if (!productId) {
  console.warn("商品IDが取得できません");
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
    `;
  }

  }






  const manufacturerList = document.getElementById("manufacturer-list");
if(manufacturerList){
  manufacturers.board.forEach((maker) => {
    const section = document.createElement("div");
    section.className = "accordion-item";
  
    const productList = maker.products
    .map(product => `
      <li>
        <a href="detail.html?product=${product.id}">
          ${product.name}
        </a>
      </li>
    `)
    .join("");
  
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

/* ===== レビュー並び替え ===== */
const sortButtons = document.querySelectorAll('.sort-buttons button');

sortButtons.forEach(button => {
  button.addEventListener('click', () => {
    const sortType = button.dataset.sort;
    let reviews = getReviews(productId);

    if (sortType === 'new') {
      // 新着順（保存順そのまま）
      // 何もしない
    }

    if (sortType === 'high') {
      reviews = reviews.slice().sort((a, b) => b.rating - a.rating);
    }

    if (sortType === 'low') {
      reviews = reviews.slice().sort((a, b) => a.rating - b.rating);
    }

    renderSortedReviews(reviews);
  });
});

  if (isDetailPage) {
    renderReviews(productId);
    setupReviewForm(productId);
  }