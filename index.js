import express from "express"
import mysql2 from "mysql2"
import cors from "cors"

const database = mysql2.createPool({
    host: "benserverplex.ddns.net",
    user: "alunos",
    password: "senhaAlunos",
    database: "alunos_filmes_03MA"
})

const app = express()

app.use(express.json())
app.use(cors())

// Rota raiz para evitar o erro 404 "Cannot GET /"
app.get("/", (request, response) => {
    response.send("Bem-vindo à API de Filmes!");
})

app.get("/all-movies", (request, response) => {
    const selectCommand = "SELECT * FROM Filmes_kalebe"

    database.query(selectCommand, (error, data) => {
        if (error) {
            console.log(error)
            return
        }

        response.json(data)
    })
})

app.post("/add-movie", (request, response) => {
    const { titulo, genero, duracao, classificacao_etaria } = request.body

    const insertCommand = 
        "INSERT INTO Filmes_kalebe(name, genero, duracao, classificacao) VALUES (?, ?, ?, ?)"

    database.query(insertCommand, [titulo, genero, duracao, classificacao_etaria], (error) => {
        if (error) {
            console.log(error)
           
            response.status(500).json({ error: "Erro ao inserir no banco de dados" })
        } else {
            response.status(201).json({
                message: "Filme adicionado com sucesso!"
            })
        }
    })
})

app.delete("/delete-movie/:id", (request, response) => {
    const { id } = request.params

    const deleteCommand = "DELETE FROM Filmes_kalebe WHERE id=?"

    database.query(deleteCommand, [id], (error) => {
        if (error) {
            console.log(error)
        } else {
            response.json({
                message: "Filme apagado com sucesso!"
            })
        }
    })
})

app.put("/update-movie/:id", (request, response) => {
    const { id } = request.params
    const { titulo, genero, duracao, classificacao_etaria } = request.body

    const updateCommand = 
        "UPDATE Filmes_kalebe SET name = ?, genero = ?, duracao = ?, classificacao = ? WHERE id = ?"

    database.query(updateCommand, [titulo, genero, duracao, classificacao_etaria, id], (error) => {
        if (error) {
            console.log(error)
        } else {
            response.json({
                message: "Informações do filme atualizadas com sucesso!"
            })
        }
    })
})

app.listen(8080, () => {
    console.log("Servidor rodando na porta 8080")
})