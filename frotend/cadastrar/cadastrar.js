let apiBaseUrl = localStorage.getItem("cinesudio_api_url") || "https://crudfilmes-88qu.vercel.app";

document.addEventListener("DOMContentLoaded", () => {
    const selectApi = document.getElementById("apiSelect");
    if (selectApi) {
        selectApi.value = apiBaseUrl;
    }
});

function alterarApi(novaUrl) {
    apiBaseUrl = novaUrl;
    localStorage.setItem("cinesudio_api_url", novaUrl);
    exibirToast(`Servidor alterado para: ${novaUrl.includes("localhost") ? "Local" : "Nuvem"}`, "info");
}

async function cadastrarFilme(event) {
    event.preventDefault();

    const inputTitle = document.getElementById("title");
    const inputGender = document.getElementById("gender");
    const inputAgeLimit = document.getElementById("ageLimit");
    const inputDuration = document.getElementById("duration");

    const titulo = inputTitle.value.trim();
    const genero = inputGender.value.trim();
    const duracao = parseInt(inputDuration.value);
    const classificacao_etaria = parseInt(inputAgeLimit.value);

    if (!titulo || !genero || isNaN(duracao) || isNaN(classificacao_etaria)) {
        exibirToast("Preencha todas as informações do filme!", "danger");
        return;
    }

    const btnSubmit = document.getElementById("btnSubmitCadastrar");
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

        const dados = await resposta.json();

        if (resposta.ok || resposta.status === 201) {
            exibirToast(dados.message || "Filme cadastrado com sucesso!", "success");
            setTimeout(() => {
                window.location.href = "../index.html";
            }, 1000);
        } else {
            exibirToast(dados.error || "Erro ao cadastrar filme.", "danger");
        }
    } catch (erro) {
        console.error("Erro no cadastro:", erro);
        exibirToast("Erro de conexão com o servidor.", "danger");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
    }
}

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

    toast.innerHTML = `${icone} <span>${mensagem}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(50px)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}