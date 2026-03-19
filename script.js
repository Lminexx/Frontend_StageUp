/* ─── HELPERS ─── */
const $ = id => document.getElementById(id);

/* ═══════════════════════════════════════════
   THEME
═══════════════════════════════════════════ */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'light' ? 'dark' : 'light');
}

// Применяем тему сразу — до рендера, чтобы не было мигания
;(function () {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
})();

/* ═══════════════════════════════════════════
   JWT DECODE
═══════════════════════════════════════════ */
function decodeJWT(token) {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch { return null; }
}

/* ═══════════════════════════════════════════
   AUTH STATE (ПРОВЕРКА АВТОРИЗАЦИИ)
═══════════════════════════════════════════ */
function initAuthState() {
    const token = localStorage.getItem('token');
    const guestBtn = $('guestButtons');
    const userMenu = $('userMenu');

    // Функция: включаем режим "Гость"
    const setGuestState = () => {
        if (guestBtn) guestBtn.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    };

    // Функция: включаем режим "Пользователь"
    const setAuthState = (username, role) => {
        if (guestBtn) guestBtn.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'flex';
            $('userAvatar').textContent = username.charAt(0).toUpperCase();
            const emoji = role === 'ORGANIZER' ? '🎪' : '🎤';
            $('userDisplayName').textContent = `${emoji} ${username}`;
        }

        // Для главной страницы (кнопка в центре экрана)
        const heroLink = $('heroAuthLink');
        if (heroLink) {
            heroLink.textContent = 'Мой профиль';
            heroLink.onclick = () => { window.location.href = 'profile.html'; };
        }
    };

    // 1. Если токена нет вообще
    if (!token || token === 'null' || token === 'undefined') {
        setGuestState();
        return;
    }

    // 2. Пробуем расшифровать токен
    const jwt = decodeJWT(token);
    if (!jwt) {
        setGuestState();
        return;
    }

    // 3. Проверяем, не просрочен ли токен
    if (jwt.exp && jwt.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        setGuestState();
        return;
    }

    // 4. Всё отлично, показываем аватарку
    const username = jwt.sub || jwt.username || jwt.name || 'Профиль';
    const role = (jwt.role || jwt.roles?.[0] || '').toUpperCase();
    const orgNav = document.getElementById('orgNavLink'); // Добавь id="orgNavLink" в HTML-ссылку
    if (orgNav) {
        orgNav.style.display = (role === 'ORGANIZER') ? 'inline-block' : 'none';
    }

    setAuthState(username, role);
}

function handleLogout() {
    localStorage.removeItem('token');
    window.location.reload();
}

initAuthState();

/* ═══════════════════════════════════════════
   MODAL OPEN / CLOSE
═══════════════════════════════════════════ */
function openModal(type) {
    let id;
    if (type === 'login') id = 'loginModal';
    else if (type === 'register') id = 'registerModal';
    else if (type === 'apply') id = 'applyModal'; // <--- ДОБАВИЛИ ЭТО

    $(id).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    $(id).classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => resetModal(id), 300);
}

function resetModal(id) {
    if (id === 'loginModal') {
        $('loginForm').style.display = '';
        $('loginSuccess').classList.remove('show');
        clearErrors(['loginUsername', 'loginPassword']);
        $('loginUsername').value = '';
        $('loginPassword').value = '';
    } else {
        $('registerForm').style.display = '';
        $('registerSuccess').classList.remove('show');
        clearErrors(['regName', 'regEmail', 'regPassword']);
        $('regName').value    = '';
        $('regEmail').value   = '';
        $('regPassword').value = '';
    }
}

function switchModal(from, to) {
    closeModal(from);
    setTimeout(() => openModal(to === 'loginModal' ? 'login' : 'register'), 260);
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target === overlay) closeModal(overlay.id);
    });
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        ['loginModal', 'registerModal'].forEach(id => {
            if ($(id).classList.contains('active')) closeModal(id);
        });
    }
});

/* ═══════════════════════════════════════════
   ROLE SWITCHER
═══════════════════════════════════════════ */
let selectedRole = 'artist';

function selectRole(role) {
    selectedRole = role;
    $('roleArtist').classList.toggle('active', role === 'artist');
    $('roleOrganizer').classList.toggle('active', role === 'organizer');
}

/* ═══════════════════════════════════════════
   PASSWORD TOGGLE
═══════════════════════════════════════════ */
function togglePass(inputId, btn) {
    const inp = $(inputId);
    const showing = inp.type === 'text';
    inp.type = showing ? 'password' : 'text';
    btn.querySelector('svg').innerHTML = showing
        ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
        : '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
    btn.style.color = showing ? 'var(--text-3)' : 'var(--accent)';
}

/* ═══════════════════════════════════════════
   VALIDATION
═══════════════════════════════════════════ */
function showError(inputId, errId) {
    $(inputId).classList.add('error-input');
    $(errId).classList.add('show');
}

function clearErrors(inputIds) {
    inputIds.forEach(id => {
        $(id).classList.remove('error-input');
        const errEl = $(id + 'Err');
        if (errEl) errEl.classList.remove('show');
    });
}

['loginUsername', 'loginPassword', 'regName', 'regEmail', 'regPassword'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('input', () => {
        el.classList.remove('error-input');
        const errEl = $(id + 'Err');
        if (errEl) errEl.classList.remove('show');
    });
});

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ═══════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════ */
async function handleLogin() {
    let valid = true;
    const username = $('loginUsername').value.trim();
    const pass     = $('loginPassword').value;

    if (!username) { showError('loginUsername', 'loginUsernameErr'); valid = false; }
    if (!pass)     { showError('loginPassword', 'loginPassErr');     valid = false; }
    if (!valid) return;

    const btn = document.querySelector('#loginForm .btn-modal');
    btn.textContent = 'Входим…';
    btn.classList.add('loading');

    try {
        const res = await fetch('http://localhost:8080/api/v1/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password: pass })
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('token', data.token);
            showSuccess('loginForm', 'loginSuccess');
            setTimeout(() => { window.location.href = 'profile.html'; }, 1400);
        } else {
            const err = await res.json().catch(() => ({}));
            $('loginUsernameErr').textContent = err.detail || 'Неверный логин или пароль';
            showError('loginUsername', 'loginUsernameErr');
        }
    } catch {
        $('loginUsernameErr').textContent = 'Ошибка сети. Попробуйте позже.';
        showError('loginUsername', 'loginUsernameErr');
    } finally {
        btn.textContent = 'Войти';
        btn.classList.remove('loading');
    }
}

/* ═══════════════════════════════════════════
   REGISTER
═══════════════════════════════════════════ */
async function handleRegister() {
    let valid = true;
    const name  = $('regName').value.trim();
    const email = $('regEmail').value.trim();
    const pass  = $('regPassword').value;

    if (!name)                { showError('regName',     'regNameErr');  valid = false; }
    if (!emailRe.test(email)) { showError('regEmail',    'regEmailErr'); valid = false; }
    if (pass.length < 8)      { showError('regPassword', 'regPassErr');  valid = false; }
    if (!valid) return;

    const btn = document.querySelector('#registerForm .btn-modal');
    btn.textContent = 'Создаём аккаунт…';
    btn.classList.add('loading');

    try {
        const res = await fetch('http://localhost:8080/api/v1/user/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: name,
                email,
                password: pass,
                role: selectedRole.toUpperCase()
            })
        });

        if (res.ok) {
            showSuccess('registerForm', 'registerSuccess');
            setTimeout(() => { closeModal('registerModal'); openModal('login'); }, 2000);
        } else {
            const err = await res.json().catch(() => ({}));
            $('regEmailErr').textContent = err.detail || 'Этот email уже используется';
            showError('regEmail', 'regEmailErr');
        }
    } catch {
        $('regEmailErr').textContent = 'Ошибка сети. Попробуйте позже.';
        showError('regEmail', 'regEmailErr');
    } finally {
        btn.textContent = 'Зарегистрироваться';
        btn.classList.remove('loading');
    }
}

/* ═══════════════════════════════════════════
   SUCCESS STATE
═══════════════════════════════════════════ */
function showSuccess(formId, successId) {
    $(formId).style.display = 'none';
    $(successId).classList.add('show');
}

/* ═══════════════════════════════════════════
   ЗАГРУЗКА ВСЕХ МЕРОПРИЯТИЙ (ЛЕНТА)
═══════════════════════════════════════════ */
async function loadAllEvents(page = 0) {
    const loadingEl = $('eventsLoading');
    const errorEl = $('eventsError');
    const emptyEl = $('eventsEmpty');
    const gridEl = $('eventsGrid');
    const paginationEl = $('pagination');

    if (!loadingEl) return;

    loadingEl.style.display = 'flex';
    errorEl.style.display = 'none';
    emptyEl.style.display = 'none';
    gridEl.style.display = 'none';
    paginationEl.style.display = 'none';
    gridEl.innerHTML = '';

    const sortVal = $('sortSelect').value.split(',');
    const sortBy = sortVal[0];
    const direction = sortVal[1];
    const size = 12;

    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };

    // ЖЕЛЕЗОБЕТОННАЯ проверка токена (отсекаем строки "null" и "undefined")
    if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        console.log(`Запрашиваем мероприятия... Токен отправлен: ${!!headers['Authorization']}`);

        const response = await fetch(`http://localhost:8080/api/v1/event?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`, {
            method: 'GET',
            headers: headers
        });

        // Если бэкенд послал нас куда подальше (например, 401 или 403)
        if (!response.ok) {
            throw new Error(`Бэкенд вернул статус: ${response.status}`);
        }

        const pageData = await response.json();
        const events = pageData.content || [];

        if (events.length === 0 && page === 0) {
            loadingEl.style.display = 'none';
            emptyEl.style.display = 'flex';
            return;
        }

        // Рендер карточек
        events.forEach(event => {
            const card = buildEventCardHTML(event);
            gridEl.appendChild(card);
        });

        loadingEl.style.display = 'none';
        gridEl.style.display = 'grid';

        // Рендер пагинации
        renderPagination(pageData.totalPages, pageData.number);

    } catch (error) {
        // Теперь в консоли браузера будет четко видно, почему упало!
        console.error('🚨 Ошибка загрузки мероприятий:', error.message || error);

        loadingEl.style.display = 'none';
        errorEl.style.display = 'flex';

        // Если это ошибка CORS или сервер вообще лежит
        if (error.message === 'Failed to fetch') {
            $('errorText').textContent = 'Сервер недоступен или ошибка CORS (проверьте консоль F12).';
        } else {
            $('errorText').textContent = `Не удалось загрузить: ${error.message}`;
        }
    }
}

/* ═══════════════════════════════════════════
   ГЕНЕРАЦИЯ КАРТОЧКИ (UI)
═══════════════════════════════════════════ */
function buildEventCardHTML(event) {
    const div = document.createElement('div');
    div.className = 'event-card';

    // Дата и время
    let dateTimeStr = 'Дата уточняется';
    if (event.eventDate) {
        const d = new Date(event.eventDate);
        dateTimeStr = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(d);
        if (event.startTime) {
            dateTimeStr += ` в ${event.startTime.slice(0,5)}`;
        }
    }

    // Город и место
    let locationStr = [event.city, event.locationName].filter(Boolean).join(', ');
    if (!locationStr) locationStr = 'Место не указано';

    // Вознаграждение
    let rewardStr = event.rewardType || 'По договоренности';
    if (event.fixedFeeAmount && event.fixedFeeAmount > 0) {
        rewardStr = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(event.fixedFeeAmount);
    }

    div.innerHTML = `
        <h3 class="event-title">${escapeHtml(event.title)}</h3>

        <div class="event-info-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>${dateTimeStr}</span>
        </div>

        <div class="event-info-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>${escapeHtml(locationStr)}</span>
        </div>

        <div class="event-info-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            <span style="color: var(--text); font-weight: 700;">${escapeHtml(rewardStr)}</span>
        </div>

        <div class="event-tags">
            ${event.requiredGenre ? `<span class="tag">${escapeHtml(event.requiredGenre)}</span>` : ''}
        </div>
    `;

    // Клик по карточке (передаем ID через решетку #)
    div.style.cursor = 'pointer';
    div.onclick = () => {
        const targetId = event.id || event.eventId || event.uuid;
        window.location.href = 'event-details.html#' + targetId;
    };

    return div;
}

/* ═══════════════════════════════════════════
   ГЕНЕРАЦИЯ ПАГИНАЦИИ (UI)
═══════════════════════════════════════════ */
function renderPagination(totalPages, currentPage) {
    const paginationEl = $('pagination');
    paginationEl.innerHTML = '';

    if (totalPages <= 1) {
        paginationEl.style.display = 'none';
        return;
    }

    paginationEl.style.display = 'flex';

    // Кнопка "Назад"
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '←';
    prevBtn.disabled = currentPage === 0;
    prevBtn.onclick = () => loadAllEvents(currentPage - 1);
    paginationEl.appendChild(prevBtn);

    // Номера страниц (Spring page начинается с 0)
    for (let i = 0; i < totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        if (i === currentPage) btn.classList.add('active');
        btn.textContent = i + 1;
        btn.onclick = () => loadAllEvents(i);
        paginationEl.appendChild(btn);
    }

    // Кнопка "Вперед"
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '→';
    nextBtn.disabled = currentPage === totalPages - 1;
    nextBtn.onclick = () => loadAllEvents(currentPage + 1);
    paginationEl.appendChild(nextBtn);
}

// Защита от XSS (вспомогательная функция, если ее еще нет в файле)
function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function filterCards() {
    const query = $('searchInput').value.trim().toLowerCase();
    const cards = $('eventsGrid').querySelectorAll('.event-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const match = !query || text.includes(query);
        card.style.display = match ? '' : 'none';
        if (match) visibleCount++;
    });

    // Показываем "ничего не найдено" если все скрыты
    const emptyEl = $('eventsEmpty');
    if (visibleCount === 0 && query) {
        emptyEl.style.display = 'flex';
        emptyEl.querySelector('h3').textContent = 'Ничего не найдено';
        emptyEl.querySelector('p').textContent = `По запросу «${query}» мероприятий нет.`;
    } else {
        emptyEl.style.display = 'none';
    }
}

async function loadEventDetails() {
    // ДОСТАЕМ ID ИЗ ХЭША (всё, что после #)
    const eventId = window.location.hash.replace('#', '');

    const loadingEl = $('eventLoading');
    const errorEl = $('eventError');
    const contentEl = $('eventContent');

    if (!loadingEl || !contentEl) return;

    if (!eventId) {
        showEventError('ID мероприятия не указан. Вернитесь назад и выберите карточку.');
        return;
    }

    // Дальше стандартный код...
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(`http://localhost:8080/api/v1/event/${eventId}`, {
            method: 'GET',
            headers: headers
        });

        if (response.status === 404) {
            showEventError('Мероприятие не найдено или было удалено.');
            return;
        }

        if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);

        const event = await response.json();
        renderEventDetails(event);

    } catch (error) {
        console.error('Ошибка загрузки деталей:', error);
        showEventError('Произошла ошибка при загрузке данных. Проверьте подключение к сети.');
    }
}

function showEventError(message) {
    $('eventLoading').style.display = 'none';
    $('eventContent').style.display = 'none';
    const errEl = $('eventError');
    errEl.style.display = 'flex';
    $('eventErrorText').textContent = message;
}

function renderEventDetails(event) {
    // Обновляем заголовок страницы в браузере
    document.title = `${event.title} - StageUp`;

    // Название
    $('evTitle').textContent = event.title;

    // Жанр (Тег)
    const tagsContainer = $('evTags');
    tagsContainer.innerHTML = '';
    if (event.requiredGenre) {
        tagsContainer.innerHTML = `<span class="tag">${escapeHtml(event.requiredGenre)}</span>`;
    }

    // Описание
    const descEl = $('evDescription');
    if (event.description) {
        descEl.textContent = event.description;
    } else {
        descEl.textContent = 'Организатор пока не добавил подробное описание.';
        descEl.style.color = 'var(--text-3)';
    }

    // Дата и время
    let dateTimeStr = 'Дата уточняется';
    if (event.eventDate) {
        const d = new Date(event.eventDate);
        dateTimeStr = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
        if (event.startTime) {
            dateTimeStr += ` в ${event.startTime.slice(0, 5)}`;
        }
    }
    $('evDateTime').textContent = dateTimeStr;

    // Город и локация
    let locationStr = [event.city, event.locationName].filter(Boolean).join(', ');
    $('evLocation').textContent = locationStr || 'Место не указано';

    // Вознаграждение
    let rewardStr = event.rewardType || 'По договоренности';
    if (event.fixedFeeAmount && event.fixedFeeAmount > 0) {
        rewardStr = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(event.fixedFeeAmount);
    }
    $('evReward').textContent = rewardStr;

    // --- ЛОГИКА КНОПКИ ОТКЛИКА ---
    const applyBtn = document.querySelector('.btn-apply');

    if (event.applied === true) {
        // Если уже откликнулся
        applyBtn.textContent = 'Вы уже откликнулись';
        applyBtn.style.background = 'var(--text-4)';
        applyBtn.style.cursor = 'not-allowed';
        applyBtn.disabled = true;
        applyBtn.onclick = null;
    } else {
        // Если еще не откликался
        applyBtn.textContent = 'Откликнуться';
        applyBtn.style.background = 'var(--accent)';
        applyBtn.style.cursor = 'pointer';
        applyBtn.disabled = false;

        applyBtn.onclick = () => {
            const token = localStorage.getItem('token');
            // Если не залогинен - просим войти, если залогинен - открываем модалку отклика
            if (!token || token === 'null' || token === 'undefined') {
                openModal('login');
            } else {
                openModal('apply');
            }
        };
    }

    // Показываем контент
    $('eventLoading').style.display = 'none';
    $('eventContent').style.display = 'block';
}

// Заглушка для кнопки "Откликнуться"
function applyForEvent() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Пожалуйста, войдите в систему, чтобы откликнуться на мероприятие.');
        // Тут можно сделать window.location.href = 'login.html' или открыть модалку
        return;
    }

    // Получаем ID из URL для отправки заявки
    const eventId = new URLSearchParams(window.location.search).get('id');

    // В будущем тут будет fetch POST запрос на бэкенд: /api/v1/event/{eventId}/apply
    alert(`Заявка на мероприятие #${eventId} успешно отправлена! (Тут будет реальный запрос к API)`);
}

/* ═══════════════════════════════════════════
   ОТПРАВКА ОТКЛИКА (Финальный вариант)
═══════════════════════════════════════════ */
async function submitApplication() {
    const letter = $('coverLetter').value.trim();
    const eventId = window.location.hash.replace('#', '');

    // 1. Проверка письма
    if (!letter) {
        alert("Напишите сопроводительное письмо.");
        return;
    }

    // 2. Получаем токен из хранилища (чтобы Gateway его принял)
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Вы не авторизованы!");
        return;
    }

    const btn = document.querySelector('#applyForm .btn-modal');
    btn.textContent = 'Отправка...';
    btn.disabled = true;

    try {
        // Шлем только то, что нужно для создания заявки.
        // ID артиста Gateway сам вытащит из токена и вставит в заголовок!
        const response = await fetch(`http://localhost:8080/api/v1/application/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                eventId: eventId,
                coverLetter: letter
            })
        });

        if (response.ok) {
            showSuccess('applyForm', 'applySuccess');
            setTimeout(() => {
                closeModal('applyModal');
                loadEventDetails(); // <--- Эта строчка заставит функцию renderEventDetails сработать заново и сменить кнопку на серую
            }, 1500);
        } else {
            const err = await response.json().catch(() => ({}));
            alert('Ошибка: ' + (err.detail || 'Не удалось отправить заявку'));
        }
    } catch (e) {
        console.error(e);
        alert('Ошибка соединения с сервером.');
    } finally {
        btn.textContent = 'Отправить отклик';
        btn.disabled = false;
    }
}

/* ═══════════════════════════════════════════
   ЗАГРУЗКА "МОИХ МЕРОПРИЯТИЙ" (Для организатора)
═══════════════════════════════════════════ */
async function loadMyEvents(page = 0) {
    const grid = $('myEventsGrid');
    const token = localStorage.getItem('token');

    if (!grid) return; // Если мы не на странице organizer.html

    try {
        const response = await fetch(`http://localhost:8080/api/v1/event/myEvents?page=${page}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Ошибка загрузки');

        const pageData = await response.json();
        const events = pageData.content || [];

        if (events.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-3); grid-column: 1 / -1;">У вас пока нет созданных мероприятий.</p>';
            return;
        }

        // Рендерим красивые карточки
        grid.innerHTML = events.map(event => {
            // 1. Форматируем дату и время
            let dateTimeStr = 'Дата уточняется';
            if (event.eventDate) {
                const d = new Date(event.eventDate);
                dateTimeStr = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(d);
                if (event.startTime) {
                    dateTimeStr += ` в ${event.startTime.slice(0,5)}`;
                }
            }

            // 2. Форматируем локацию
            let locationStr = [event.city, event.locationName].filter(Boolean).join(', ');
            if (!locationStr) locationStr = 'Место не указано';

            // 3. Форматируем деньги
            let rewardStr = event.rewardType === 'FREE' ? 'Бесплатно' : 'По договоренности';
            if (event.fixedFeeAmount && event.fixedFeeAmount > 0) {
                rewardStr = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(event.fixedFeeAmount);
            }

            // 4. Возвращаем HTML карточки
            return `
                <div class="event-card">
                    <h3 class="event-title">${escapeHtml(event.title)}</h3>

                    <div class="event-info-row">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span>${dateTimeStr}</span>
                    </div>

                    <div class="event-info-row">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span>${escapeHtml(locationStr)}</span>
                    </div>

                    <div class="event-info-row">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                        <span style="color: var(--accent); font-weight: 700;">${escapeHtml(rewardStr)}</span>
                    </div>

                    <div class="event-tags" style="margin-bottom: 20px;">
                        ${event.requiredGenre ? `<span class="tag">${escapeHtml(event.requiredGenre)}</span>` : ''}
                    </div>

                      <!-- КНОПКИ ОРГАНИЗАТОРА -->
                    <div class="org-actions" style="margin-top: auto; border-top: 1px solid var(--border); padding-top: 16px; display: flex; gap: 10px;">
                        <!-- СТАВИМ РЕШЕТКУ ЗДЕСЬ -->
                        <button class="btn-outline" style="flex: 1;" onclick="location.href='edit-event.html#${event.id}'">Редактировать</button>
                        <button class="btn-outline" style="flex: 1;" onclick="location.href='applications.html#${event.id}'">Заявки</button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error(e);
        grid.innerHTML = '<p style="color: var(--danger); grid-column: 1 / -1;">Не удалось загрузить мероприятия. Проверьте соединение.</p>';
    }
}

async function submitCreateEvent() {
    // 1. Собираем сырые значения из инпутов
    const title = $('evTitle').value.trim();
    const dateVal = $('evDate').value; // Формат YYYY-MM-DD
    const startVal = $('evStartTime').value; // Формат HH:mm
    const endVal = $('evEndTime').value; // Формат HH:mm

    // 2. Валидация обязательных полей (защита от null)
    if (!title || !dateVal || !startVal) {
        alert("Заполните название, дату и время начала!");
        return;
    }

    // 3. Формируем ИДЕАЛЬНЫЙ объект, который ждет Java
    const eventData = {
        title: title,
        description: $('evDesc').value.trim() || null,
        city: $('evCity').value.trim() || null,
        locationName: $('evLocation').value.trim() || null,
        address: $('evAddress').value.trim() || null, // ВОТ ТВОЙ АДРЕС
        requiredGenre: $('evGenre').value.trim() || null,

        eventDate: dateVal,
        // ДОБАВЛЯЕМ :00 ДЛЯ JAVA LocalTime !!!
        startTime: startVal + ":00",
        endTime: endVal ? (endVal + ":00") : null,

        rewardType: $('evRewardType').value,
        fixedFeeAmount: $('evFee').value ? parseFloat($('evFee').value) : null,

        technicalRequirements: "Не указано", // Дефолт
        durationMinutes: null // Если нужно, можно высчитать из времени
    };

    // 4. Отправка
    const token = localStorage.getItem('token');
    const btn = document.querySelector('#eventForm .btn-modal') || document.querySelector('.btn-modal');
    btn.textContent = 'Публикация...';
    btn.disabled = true;

    try {
        const response = await fetch('http://localhost:8080/api/v1/event/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData) // Смотри во вкладку Network в браузере!
        });

        if (response.ok) {
            alert('Мероприятие успешно создано!');
            window.location.href = 'organizer.html'; // Перекидываем в профиль
        } else {
            const err = await response.json().catch(() => ({}));
            alert('Ошибка бэкенда: ' + (err.detail || err.message || response.status));
        }
    } catch (e) {
        console.error(e);
        alert('Ошибка соединения с сервером');
    } finally {
        btn.textContent = 'Опубликовать мероприятие';
        btn.disabled = false;
    }
}

/* ═══════════════════════════════════════════
   РЕДАКТИРОВАНИЕ МЕРОПРИЯТИЯ
═══════════════════════════════════════════ */

// 1. Загрузка данных в форму
async function loadEventForEdit() {
    const eventId = window.location.hash.replace('#', '');

    if (!eventId) {
        alert("ID мероприятия не найден в ссылке!");
        return;
    }

    try {
        console.log("Пытаемся загрузить данные для ID:", eventId);

        const response = await fetch(`http://localhost:8080/api/v1/event/${eventId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (!response.ok) {
            throw new Error(`Бэкенд вернул статус ${response.status}`);
        }

        const event = await response.json();
        console.log("Успешно получены данные с бэкенда:", event);

        // Безопасное заполнение полей (если инпута нет в HTML, скрипт не упадет)
        if ($('evTitle')) $('evTitle').value = event.title || '';
        if ($('evGenre')) $('evGenre').value = event.requiredGenre || '';
        if ($('evDesc'))  $('evDesc').value = event.description || '';
        if ($('evCity'))  $('evCity').value = event.city || '';
        if ($('evLocation')) $('evLocation').value = event.locationName || '';
        if ($('evAddress'))  $('evAddress').value = event.address || '';
        if ($('evDate'))  $('evDate').value = event.eventDate || '';
        if ($('evRewardType')) $('evRewardType').value = event.rewardType || 'BY_AGREEMENT';
        if ($('evFee'))   $('evFee').value = event.fixedFeeAmount || '';

        // Время из базы приходит как "HH:mm:ss", режем до "HH:mm"
        if (event.startTime && $('evStartTime')) $('evStartTime').value = event.startTime.slice(0, 5);
        if (event.endTime && $('evEndTime')) $('evEndTime').value = event.endTime.slice(0, 5);

        // Скрываем загрузку, показываем форму
        if ($('loadingForm')) $('loadingForm').style.display = 'none';
        if ($('editForm')) $('editForm').style.display = 'block';

    } catch (e) {
        console.error("🚨 Ошибка при загрузке данных:", e);
        if ($('loadingForm')) {
            $('loadingForm').innerHTML = `<p style="color: var(--danger);">Ошибка: ${e.message}<br>Откройте консоль (F12) для деталей.</p>`;
        }
    }
}

// 2. Отправка обновленных данных
async function submitEditEvent() {
    // 1. БЕРЕМ ID ИЗ ХЭША (решетки)
    const eventId = window.location.hash.replace('#', '');

    // 2. ЖЕЛЕЗОБЕТОННАЯ ПРОВЕРКА (отсекаем строку "null")
    if (!eventId || eventId === 'null' || eventId === 'undefined') {
        alert("Ошибка: потерян ID мероприятия! URL должен содержать #id");
        return; // Останавливаем выполнение, чтобы не слать бред на бэкенд
    }

    // 3. Собираем сырые значения из инпутов
    const title = $('evTitle').value.trim();
    const dateVal = $('evDate').value;
    const startVal = $('evStartTime').value;
    const endVal = $('evEndTime').value;

    if (!title || !dateVal || !startVal) {
        alert("Название, дата и время начала обязательны!");
        return;
    }

    // 4. Формируем объект
    const eventData = {
        title: title,
        description: $('evDesc').value.trim() || null,
        city: $('evCity').value.trim() || null,
        locationName: $('evLocation').value.trim() || null,
        address: $('evAddress').value.trim() || null,
        requiredGenre: $('evGenre').value.trim() || null,
        eventDate: dateVal,
        startTime: startVal + ":00",
        endTime: endVal ? (endVal + ":00") : null,
        rewardType: $('evRewardType').value,
        fixedFeeAmount: $('evFee').value ? parseFloat($('evFee').value) : null,
        technicalRequirements: "Не указано",
        durationMinutes: null
    };

    // 5. Отправляем PATCH запрос
    const token = localStorage.getItem('token');
    const btn = document.querySelector('#editForm .btn-modal');
    btn.textContent = 'Сохранение...';
    btn.disabled = true;

    try {
        const response = await fetch(`http://localhost:8080/api/v1/event/${eventId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });

        if (response.ok) {
            alert('Изменения успешно сохранены!');
            window.location.href = 'organizer.html'; // Возвращаемся в профиль
        } else {
            const err = await response.json().catch(() => ({}));
            alert('Ошибка бэкенда: ' + (err.detail || err.message || response.status));
        }
    } catch (e) {
        console.error("Ошибка при отправке:", e);
        alert('Ошибка соединения с сервером');
    } finally {
        btn.textContent = 'Сохранить изменения';
        btn.disabled = false;
    }
}

/* ═══════════════════════════════════════════
   ЗАГРУЗКА ЗАЯВОК (Для организатора)
═══════════════════════════════════════════ */
async function loadApplications(page = 0) {
    const appsList = $('appsList');
    if (!appsList) return; // Мы не на странице заявок

    const eventId = window.location.hash.replace('#', '');
    if (!eventId) {
        alert("ID мероприятия не найден.");
        window.location.href = 'organizer.html';
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/api/v1/application/event/${eventId}?page=${page}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (!response.ok) throw new Error();

        const pageData = await response.json();
        const apps = pageData.content || [];

        $('appsLoading').style.display = 'none';

        if (apps.length === 0) {
            $('appsEmpty').style.display = 'flex';
            return;
        }

        // Рендерим заявки
        appsList.innerHTML = apps.map(app => {
            const d = new Date(app.applicationDate);
            const dateStr = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' }).format(d);

            const artistName = app.artistName || 'Неизвестный артист';

            return `
                <div class="app-card">
                    <div class="app-header">
                        <div>
                            <h3 style="margin:0 0 4px; font-size:18px;">${escapeHtml(artistName)}</h3>
                            <span style="color:var(--text-3); font-size:13px;">Отправлено: ${dateStr}</span>
                        </div>
                        <span class="status-badge status-${app.status}">
                            ${app.status === 'PENDING' ? 'НА РАССМОТРЕНИИ' : app.status === 'APPROVED' ? 'ПРИНЯТА' : 'ОТКЛОНЕНА'}
                        </span>
                    </div>

                    <div class="app-letter">
                        ${escapeHtml(app.coverLetter)}
                    </div>

                    <!-- Кнопки решения (показываем только если заявка PENDING) -->
                ${app.status === 'PENDING' ? `
                    <div style="display:flex; gap:12px;">
                        <button class="btn-modal" style="flex:1; padding:10px;" onclick="changeAppStatus('${app.id}', 'APPROVED')">Принять</button>
                        <button class="btn-outline" style="flex:1; padding:10px; border-color:var(--danger); color:var(--danger);" onclick="changeAppStatus('${app.id}', 'REJECTED')">Отклонить</button>
                    </div>
                ` : ''}
                </div>
            `;
        }).join('');

    } catch (e) {
        $('appsLoading').style.display = 'none';
        appsList.innerHTML = '<p style="color:var(--danger);">Ошибка при загрузке заявок.</p>';
    }
}

// Заглушка для смены статуса
async function changeAppStatus(applicationId, newStatus) {
    alert(`Тут будет запрос на смену статуса заявки ${applicationId} на ${newStatus}. Пока бэкенд для этого не написан!`);
    // После успешного запроса на бэкенд нужно вызвать loadApplications(0) чтобы обновить список
}


// В script.js обновляем функцию changeAppStatus
async function changeAppStatus(applicationId, newStatus) {
    const token = localStorage.getItem('token');

    // Подтверждение
    if (!confirm(`Вы уверены, что хотите установить статус: ${newStatus}?`)) return;

    try {
        const response = await fetch(`http://localhost:8080/api/v1/application/${applicationId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: newStatus // Шлем именно "APPROVED" или "REJECTED"
            })
        });

        if (response.ok) {
            alert('Статус обновлен!');
            loadApplications(0); // Перезагружаем список
        } else {
            const err = await response.json().catch(() => ({}));
            alert('Ошибка: ' + (err.detail || 'Не удалось обновить статус'));
        }
    } catch (e) {
        alert('Ошибка соединения с сервером');
    }
}