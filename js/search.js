const input = document.getElementById('site-search');
const searchBox = document.getElementById('search-box');
const clearBtn = document.querySelector('.search-box__clear');
const results = document.getElementById('search-results');
const body = document.body;

function toggleClear() {
  const hasValue = input.value.length > 0;

  searchBox.classList.toggle('search-box--filled', hasValue);
  body.classList.toggle('search-active', hasValue);

  if (hasValue) {
    results.innerHTML = '<div class="font-s">Здесь будут результаты поиска</div>';
  } else {
    results.innerHTML = '';
  }
}

input.addEventListener('focus', toggleClear);
input.addEventListener('input', toggleClear);

clearBtn.addEventListener('click', () => {
  input.value = '';
  toggleClear();
  input.focus();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    input.value = '';
    input.blur();
    toggleClear();
  }
});

toggleClear();