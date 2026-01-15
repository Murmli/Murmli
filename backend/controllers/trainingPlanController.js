const TrainingPlan = require('../models/trainingPlanModel');
const { addCurrentWeekIfActive } = require('../utils/planerUtils');
const { generateImagesForPlan } = require('../utils/exerciseImageUtils');
const {
  generateTrainingPlanFromText,
  generateTrainingPlanContinuation,
  editTextTrainingPlanWithLLM,
  askTrainingPlan,
} = require('../utils/llm');
const TrainingLog = require('../models/trainingLogModel');

// Entfernt Gewicht bzw. Dauer, falls sie laut measurementType nicht benötigt werden
const sanitizeExercises = (plan) => {
  if (!plan || !Array.isArray(plan.days)) return;
  plan.days.forEach(day => {
    if (!Array.isArray(day.exercises)) return;
    day.exercises.forEach(ex => {
      if (!['duration', 'weight', 'none'].includes(ex.measurementType)) {
        ex.measurementType = 'none';
      }
      if (ex.measurementType !== 'weight') {
        ex.suggestedWeight = null;
      }
      if (ex.measurementType !== 'duration') {
        ex.duration = null;
      }
    });
  });
};

const gatherTrainingPlanGenerationContext = async (user) => {
  const exerciseHistory = 10;
  let existingExerciseNames = [];

  try {
    const aggregationResult = await TrainingPlan.aggregate([
      { $match: { user: user._id } },
      { $unwind: '$days' },
      { $unwind: '$days.exercises' },
      { $group: { _id: null, names: { $addToSet: '$days.exercises.name' } } }
    ]);
    const allNames = aggregationResult[0]?.names || [];
    for (let i = allNames.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allNames[i], allNames[j]] = [allNames[j], allNames[i]];
    }
    existingExerciseNames = allNames.slice(0, exerciseHistory);
  } catch (err) {
    console.error('Error aggregating exercise names:', err.message);
    existingExerciseNames = [];
  }

  const latestWeight = Array.isArray(user.weightTracking) && user.weightTracking.length > 0
    ? user.weightTracking[user.weightTracking.length - 1].weight
    : null;
  const birthyear = user.birthyear || null;
  const age = birthyear ? (new Date().getFullYear() - birthyear) : null;
  const bodySummary = {
    gender: user.gender || null,
    heightCm: user.height || null,
    currentWeightKg: latestWeight,
    ageYears: age,
  };

  let historySummary = { exercises: [] };
  try {
    const logs = await TrainingLog.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('createdAt exercises')
      .lean();

    const byName = new Map();
    for (const log of logs) {
      if (!Array.isArray(log.exercises)) continue;
      for (const ex of log.exercises) {
        const name = ex?.name;
        if (!name || byName.has(name)) continue;
        const sets = Array.isArray(ex.sets) ? ex.sets : [];
        const weights = sets.map(s => s?.weight).filter(v => typeof v === 'number');
        const reps = sets.map(s => s?.repetitions).filter(v => typeof v === 'number');
        const durations = sets.map(s => s?.duration).filter(v => typeof v === 'number');

        const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : null;
        byName.set(name, {
          name,
          measurementType: ex.measurementType || 'none',
          lastWeightKg: weights.length ? weights[0] : null,
          avgWeightKg: avg(weights),
          lastReps: reps.length ? reps[0] : null,
          avgReps: avg(reps),
          lastDurationSec: durations.length ? durations[0] : null,
          avgDurationSec: avg(durations),
          seenAt: log.createdAt,
        });
      }
    }
    historySummary.exercises = Array.from(byName.values());
  } catch (e) {
    console.error('Error summarizing training logs:', e.message);
    historySummary = { exercises: [] };
  }

  return { existingExerciseNames, bodySummary, historySummary };
};

/**
 * Ruft alle Trainingspläne für den authentifizierten Benutzer ab.
 * @param {Object} req - Das Express-Request-Objekt.
 * @param {Object} res - Das Express-Response-Objekt.
 */
exports.getAllTrainingPlans = async (req, res) => {
  try {
    const plans = await TrainingPlan.find({ user: req.user._id });
    const plansWithWeeks = plans.map(addCurrentWeekIfActive);
    res.json(plansWithWeeks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Ruft einen spezifischen Trainingsplan nach ID ab.
 * @param {Object} req - Das Express-Request-Objekt.
 * @param {Object} res - Das Express-Response-Objekt.
 */
exports.getTrainingPlanById = async (req, res) => {
  try {
    const plan = await TrainingPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Training plan not found' });
    }
    if (!plan.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const planObj = addCurrentWeekIfActive(plan);
    return res.json(planObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Erstellt einen neuen Trainingsplan.
 * @param {Object} req - Das Express-Request-Objekt.
 * @param {Object} res - Das Express-Response-Objekt.
 */
exports.createTrainingPlan = async (req, res) => {
  try {
    req.body.user = req.user._id;
    sanitizeExercises(req.body);
    const newPlan = await TrainingPlan.create(req.body);
    res.status(201).json(newPlan);
    generateImagesForPlan(newPlan).catch(err =>
      console.error('exercise image generation:', err.message)
    );
  } catch (error) {
    console.error("/api/v2/training-plans " + error);
    res.status(400).json({ message: 'Invalid data', error: error.message });
  }
};

/**
 * Aktualisiert einen bestehenden Trainingsplan.
 * @param {Object} req - Das Express-Request-Objekt.
 * @param {Object} res - Das Express-Response-Objekt.
 */
exports.updateTrainingPlan = async (req, res) => {
  try {
    const plan = await TrainingPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Training plan not found' });
    }
    if (!plan.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.body.user = req.user._id;
    sanitizeExercises(req.body);
    const updatedPlan = await TrainingPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json(updatedPlan);
    generateImagesForPlan(updatedPlan).catch(err =>
      console.error('exercise image generation:', err.message)
    );
  } catch (error) {
    console.error("/api/v2/training-plans/" + req.params.id + " " + error);
    res.status(400).json({ message: 'Invalid data', error: error.message });
  }
};

/**
 * Aktualisiert eine Übung innerhalb eines Trainingsplans.
 * Erlaubt das Anpassen von vorgeschlagenem Gewicht, Dauer oder Wiederholungen.
 * @param {Object} req - Das Express-Request-Objekt.
 * @param {Object} res - Das Express-Response-Objekt.
 */
exports.updateTrainingPlanExercise = async (req, res) => {
  try {
    const plan = await TrainingPlan.findById(req.params.planId);
    if (!plan) {
      return res.status(404).json({ message: 'Training plan not found' });
    }
    if (!plan.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const exerciseId = req.params.exerciseId;
    let exercise = null;
    for (const day of plan.days) {
      const ex = day.exercises.id(exerciseId);
      if (ex) {
        exercise = ex;
        break;
      }
    }

    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    const { suggestedWeight, duration, repetitions } = req.body;

    if (suggestedWeight !== undefined) {
      exercise.suggestedWeight = suggestedWeight;
    }
    if (duration !== undefined) {
      exercise.duration = duration;
    }
    if (repetitions !== undefined) {
      exercise.repetitions = repetitions;
    }

    sanitizeExercises(plan);
    await plan.save();

    res.json(exercise);
  } catch (error) {
    console.error('updateTrainingPlanExercise', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Löscht einen Trainingsplan.
 * @param {Object} req - Das Express-Request-Objekt.
 * @param {Object} res - Das Express-Response-Objekt.
 */
exports.deleteTrainingPlan = async (req, res) => {
  try {
    const plan = await TrainingPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Training plan not found' });
    }
    if (!plan.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await TrainingPlan.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Generiert einen Trainingsplan basierend auf einem Text.
 * @param {Object} req - Das Express-Request-Objekt.
 * @param {Object} res - Das Express-Response-Objekt.
 */
exports.generateTrainingPlan = async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ message: 'Missing text input' });
  }

  // send immediate response so the client can continue working
  res.status(202).json({ message: 'Training plan creation started', status: 'processing' });

  (async () => {
    try {
      const context = await gatherTrainingPlanGenerationContext(req.user);
      const answer = await generateTrainingPlanFromText(
        text,
        req.user,
        context.existingExerciseNames,
        context.bodySummary,
        context.historySummary
      );
      if (!answer) {
        console.error('LLM did not return a response');
        return;
      }

      answer.user = req.user._id;
      sanitizeExercises(answer);
      const createdPlan = await TrainingPlan.create(answer);
      console.log(`Training plan ${createdPlan._id} created for user ${req.user._id}`);
      await generateImagesForPlan(createdPlan).catch(err =>
        console.error('exercise image generation:', err.message)
      );
    } catch (error) {
      console.error('Error generating training plan:', error.message);
    }
  })();
};

exports.continueTrainingPlan = async (req, res) => {
  const { text = '', plan: providedPlan } = req.body;

  const extractExerciseNames = (planCandidate) => {
    if (!planCandidate || !Array.isArray(planCandidate.days)) {
      return [];
    }
    const names = new Set();
    for (const day of planCandidate.days) {
      if (!day || !Array.isArray(day.exercises)) continue;
      for (const exercise of day.exercises) {
        if (exercise?.name) {
          names.add(exercise.name);
        }
      }
    }
    return Array.from(names);
  };

  try {
    const basePlan = await TrainingPlan.findById(req.params.id);
    if (!basePlan) {
      return res.status(404).json({ message: 'Training plan not found' });
    }
    if (!basePlan.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const planForPrompt = providedPlan && typeof providedPlan === 'object'
      ? providedPlan
      : basePlan.toObject();
    const basePlanExerciseNames = extractExerciseNames(planForPrompt);
    const user = req.user;

    res.status(202).json({ message: 'Training plan continuation started', status: 'processing' });

    (async () => {
      try {
        const context = await gatherTrainingPlanGenerationContext(user);
        const avoidExercises = Array.from(new Set([
          ...basePlanExerciseNames,
          ...(context.existingExerciseNames || [])
        ]));
        const promptText = typeof text === 'string' && text.trim().length
          ? text
          : 'Erstelle eine Fortsetzung basierend auf dem bestehenden Plan.';
        const answer = await generateTrainingPlanContinuation(
          planForPrompt,
          promptText,
          user,
          avoidExercises,
          context.bodySummary,
          context.historySummary,
          basePlanExerciseNames
        );

        if (!answer) {
          console.error('LLM did not return a response for continuation');
          return;
        }

        answer.user = user._id;
        sanitizeExercises(answer);
        const createdPlan = await TrainingPlan.create(answer);
        console.log(`Training plan ${createdPlan._id} continued from ${basePlan._id} for user ${user._id}`);
        await generateImagesForPlan(createdPlan).catch(err =>
          console.error('exercise image generation:', err.message)
        );
      } catch (error) {
        console.error('Error continuing training plan:', error.message);
      }
    })();
  } catch (error) {
    console.error('continueTrainingPlan', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Bearbeitet einen bestehenden Trainingsplan per Textbeschreibung (LLM-gestützt).
 * @param {Object} req - Das Express-Request-Objekt.
 * @param {Object} res - Das Express-Response-Objekt.
 */
exports.editTextTrainingPlan = async (req, res) => {
  const { text, preview, updatedPlan } = req.body;
  if (!text && !updatedPlan) {
    return res.status(400).json({ message: 'Missing text input or plan' });
  }

  try {
    const plan = await TrainingPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Training plan not found' });
    }
    if (!plan.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    let updatedPlanData;
    let changeSummary = [];

    if (updatedPlan) {
      updatedPlanData = updatedPlan;
    } else {
      const llmResponse = await editTextTrainingPlanWithLLM(plan, text, req.user.language);

      if (!llmResponse) {
        return res.status(500).json({ message: 'LLM did not return a response' });
      }

      if (llmResponse.plan) {
        updatedPlanData = llmResponse.plan;
        changeSummary = Array.isArray(llmResponse.changes) ? llmResponse.changes : [];
      } else {
        updatedPlanData = llmResponse;
      }
    }

    if (preview) {
      return res.status(200).json({ preview: updatedPlanData, changes: changeSummary });
    }

    updatedPlanData.user = req.user._id;
    sanitizeExercises(updatedPlanData);

    const updatedPlanDoc = await TrainingPlan.findByIdAndUpdate(
      req.params.id,
      updatedPlanData,
      { new: true, runValidators: true }
    );

    const returnPlan = addCurrentWeekIfActive(updatedPlanDoc);

    res.json(returnPlan);
    generateImagesForPlan(updatedPlanDoc).catch(err =>
      console.error('exercise image generation:', err.message)
    );
  } catch (error) {
    console.error('Error editing training plan with LLM:', error.message);
    res.status(500).json({ message: 'Error editing training plan', error: error.message });
  }
};

/**
 * Aktiviert oder archiviert einen Trainingsplan.
 * @param {Object} req - Das Express-Request-Objekt.
 * @param {Object} res - Das Express-Response-Objekt.
 */
exports.updateTrainingPlanStatus = async (req, res) => {
  const { status } = req.body;
  if (!['active', 'archived'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const plan = await TrainingPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Training plan not found' });
    }
    if (!plan.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    plan.status = status;
    plan.startDate = status === 'active' ? new Date() : null;

    await plan.save();

    const returnPlan = addCurrentWeekIfActive(plan);

    res.json(returnPlan);
  } catch (error) {
    console.error("/api/v2/training-plans/" + req.params.id + "/status" + error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Returns the number of training plans for the authenticated user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.getTrainingPlanCount = async (req, res) => {
  try {
    const count = await TrainingPlan.countDocuments({ user: req.user._id });
    res.status(200).json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Beantwortet eine Frage zu einem Trainingsplan mithilfe eines LLM.
 * Es werden die letzten Trainingslogs (max. 10) mit Datum übermittelt.
 * @param {Object} req - Express Request Objekt.
 * @param {Object} res - Express Response Objekt.
 */
exports.askTrainingPlanQuestion = async (req, res) => {
  const { question, messages } = req.body;

  if (!question && (!messages || messages.length === 0)) {
    return res.status(400).json({ message: 'Missing question or messages' });
  }

  try {
    const plan = await TrainingPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Training plan not found' });
    }
    if (!plan.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const logs = await TrainingLog.find({ user: req.user._id, trainingPlan: plan._id, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('createdAt weekday status exercises')
      .lean();

    const currentDate = new Date().toISOString();

    // Pass messages if available, otherwise fallback to question (wrapped in array or as string, llm handles both now but let's send what we have)
    // Actually llm.js handles string or array.
    const input = messages || question;

    const answer = await askTrainingPlan(input, plan, logs, currentDate, req.user.language);
    if (!answer) {
      return res.status(500).json({ message: 'LLM did not return a response' });
    }
    res.json({ answer });
  } catch (error) {
    console.error('askTrainingPlanQuestion', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
