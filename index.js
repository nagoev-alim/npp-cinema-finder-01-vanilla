// ⚡️ Import Styles
import './style.scss';
import feather from 'feather-icons';
import axios from 'axios';
import { showNotification } from './modules/showNotification.js';

// ⚡️ Render Skeleton
document.querySelector('#app').innerHTML = `
<div class='app-container'>
  <div class='cinema'>
    <header>
      <h2>
        <a class='h4' href='/'>Cinema Finder</a>
      </h2>
      <form data-form=''>
        <label>
          <input type='search' name='query' placeholder='Enter name'>
        </label>
      </form>
    </header>

    <main>
      <ul data-list=''></ul>
      <button class='detail hide' data-more=''>More</button>
    </main>

    <div class='overlay' data-overlay=''>
      <section class='modal' data-modal=''></section>
    </div>
  </div>

  <a class='app-author' href='https://github.com/nagoev-alim' target='_blank'>${feather.icons.github.toSvg()}</a>
</div>
`;

// ⚡️Create Class
class App {
  constructor() {
    this.CONSTANTS = {
      url: 'https://kinopoiskapiunofficial.tech/api/v2.1/films/',
      keyword: 'search-by-keyword?keyword=',
      top: 'top?type=TOP_250_BEST_FILMS',
      key: 'acda60f6-b930-4677-b4fe-add4a929410a',
    };

    this.DOM = {
      form: document.querySelector('[data-form]'),
      result: document.querySelector('[data-list]'),
      overlay: document.querySelector('[data-overlay]'),
      modal: document.querySelector('[data-modal]'),
      more: document.querySelector('[data-more]'),
    };

    this.http = axios.create({
      baseURL: this.CONSTANTS.url,
      headers: {
        'X-API-KEY': this.CONSTANTS.key,
        'Content-Type': 'application/json',
      },
    });

    this.currentPage = 1;
    this.countPage = null;
    this.result = [];
    this.currentType = this.CONSTANTS.top;

    this.onFetch(this.currentType);

    this.DOM.form.addEventListener('submit', this.onSubmit);
    this.DOM.result.addEventListener('click', this.onElementClick);
    this.DOM.overlay.addEventListener('click', this.toggleModal);
    this.DOM.more.addEventListener('click', this.onMoreClick);
    document.addEventListener('keydown', this.toggleModal);
  }

  /**
   * @function onFetch - Fetch data
   * @param url
   */
  onFetch = async (url) => {
    try {
      this.DOM.result.innerHTML = `<p class='h5'>Loading...</p>`;
      const { data: { films, pagesCount } } = await this.http.get(`${url}&page=${this.currentPage}`);

      if (films.length === 0) {
        showNotification('warning', 'Nothing found, you will be redirect to home page');
        setTimeout(() => location.reload(), 4000);
        return;
      }

      this.result = films;
      this.countPage = pagesCount;
      this.renderData(this.result);
    } catch (e) {
      showNotification('danger', 'Something went wrong, open dev console.');
      console.log(e);
    }
  };

  /**
   * @function renderData - Render HTML
   */
  renderData = (data) => {
    this.DOM.result.innerHTML = `
      ${Array.from(data).map(({ nameEn, nameRu, rating, posterUrl, filmId }) => `
      <li data-id='${filmId}'>
        <div class='hidden'>
          <button data-detail=''>Detail</button>
        </div>
        <div class='header'>
          <img src='${posterUrl}' alt='${nameEn === null ? nameRu : nameEn}'>
        </div>
        <div class='body'>
          <h5>${nameEn === null ? nameRu : nameEn}</h5>
          <p>${rating === 'null' ? '-' : rating}</p>
        </div>
      </li>
      `).join('')}`;

    this.DOM.more.className = `detail ${this.currentPage < this.countPage ? '' : 'hide'}`;
  };

  /**
   * @function onSubmit - Form submit handler
   * @param event
   * @returns {Promise<void>}
   */
  onSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const query = Object.fromEntries(new FormData(form).entries()).query.trim();

    if (query.length === 0) {
      showNotification('warning', 'Please fill the field.');
      return;
    }

    this.currentPage = 1;
    this.currentType = `${this.CONSTANTS.keyword}${query}`;
    await this.onFetch(this.currentType);
  };

  /**
   * @function onElementClick - Fetch detail info and render HTML
   */
  onElementClick = async ({ target }) => {
    if (target.matches('[data-detail=""]')) {
      const {
        data: {
          data: {
            description,
            filmLength,
            nameEn,
            nameRu,
            posterUrl,
            posterUrlPreview,
            webUrl,
            year,
          },
        },
      } = await this.http.get(target.closest('li').getAttribute('data-id'));

      this.DOM.modal.innerHTML = `
        <button data-close=''>${feather.icons.x.toSvg()}</button>
        <div class='header'>
          <img src='${posterUrl ? posterUrl : posterUrlPreview}' alt='${nameEn ? nameEn : nameRu}'>
        </div>
        <div class='body'>
          <h5>${nameEn ? nameEn : nameRu} (${year})</h5>
          <p>${description}</p>
          <p>Duration: ${filmLength}</p>
          <a class='button' href='${webUrl}' target='_blank'>More</a>
        </div>
      `;

      this.DOM.overlay.classList.add('open');
    }
  };

  /**
   * @function toggleModal - Show/Hide Modal
   * @param target
   * @param key
   */
  toggleModal = ({ target, key }) => {
    if (key === 'Escape' || (target.matches('[data-close]') || target.matches('[data-overlay]'))) {
      this.DOM.overlay.classList.add('hidden');
      setTimeout(() => this.DOM.overlay.classList.remove('hidden', 'open'), 800);
    }
  };

  /**
   * @function onMoreClick - More button click handler
   */
  onMoreClick = async () => {
    if (this.currentPage < this.countPage) {
      this.currentPage++;
      const { data: { films } } = await this.http.get(`${this.currentType}&page=${this.currentPage}`);
      this.result = [...this.result, ...films];
      this.renderData(this.result);
    } else {
      this.DOM.more.classList.add('hide');
    }
  };
}

// ⚡️Class instance
new App();
