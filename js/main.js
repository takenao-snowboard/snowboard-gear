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

  const manufacturerList = document.getElementById("manufacturer-list");

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

// 管理者モード（true = 管理者）
  const isAdmin = true;
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

  /* ===== レビュー一覧 ===== */
  const savedReviews = localStorage.getItem('reviews');

  const reviews = savedReviews
    ? JSON.parse(savedReviews)
    : [
        {
          nickname: "匿名",
          rating: 4,
          age: "30代",
          style: "フリーラン",
          text: "安定感があり高速域でも安心。",
          date: "2025-01-10"
        },
        {
          nickname: "匿名",
          rating: 5,
          age: "20代",
          style: "パーク",
          text: "反発が良くてジャンプがやりやすい。",
          date: "2025-01-15"
        }
      ];

  const reviewList = document.getElementById('review-list');

  function renderReviews(list) {
    reviewList.innerHTML = '';

    list.forEach((r, index) => {
      const div = document.createElement('div');
      div.className = 'review';

      div.innerHTML = `
        <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
        <div class="review-meta">
          ${r.nickname} / ${r.age} / ${r.style}
        </div>
        <p>${r.text}</p>
        ${
          isAdmin
            ? `<button class="delete-btn" data-index="${index}">削除</button>`
            : ''
        }
      `;

      reviewList.appendChild(div);
    });
  }

  renderReviews(reviews);

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

    /* ===== レビュー投稿 ===== */
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

  reviews.push(newReview);
  localStorage.setItem('reviews', JSON.stringify(reviews));
  renderReviews(reviews);

  // フォームリセット
  document.getElementById('nickname').value = '';
  document.getElementById('age').value = '';
  document.getElementById('style').value = '';
  textarea.value = '';
  starContainer.dataset.rating = 0;
  highlightStars(0);
  counter.textContent = '残り 300 文字';
});

reviewList.addEventListener('click', (e) => {
  if (!e.target.classList.contains('delete-btn')) return;

  const index = Number(e.target.dataset.index);

  if (!confirm('このレビューを削除しますか？')) return;

  reviews.splice(index, 1);
  localStorage.setItem('reviews', JSON.stringify(reviews));
  renderReviews(reviews);
});

const params = new URLSearchParams(window.location.search);
const productId = params.get("product");

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

const detailContainer = document.getElementById("product-detail");

if (detailContainer && currentProduct) {
  detailContainer.innerHTML = `
    <h1>${currentProduct.name}</h1>
    <p>メーカー：${currentProduct.maker}</p>
  `;
}