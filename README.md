# 📅 Scheduling API

O projeto consiste em uma API back-end para gerenciamento de agendamentos, permitindo o controle eficiente de salas, usuários e horários.

Foi realizada a integração com o envio de emails para notificar clientes e admnistradores.

O sistema foi desenvolvido utilizando TypeScript, Node.js e Express, com autenticação baseada em JWT e persistência de dados via MySQL utilizando Sequelize ORM. O ambiente de banco de dados é facilmente configurado via Docker.

O projeto segue boas práticas de Clean Code e está preparado para receber testes unitários e E2E.

Para a documentação da API foi utilizado o Swagger.

---

<br/>

## 📗 Link da documentação da API

<h2>Link: <a href="https://scheduling-api-ws9u.onrender.com/api/docs" target="_blank" rel="external">Documentação</a></h2>

<br/>

## 💻 Pré-requisitos

- Node.js (versão mais recente)
- Docker (versão mais recente)
- Git (para clonar o repositório)

---

## ⚙️ Instalação

Clone o repositório e instale as dependências:

```
git clone <url-do-repositorio>
cd scheduling-api
npm install
```

---

## 🚀 Rodando o Projeto

1. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
NODE_ENV=dev
PORT="3333"
DATABASE_URL="mysql://scheduling:scheduling@localhost:3306/scheduling"
JWT_SECRET="secret"
MAIL_USER="usuario@email.com"
MAIL_PASS="password_email"
```

2. Suba o container do banco de dados:

```
docker compose up -d
```

3. Inicie a aplicação:

```
npm run dev
```

---

## 🧪 Testes

Os testes foram implementados, tanto unitários como E2E utilizando Vitest e Supertest. Para rodar os testes:

```
npm run test        # Testes unitários
npm run test:e2e    # Testes E2E
```

---

## 🛠️ Tecnologias Utilizadas

- TypeScript
- Node.js
- Express
- Sequelize
- MySQL
- Docker
- Nodemailer (para envio de emails)
- Vitest (para testes)
- Supertest (para testes E2E)
- Swagger (para a documentação)

---

## ✨ Funcionalidades

- Autenticação via JWT
- Sistema RBAC
- Gerenciamento de usuários
- Gerenciamento de salas
- Agendamento de horários
- Notificação por email quando um cliente cria um agendamento (enviado para administradores)
- Notificação por email quando um administrador aprova um agendamento (enviado para o cliente)
- Testes automatizados (Github Actions)
- Documentação com Swagger
- Implementação de Rate-Limit para escalabilidade e segurança (Ex: 10 tentativas de login bloqueio por 1 min).
---

## 📄 Licença

Este projeto está sob licença MIT.

---

Sinta-se à vontade para contribuir!


