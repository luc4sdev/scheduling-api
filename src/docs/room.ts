/**
 * @swagger
 * tags:
 *   - name: Rooms
 *     description: Gerenciamento de salas e horários de funcionamento
 */

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Lista todas as salas cadastradas
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de salas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 *
 *   post:
 *     summary: Cria uma ou mais salas (em lote)
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/CreateRoomInput'
 *     responses:
 *       201:
 *         description: Salas criadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 *       400:
 *         description: Erro de validação ou formato de hora inválido
 */

/**
 * @swagger
 * /api/rooms/{id}:
 *   put:
 *     summary: Atualiza uma sala existente
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoomInput'
 *     responses:
 *       200:
 *         description: Sala atualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       404:
 *         description: Sala não encontrada
 *
 *   delete:
 *     summary: Remove uma sala (Soft delete ou hard delete)
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Sala removida com sucesso (sem conteúdo)
 *       404:
 *         description: Sala não encontrada
 */
