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

  reviews.forEach(review => {
    const div = document.createElement("div");
    div.className = "review-item";
    div.innerHTML = `
      <div class="review-rating">${"★".repeat(review.rating)}</div>
      <div class="review-name">${review.nickname}</div>
      <p>${review.text}</p>
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
    star.addEventListener('click', () => {
      starContainer.dataset.rating = star.dataset.value;
      highlightStars(star.dataset.value);
    });
  });

  textarea.addEventListener('input', () => {
    counter.textContent = `残り ${300 - textarea.value.length} 文字`;
  });

  document.getElementById('submit-review').addEventListener('click', () => {
    const nickname = nicknameInput.value || '匿名';
    const age = ageInput.value || '未設定';
    const style = styleInput.value || '未設定';
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

  /* ===== 文字数カウント ===== */
  const textarea = document.querySelector('textarea');
  const counter = document.querySelector('.char-count');

  textarea.addEventListener('input', () => {
    const remaining = 300 - textarea.value.length;
    counter.textContent = `残り ${remaining} 文字`;
  });

  /* ===== ★評価 ===== */
  const starContainer = document.querySelector('.star-rating');
  const stars = document.querySelectorAll('.star-rating span');

  function highlightStars(rating) {
    stars.forEach(star => {
      star.classList.toggle('active', star.dataset.value <= rating);
    });
  }

  stars.forEach(star => {
    star.addEventListener('mouseover', () => {
      highlightStars(star.dataset.value);
    });

    star.addEventListener('mouseout', () => {
      highlightStars(starContainer.dataset.rating);
    });

    star.addEventListener('click', () => {
      starContainer.dataset.rating = star.dataset.value;
      highlightStars(star.dataset.value);
    });
  });


  // 並び替え
  document.querySelectorAll('.sort-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.sort;
      let sorted = [...reviews];

      if (type === 'high') sorted.sort((a, b) => b.rating - a.rating);
      if (type === 'low') sorted.sort((a, b) => a.rating - b.rating);
      if (type === 'new') sorted.sort((a, b) => new Date(b.date) - new Date(a.date));

      renderReviews(sorted);
    });
  });

  // レビュー投稿
  document.getElementById('submit-review').addEventListener('click', () => {
    const nickname = document.getElementById('nickname').value || '匿名';
    const age = document.getElementById('age').value || '未設定';
    const style = document.getElementById('style').value || '未設定';
    const rating = Number(starContainer.dataset.rating);
    const text = textarea.value.trim();
  
    if (!rating) {
      alert('評価（★）を選択してください');
      return;
    }
  
    if (!text) {
      alert('レビュー内容を入力してください');
      return;
    }
  
    const newReview = {
      nickname,
      age,
      style,
      rating,
      text,
      date: new Date().toISOString().split('T')[0]
    };
  
    if (!allReviews[productId]) {
      allReviews[productId] = [];
    }
    
    renderReviews(allReviews[productId]);

    // フォームリセット
    document.getElementById('nickname').value = '';
    document.getElementById('age').value = '';
    document.getElementById('style').value = '';
    textarea.value = '';
    starContainer.dataset.rating = 0;
    highlightStars(0);
    counter.textContent = '残り 300 文字';
  });

  // レビュー削除
  reviewList.addEventListener('click', (e) => {
    if (!e.target.classList.contains('delete-btn')) return;
  
    const index = Number(e.target.dataset.index);
  
    if (!confirm('このレビューを削除しますか？')) return;
  
    renderReviews(reviews);
  });

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

  if (isDetailPage) {
    renderReviews(productId);
    setupReviewForm(productId);
  }