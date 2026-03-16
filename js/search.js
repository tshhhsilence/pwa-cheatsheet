const input = document.getElementById('site-search');
  const searchBox = document.querySelector('.search-box');
  const clearBtn = document.querySelector('.search-box__clear');

  function toggleClear() {
    searchBox.classList.toggle('search-box--filled', input.value.length > 0);
  }

  input.addEventListener('input', toggleClear);

  clearBtn.addEventListener('click', () => {
    input.value = '';
    toggleClear();
    input.focus();
  });

  toggleClear();