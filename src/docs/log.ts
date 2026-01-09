/**
 * @swagger
 * tags:
 *   - name: Logs
 *     description: Histórico de atividades do sistema
 */

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Lista logs do sistema (Paginado)
 *     description: Retorna logs filtrados. Se for ADMIN vê tudo, se for USER vê apenas os seus.
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Itens por página
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Busca textual em 'action' ou 'module'
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar por data específica (YYYY-MM-DD)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Ordenação por data de criação
 *     responses:
 *       200:
 *         description: Lista de logs retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Log'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       400:
 *         description: Erro de validação nos filtros (Zod)
 *       401:
 *         description: Usuário não autenticado
 *       500:
 *         description: Erro interno do servidor
 */