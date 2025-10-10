const express = require('express');
const router = express.Router();
const trainingPlanController = require('../controllers/trainingPlanController');
const { secretKeyMiddleware, sessionMiddleware } = require('../middlewares/authMiddleware.js');

/**
 * @swagger
 * tags:
 *   name: TrainingPlans
 *   description: Trainingspläne verwalten
 */

/**
 * @swagger
 * /api/v2/training-plans:
 *   get:
 *     title: Get All Training Plans
 *     summary: Alle Trainingspläne abrufen
 *     tags: [TrainingPlans]
 *     responses:
 *       200:
 *         description: Liste der Trainingspläne
 */
router.get('/', secretKeyMiddleware, sessionMiddleware, trainingPlanController.getAllTrainingPlans);

/**
 * @swagger
 * /api/v2/training-plans/count:
 *   post:
 *     title: Get Training Plan Count
 *     summary: Anzahl der Trainingspläne des Benutzers abrufen
 *     tags: [TrainingPlans]
 *     responses:
 *       200:
 *         description: Anzahl der Trainingspläne
 */
router.post('/count', secretKeyMiddleware, sessionMiddleware, trainingPlanController.getTrainingPlanCount);

/**
 * @swagger
 * /api/v2/training-plans/{id}:
 *   get:
 *     title: Get Training Plan By ID
 *     summary: Trainingsplan nach ID abrufen
 *     tags: [TrainingPlans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trainingsplan-ID
 *     responses:
 *       200:
 *         description: Trainingsplan-Daten
 *       404:
 *         description: Nicht gefunden
 */
router.get('/:id', secretKeyMiddleware, sessionMiddleware, trainingPlanController.getTrainingPlanById);

/**
 * @swagger
 * /api/v2/training-plans:
 *   post:
 *     title: Create Training Plan
 *     summary: Neuen Trainingsplan erstellen
 *     tags: [TrainingPlans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Create Training Plan Request
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               goal:
 *                 type: string
 *               difficulty:
 *                 type: number
 *               visibility:
 *                 type: string
 *                 enum: [private, public]
 *               days:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     weekday:
 *                       type: string
 *                       enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
 *                     exercises:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           sets:
 *                             type: number
 *                           repetitions:
 *                             type: number
 *                           duration:
 *                             type: number
 *                           weight:
 *                             type: number
 *                           restBetweenSets:
 *                             type: number
 *                           restAfterExercise:
 *                             type: number
 *               lastCompletedAt:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, archived]
 *     responses:
 *       201:
 *         description: Trainingsplan erstellt
 *       400:
 *         description: Ungültige Eingabe
 */
router.post('/', secretKeyMiddleware, sessionMiddleware, trainingPlanController.createTrainingPlan);

/**
 * @swagger
 * /api/v2/training-plans/{id}:
 *   put:
 *     title: Update Training Plan
 *     summary: Trainingsplan aktualisieren
 *     tags: [TrainingPlans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trainingsplan-ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Update Training Plan Request
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               goal:
 *                 type: string
 *               difficulty:
 *                 type: number
 *               visibility:
 *                 type: string
 *                 enum: [private, public]
 *               days:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     weekday:
 *                       type: string
 *                       enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
 *                     exercises:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           sets:
 *                             type: number
 *                           repetitions:
 *                             type: number
 *                           duration:
 *                             type: number
 *                           weight:
 *                             type: number
 *                           restBetweenSets:
 *                             type: number
 *                           restAfterExercise:
 *                             type: number
 *               lastCompletedAt:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, archived]
 *     responses:
 *       200:
 *         description: Trainingsplan aktualisiert
 *       400:
 *         description: Ungültige Eingabe
 *       404:
 *         description: Nicht gefunden
 */
router.put('/:id', secretKeyMiddleware, sessionMiddleware, trainingPlanController.updateTrainingPlan);

/**
 * @swagger
 * /api/v2/training-plans/{id}:
 *   delete:
 *     title: Delete Training Plan
 *     summary: Trainingsplan löschen
 *     tags: [TrainingPlans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trainingsplan-ID
 *     responses:
 *       204:
 *         description: Erfolgreich gelöscht
 *       404:
 *         description: Nicht gefunden
 */
router.delete('/:id', secretKeyMiddleware, sessionMiddleware, trainingPlanController.deleteTrainingPlan);

/**
 * @swagger
 * /api/v2/training-plans/generate:
 *   post:
 *     title: Generate Training Plan
 *     summary: Generiert einen Trainingsplan basierend auf einem Text
 *     tags: [TrainingPlans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Generate Training Plan Request
 *             properties:
 *               text:
 *                 type: string
 *                 description: Beschreibung oder Wunsch für den Trainingsplan
 *           example:
 *             text: "Zweimal die Woche zuhause trainieren, aber Fokus auf die Beine, da ich für einen Radfahrmarathon übe. Die Übungen sollten nicht so schwer sein und ein Training soll ca. 25 Minuten dauern."
 *     responses:
 *       202:
 *         description: Training plan generation started
*       400:
*         description: Fehlerhafte Anfrage
*       500:
 *         description: Serverfehler
 */
router.post('/generate', secretKeyMiddleware, sessionMiddleware, trainingPlanController.generateTrainingPlan);

/**
 * @swagger
 * /api/v2/training-plans/{id}/continue:
 *   post:
 *     title: Continue Training Plan
 *     summary: Erstellt einen neuen Trainingsplan basierend auf einem bestehenden Plan
 *     tags: [TrainingPlans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trainingsplan-ID, die als Grundlage dient
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: Zusätzliche Hinweise für den neuen Plan
 *               plan:
 *                 type: object
 *                 description: Optionaler Trainingsplan, der mitgesendet wird
 *     responses:
 *       202:
 *         description: Fortsetzung der Trainingsplanerstellung gestartet
 *       403:
 *         description: Verboten
 *       404:
 *         description: Trainingsplan nicht gefunden
 */
router.post('/:id/continue', secretKeyMiddleware, sessionMiddleware, trainingPlanController.continueTrainingPlan);

/**
 * @swagger
 * /api/v2/training-plans/{id}/ask:
 *   post:
 *     title: Ask Training Plan Question
 *     summary: Stellt eine Frage zu einem Trainingsplan
 *     tags: [TrainingPlans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trainingsplan-ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *     responses:
 *       200:
 *         description: Antwort des LLM
 *       400:
 *         description: Ungültige Frage
 */
router.post('/:id/ask', secretKeyMiddleware, sessionMiddleware, trainingPlanController.askTrainingPlanQuestion);

// Update single exercise within a training plan
router.patch('/:planId/exercises/:exerciseId', secretKeyMiddleware, sessionMiddleware, trainingPlanController.updateTrainingPlanExercise);

/**
 * @swagger
 * /api/v2/training-plans/{id}/edit-text:
 *   post:
 *     title: Edit Training Plan With AI
 *     summary: Bestehenden Trainingsplan per Textbeschreibung bearbeiten (LLM-gestützt)
 *     tags: [TrainingPlans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trainingsplan-ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Edit Training Plan Request
 *             properties:
 *               text:
 *                 type: string
 *                 description: Beschreibung der gewünschten Änderungen
 *               preview:
 *                 type: boolean
 *                 description: Nur eine Vorschau zurückgeben ohne zu speichern
 *               updatedPlan:
 *                 type: object
 *                 description: Planobjekt aus der Vorschau zum Speichern
 *           example:
 *             text: "Füge mehr Beinübungen hinzu und reduziere die Trainingsdauer auf 30 Minuten."
 *     responses:
 *       200:
 *         description: Aktualisierter Trainingsplan oder Vorschau. Bei `preview` true enthält die Antwort `preview` (Plan) und `changes` (Array)
 *       400:
 *         description: Fehlerhafte Anfrage
 *       403:
 *         description: Verboten
 *       404:
 *         description: Trainingsplan nicht gefunden
 *       500:
 *         description: Serverfehler
 */
router.post('/:id/edit-text', secretKeyMiddleware, sessionMiddleware, trainingPlanController.editTextTrainingPlan);

/**
 * @swagger
 * /api/v2/training-plans/{id}/status:
 *   patch:
 *     title: Update Training Plan Status
 *     summary: Trainingsplan aktivieren oder archivieren
 *     tags: [TrainingPlans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trainingsplan-ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Update Training Plan Status Request
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, archived]
 *     responses:
 *       200:
 *         description: Status aktualisiert
 *       400:
 *         description: Ungültige Eingabe
 *       404:
 *         description: Trainingsplan nicht gefunden
 */
router.patch('/:id/status', secretKeyMiddleware, sessionMiddleware, trainingPlanController.updateTrainingPlanStatus);

module.exports = router;
