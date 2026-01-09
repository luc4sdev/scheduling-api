/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           enum: [USER, ADMIN]
 *         isActive:
 *           type: boolean
 *         cep:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *
 *     CreateUserInput:
 *       type: object
 *       required:
 *         - name
 *         - lastName
 *         - email
 *         - password
 *         - cep
 *         - street
 *         - number
 *         - neighborhood
 *         - city
 *         - state
 *       properties:
 *         name:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *         cep:
 *           type: string
 *         street:
 *           type: string
 *         number:
 *           type: string
 *         complement:
 *           type: string
 *         neighborhood:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *
 *     UpdateUserInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *         isActive:
 *           type: boolean
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *         role:
 *           type: string
 *           enum: [USER, ADMIN]
 *
 *     Log:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         action:
 *           type: string
 *           description: "Ação realizada"
 *         module:
 *           type: string
 *           description: "Módulo onde ocorreu a ação"
 *         details:
 *           type: object
 *           description: "Objeto JSON com detalhes da operação"
 *           additionalProperties: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         userId:
 *           type: string
 *           format: uuid
 *         user:
 *           $ref: '#/components/schemas/User'
 *
 *     Room:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         startTime:
 *           type: string
 *           description: "Horário de abertura (HH:mm)"
 *           example: "08:00"
 *         endTime:
 *           type: string
 *           description: "Horário de fechamento (HH:mm)"
 *           example: "18:00"
 *         slotDuration:
 *           type: integer
 *           description: "Duração de cada agendamento em minutos"
 *           example: 30
 *         isActive:
 *           type: boolean
 *
 *     CreateRoomInput:
 *       type: object
 *       required:
 *         - name
 *         - startTime
 *         - endTime
 *       properties:
 *         name:
 *           type: string
 *         startTime:
 *           type: string
 *           pattern: '^\\d{2}:\\d{2}$'
 *           example: "08:00"
 *         endTime:
 *           type: string
 *           pattern: '^\\d{2}:\\d{2}$'
 *           example: "18:00"
 *         slotDuration:
 *           type: integer
 *           default: 30
 *           minimum: 15
 *
 *     UpdateRoomInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         startTime:
 *           type: string
 *           pattern: '^\\d{2}:\\d{2}$'
 *         endTime:
 *           type: string
 *           pattern: '^\\d{2}:\\d{2}$'
 *         slotDuration:
 *           type: integer
 *         isActive:
 *           type: boolean
 *
 *     Schedule:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         date:
 *           type: string
 *           format: date
 *           example: "2024-12-25"
 *         startTime:
 *           type: string
 *           example: "14:00"
 *         endTime:
 *           type: string
 *           example: "15:00"
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELED, COMPLETED]
 *         userId:
 *           type: string
 *           format: uuid
 *         roomId:
 *           type: string
 *           format: uuid
 *         user:
 *           $ref: '#/components/schemas/User'
 *         room:
 *           $ref: '#/components/schemas/Room'
 *
 *     CreateScheduleInput:
 *       type: object
 *       required:
 *         - roomId
 *         - date
 *         - startTime
 *       properties:
 *         roomId:
 *           type: string
 *           format: uuid
 *         date:
 *           type: string
 *           format: date
 *           example: "2024-12-25"
 *         startTime:
 *           type: string
 *           pattern: '^\\d{2}:\\d{2}$'
 *           example: "14:30"
 *
 *     UpdateScheduleStatusInput:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELED, COMPLETED]
 */
