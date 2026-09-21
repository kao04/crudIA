async function buscarFilmes() {

    const resposta = await fetch("https://crudfilmes-88qu.vercel.app/all-movies")
    const filmes = await resposta.json()

    const lista = document.querySelector(".filmes")
    lista.innerHTML = ""

    filmes.forEach((filme) => {
        lista.innerHTML += `
		<div>
        <h2>${filme.title}</h2>
        <p><strong>Gênero: ${filme.gender}</strong></p>
        <p><strong>Duração: ${filme.duration}</strong></p>
        <p><strong>Clasificação: ${filme.classificacao > "0" ? filme.ageLimit + 'anos' : 'livre'}</strong></p>
        </div>
                `
        console.log(filme)
    })
}

buscarFilmes()