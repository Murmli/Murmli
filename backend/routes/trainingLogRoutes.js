const express = require('express');
const router = express.Router();
const trainingLogController = require('../controllers/trainingLogController');
const { secretKeyMiddleware, sessionMiddleware } = require('../middlewares/authMiddleware.js'); // Stellt req.user bereit

/**
 * @swagger
 * /api/v2/training-logs/stats:
 *   get:
 *     title: Get Training Statistics
 *     summary: Ruft Trainingsstatistiken für den Benutzer ab
 *     tags: [TrainingLogs]
 *     responses:
 *       200:
 *         description: Trainingsstatistiken
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalWorkouts:
 *                   type: integer
 *                 lastWorkout:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date-time
 *                     name:
 *                       type: string
 *                 lastExercises:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       weight:
 *                         type: number
 *       500:
 *         description: Serverfehler
 */
router.get('/stats', secretKeyMiddleware, sessionMiddleware, trainingLogController.getTrainingStats);

/**
 * @swagger
 * tags:
 *   name: TrainingLogs
 *   description: API Endpunkte zur Verwaltung von Training Logs
 */

/**
 * @swagger
 * /api/v2/training-logs:
 *   post:
 *     title: Create Training Log
 *     summary: Erstellt ein neues Training Log
 *     tags: [TrainingLogs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Create Training Log Request
 *             required:
 *               - trainingPlanId
 *               - weekday
 *             properties:
 *               trainingPlanId:
 *                 type: string
 *                 description: Die ID des zu verwendenden Training Plans
 *               weekday:
 *                 type: integer
 *                 description: Der Wochentag (1=Montag, 7=Sonntag), für den das Log erstellt wird
 *                 enum: [1, 2, 3, 4, 5, 6, 7]
 *     responses:
 *       201:
 *         description: Training Log erfolgreich erstellt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TrainingLog'
 *       400:
 *         description: |
 *           Ungültige Eingabe. Mögliche Gründe:
 *           - `trainingPlanId` oder `weekday` fehlen.
 *           - `trainingPlanId` hat ein ungültiges Format.
 *           - `weekday` ist keine Zahl zwischen 1 und 7.
 *           - Für den angegebenen `weekday` wurden keine Übungen im Plan gefunden.
 *       404:
 *         description: Trainingsplan nicht gefunden oder gehört nicht dem Benutzer.
 *       500:
 *         description: Serverfehler
 */
router.post('/', secretKeyMiddleware, sessionMiddleware, trainingLogController.createTrainingLog);

/**
 * @swagger
 * /api/v2/training-logs:
 *   get:
 *     title: Get All Training Logs
 *     summary: Ruft alle Training Logs des Benutzers ab
 *     tags: [TrainingLogs]
 *     responses:
 *       200:
 *         description: Liste der Training Logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TrainingLog'
 *       500:
 *         description: Serverfehler
 */
router.get('/', secretKeyMiddleware, sessionMiddleware, trainingLogController.getAllTrainingLogs);

/**
 * @swagger
 * /api/v2/training-logs/preview:
 *   post:
 *     title: Preview Training Log
 *     summary: Erstellt eine Vorschau eines Training Logs ohne Speichern
 *     tags: [TrainingLogs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Preview Training Log Request
 *             required:
 *               - trainingPlanId
 *               - weekday
 *             properties:
 *               trainingPlanId:
 *                 type: string
 *                 description: Die ID des zu verwendenden Training Plans
 *               weekday:
 *                 type: integer
 *                 description: Der Wochentag (1=Montag, 7=Sonntag), für den die Vorschau erstellt wird
 *                 enum: [1, 2, 3, 4, 5, 6, 7]
 *     responses:
 *       200:
 *         description: Vorschau des Training Logs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PreviewTrainingLog'
 *       400:
 *         description: |
 *           Ungültige Eingabe. Mögliche Gründe:
 *           - `trainingPlanId` oder `weekday` fehlen.
 *           - `trainingPlanId` hat ein ungültiges Format.
 *           - `weekday` ist keine Zahl zwischen 1 und 7.
 *       404:
 *         description: Trainingsplan nicht gefunden oder gehört nicht dem Benutzer.
 *       500:
 *         description: Serverfehler beim Erstellen der Training Log Vorschau.
 */
router.post('/preview', secretKeyMiddleware, sessionMiddleware, trainingLogController.previewTrainingLog);

/**
 * @swagger
 * /api/v2/training-logs/last:
 *   get:
 *     title: Get Last Training Log
 *     summary: Ruft die letzte Training Log für einen bestimmten Plan und Wochentag ab
 *     tags: [TrainingLogs]
 *     parameters:
 *       - in: query
 *         name: trainingPlanId
 *         required: true
 *         schema:
 *           type: string
 *         description: Die ID des Training Plans
 *       - in: query
 *         name: weekday
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3, 4, 5, 6, 7]
 *         description: Der Wochentag (1=Montag, 7=Sonntag)
 *     responses:
 *       200:
 *         description: |
 *           Gibt das letzte Training Log zurück, wenn es kürzlich erstellt wurde.
 *           Wenn kein Log gefunden wird oder das gefundene Log zu alt ist (und dann auf 'aborted' gesetzt wird),
 *           wird eine entsprechende Nachricht zurückgegeben.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/TrainingLog'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Kein vorheriges Training Log für diesen Plan und Tag gefunden.
 *       400:
 *         description: |
 *           Ungültige Eingabe. Mögliche Gründe:
 *           - `trainingPlanId` oder `weekday` fehlen in den Query-Parametern.
 *           - `trainingPlanId` hat ein ungültiges Format.
 *           - `weekday` ist keine Zahl zwischen 1 und 7.
 *       500:
 *         description: Serverfehler beim Abrufen des letzten Training Logs.
 */
router.get('/last', secretKeyMiddleware, sessionMiddleware, trainingLogController.getLastTrainingLog);

/**
 * @swagger
 * /api/v2/training-logs/{logId}:
 *   get:
 *     title: Get Training Log By ID
 *     summary: Ruft ein spezifisches Training Log ab
 *     tags: [TrainingLogs]
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *         description: Die ID des Training Logs
 *     responses:
 *       200:
 *         description: Training Log Details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TrainingLog'
 *       400:
 *         description: Ungültige Log ID (entspricht nicht dem ObjectId Format).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Ungültige Log ID.
 *       404:
 *         description: Training Log nicht gefunden.
 *       500:
 *         description: Serverfehler beim Abrufen des Training Logs.
 */
router.get('/:logId', secretKeyMiddleware, sessionMiddleware, trainingLogController.getTrainingLogById);

/**
 * @swagger
 * /api/v2/training-logs/{logId}:
 *   delete:
 *     title: Delete Training Log
 *     summary: Löscht ein spezifisches Training Log
 *     tags: [TrainingLogs]

 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *         description: Die ID des zu löschenden Training Logs
 *     responses:
 *       200:
 *         description: Training Log erfolgreich gelöscht
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Training Log erfolgreich gelöscht.
 *       400:
 *         description: Ungültige Log ID (entspricht nicht dem ObjectId Format).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Ungültige Log ID.
 *       404:
 *         description: Training Log nicht gefunden oder Berechtigung fehlt.
 *       500:
 *         description: Serverfehler beim Löschen des Training Logs.
 */
router.delete('/:logId', secretKeyMiddleware, sessionMiddleware, trainingLogController.deleteTrainingLog);

/**
 * @swagger
 * /api/v2/training-logs/{logId}/next-set:
 *   get:
 *     title: Get Next Set
 *     summary: Ruft den nächsten anstehenden Satz im Training Log ab
 *     tags: [TrainingLogs]
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *         description: Die ID des Training Logs
 *     responses:
 *       200:
 *         description: Details zum nächsten Satz oder Abschlussmeldung
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     logId:
 *                       type: string
 *                     exerciseLogId:
 *                       type: string
 *                     setIndex:
 *                       type: integer
 *                     exerciseName:
 *                       type: string
 *                     exerciseImage:
 *                       type: string
 *                     setDetails:
 *                       $ref: '#/components/schemas/Set' # Referenz zu geteilten Schemas
 *                     totalSetsInExercise:
 *                       type: integer
 *                     currentSetNumber:
 *                       type: integer
 *                     currentExerciseNumber:
 *                       type: integer
 *                     totalExercises:
 *                       type: integer
 *                     restAfterSet:
 *                       type: integer
 *                     restAfterExercise:
 *                       type: integer
 *                     isLastSetInExercise:
 *                       type: boolean
 *                     isLastExercise:
 *                       type: boolean
 *                 - type: object # Option 2: Training Completed Data
 *                   description: Wird zurückgegeben, wenn alle Sätze im Training Log abgeschlossen sind.
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: Die ID des abgeschlossenen Training Logs.
 *                     status:
 *                       type: string
 *                       example: completed
 *                       description: Der Status des Training Logs, auf "completed" gesetzt.
 *                     totalDurationMinutes:
 *                       type: number
 *                       description: Die Gesamtdauer des Trainings in Minuten.
 *       400:
 *         description: Ungültige Log ID (entspricht nicht dem ObjectId Format).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Ungültige Log ID.
 *       404:
 *         description: Training Log nicht gefunden oder nicht im Status 'in-progress'.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Training log not found or not active.
 *       500:
 *         description: Serverfehler beim Abrufen des nächsten Sets.
 */
router.get('/:logId/next-set', secretKeyMiddleware, sessionMiddleware, trainingLogController.getNextSetForLog);

/**
 * @swagger
 * /api/v2/training-logs/{logId}/exercises/{exerciseLogId}/sets/{setIndex}/complete:
 *   post:
 *     title: Complete Set
 *     summary: Markiert einen Satz als abgeschlossen und gibt den nächsten zurück
 *     tags: [TrainingLogs]
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *         description: Die ID des Training Logs
 *       - in: path
 *         name: exerciseLogId
 *         required: true
 *         schema:
 *           type: string
 *         description: Die ID des Exercise Logs innerhalb des Training Logs
 *       - in: path
 *         name: setIndex
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Der Index (0-basiert) des abzuschließenden Satzes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Complete Set Request
 *             properties:
 *               repetitions:
 *                 type: number
 *                 description: Tatsächlich ausgeführte Wiederholungen (optional)
 *               duration:
 *                 type: number
 *                 description: Tatsächlich benötigte Dauer in Sekunden (optional)
 *               weight:
 *                 type: number
 *                 description: Tatsächlich verwendetes Gewicht (optional)
 *               difficulty:
 *                 type: number
 *                 description: Empfundene Anstrengung 1-10 (optional, beim letzten Satz)
 *     responses:
 *       200:
 *         description: Satz erfolgreich abgeschlossen, Details zum nächsten Satz oder Abschlussmeldung
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object # Option 1: Next Set Data
 *                   description: Details zum nächsten anstehenden Satz.
 *                   properties:
 *                     logId:
 *                       type: string
 *                       description: Die ID des aktuellen Training Logs.
 *                     exerciseLogId:
 *                       type: string
 *                       description: Die ID des aktuellen Exercise Logs.
 *                     setIndex:
 *                       type: integer
 *                       description: Der Index des nächsten Satzes.
 *                     exerciseName:
 *                       type: string
 *                       description: Name der aktuellen Übung.
 *                     exerciseImage:
 *                       type: string
 *                       nullable: true
 *                       description: URL zum Bild der aktuellen Übung.
 *                     setDetails:
 *                       $ref: '#/components/schemas/Set'
 *                     totalSetsInExercise:
 *                       type: integer
 *                       description: Gesamtanzahl der Sätze in der aktuellen Übung.
 *                     currentSetNumber:
 *                       type: integer
 *                       description: Nummer des aktuellen Satzes in der Übung (1-basiert).
 *                     currentExerciseNumber:
 *                       type: integer
 *                       description: Nummer der aktuellen Übung im Training (1-basiert).
 *                     totalExercises:
 *                       type: integer
 *                       description: Gesamtanzahl der Übungen im Training.
 *                     restAfterSet:
 *                       type: integer
 *                       description: Pause nach diesem Satz in Sekunden.
 *                     restAfterExercise:
 *                       type: integer
 *                       description: Pause nach dieser Übung in Sekunden.
 *                     isLastSetInExercise:
 *                       type: boolean
 *                       description: True, wenn dies der letzte Satz in der aktuellen Übung ist.
 *                     isLastExercise:
 *                       type: boolean
 *                       description: True, wenn dies die letzte Übung im gesamten Training ist.
 *                 - type: object # Option 2: Training Completed Data
 *                   description: Wird zurückgegeben, wenn alle Sätze im Training Log abgeschlossen sind.
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: Die ID des abgeschlossenen Training Logs.
 *                     status:
 *                       type: string
 *                       example: completed
 *                       description: Der Status des Training Logs, auf "completed" gesetzt.
 *                     totalDurationMinutes:
 *                       type: number
 *                       description: Die Gesamtdauer des Trainings in Minuten.
 *       400:
 *         description: |
 *           Ungültige Eingabe oder Anfrage. Mögliche Gründe:
 *           - `logId` oder `exerciseLogId` haben ein ungültiges Format.
 *           - `setIndex` ist ungültig (z.B. nicht numerisch, negativ).
 *           - Das Training Log ist nicht im Status 'in-progress'.
 *           - Der Satz wurde bereits abgeschlossen.
 *           - Mongoose CastError aufgrund ungültiger ID im Pfad oder Datenstrukturproblem.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Ungültige Log oder ExerciseLog ID.
 *       404:
 *         description: |
 *           Ressource nicht gefunden. Mögliche Gründe:
 *           - Training Log nicht gefunden.
 *           - Exercise Log (anhand `exerciseLogId`) nicht im Training Log gefunden.
 *           - `setIndex` liegt außerhalb des gültigen Bereichs für die Übung.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Training Log nicht gefunden.
 *       500:
 *         description: Serverfehler beim Abschließen des Sets.
 */
router.post('/:logId/exercises/:exerciseLogId/sets/:setIndex/complete', secretKeyMiddleware, sessionMiddleware, trainingLogController.completeSet);

/**
 * @swagger
 * /api/v2/training-logs/{logId}/exercises/{exerciseLogId}/sets/{setId}:
 *   patch:
 *     title: Update Set
 *     summary: Aktualisiert einen Satz in einem Training Log
 *     tags: [TrainingLogs]
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: exerciseLogId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: setId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Update Set Request
 *             properties:
 *               repetitions:
 *                 type: number
 *               duration:
 *                 type: number
 *               weight:
 *                 type: number
 *     responses:
 *       200:
 *         description: Satz erfolgreich aktualisiert
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Set'
 *       400:
 *         description: Ungültige Anfrage
 *       404:
 *         description: Training Log, Exercise oder Set nicht gefunden
 *       500:
 *         description: Serverfehler
 */
router.patch('/:logId/exercises/:exerciseLogId/sets/:setId', secretKeyMiddleware, sessionMiddleware, trainingLogController.updateSet);

/**
 * @swagger
 * /api/v2/training-logs/{logId}/complete:
 *   post:
 *     title: Complete Training
 *     summary: Schließt ein Training Log ab
 *     tags: [TrainingLogs]
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *         description: Die ID des abzuschließenden Training Logs
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Complete Training Request
 *             properties:
 *               totalDuration:
 *                 type: number
 *                 description: Gesamtdauer des Trainings in Sekunden (optional)
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Bewertung des Trainings (optional)
 *               notes:
 *                 type: string
 *                 description: Notizen zum Training (optional)
 *     responses:
 *       200:
 *         description: Training Log erfolgreich abgeschlossen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Training erfolgreich abgeschlossen!
 *                 log:
 *                   $ref: '#/components/schemas/TrainingLog'
 *       400:
 *         description: |
 *           Ungültige Anfrage. Mögliche Gründe:
 *           - Die `logId` im Pfad ist ungültig (entspricht nicht dem ObjectId Format).
 *           - Das Training Log ist nicht im Status 'in-progress'.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Ungültige Log ID.
 *       404:
 *         description: Training Log nicht gefunden.
 *       500:
 *         description: Serverfehler beim Abschließen des Trainings.
 */
router.post('/:logId/complete', secretKeyMiddleware, sessionMiddleware, trainingLogController.completeTraining);

/**
 * @swagger
 * /api/v2/training-logs/{logId}/status:
 *   patch:
 *     title: Set Training Log Status
 *     summary: Setzt den Status eines Training Logs
 *     tags: [TrainingLogs]
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *         description: Die ID des Training Logs
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Set Training Log Status Request
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 description: Der neue Status des Training Logs
 *                 enum: [completed, aborted, in-progress, canceled]
 *     responses:
 *       200:
 *         description: Status erfolgreich gesetzt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Status des Training Logs auf 'completed' gesetzt.
 *                 log:
 *                   $ref: '#/components/schemas/TrainingLog'
 *       400:
 *         description: Ungültige Log ID oder ungültiger Status
 *       404:
 *         description: Training Log nicht gefunden
 *       500:
 *         description: Serverfehler
 */
router.patch('/:logId/status', secretKeyMiddleware, sessionMiddleware, trainingLogController.setStatus);

/**
 * @swagger
 * /api/v2/training-logs/{logId}/feedback:
 *   post:
 *     title: Get Training Feedback
 *     summary: Analysiert ein Training Log mit einem LLM
 *     tags: [TrainingLogs]
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *         description: Die ID des Training Logs
 *     responses:
 *       200:
 *         description: Analyse des Training Logs
 *       400:
 *         description: Ungültige Log ID
 *       404:
 *         description: Training Log nicht gefunden
 *       500:
 *         description: Serverfehler
 */
router.post('/:logId/feedback', secretKeyMiddleware, sessionMiddleware, trainingLogController.getTrainingFeedback);
router.post('/:logId/calories', secretKeyMiddleware, sessionMiddleware, trainingLogController.trackTrainingCalories);

// Swagger Schema Definitionen (könnten auch zentralisiert werden, aber hier für Vollständigkeit)
/**
 * @swagger
 * components:
 *   schemas:
 *     Set:
 *       type: object
 *       properties:
 *         repetitions:
 *           type: number
 *         duration:
 *           type: number
 *           description: Dauer in Sekunden
 *         weight:
 *           type: number
 *         restAfterSet:
 *           type: number
 *           description: Pause nach dem Satz in Sekunden
 *         completed:
 *           type: boolean
 *           default: false
 *     ExerciseLog:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Eindeutige ID des Exercise Logs
 *         name:
 *           type: string
 *         trainingPlanExercise:
 *           type: string
 *           description: Referenz zur Übung im Trainingsplan
 *         image:
 *           type: string
 *           nullable: true
 *         sets:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Set'
 *     TrainingLog:
 *       type: object
 *       required:
 *         - user
 *         - trainingPlan
 *         - weekday
 *       properties:
 *         _id:
 *           type: string
 *           description: Eindeutige ID des Training Logs
 *         user:
 *           type: string
 *           description: ID des Benutzers
 *         trainingPlan:
 *           oneOf:
 *             - type: string
 *               description: ID des zugehörigen Training Plans.
 *             - type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Die ID des Training Plans.
 *                 name:
 *                   type: string
 *                   description: Der Name des Training Plans.
 *                 goal:
 *                   type: string
 *                   description: Das Ziel des Training Plans (kann in manchen Antworten enthalten sein).
 *               required: # Sicherstellen, dass _id und name immer vorhanden sind, wenn es ein Objekt ist
 *                 - _id
 *                 - name
 *           description: Der zugehörige Trainingsplan. Kann eine ID oder ein populiertes Objekt sein.
 *         weekday:
 *           type: integer
 *           enum: [1, 2, 3, 4, 5, 6, 7]
 *           description: Wochentag (1=Montag, 7=Sonntag)
 *         exercises:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ExerciseLog'
 *         totalDuration:
 *           type: number
 *           description: Gesamtdauer in Sekunden (optional)
 *         status:
 *           type: string
 *           enum: [completed, aborted, in-progress, canceled]
 *           default: in-progress
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           description: Bewertung (optional)
 *         notes:
 *           type: string
 *           description: Notizen (optional)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     PreviewExerciseLog:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Temporäre, neu generierte ID für die Übung in der Vorschau.
 *         name:
 *           type: string
 *           description: Name der Übung.
 *         trainingPlanExercise:
 *           type: string
 *           description: ID der referenzierten Übung im Trainingsplan.
 *         image:
 *           type: string
 *           nullable: true
 *           description: URL zum Übungsbild.
 *         restAfterExercise:
 *           type: number
 *           description: Pause nach der Übung in Sekunden.
 *         sets:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Set'
 *         repetitions:
 *           type: number
 *           description: Geplante Wiederholungen (aus dem Trainingsplan).
 *         suggestedWeight:
 *           type: number
 *           description: Vorgeschlagenes Gewicht (aus dem Trainingsplan).
 *         duration:
 *           type: number
 *           description: Geplante Dauer in Sekunden (aus dem Trainingsplan).
 *     PreviewTrainingLog:
 *       type: object
 *       properties:
 *         user:
 *           type: string
 *           description: ID des Benutzers.
 *         name:
 *           type: string
 *           description: Name des Trainingsplans.
 *         description:
 *           type: string
 *           description: Beschreibung des Trainingstags aus dem Plan.
 *         trainingPlan:
 *           type: string
 *           description: ID des zugehörigen Training Plans.
 *         weekday:
 *           type: integer
 *           enum: [1, 2, 3, 4, 5, 6, 7]
 *           description: Wochentag (1=Montag, 7=Sonntag).
 *         exercises:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PreviewExerciseLog'
 *         status:
 *           type: string
 *           enum: [preview]
 *           description: Status des Logs (immer 'preview' für Vorschauobjekte).
 *   securitySchemes:
 *      bearerAuth:
 *          type: http
 *          scheme: bearer
 *          bearerFormat: JWT
 */

module.exports = router;