document.addEventListener("DOMContentLoaded", () => {
  const isAdmin = false;

  let currentSort = "new";
  let currentAgeFilter = "";
  let currentStyleFilter = "";
  let indexSortMode = "default";
  let currentSeason = "2025-2026";
  let currentSearch = "";

  function normalizeText(s) {
    return (s || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
      .replace(/[ぁ-ん]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0x60));
  }

  const params = new URLSearchParams(window.location.search);
  const productId = params.get("product");
  const seasonParam = params.get("season");

  const pathname = (location.pathname.split("/").pop() || "").toLowerCase();
  const categoryFromPath = pathname === "bind.html"
    ? "bind"
    : pathname === "boot.html"
    ? "boot"
    : pathname === "board.html"
    ? "board"
    : null;

  const categoryFromQuery = (params.get("category") || "").toLowerCase();
  const requestedCategory = categoryFromQuery || categoryFromPath || "board";
  const supportedCategories = ["board", "bind", "boot"];
  const currentCategory = supportedCategories.includes(requestedCategory)
    ? requestedCategory
    : "board";
  const categoryLabel = currentCategory === "bind"
    ? "Bind"
    : currentCategory === "boot"
    ? "Boot"
    : "Board";

  const isDetailHtml = pathname === "detail.html";
  const isDetailPage = isDetailHtml && !!productId;
  const activeSeason = seasonParam || localStorage.getItem("currentSeason") || "2025-2026";

  if (isDetailHtml && !productId) {
    const detailContainer = document.getElementById("product-detail");
    if (detailContainer) {
      detailContainer.innerHTML = `
        <h1>商品が選択されていません</h1>
        <p>カテゴリ一覧から商品を選んでください。</p>
        <p><a href="${currentCategory}.html">← ${categoryLabel}一覧へ</a></p>
      `;
    }
    return;
  }

  const manufacturers = window.getCatalogByCategory
    ? window.getCatalogByCategory(currentCategory)
    : (window.MANUFACTURERS || []);

  const searchInput = document.getElementById("gear-search");
  const clearBtn = document.getElementById("clear-search");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      currentSearch = searchInput.value;
      renderManufacturerList();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      currentSearch = "";
      if (searchInput) searchInput.value = "";
      renderManufacturerList();
    });
  }

  const sortBtn = document.getElementById("sort-rating-desc");
  if (sortBtn) {
    sortBtn.addEventListener("click", () => {
      indexSortMode = "rating-desc";
      renderManufacturerList();
    });
  }

  const seasonSelect = document.getElementById("season-select");
  if (seasonSelect) {
    const savedSeason = localStorage.getItem("currentSeason");
    if (savedSeason) {
      currentSeason = savedSeason;
      seasonSelect.value = savedSeason;
    } else {
      currentSeason = seasonSelect.value || currentSeason;
    }

    seasonSelect.addEventListener("change", () => {
      currentSeason = seasonSelect.value;
      localStorage.setItem("currentSeason", currentSeason);
      renderManufacturerList();
    });
  }

  function reviewKey(category, id, season) {
    return `reviews_${season}_${category}_${id}`;
  }

  function legacyBoardKey(id, season) {
    return `reviews_${season}_${id}`;
  }

  function safeParseReviews(value) {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function getReviews(id, season, category = currentCategory) {
    const primary = safeParseReviews(localStorage.getItem(reviewKey(category, id, season)));
    if (primary.length > 0) return primary;

    if (category === "board") {
      return safeParseReviews(localStorage.getItem(legacyBoardKey(id, season)));
    }

    return primary;
  }

  function saveReviews(id, season, reviews, category = currentCategory) {
    localStorage.setItem(reviewKey(category, id, season), JSON.stringify(reviews));
  }

  function calculateReviewSummary(reviews) {
    if (!reviews.length) return { average: 0, count: 0 };

    const total = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
    const average = total / reviews.length;
    return { average: Math.round(average * 10) / 10, count: reviews.length };
  }

  function getProductSummary(id, season) {
    const reviews = getReviews(id, season, currentCategory);
    return calculateReviewSummary(reviews);
  }

  function attachDeleteEvents(id, season) {
    const reviewList = document.getElementById("review-list");
    if (!reviewList) return;

    reviewList.querySelectorAll(".delete-btn").forEach(button => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.index);
        const reviews = getReviews(id, season);
        reviews.splice(index, 1);
        saveReviews(id, season, reviews);
        applySortAndRender();
      });
    });
  }

  function renderReviewSummary(reviews) {
    const summaryEl = document.getElementById("review-summary");
    if (!summaryEl) return;

    const starsEl = summaryEl.querySelector(".stars");
    const ratingTextEl = summaryEl.querySelector(".rating-text");
    const countEl = summaryEl.querySelector(".review-count");
    if (!starsEl || !ratingTextEl || !countEl) return;

    if (reviews.length === 0) {
      starsEl.textContent = "☆☆☆☆☆";
      ratingTextEl.textContent = " 未評価";
      countEl.textContent = "（レビューなし）";
      return;
    }

    const avg = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length;
    const rounded = Math.round(avg * 10) / 10;
    const fullStars = Math.floor(avg);
    const emptyStars = 5 - fullStars;

    starsEl.textContent = "★".repeat(fullStars) + "☆".repeat(emptyStars);
    ratingTextEl.textContent = ` ${rounded} / 5`;
    countEl.textContent = `（${reviews.length}件のレビュー）`;
  }

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
        <div class="review-rating">${"★".repeat(Number(review.rating) || 0)}</div>
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
    if (!productId) return;

    let reviews = getReviews(productId, activeSeason);

    if (currentAgeFilter) reviews = reviews.filter(r => r.age === currentAgeFilter);
    if (currentStyleFilter) reviews = reviews.filter(r => r.style === currentStyleFilter);

    if (currentSort === "new") {
      reviews = reviews.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    if (currentSort === "old") {
      reviews = reviews.slice().sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    }

    if (currentSort === "high") {
      reviews = reviews.slice().sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    }

    if (currentSort === "low") {
      reviews = reviews.slice().sort((a, b) => (Number(a.rating) || 0) - (Number(b.rating) || 0));
    }

    renderReviewSummary(reviews);
    renderSortedReviews(reviews);
  }

  function setupReviewForm(id, season) {
    const textarea = document.querySelector("textarea");
    const counter = document.querySelector(".char-count");
    const starContainer = document.querySelector(".star-rating");
    const stars = document.querySelectorAll(".star-rating span");
    const submitButton = document.getElementById("submit-review");

    if (!textarea || !counter || !starContainer || !stars.length || !submitButton) return;

    function highlightStars(rating) {
      stars.forEach(star => {
        star.classList.toggle("active", Number(star.dataset.value) <= Number(rating));
      });
    }

    stars.forEach(star => {
      star.addEventListener("mouseover", () => highlightStars(star.dataset.value));
      star.addEventListener("mouseout", () => highlightStars(starContainer.dataset.rating || 0));
      star.addEventListener("click", () => {
        starContainer.dataset.rating = star.dataset.value;
        highlightStars(star.dataset.value);
      });
    });

    textarea.addEventListener("input", () => {
      counter.textContent = `残り ${300 - textarea.value.length} 文字`;
    });

    submitButton.addEventListener("click", () => {
      const nickname = document.getElementById("nickname")?.value || "匿名";
      const age = document.getElementById("age")?.value || "未設定";
      const style = document.getElementById("style")?.value || "未設定";
      const rating = Number(starContainer.dataset.rating);
      const text = textarea.value.trim();

      if (!rating || !text) {
        alert("入力不足です");
        return;
      }

      const reviews = getReviews(id, season);
      const createdAt = new Date().toISOString();
      reviews.unshift({ nickname, age, style, rating, text, createdAt });

      saveReviews(id, season, reviews);
      applySortAndRender();

      const nicknameInput = document.getElementById("nickname");
      const ageSelect = document.getElementById("age");
      const styleSelect = document.getElementById("style");

      if (nicknameInput) nicknameInput.value = "";
      if (ageSelect) ageSelect.selectedIndex = 0;
      if (styleSelect) styleSelect.selectedIndex = 0;

      textarea.value = "";
      starContainer.dataset.rating = "0";
      highlightStars(0);
      counter.textContent = "残り 300 文字";
    });
  }

  if (isDetailPage) {
    let currentProduct = window.findProductByCategoryAndId
      ? window.findProductByCategoryAndId(currentCategory, productId)
      : null;

    if (!currentProduct && window.getAllProducts) {
      currentProduct = window.getAllProducts().find(p => p.id === productId) || null;
    }

    const detailContainer = document.getElementById("product-detail");

    if (detailContainer && currentProduct) {
      const flex = currentProduct.flex || "-";
      const profile = currentProduct.profile || "-";
      const description = currentProduct.description || "";

      detailContainer.innerHTML = `
        <h1>${currentProduct.name}</h1>
        <p>カテゴリ：${categoryLabel}</p>
        <p>メーカー：${currentProduct.maker}</p>
        <p id="season-label" class="season-label">シーズン：${activeSeason}</p>
        <div class="product-specs">
          <h2>スペック</h2>
          <p>硬さ：${flex}</p>
          <p>形状：${profile}</p>
        </div>
        ${description ? `<div class="product-description"><h2>モデル説明（要約）</h2><p>${description}</p></div>` : ""}
        <div id="review-summary" class="review-summary">
          <span class="stars"></span>
          <span class="rating-text"></span>
          <span class="review-count"></span>
        </div>
      `;

      addToRecentlyViewed({
        id: currentProduct.id,
        name: currentProduct.name,
        maker: currentProduct.maker,
        category: currentCategory,
        season: activeSeason
      });
    }

    if (detailContainer && !currentProduct) {
      detailContainer.innerHTML = `
        <h1>商品が見つかりません</h1>
        <p>対象の商品のURLが正しいか確認してください。</p>
        <p><a href="${currentCategory}.html">← ${categoryLabel}一覧へ戻る</a></p>
      `;
    }

    function addToRecentlyViewed(item) {
      const key = "recentlyViewed";
      const max = 5;
      const list = safeParseReviews(localStorage.getItem(key));

      const filtered = list.filter(x => !(x.id === item.id && x.season === item.season && x.category === item.category));
      filtered.unshift({ ...item, viewedAt: new Date().toISOString() });

      localStorage.setItem(key, JSON.stringify(filtered.slice(0, max)));
    }
  }

  function renderManufacturerList() {
    const q = normalizeText(currentSearch);
    const manufacturerList = document.getElementById("manufacturer-list");
    if (!manufacturerList) return;

    manufacturerList.innerHTML = "";

    const emptyEl = document.getElementById("season-empty");
    let visibleProductCount = 0;
    let visibleMakerCount = 0;

    manufacturers.forEach(maker => {
      const section = document.createElement("div");
      section.className = "accordion-item";

      const makerName = normalizeText(maker.maker);
      const makerKana = normalizeText(maker.kana);

      const seasonProducts = (maker.products || []).filter(
        p => (p.season || "2025-2026") === currentSeason
      );

      const matchedProducts = seasonProducts.filter(p => {
        const pn = normalizeText(p.name);
        const pk = normalizeText(p.kana);
        const pid = normalizeText(p.id);

        return !q
          || pn.includes(q)
          || pk.includes(q)
          || pid.includes(q)
          || makerName.includes(q)
          || makerKana.includes(q);
      });

      const makerMatched = q && (makerName.includes(q) || makerKana.includes(q));
      const noSearch = !q;
      const shouldShowMaker = noSearch || makerMatched || matchedProducts.length > 0;
      if (!shouldShowMaker) return;

      const finalProducts = makerMatched || noSearch ? seasonProducts : matchedProducts;
      const seasonCount = seasonProducts.length;
      visibleMakerCount += 1;

      visibleProductCount += finalProducts.length;

      const products = [...finalProducts];
      if (indexSortMode === "rating-desc") {
        products.sort((a, b) => {
          const aAvg = getProductSummary(a.id, currentSeason).average || 0;
          const bAvg = getProductSummary(b.id, currentSeason).average || 0;
          return bAvg - aAvg;
        });
      }

      const productList = products
        .map(product => {
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
              <a href="detail.html?category=${currentCategory}&product=${product.id}&season=${currentSeason}">
                <span class="product-name">${product.name}</span>
                <span class="product-rating">${ratingHtml}</span>
              </a>
            </li>
          `;
        })
        .join("");

      const contentHtml = seasonCount === 0
        ? `<p class="empty-product-note">2025-2026モデルは確認中です。</p>`
        : `<ul class="product-list">${productList}</ul>`;

      section.innerHTML = `
        <div class="accordion-header">
          <span class="accordion-icon">＋</span>
          <span class="accordion-title">${maker.maker} (${seasonCount})</span>
        </div>
        <div class="accordion-content" style="display:none;">
          ${contentHtml}
        </div>
      `;

      manufacturerList.appendChild(section);
    });

    if (emptyEl) {
      if (visibleMakerCount === 0) {
        emptyEl.textContent = "この条件に一致するメーカーはありません。";
        emptyEl.style.display = "block";
      } else if (visibleProductCount === 0) {
        emptyEl.textContent = "このシーズンのモデル情報は確認中です。";
        emptyEl.style.display = "block";
      } else {
        emptyEl.style.display = "none";
      }
    }

    document.querySelectorAll(".accordion-header").forEach(header => {
      header.addEventListener("click", () => {
        const content = header.nextElementSibling;
        const icon = header.querySelector(".accordion-icon");

        const open = content?.style.display === "block";
        if (content) content.style.display = open ? "none" : "block";
        if (icon) icon.textContent = open ? "＋" : "−";
      });
    });
  }

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

  const sortButtons = document.querySelectorAll(".sort-buttons button");
  const defaultSortButton = document.querySelector('.sort-buttons button[data-sort="new"]');
  if (defaultSortButton) defaultSortButton.classList.add("active");

  sortButtons.forEach(button => {
    button.addEventListener("click", () => {
      currentSort = button.dataset.sort;
      sortButtons.forEach(btn => btn.classList.remove("active"));
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
