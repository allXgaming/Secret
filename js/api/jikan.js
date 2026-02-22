// Jikan API functions (moved from home.js and main.js)

export async function fetchAnimeByCategory(category, page) {
    const grid = document.getElementById('animeGrid');
    const loader = document.getElementById('loading');
    const pagination = document.getElementById('paginationControls');
    grid.innerHTML = '';
    loader.classList.remove('hidden');
    pagination.style.display = 'none';

    let url = '';
    switch(category) {
        case 'trending': url = `https://api.jikan.moe/v4/top/anime?filter=bypopularity&page=${page}`; break;
        case 'new': url = `https://api.jikan.moe/v4/seasons/now?page=${page}`; break;
        case 'upcoming': url = `https://api.jikan.moe/v4/seasons/upcoming?page=${page}`; break;
        case 'all': url = `https://api.jikan.moe/v4/anime?order_by=members&sort=desc&page=${page}`; break;
    }

    try {
        const res = await fetch(url);
        const data = await res.json();
        loader.classList.add('hidden');
        renderAnimeGrid(data.data);
        pagination.classList.remove('hidden');
        pagination.style.display = 'flex';
        document.getElementById('pageIndicator').innerText = `Page ${page}`;
        const hasNext = data.pagination?.has_next_page || category === 'all';
        document.getElementById('nextPageBtn').style.display = hasNext ? 'block' : 'none';
        document.getElementById('prevPageBtn').style.display = page === 1 ? 'none' : 'block';
    } catch(e) { 
        loader.classList.add('hidden');
        grid.innerHTML = '<p class="text-center" style="grid-column:1/-1; color:#ff5252;">Error loading data.</p>';
    }
}

export async function searchAnime(query, page = 1) {
    const grid = document.getElementById('animeGrid');
    const loader = document.getElementById('loading');
    const pagination = document.getElementById('paginationControls');
    if(page === 1) grid.innerHTML = '';
    loader.classList.remove('hidden');
    document.getElementById('sectionTitle').innerText = `Search Results: "${query}"`;
    document.querySelectorAll('#homePage .filter-btn').forEach(btn => btn.classList.remove('active'));

    try {
        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${query}&sfw&page=${page}`);
        const data = await res.json();
        loader.classList.add('hidden');
        if(data.data.length === 0 && page === 1) {
            grid.innerHTML = '<p class="text-center" style="color:#aaa; grid-column:1/-1;">No results found</p>';
            pagination.style.display = 'none';
            return;
        }
        renderAnimeGrid(data.data);
        pagination.style.display = 'flex';
        document.getElementById('pageIndicator').innerText = `Page ${page}`;
        document.getElementById('nextPageBtn').style.display = data.pagination.has_next_page ? 'block' : 'none';
        document.getElementById('prevPageBtn').style.display = page === 1 ? 'none' : 'block';
    } catch(e) {
        loader.classList.add('hidden');
    }
}

function renderAnimeGrid(animeList) {
    const grid = document.getElementById('animeGrid');
    animeList.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.addEventListener('click', () => window.navigateTo('details', { id: anime.mal_id }));
        let title = anime.title_english || anime.title;
        card.innerHTML = `
            <img src="${anime.images.jpg.image_url}" loading="lazy">
            <div class="card-content">
                <div class="card-title">${title}</div>
                <div style="font-size:11px; color:var(--text-muted); display:flex; justify-content:space-between; font-weight:600;">
                    <span>⭐ ${anime.score||'N/A'}</span>
                    <span>${anime.year || anime.type || ''}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

export async function loadDetailsPage(animeId) {
    const loading = document.getElementById('detailsLoading');
    const content = document.getElementById('detailsContent');
    const statusSelect = document.getElementById('statusSelect');

    loading.style.display = 'flex';
    content.classList.add('hidden');
    try {
        const res = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`);
        const json = await res.json();
        window.currentAnime = json.data;
        loading.style.display = 'none';
        content.classList.remove('hidden');
        document.getElementById('title').innerText = window.currentAnime.title_english || window.currentAnime.title;
        document.getElementById('banner').src = window.currentAnime.images.jpg.large_image_url;
        document.getElementById('poster').src = window.currentAnime.images.jpg.image_url;
        document.getElementById('score').innerText = window.currentAnime.score || 'N/A';
        document.getElementById('episodes').innerText = window.currentAnime.episodes || '?';
        document.getElementById('year').innerText = window.currentAnime.year || 'N/A';
        document.getElementById('type').innerText = window.currentAnime.type || 'TV';
        document.getElementById('synopsis').innerText = window.currentAnime.synopsis || "No description available.";
        if(window.currentAnime.genres) document.getElementById('genres').innerHTML = window.currentAnime.genres.map(g => `<span class="genre-tag">${g.name}</span>`).join('');
        document.getElementById('addBtn').onclick = window.addToWatchlist;

        if(window.currentAnime.status === "Not yet aired") {
            statusSelect.innerHTML = `<option value="plan">Plan to Watch</option>`;
        } else {
            statusSelect.innerHTML = `
                <option value="watching">Watching</option>
                <option value="completed">Completed</option>
                <option value="plan">Plan to Watch</option>
                <option value="dropped">Dropped</option>
            `;
        }
    } catch (error) {
        loading.style.display = 'none';
    }
}