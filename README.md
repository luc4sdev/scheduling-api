# 📅 Scheduling API

O projeto consiste em uma API back-end para gerenciamento de agendamentos, permitindo o controle eficiente de salas, usuários e horários.

O sistema foi desenvolvido utilizando TypeScript, Node.js e Fastify, com autenticação baseada em JWT e persistência de dados via PostgreSQL utilizando Prisma ORM. O ambiente de banco de dados é facilmente configurado via Docker.

A documentação da API é gerada automaticamente com Swagger, facilitando a integração e o entendimento das rotas disponíveis.

O projeto segue boas práticas de Clean Code, SOLID, DDD e está preparado para receber testes unitários e E2E

---

## 💻 Pré-requisitos

- Node.js (versão mais recente)
- Docker (versão mais recente)
- Git (opcional, para clonar o repositório)

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
DATABASE_URL="postgresql://docker:docker@localhost:5432/scheduling?schema=public"
JWT_SECRET="secret"
```

2. Gere o client do Prisma:

```
npx prisma generate
```

3. Suba o container do banco de dados:

```
docker compose up -d
```

4. (Opcional) Popule o banco de dados:

```
npm run seed
```

5. Inicie a aplicação:

```
npm run dev
```

Acesse a documentação em: [http://localhost:3333/docs](http://localhost:3333/docs)

---

## 🧪 Testes

O projeto está preparado para receber testes unitários e E2E utilizando Vitest. Para rodar os testes (após implementá-los):

```
npm run test        # Testes unitários
npm run test:e2e    # Testes E2E
```

---

## 🛠️ Tecnologias Utilizadas

- TypeScript
- Node.js
- Fastify
- Prisma ORM
- PostgreSQL
- Docker
- Swagger
- Vitest (para testes)

---

## ✨ Funcionalidades

- Autenticação via JWT
- Gerenciamento de usuários
- Gerenciamento de salas
- Agendamento de horários
- Documentação automática via Swagger

---

## 📄 Licença

Este projeto está sob licença MIT.

---

Sinta-se à vontade para contribuir, sugerir melhorias ou relatar problemas!


