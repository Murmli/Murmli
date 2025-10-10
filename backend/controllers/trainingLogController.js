const TrainingLog = require('../models/trainingLogModel');
// TrainingPlan wird hier nicht mehr direkt benötigt, nur noch in create/preview etc.
const TrainingPlan = require('../models/trainingPlanModel');
const ExerciseImage = require('../models/exerciseImageModel');
const { createExerciseImage } = require('../utils/exerciseImageUtils');
const Tracker = require('../models/trackerModel.js');
const mongoose = require('mongoose');
const { analyzeTrainingLog, trainingLogToActivity } = require('../utils/llm.js'); // Beibehalten, falls anderswo genutzt

// Hilfsfunktion, um Anleitungen aus dem Trainingsplan zu einem Log hinzuzufügen
const _attachInstructions = async (log) => {
  const plan = await TrainingPlan.findById(log.trainingPlan).select('days.exercises._id days.exercises.instructions');
  const instructionMap = new Map();
  plan?.days.forEach(day => {
    day.exercises.forEach(ex => {
      instructionMap.set(ex._id.toString(), ex.instructions);
    });
  });
  const logObject = log.toObject ? log.toObject() : log;
  logObject.exercises = logObject.exercises.map(ex => ({
    ...ex,
    instructions: instructionMap.get(ex.trainingPlanExercise.toString()) || null,
  }));
  return logObject;
};

// Helper function to get the next set
const _getNextSet = async (logId, userId) => {
  const log = await TrainingLog.findOne({ _id: logId, user: userId });
  if (!log || log.status !== 'in-progress') {
    return { status: 404, message: 'Training log not found or not active.' };
  }

  // Füge die Anleitungen zum Log hinzu
  const logWithInstructions = await _attachInstructions(log);

  // go through all exercises
  for (let i = 0; i < logWithInstructions.exercises.length; i++) {
    const exerciseLog = logWithInstructions.exercises[i];

    // go through all sets
    for (let j = 0; j < exerciseLog.sets.length; j++) {
      const set = exerciseLog.sets[j];
      // If the set is not completed, return it
      if (!set.completed) {
        return {
          status: 200,
          data: {
            logId: log._id,
            exerciseLogId: exerciseLog._id,
            setIndex: j,
            exerciseName: exerciseLog.name,
            exerciseImage: exerciseLog.image,
            setDetails: set,
            instructions: exerciseLog.instructions,
            totalSetsInExercise: exerciseLog.sets.length,
            currentSetNumber: j + 1,
            currentExerciseNumber: i + 1,
            totalExercises: logWithInstructions.exercises.length,
            // pause times
            restAfterSet: set.restAfterSet,
            restAfterExercise: exerciseLog.restAfterExercise,
            // flag for frontend
            isLastSetInExercise: j === exerciseLog.sets.length - 1,
            isLastExercise: i === log.exercises.length - 1,
          }
        };
      }
    }
  }

  // All sets are completed, return log as completed
  const endTime = new Date();
  const startTime = log.createdAt;
  const totalDurationMs = endTime - startTime;

  return {
    status: 200,
    message: 'Training completed!',
    data: {
      _id: log._id,
      status: 'completed',
      totalDurationMinutes: Math.round(totalDurationMs / (1000 * 60)) // ms to Minutes
    }
  };
};

// Controller-Funktion zum Erstellen eines neuen Training Logs
exports.createTrainingLog = async (req, res) => {
  const { trainingPlanId, weekday } = req.body;
  const userId = req.user._id; // Annahme: Kommt von authMiddleware

  // Validierung der Eingabe
  if (!trainingPlanId || !weekday) {
    return res.status(400).json({ message: 'trainingPlanId und weekday sind erforderlich.' });
  }
  if (!mongoose.Types.ObjectId.isValid(trainingPlanId)) {
    return res.status(400).json({ message: 'Ungültige trainingPlanId.' });
  }
  if (![1, 2, 3, 4, 5, 6, 7].includes(parseInt(weekday, 10))) { // Stelle sicher, dass weekday eine Zahl ist
    return res.status(400).json({ message: 'Ungültiger Wochentag (1-7).' });
  }

  try {
    // Finde den Trainingsplan des Benutzers
    const plan = await TrainingPlan.findOne({ _id: trainingPlanId, user: userId });
    if (!plan) {
      return res.status(404).json({ message: 'Trainingsplan nicht gefunden oder gehört nicht dem Benutzer.' });
    }

    // Finde den spezifischen Tag im Plan
    const dayPlan = plan.days.find(d => d.weekday === parseInt(weekday, 10));
    if (!dayPlan || dayPlan.exercises.length === 0) {
      return res.status(400).json({ message: `Keine Übungen für den Wochentag ${weekday} im Plan gefunden.` });
    }

    // Baue die exerciseLogs für das neue TrainingLog
    const exerciseLogs = [];
    for (const exercisePlan of dayPlan.exercises) {
      // Bild abrufen oder Dummy verwenden
      let exerciseImage = await ExerciseImage.findOne({ exerciseKey: exercisePlan.key });
      if (!exerciseImage) {
        // asynchroner Aufruf der Bildgenerierung
        createExerciseImage(exercisePlan).catch(err =>
          console.error('Bildgenerierung fehlgeschlagen:', err.message)
        );
      }
      const imageUrl = exerciseImage ? exerciseImage.imageUrl : 'dummy';

      const measurementType = exercisePlan.measurementType || 'none';

      // Erstelle die Sätze für die Übung basierend auf dem Plan
      const sets = [];
      for (let i = 0; i < exercisePlan.sets; i++) {
        sets.push({
          repetitions: measurementType === 'duration' ? null : exercisePlan.repetitions,
          duration: measurementType === 'duration' ? exercisePlan.duration : null,
          weight: measurementType === 'weight' ? exercisePlan.suggestedWeight : null,
          restAfterSet: exercisePlan.restBetweenSets, // Pause nach diesem Set aus Plan
          completed: false, // Startet als nicht abgeschlossen
        });
      }

      // Füge die Übung zum Log hinzu
      exerciseLogs.push({
        name: exercisePlan.name,
        trainingPlanExercise: exercisePlan._id, // Wichtige Referenz zur Übung im Plan
        image: imageUrl,
        restAfterExercise: exercisePlan.restAfterExercise, // Pause nach der Übung aus Plan hinzufügen
        measurementType,
        sets: sets,
      });
    }

    // Erstelle das neue TrainingLog-Dokument
    const newLog = new TrainingLog({
      user: userId,
      trainingPlan: trainingPlanId,
      weekday: parseInt(weekday, 10),
      exercises: exerciseLogs,
      status: 'in-progress', // Initialer Status
    });

    // Speichere das neue Log in der Datenbank
    await newLog.save();

    // Füge die Anleitungen hinzu
    const logWithInstructions = await _attachInstructions(newLog);

    // Sende das erstellte Log als Antwort zurück
    res.status(201).json(logWithInstructions);

  } catch (error) {
    console.error("Fehler beim Erstellen des Training Logs:", error);
    res.status(500).json({ message: 'Serverfehler beim Erstellen des Training Logs.', error: error.message });
  }
};

// Controller-Funktion zum Abrufen aller Logs eines Benutzers
exports.getAllTrainingLogs = async (req, res) => {
  try {
    const logs = await TrainingLog.find({ user: req.user._id })
      .sort({ createdAt: -1 }) // Neueste zuerst
      .populate('trainingPlan', 'name'); // Optional: Name des Plans mitladen
    const logsWithInstructions = await Promise.all(logs.map(log => _attachInstructions(log)));
    res.status(200).json(logsWithInstructions);
  } catch (error) {
    console.error("Fehler beim Abrufen der Training Logs:", error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Training Logs.', error: error.message });
  }
};

// Controller-Funktion zum Abrufen eines spezifischen Logs
exports.getTrainingLogById = async (req, res) => {
  try {
    // ID-Validierung
    if (!mongoose.Types.ObjectId.isValid(req.params.logId)) {
      return res.status(400).json({ message: 'Ungültige Log ID.' });
    }
    // Suche das Log für den aktuellen Benutzer
    const log = await TrainingLog.findOne({ _id: req.params.logId, user: req.user._id })
      .populate('trainingPlan', 'name goal'); // Optional: Details des Plans mitladen
    // Optional: .populate('exercises.trainingPlanExercise'); // Falls Details der Plan-Übung benötigt werden
    if (!log) {
      return res.status(404).json({ message: 'Training Log nicht gefunden.' });
    }
    const logWithInstructions = await _attachInstructions(log);
    res.status(200).json(logWithInstructions);
  } catch (error) {
    console.error("Fehler beim Abrufen des Training Logs:", error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen des Training Logs.', error: error.message });
  }
};

// Controller-Funktion zum Löschen eines Logs
exports.deleteTrainingLog = async (req, res) => {
  try {
    // ID-Validierung
    if (!mongoose.Types.ObjectId.isValid(req.params.logId)) {
      return res.status(400).json({ message: 'Ungültige Log ID.' });
    }
    // Finde und lösche das Log für den aktuellen Benutzer
    const result = await TrainingLog.findOneAndDelete({ _id: req.params.logId, user: req.user._id });
    if (!result) {
      // Log nicht gefunden oder gehört nicht dem Benutzer
      return res.status(404).json({ message: 'Training Log nicht gefunden oder Berechtigung fehlt.' });
    }
    // Erfolgsmeldung
    res.status(200).json({ message: 'Training Log erfolgreich gelöscht.' });
  } catch (error) {
    console.error("Fehler beim Löschen des Training Logs:", error);
    res.status(500).json({ message: 'Serverfehler beim Löschen des Training Logs.', error: error.message });
  }
};

// Controller-Funktion zum Abrufen des nächsten Sets (Wrapper um die interne Funktion)
exports.getNextSetForLog = async (req, res) => {
  try {
    // ID-Validierung
    if (!mongoose.Types.ObjectId.isValid(req.params.logId)) {
      return res.status(400).json({ message: 'Ungültige Log ID.' });
    }
    // Rufe die interne Hilfsfunktion auf
    const result = await _getNextSet(req.params.logId, req.user._id);
    // Sende das Ergebnis (Daten oder Fehlermeldung)
    res.status(result.status).json(result.data || { message: result.message });
  } catch (error) {
    console.error("Fehler beim Abrufen des nächsten Sets:", error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen des nächsten Sets.', error: error.message });
  }
};

// Controller-Funktion zum Abschließen eines Sets
exports.completeSet = async (req, res) => {
  const { logId, exerciseLogId, setIndex } = req.params;
  const userId = req.user._id;
  // Daten aus dem Request Body (tatsächlich erreichte Werte)
  const { repetitions, duration, weight, difficulty } = req.body;

  // Validierung der IDs und des Index
  if (!mongoose.Types.ObjectId.isValid(logId) || !mongoose.Types.ObjectId.isValid(exerciseLogId)) {
    return res.status(400).json({ message: 'Ungültige Log oder ExerciseLog ID.' });
  }
  const setIdx = parseInt(setIndex, 10);
  if (isNaN(setIdx) || setIdx < 0) {
    return res.status(400).json({ message: 'Ungültiger Set Index.' });
  }

  try {
    // Finde das aktive Log des Benutzers
    const log = await TrainingLog.findOne({ _id: logId, user: userId });

    if (!log) {
      return res.status(404).json({ message: 'Training Log nicht gefunden.' });
    }
    // Prüfe, ob das Training überhaupt läuft
    if (log.status !== 'in-progress') {
      return res.status(400).json({ message: `Training ist nicht aktiv (Status: ${log.status}).` });
    }

    // Finde die spezifische Übung innerhalb des Logs anhand ihrer ID
    const exerciseLog = log.exercises.id(exerciseLogId);
    if (!exerciseLog) {
      // Dieser Fehler sollte nicht auftreten, wenn exerciseLogId aus einem vorherigen getNextSet stammt
      return res.status(404).json({ message: 'Übung im Log nicht gefunden (inkonsistente Daten?).' });
    }

    // Prüfe, ob der Set-Index gültig ist
    if (setIdx >= exerciseLog.sets.length) {
      return res.status(404).json({ message: `Set Index ${setIdx} außerhalb des gültigen Bereichs (0-${exerciseLog.sets.length - 1}).` });
    }

    // Greife auf den spezifischen Satz zu
    const setToComplete = exerciseLog.sets[setIdx];
    // Dieser Check ist redundant, wenn der Index-Check oben erfolgreich war, aber schadet nicht
    if (!setToComplete) {
      return res.status(404).json({ message: 'Satz nicht gefunden (interner Fehler?).' });
    }

    // Prüfe, ob der Satz bereits abgeschlossen wurde
    if (setToComplete.completed) {
      console.warn(`Versuch, bereits abgeschlossenen Satz abzuschließen: Log ${logId}, Exercise ${exerciseLogId}, Set ${setIdx}`);
      return res.status(400).json({ message: 'Dieser Satz wurde bereits abgeschlossen.' });
    }

    // Aktualisiere den Satz mit den tatsächlichen Werten aus dem Request Body, falls vorhanden
    if (repetitions !== undefined && repetitions !== null) setToComplete.repetitions = repetitions;
    if (duration !== undefined && duration !== null) setToComplete.duration = duration;
    if (weight !== undefined && weight !== null) setToComplete.weight = weight;

    // Markiere den Satz als abgeschlossen
    setToComplete.completed = true;

    // Schwierigkeitsgrad der gesamten Übung speichern, falls übergeben
    if (difficulty !== undefined && difficulty !== null) {
      exerciseLog.difficulty = difficulty;
    }

    // Speichere die Änderungen am Log-Dokument
    await log.save();

    // Rufe den nächsten Set ab und sende ihn als Antwort
    const nextSetResult = await _getNextSet(logId, userId);
    res.status(nextSetResult.status).json(nextSetResult.data || { message: nextSetResult.message });

  } catch (error) {
    console.error("Fehler beim Abschließen des Sets:", error);
    // Spezifischere Fehlermeldung bei CastError (z.B. ungültige exerciseLogId im Subdokument-Pfad)
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Ungültige ID im Pfad oder Datenstrukturproblem.' });
    }
    res.status(500).json({ message: 'Serverfehler beim Abschließen des Sets.', error: error.message });
  }
};

// Controller-Funktion zum Aktualisieren eines Satzes
exports.updateSet = async (req, res) => {
  const { logId, exerciseLogId, setId } = req.params;
  const { repetitions, duration, weight } = req.body;
  const userId = req.user._id;

  if (
    !mongoose.Types.ObjectId.isValid(logId) ||
    !mongoose.Types.ObjectId.isValid(exerciseLogId) ||
    !mongoose.Types.ObjectId.isValid(setId)
  ) {
    return res.status(400).json({ message: 'Ungültige ID im Pfad.' });
  }

  try {
    const log = await TrainingLog.findOne({ _id: logId, user: userId });
    if (!log) {
      return res.status(404).json({ message: 'Training Log nicht gefunden.' });
    }

    const exerciseLog = log.exercises.id(exerciseLogId);
    if (!exerciseLog) {
      return res.status(404).json({ message: 'Exercise Log nicht gefunden.' });
    }

    const setToUpdate = exerciseLog.sets.id(setId);
    if (!setToUpdate) {
      return res.status(404).json({ message: 'Set nicht gefunden.' });
    }

    if (repetitions !== undefined) setToUpdate.repetitions = repetitions;
    if (duration !== undefined) setToUpdate.duration = duration;
    if (weight !== undefined) setToUpdate.weight = weight;

    await log.save();

    res.status(200).json(setToUpdate);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Sets:', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Sets.', error: error.message });
  }
};

// Controller-Funktion zum Abschließen eines gesamten Trainings Logs
exports.completeTraining = async (req, res) => {
  const { logId } = req.params;
  const userId = req.user._id;
  const { totalDuration, rating, notes } = req.body; // Optionale Felder

  // ID-Validierung
  if (!mongoose.Types.ObjectId.isValid(logId)) {
    return res.status(400).json({ message: 'Ungültige Log ID.' });
  }

  try {
    // Finde das Log des Benutzers
    const log = await TrainingLog.findOne({ _id: logId, user: userId });

    if (!log) {
      return res.status(404).json({ message: 'Training Log nicht gefunden.' });
    }

    // Prüfe, ob das Training bereits abgeschlossen oder abgebrochen ist
    if (log.status !== 'in-progress') {
      return res.status(400).json({ message: `Training ist nicht aktiv (Status: ${log.status}).` });
    }

    // Aktualisiere Status und optionale Felder
    log.status = 'completed';

    let resolvedDuration = null;
    if (totalDuration !== undefined && totalDuration !== null) {
      const parsedDuration = Number(totalDuration);
      if (!Number.isNaN(parsedDuration) && Number.isFinite(parsedDuration)) {
        resolvedDuration = Math.max(0, Math.round(parsedDuration));
      }
    } else if (log.createdAt) {
      const startedAt = new Date(log.createdAt);
      if (!Number.isNaN(startedAt.getTime())) {
        const diffSeconds = Math.max(0, Math.round((Date.now() - startedAt.getTime()) / 1000));
        resolvedDuration = diffSeconds;
      }
    }
    if (resolvedDuration !== null) {
      log.totalDuration = resolvedDuration;
    }
    if (rating !== undefined && rating !== null) log.rating = rating;
    if (notes !== undefined && notes !== null) log.notes = notes;

    // Markiere alle noch nicht abgeschlossenen Sets als abgeschlossen (optional, je nach Logik)
    // Dies könnte nützlich sein, falls der Benutzer das Training vorzeitig beendet
    log.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (!set.completed) {
          set.completed = true;
          // Optional: Setze hier Standardwerte für repetitions/duration/weight, falls nicht angegeben
        }
      });
    });


    await log.save();

    res.status(200).json({ message: 'Training erfolgreich abgeschlossen!', log });

  } catch (error) {
    console.error("Fehler beim Abschließen des Trainings:", error);
    res.status(500).json({ message: 'Serverfehler beim Abschließen des Trainings.', error: error.message });
  }
};

// Controller-Funktion zum Setzen des Status eines Training Logs
exports.setStatus = async (req, res) => {
  const { logId } = req.params;
  const userId = req.user._id;
  const { status } = req.body;

  // ID-Validierung ohne mongoose
  if (!logId || typeof logId !== 'string' || logId.length !== 24 || !/^[a-fA-F0-9]+$/.test(logId)) {
    return res.status(400).json({ message: 'Ungültige Log ID.' });
  }

  // Status-Validierung
  const validStatuses = ['completed', 'aborted', 'in-progress', 'canceled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: `Ungültiger oder fehlender Status. Erlaubt sind: ${validStatuses.join(', ')}` });
  }

  try {
    // Finde das Log des Benutzers und aktualisiere den Status
    const log = await TrainingLog.findOneAndUpdate(
      { _id: logId, user: userId },
      { $set: { status: status } },
      { new: true } // Gibt das aktualisierte Dokument zurück
    );

    if (!log) {
      return res.status(404).json({ message: 'Training Log nicht gefunden.' });
    }

    res.status(200).json({ message: `Status des Training Logs auf '${status}' gesetzt.`, log });

  } catch (error) {
    console.error("Fehler beim Setzen des Training Log Status:", error);
    res.status(500).json({ message: 'Serverfehler beim Setzen des Training Log Status.', error: error.message });
  }
};

// Interne Helper-Funktion zur Erstellung der Vorschau-Daten
const _generatePreviewLog = async (userId, trainingPlanId, weekday) => {
  // Validierung der Eingabe (ähnlich wie createTrainingLog)
  if (!trainingPlanId || !weekday) {
    throw { status: 400, message: 'trainingPlanId und weekday sind erforderlich.' };
  }
  if (!mongoose.Types.ObjectId.isValid(trainingPlanId)) {
    throw { status: 400, message: 'Ungültige trainingPlanId.' };
  }
  const parsedWeekday = parseInt(weekday, 10);
  if (![1, 2, 3, 4, 5, 6, 7].includes(parsedWeekday)) {
    throw { status: 400, message: 'Ungültiger Wochentag (1-7).' };
  }

  // Finde den Trainingsplan des Benutzers
  const plan = await TrainingPlan.findOne({ _id: trainingPlanId, user: userId });
  if (!plan) {
    throw { status: 404, message: 'Trainingsplan nicht gefunden oder gehört nicht dem Benutzer.' };
  }

  // Finde den spezifischen Tag im Plan
  const dayPlan = plan.days.find(d => d.weekday === parsedWeekday);
  if (!dayPlan || dayPlan.exercises.length === 0) {
    // Kein Fehler, aber leere Vorschau zurückgeben
    return {
      user: userId,
      name: plan.name,
      description: dayPlan?.description || '',
      trainingPlan: trainingPlanId,
      weekday: parsedWeekday,
      exercises: [],
      status: 'preview',
    };
  }

  // Baue die exerciseLogs für die Vorschau (ähnlich wie createTrainingLog)
  const exerciseLogs = [];
  for (const exercisePlan of dayPlan.exercises) {
    let exerciseImage = await ExerciseImage.findOne({ exerciseKey: exercisePlan.key });
    if (!exerciseImage) {
      // asynchroner Aufruf der Bildgenerierung
      createExerciseImage(exercisePlan).catch(err =>
        console.error('Bildgenerierung fehlgeschlagen:', err.message)
      );
    }
    const imageUrl = exerciseImage ? exerciseImage.imageUrl : 'dummy';

    const measurementType = exercisePlan.measurementType || 'none';
    const sets = [];
    for (let i = 0; i < exercisePlan.sets; i++) {
      sets.push({
        repetitions: measurementType === 'duration' ? null : exercisePlan.repetitions,
        duration: measurementType === 'duration' ? exercisePlan.duration : null,
        weight: measurementType === 'weight' ? exercisePlan.suggestedWeight : null,
        restAfterSet: exercisePlan.restBetweenSets,
        completed: false, // In Vorschau immer false
      });
    }

    exerciseLogs.push({
      _id: new mongoose.Types.ObjectId(), // Generiere eine temporäre ID für die Vorschau
      name: exercisePlan.name,
      trainingPlanExercise: exercisePlan._id,
      image: imageUrl,
      instructions: exercisePlan.instructions,
      restAfterExercise: exercisePlan.restAfterExercise, // Hinzugefügt für Konsistenz
      measurementType,
      sets: sets,
      // Felder aus dem Plan für die Vorschau hinzugefügt
      repetitions: measurementType === 'duration' ? null : exercisePlan.repetitions,
      suggestedWeight: measurementType === 'weight' ? exercisePlan.suggestedWeight : null,
      duration: measurementType === 'duration' ? exercisePlan.duration : null,
    });
  }
  // Erstelle ein temporäres Log-Objekt (nicht in der DB speichern)
  const previewLog = {
    user: userId,
    name: plan.name,
    description: dayPlan.description,
    trainingPlan: trainingPlanId,
    weekday: parsedWeekday,
    exercises: exerciseLogs,
    status: 'preview', // Spezieller Status für die Vorschau
    // createdAt und updatedAt werden hier nicht gesetzt, da es nicht gespeichert wird
  };

  return previewLog;
};

// Controller-Funktion zur Vorschau eines Training Logs (ohne Speichern) - Wrapper um _generatePreviewLog
exports.previewTrainingLog = async (req, res) => {
  const { trainingPlanId, weekday } = req.body;
  const userId = req.user._id;

  try {
    // Rufe die interne Helper-Funktion auf
    const previewLog = await _generatePreviewLog(userId, trainingPlanId, weekday);
    // Sende das Vorschau-Log als Antwort zurück
    res.status(200).json(previewLog);
  } catch (error) {
    console.error("Fehler beim Erstellen der Training Log Vorschau:", error);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ message: error.message || 'Serverfehler beim Erstellen der Training Log Vorschau.', error: error.error });
  }
};

// Controller-Funktion zum Abrufen des letzten Training Logs anhand von Plan und Wochentag
exports.getLastTrainingLog = async (req, res) => {
  const { trainingPlanId, weekday } = req.query; // Verwende req.query für GET-Parameter
  const userId = req.user._id;

  // Ablaufzeit in Minuten (konfigurierbar)
  const expirationMinutes = 30;

  // Validierung der Eingabe
  if (!trainingPlanId || !weekday) {
    return res.status(400).json({ message: 'trainingPlanId und weekday sind erforderlich.' });
  }
  // Grundlegende ID-Formatprüfung
  if (typeof trainingPlanId !== 'string' || trainingPlanId.length !== 24 || !/^[a-fA-F0-9]+$/.test(trainingPlanId)) {
    return res.status(400).json({ message: 'Ungültige Trainingsplan ID.' });
  }
  const parsedWeekday = parseInt(weekday, 10);
  if (![1, 2, 3, 4, 5, 6, 7].includes(parsedWeekday)) {
    return res.status(400).json({ message: 'Ungültiger Wochentag (1-7).' });
  }

  try {
    // Finde das letzte Log für den spezifischen Plan und Wochentag
    const lastLog = await TrainingLog.findOne({
      user: userId,
      trainingPlan: trainingPlanId,
      weekday: parsedWeekday,
    })
      .sort({ createdAt: -1 }) // Neuestes zuerst
      .limit(1)
      .populate('trainingPlan', 'name goal'); // Mehr Details vom Plan laden

    // Prüfe, ob ein Log gefunden wurde
    if (!lastLog) {
      return res.status(200).json({ message: 'Kein vorheriges Training Log für diesen Plan und Tag gefunden.' });
    }

    // Prüfe, ob das Log älter als die konfigurierbare Ablaufzeit ist
    const expirationTime = new Date(Date.now() - expirationMinutes * 60 * 1000);
    if (lastLog.createdAt < expirationTime) {
      // Aktualisiere den Status auf 'aborted'
      lastLog.status = 'aborted';
      await lastLog.save();
      return res.status(200).json({ message: `Das letzte Training Log ist älter als ${expirationMinutes} Minuten und wurde abgebrochen.` });
    }

    const lastLogWithInstructions = await _attachInstructions(lastLog);
    res.status(200).json(lastLogWithInstructions);

  } catch (error) {
    // Fehlerbehandlung nur für die findOne-Operation
    console.error("Fehler beim Abrufen des letzten Training Logs:", error);
    // Status-Code aus dem Fehler übernehmen, falls vorhanden (z.B. von Validierungen)
    const statusCode = error.status || 500;
    res.status(statusCode).json({ message: error.message || 'Serverfehler beim Abrufen des letzten Training Logs.', error: error.error });
  }
};

exports.getTrainingStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const totalWorkouts = await TrainingLog.countDocuments({
      user: userId,
      status: 'completed',
    });

    const lastWorkoutLog = await TrainingLog.findOne({
      user: userId,
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .populate('trainingPlan', 'name');

    let lastWorkout = null;
    let lastExercises = [];

    if (lastWorkoutLog) {
      lastWorkout = {
        date: lastWorkoutLog.createdAt,
        name: lastWorkoutLog.trainingPlan ? lastWorkoutLog.trainingPlan.name : 'Unknown Plan',
      };

      lastExercises = lastWorkoutLog.exercises
        .slice(-5)
        .map(ex => ({
          name: ex.name,
          weight: ex.sets.length > 0 ? ex.sets[ex.sets.length - 1].weight : null,
        }));
    }

    res.status(200).json({
      totalWorkouts,
      lastWorkout,
      lastExercises,
    });
  } catch (error) {
    console.error('Error fetching training stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Analyse eines Training Logs durch ein LLM
exports.getTrainingFeedback = async (req, res) => {
  try {
    const { logId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(logId)) {
      return res.status(400).json({ message: 'Ungültige Log ID.' });
    }

    const currentLog = await TrainingLog.findOne({ _id: logId, user: req.user._id });
    if (!currentLog) {
      return res.status(404).json({ message: 'Training Log nicht gefunden.' });
    }

    if (currentLog.status !== 'completed') {
      return res.status(400).json({ message: 'Training Log ist nicht abgeschlossen.' });
    }

    const previousLogs = await TrainingLog.find({
      user: req.user._id,
      _id: { $ne: logId },
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .limit(3);

    const analysis = await analyzeTrainingLog({
      currentLog,
      previousLogs,
      outputLang: req.user?.language || 'de-DE',
    });
    if (!analysis) {
      return res.status(500).json({ message: 'Analyse fehlgeschlagen.' });
    }

    res.status(200).json(analysis);
  } catch (error) {
    console.error('Fehler bei der Analyse des Training Logs:', error);
    res.status(500).json({
      message: 'Serverfehler bei der Analyse des Training Logs.',
      error: error.message,
    });
  }
};

exports.trackTrainingCalories = async (req, res) => {
  try {
    const { logId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(logId)) {
      return res.status(400).json({ message: 'Ungültige Log ID.' });
    }

    const currentLog = await TrainingLog.findOne({ _id: logId, user: req.user._id });
    if (!currentLog) {
      return res.status(404).json({ message: 'Training Log nicht gefunden.' });
    }

    const latestWeightEntry = req.user.weightTracking?.length
      ? req.user.weightTracking[req.user.weightTracking.length - 1].weight
      : null;
    if (!latestWeightEntry) {
      return res.status(400).json({ message: 'Keine Gewichtsangaben vorhanden.' });
    }

    const activityResult = await trainingLogToActivity({
      currentLog,
      user: {
        gender: req.user.gender,
        height: req.user.height,
        weight: latestWeightEntry,
      },
    });

    if (!activityResult) {
      return res.status(500).json({ message: 'Kalorienberechnung fehlgeschlagen.' });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    let tracker = await Tracker.findOne({ user: req.user._id, date: today });
    if (!tracker) {
      tracker = new Tracker({
        user: req.user._id,
        date: today,
        foodItems: [],
        activities: [],
        totals: { kcal: 0, protein: 0, carbohydrates: 0, fat: 0 },
        recommendations: req.user.recommendations || {},
      });
    }

    tracker.recommendations.kcal += activityResult.caloriesBurned;
    tracker.activities.push({ ...activityResult, timestamp: new Date() });
    await tracker.save();

    res.status(200).json({ activityResult, tracker });
  } catch (error) {
    console.error('Fehler beim Kalorientracking:', error);
    res.status(500).json({
      message: 'Serverfehler beim Kalorientracking.',
      error: error.message,
    });
  }
};

