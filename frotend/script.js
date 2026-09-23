// Base URL da API (Padrão: Produção Vercel com fallback Local)
let apiBaseUrl = localStorage.getItem("cinesudio_api_url") || "https://crudfilmes-88qu.vercel.app";

// Estado global de filmes
let todosOsFilmes = [];
let filmeParaDeletarId = null;

// Inicialização ao carregar o DOM
document.addEventListener("DOMContentLoaded", () => {
    // Sincronizar o selector de API
    const selectApi = document.getElementById("apiSelect");
    if (selectApi) {
        selectApi.value = apiBaseUrl;
    }
    
    // Buscar filmes ao iniciar
    buscarFilmes();
});

// Alterar endpoint da API (Nuvem / Local)
function alterarApi(novaUrl) {
    apiBaseUrl = novaUrl;
    localStorage.setItem("cinesudio_api_url", novaUrl);
    exibirToast(`Servidor alterado para: ${novaUrl.includes("localhost") ? "Local (Porta 8080)" : "Nuvem (Vercel)"}`, "info");
    buscarFilmes();
}

// Buscar todos os filmes da API (GET /all-movies)
async function buscarFilmes() {
    const grid = document.getElementById("filmesGrid");
    const emptyState = document.getElementById("emptyState");

    try {
        // Exibir skeletons de carregamento
        grid.style.display = "grid";
        emptyState.style.display = "none";
        grid.innerHTML = `
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
        `;

        const resposta = await fetch(`${apiBaseUrl}/all-movies`);
        
        if (!resposta.ok) {
            throw new Error(`Erro na API (${resposta.status})`);
        }

        const dados = await resposta.json();
        
        // Tratar dados nulos ou vazios
        todosOsFilmes = Array.isArray(dados) ? dados.filter(f => f && (f.name || f.titulo || f.id)) : [];
        
        // Popular filtro de gêneros
        popularFiltroGeneros(todosOsFilmes);

        // Renderizar filmes
        renderizarFilmes(todosOsFilmes);

    } catch (erro) {
        console.error("Erro ao buscar filmes:", erro);
        grid.style.display = "none";
        emptyState.style.display = "block";
        emptyState.querySelector("h3").innerText = "Erro ao conectar com a API";
        emptyState.querySelector("p").innerText = `Não foi possível carregar os filmes de ${apiBaseUrl}. Verifique se o servidor backend está online.`;
        exibirToast("Erro ao conectar com o servidor da API.", "danger");
    }
}

// Renderizar cards na tela
function renderizarFilmes(filmes) {
    const grid = document.getElementById("filmesGrid");
    const emptyState = document.getElementById("emptyState");
    const counterElement = document.getElementById("totalFilmesCount");

    if (counterElement) {
        counterElement.innerText = filmes.length;
    }

    if (filmes.length === 0) {
        grid.style.display = "none";
        emptyState.style.display = "block";
        return;
    }

    grid.style.display = "grid";
    emptyState.style.display = "none";

    grid.innerHTML = filmes.map((filme) => {
        const id = filme.id;
        const titulo = filme.name || filme.titulo || "Título Desconhecido";
        const genero = filme.genero || "Geral";
        const duracao = formatarDuracao(filme.duracao);
        const classificacao = formatarClassificacao(filme.classificacao || filme.classificacao_etaria);
        const gradientBg = gerarGradientePoster(titulo, genero);

        return `
            <article class="movie-card" data-id="${id}">
                <div class="card-banner" style="background: ${gradientBg}">
                    <div class="poster-pattern" style="background-image: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 60%);"></div>
                    <span class="genre-tag">${escaparHtml(genero)}</span>
                    <span class="rating-badge ${classificacao.classe}">${classificacao.texto}</span>
                </div>
                
                <div class="card-body">
                    <div>
                        <h2 class="movie-title" title="${escaparHtml(titulo)}">${escaparHtml(titulo)}</h2>
                        <div class="movie-meta">
                            <span class="meta-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            </span>
                            <span>${duracao}</span>
                        </div>
                    </div>

                    <div class="card-actions">
                        <button class="btn btn-edit" onclick="abrirModalEdicao(${id})" title="Editar filme">
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            <span>Editar</span>
                        </button>
                        <button class="btn btn-delete" onclick="solicitarExclusao(${id}, '${escaparHtml(titulo).replace(/'/g, "\\'")}')" title="Apagar filme">
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            <span>Apagar</span>
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

// Abrir Modal de Edição com Dados Preenchidos (PUT /update-movie/:id)
function abrirModalEdicao(id) {
    const filme = todosOsFilmes.find(f => f.id === id);
    if (!filme) return;

    document.getElementById("editId").value = filme.id;
    document.getElementById("editTitle").value = filme.name || filme.titulo || "";
    document.getElementById("editGender").value = filme.genero || "";
    document.getElementById("editDuration").value = filme.duracao || "";
    document.getElementById("editAgeLimit").value = filme.classificacao || filme.classificacao_etaria || 0;

    const modal = document.getElementById("modalEdicao");
    modal.style.display = "flex";
}

function fecharModalEdicao() {
    document.getElementById("modalEdicao").style.display = "none";
}

// Salvar Edição do Filme (PUT /update-movie/:id)
async function salvarEdicaoFilme(event) {
    event.preventDefault();

    const id = document.getElementById("editId").value;
    const titulo = document.getElementById("editTitle").value.trim();
    const genero = document.getElementById("editGender").value.trim();
    const duracao = parseInt(document.getElementById("editDuration").value);
    const classificacao_etaria = parseInt(document.getElementById("editAgeLimit").value);

    if (!titulo || !genero || isNaN(duracao) || isNaN(classificacao_etaria)) {
        exibirToast("Preencha todos os campos corretamente!", "danger");
        return;
    }

    const btnSubmit = document.getElementById("btnSubmitEdit");
    const textoOriginal = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Salvando...";

    try {
        const resposta = await fetch(`${apiBaseUrl}/update-movie/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                titulo,
                genero,
                duracao,
                classificacao_etaria
            })
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            exibirToast(resultado.message || "Filme atualizado com sucesso!", "success");
            fecharModalEdicao();
            buscarFilmes();
        } else {
            exibirToast(resultado.error || "Erro ao atualizar filme.", "danger");
        }
    } catch (erro) {
        console.error("Erro ao editar filme:", erro);
        exibirToast("Falha na comunicação com o servidor.", "danger");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
    }
}

// Solicitar Confirmação de Exclusão (DELETE /delete-movie/:id)
function solicitarExclusao(id, titulo) {
    filmeParaDeletarId = id;
    document.getElementById("deleteMovieTitle").innerText = `"${titulo}"`;
    document.getElementById("modalDelecao").style.display = "flex";
}

function fecharModalDelecao() {
    filmeParaDeletarId = null;
    document.getElementById("modalDelecao").style.display = "none";
}

// Executar Exclusão do Filme (DELETE /delete-movie/:id)
async function executarExclusao() {
    if (!filmeParaDeletarId) return;

    const btnConfirm = document.getElementById("btnConfirmDelete");
    btnConfirm.disabled = true;
    btnConfirm.innerText = "Apagando...";

    try {
        const resposta = await fetch(`${apiBaseUrl}/delete-movie/${filmeParaDeletarId}`, {
            method: "DELETE"
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            exibirToast(resultado.message || "Filme apagado com sucesso!", "success");
            fecharModalDelecao();
            buscarFilmes();
        } else {
            exibirToast(resultado.error || "Erro ao apagar filme.", "danger");
        }
    } catch (erro) {
        console.error("Erro ao deletar filme:", erro);
        exibirToast("Falha ao apagar filme no servidor.", "danger");
    } finally {
        btnConfirm.disabled = false;
        btnConfirm.innerText = "Apagar Filme";
    }
}

// Abrir e Salvar Novo Filme (POST /add-movie)
function abrirModalCadastro() {
    document.getElementById("formCadastro").reset();
    document.getElementById("modalCadastro").style.display = "flex";
}

function fecharModalCadastro() {
    document.getElementById("modalCadastro").style.display = "none";
}

async function salvarNovoFilme(event) {
    event.preventDefault();

    const titulo = document.getElementById("addTitle").value.trim();
    const genero = document.getElementById("addGender").value.trim();
    const duracao = parseInt(document.getElementById("addDuration").value);
    const classificacao_etaria = parseInt(document.getElementById("addAgeLimit").value);

    if (!titulo || !genero || isNaN(duracao) || isNaN(classificacao_etaria)) {
        exibirToast("Preencha todos os campos do formulário!", "danger");
        return;
    }

    const btnSubmit = document.getElementById("btnSubmitAdd");
    const textoOriginal = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Cadastrando...";

    try {
        const resposta = await fetch(`${apiBaseUrl}/add-movie`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                titulo,
                genero,
                duracao,
                classificacao_etaria
            })
        });

        const resultado = await resposta.json();

        if (resposta.ok || resposta.status === 201) {
            exibirToast(resultado.message || "Filme cadastrado com sucesso!", "success");
            fecharModalCadastro();
            buscarFilmes();
        } else {
            exibirToast(resultado.error || "Erro ao cadastrar filme.", "danger");
        }
    } catch (erro) {
        console.error("Erro ao cadastrar filme:", erro);
        exibirToast("Falha ao enviar novo filme.", "danger");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
    }
}

// Filtro e Busca em Tempo Real
function filtrarFilmes() {
    const busca = document.getElementById("searchInput").value.toLowerCase().trim();
    const generoSelecionado = document.getElementById("genreFilter").value.toLowerCase();
    const btnClear = document.getElementById("btnClearSearch");

    if (btnClear) {
        btnClear.style.display = busca ? "block" : "none";
    }

    const filtrados = todosOsFilmes.filter((filme) => {
        const titulo = (filme.name || filme.titulo || "").toLowerCase();
        const genero = (filme.genero || "").toLowerCase();

        const bateBusca = titulo.includes(busca) || genero.includes(busca);
        const bateGenero = !generoSelecionado || genero === generoSelecionado;

        return bateBusca && bateGenero;
    });

    renderizarFilmes(filtrados);
}

function limparBusca() {
    document.getElementById("searchInput").value = "";
    document.getElementById("genreFilter").value = "";
    document.getElementById("btnClearSearch").style.display = "none";
    renderizarFilmes(todosOsFilmes);
}

function popularFiltroGeneros(filmes) {
    const select = document.getElementById("genreFilter");
    if (!select) return;

    const generosUnicos = Array.from(new Set(filmes.map(f => f.genero).filter(Boolean)));
    
    select.innerHTML = `<option value="">Todos os Gêneros (${generosUnicos.length})</option>` +
        generosUnicos.map(g => `<option value="${escaparHtml(g)}">${escaparHtml(g)}</option>`).join("");
}

// Formatadores e Utilitários Visuais
function formatarDuracao(minutos) {
    if (!minutos || isNaN(minutos) || minutos <= 0) return "Duração N/A";
    const min = parseInt(minutos);
    if (min < 60) return `${min} min`;
    const horas = Math.floor(min / 60);
    const rest = min % 60;
    return rest > 0 ? `${horas}h ${rest}m` : `${horas}h`;
}

function formatarClassificacao(valor) {
    const num = parseInt(valor);
    if (isNaN(num) || num <= 0) {
        return { texto: "Livre", classe: "rating-livre" };
    }
    if (num < 12) return { texto: `${num}+`, classe: "rating-10" };
    if (num < 14) return { texto: "12+", classe: "rating-12" };
    if (num < 16) return { texto: "14+", classe: "rating-14" };
    if (num < 18) return { texto: "16+", classe: "rating-16" };
    return { texto: "18+", classe: "rating-18" };
}

// Gerar Gradiente Estético Procedural para o Card
function gerarGradientePoster(titulo, genero) {
    const paletas = [
        "linear-gradient(135deg, #1e1b4b 0%, #311b92 50%, #4a148c 100%)",
        "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
        "linear-gradient(135deg, #450a0a 0%, #78350f 50%, #991b1b 100%)",
        "linear-gradient(135deg, #064e3b 0%, #047857 50%, #065f46 100%)",
        "linear-gradient(135deg, #172554 0%, #1e40af 50%, #1d4ed8 100%)",
        "linear-gradient(135deg, #3b0764 0%, #6b21a8 50%, #581c87 100%)"
    ];

    let hash = 0;
    const str = (titulo + genero).toString();
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % paletas.length;
    return paletas[index];
}

function escaparHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Sistema Toast de Notificações
function exibirToast(mensagem, tipo = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${tipo}`;
    
    let icone = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;
    if (tipo === "success") {
        icone = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    } else if (tipo === "danger") {
        icone = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>`;
    }

    toast.innerHTML = `${icone} <span>${escaparHtml(mensagem)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(50px)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}