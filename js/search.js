const input = document.getElementById('site-search');
const searchBox = document.querySelector('.search-box');
const clearBtn = document.querySelector('.search-box__clear');
const searchResults = document.getElementById('search-results');
const body = document.body;

const SEARCH_INDEX_URL = '../data/search-index.json';
const MAX_RESULTS = 24;

let searchIndex = [];
let searchIndexPromise = null;

function normalizeText(value = '') {
  return value
    .toString()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function escapeHtml(value = '') {
  return value
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function loadSearchIndex() {
  if (searchIndex.length) return searchIndex;
  if (searchIndexPromise) return searchIndexPromise;

  searchIndexPromise = fetch(SEARCH_INDEX_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Не удалось загрузить индекс поиска: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      searchIndex = Array.isArray(data) ? data : [];
      return searchIndex;
    })
    .catch((error) => {
      console.error(error);
      searchIndex = [];
      return searchIndex;
    });

  return searchIndexPromise;
}

function getItemText(item) {
  const keywords = Array.isArray(item.keywords) ? item.keywords.join(' ') : '';
  return normalizeText([
    item.subject,
    item.grade,
    item.title,
    keywords,
  ].join(' '));
}

function getItemScore(item, query) {
  const normalizedQuery = normalizeText(query);
  const title = normalizeText(item.title);
  const subject = normalizeText(item.subject);
  const grade = normalizeText(item.grade);
  const keywords = Array.isArray(item.keywords)
    ? item.keywords.map((keyword) => normalizeText(keyword))
    : [];

  let score = 0;

  if (title === normalizedQuery) score += 300;
  if (title.startsWith(normalizedQuery)) score += 180;
  else if (title.includes(normalizedQuery)) score += 120;

  if (subject.includes(normalizedQuery)) score += 40;
  if (grade.includes(normalizedQuery)) score += 20;

  for (const keyword of keywords) {
    if (keyword === normalizedQuery) score += 220;
    else if (keyword.startsWith(normalizedQuery)) score += 90;
    else if (keyword.includes(normalizedQuery)) score += 60;
  }

  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);
  if (queryWords.length > 1) {
    const haystack = getItemText(item);
    const matchedWords = queryWords.filter((word) => haystack.includes(word)).length;
    score += matchedWords * 25;
  }

  return score;
}

function findMatches(query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  return searchIndex
    .map((item) => ({ item, score: getItemScore(item, normalizedQuery) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.item.title.localeCompare(b.item.title, 'ru');
    })
    .slice(0, MAX_RESULTS)
    .map(({ item }) => item);
}

function groupResults(items) {
  const groups = new Map();

  items.forEach((item) => {
    const subject = item.subject || 'Без предмета';
    if (!groups.has(subject)) {
      groups.set(subject, []);
    }
    groups.get(subject).push(item);
  });

  return [...groups.entries()];
}

function renderResults(items, query) {
  if (!searchResults) return;

  if (!query.trim()) {
    searchResults.innerHTML = '';
    searchResults.hidden = true;
    return;
  }

  searchResults.hidden = false;

  if (!items.length) {
    searchResults.innerHTML = `
      <div class="search-results__empty">По запросу «${escapeHtml(query)}» ничего не найдено</div>
    `;
    return;
  }

  searchResults.innerHTML = groupResults(items)
    .map(([subject, subjectItems]) => `
      <section class="search-results__group">
        <p class="search-results__subject font-s">${escapeHtml(subject)}</p>
        <div class="search-results__list">
          ${subjectItems
            .map((item) => `
              <a class="search-results__item" href="${escapeHtml(`${item.page || ''}${item.hash || ''}`)}">
                <div class="search-results__text">
                  <p class="search-results__grade font-s">${escapeHtml(item.grade || '')}</p>
                  <p class="search-results__title font-m">${escapeHtml(item.title || '')}</p>
                </div>
                <img src="../icons/arw-rght.svg" class="search-results__arrow" />
              </a>
            `)
            .join('')}
        </div>
      </section>
    `)
    .join('');
}

function setSearchState(isActive) {
  searchBox.classList.toggle('search-box--filled', isActive);
  body.classList.toggle('search-active', isActive);
}

async function updateSearch() {
  const query = input.value.trim();
  const isActive = query.length > 0;

  setSearchState(isActive);

  if (!isActive) {
    renderResults([], '');
    return;
  }

  await loadSearchIndex();
  renderResults(findMatches(query), query);
}

input.addEventListener('focus', () => {
  if (input.value.trim()) {
    setSearchState(true);
    searchResults.hidden = false;
  }
});

input.addEventListener('input', updateSearch);

clearBtn.addEventListener('click', () => {
  input.value = '';
  updateSearch();
  input.focus();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    input.value = '';
    input.blur();
    updateSearch();
  }
});

loadSearchIndex();
updateSearch();