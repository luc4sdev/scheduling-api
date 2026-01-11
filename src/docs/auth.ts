/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Endpoint de autenticação
 */


/**
 * @swagger
 * /api/sessions/password:
 *   post:
 *     summary: Autentica um usuário e gera um token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@email.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "admin123"
 *     responses:
 *       201:
 *         description: Autenticação realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT para ser usado no header Authorization
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Credenciais inválidas ou erro de validação (Zod)
 *       500:
 *         description: Erro interno do servidor
 */


/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Registra o logout do usuário
 *     description: Esta rota deve ser chamada pelo front antes de limpar o token.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout registrado com sucesso
 */

