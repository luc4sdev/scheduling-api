/**
 * @swagger
 * tags:
 *   - name: Schedules
 *     description: Gerenciamento de agendamentos
 */

/**
 * @swagger
 * /api/schedules/availability:
 *   get:
 *     summary: Verifica horários disponíveis em uma sala e data
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da sala
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: "Data (YYYY-MM-DD)"
 *     responses:
 *       200:
 *         description: Lista de horários disponíveis
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["08:00", "08:30", "09:00"]
 *       400:
 *         description: Erro de validação ou data inválida
 *       404:
 *         description: Sala não encontrada
 */

/**
 * @swagger
 * /api/schedules:
 *   post:
 *     summary: Cria um novo agendamento
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateScheduleInput'
 *     responses:
 *       201:
 *         description: Agendamento criado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Schedule'
 *       400:
 *         description: Erro de validação ou horário indisponível
 *
 *   get:
 *     summary: Lista agendamentos (Paginado)
 *     description: Se for Admin vê todos, se for User vê apenas os seus ou onde é o profissional.
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Busca textual
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: roomId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Lista de agendamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Schedule'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */

/**
 * @swagger
 * /api/schedules/{id}/status:
 *   patch:
 *     summary: Atualiza o status de um agendamento
 *     tags: [Schedules]
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
 *             $ref: '#/components/schemas/UpdateScheduleStatusInput'
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Schedule'
 *       400:
 *         description: Status inválido
 *       404:
 *         description: Agendamento não encontrado
 */
