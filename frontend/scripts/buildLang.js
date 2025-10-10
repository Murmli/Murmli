// Dependencies
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const OpenAI = require("openai");

// Settings
const maxParallelTranslations = 5; // Maximale Anzahl paralleler Übersetzungen
const referenceLanguage = 'de-DE'; // Referenzsprache

// Parse targetLanguages from languageStore
const languageStorePath = path.join(__dirname, '..', 'src', 'stores', 'languageStore.js');
const languageStoreContent = fs.readFileSync(languageStorePath, 'utf8');
const languagesRegex = /const languages = (\[.*?\]);/s;
const languagesMatch = languageStoreContent.match(languagesRegex);

if (!languagesMatch) {
    console.error('Could not find languages array in languageStore.js');
    process.exit(1);
}

const languagesArray = eval(`(${languagesMatch[1]})`);
const targetLanguages = languagesArray
    .map(lang => lang.value)
    .filter(lang => lang !== referenceLanguage);

// Centrally managed language map
const { languageMapRaw, languageMap } = require("../../backend/languageMap.js");

const localesDir = path.join(__dirname, '..', 'src', 'locales');

// OpenAI Configuration
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is missing. Please set it in your .env file.');
    process.exit(1);
}

const loadJSON = (filePath) => {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        return null;
    }
};

const saveJSON = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

/**
 * Entfernt rekursiv alle Keys aus target, die nicht in reference existieren.
 * Modifiziert target direkt.
 */
const removeObsoleteKeys = (reference, target) => {
    if (typeof reference !== 'object' || reference === null || Array.isArray(reference)) return;
    if (typeof target !== 'object' || target === null || Array.isArray(target)) return;

    for (const key of Object.keys(target)) {
        if (!(key in reference)) {
            delete target[key];
        } else {
            removeObsoleteKeys(reference[key], target[key]);
        }
    }
};

// Function to find missing keys in target compared to reference
const findMissingKeys = (reference, target, path = '') => {
    const missingEntries = {};

    // Check all keys in reference
    for (const key in reference) {
        const currentPath = path ? `${path}.${key}` : key;

        // If key doesn't exist in target
        if (!(key in target)) {
            missingEntries[key] = reference[key];
            continue;
        }

        // If both are objects (but not arrays), recurse
        if (
            typeof reference[key] === 'object' && reference[key] !== null && !Array.isArray(reference[key]) &&
            typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])
        ) {
            const nestedMissing = findMissingKeys(reference[key], target[key], currentPath);
            if (Object.keys(nestedMissing).length > 0) {
                missingEntries[key] = nestedMissing;
            }
        }
    }

    return missingEntries;
};

// Function to merge missing translations back into target
const mergeTranslations = (target, translated) => {
    const result = { ...target };

    for (const key in translated) {
        if (typeof translated[key] === 'object' && translated[key] !== null && !Array.isArray(translated[key])) {
            if (!result[key] || typeof result[key] !== 'object') {
                result[key] = {};
            }
            result[key] = mergeTranslations(result[key], translated[key]);
        } else {
            result[key] = translated[key];
        }
    }

    return result;
};

// Translation function
const translateJSON = async (inputJson, targetLanguage) => {
    const actualTargetLanguage = languageMap[targetLanguage.toLowerCase()] || targetLanguage;
    console.log("targetlanguage: ", actualTargetLanguage)
    const messages = [
        {
            role: "system",
            content: `
Der Benutzer gibt dir eine JSON-Datei, die Texte in einer bestimmten Sprache enthält. 
Deine Aufgabe ist es, alle Texte innerhalb der Datei in die vorgegebene Zielsprache "${actualTargetLanguage}" zu übersetzen.

Anforderungen:
- Die Struktur der JSON-Datei muss exakt beibehalten werden – keine Änderungen an Schlüsseln oder der Hierarchie.
- Nur die Werte innerhalb der JSON-Datei werden übersetzt, nicht die Schlüssel.
- Du gibst die vollständige, übersetzte JSON-Datei zurück, ohne zusätzliche Kommentare oder Erklärungen.
- Achte darauf, dass die Übersetzung natürlich klingt und kulturelle Nuancen der Zielsprache berücksichtigt.
            `
        },
        {
            role: "user",
            content: inputJson
        }
    ];

    try {
        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_TRANSLATION_MODEL || "gpt-5-mini",
            messages: messages,
            response_format: { type: "json_object" },
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error(`Error translating to "${targetLanguage}":`, error.message);
        throw error;
    }
};

// Main translation processor
const processTranslation = async (referenceData, targetLanguage) => {
    try {
        console.log(`Processing translation for: ${targetLanguage}`);
        const startTime = Date.now();

        const targetFilePath = path.join(localesDir, `${targetLanguage}.json`);

        // Check if target file exists
        let existingTranslation = loadJSON(targetFilePath);
        let translatedData;

        if (existingTranslation) {
            console.log(`Existing translation found for ${targetLanguage}, checking for missing keys...`);

            // Entferne Keys, die nicht mehr in der Referenz vorhanden sind
            removeObsoleteKeys(referenceData, existingTranslation);
            saveJSON(targetFilePath, existingTranslation);

            // Find missing keys in existing translation compared to reference
            const missingKeys = findMissingKeys(referenceData, existingTranslation);
            if (Object.keys(missingKeys).length === 0) {
                console.log(`✓ No missing keys found for ${targetLanguage}, skipping translation.`);
                return { success: true, language: targetLanguage, status: 'unchanged' };
            }

            console.log(`Found ${Object.keys(missingKeys).length} top-level missing keys for ${targetLanguage}, translating only those...`);

            // Translate only the missing keys
            const missingKeysJson = JSON.stringify(missingKeys, null, 2);
            const translatedMissingKeysText = await translateJSON(missingKeysJson, targetLanguage);
            const translatedMissingKeys = JSON.parse(translatedMissingKeysText);

            // Merge the translated missing keys back into the existing translation
            translatedData = mergeTranslations(existingTranslation, translatedMissingKeys);
        } else {
            console.log(`No existing translation found for ${targetLanguage}, creating new translation...`);

            // Translate the entire reference data
            const translatedJsonText = await translateJSON(JSON.stringify(referenceData, null, 2), targetLanguage);
            translatedData = JSON.parse(translatedJsonText);
        }

        // Save the updated/new translation
        saveJSON(targetFilePath, translatedData);

        const duration = (Date.now() - startTime) / 1000;
        console.log(`✓ ${targetLanguage} completed in ${duration}s`);
        return { success: true, language: targetLanguage };
    } catch (error) {
        console.error(`✗ Failed to translate ${targetLanguage}:`, error.message);
        return { success: false, language: targetLanguage, error: error.message };
    }
};

// Batch processor with concurrency control
const processInBatches = async (tasks, batchSize) => {
    const results = [];
    for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        console.log(`\nProcessing batch ${i / batchSize + 1}/${Math.ceil(tasks.length / batchSize)}`);

        const batchResults = await Promise.all(batch.map(task => task()));
        results.push(...batchResults);

        // Brief pause between batches to avoid rate limiting
        if (i + batchSize < tasks.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    return results;
};

// Main function
const buildLanguages = async () => {
    console.log('Starting incremental translation process...');
    console.log(`Reference language: ${referenceLanguage}`);
    console.log(`Target languages: ${targetLanguages.join(', ')}`);
    console.log(`Max parallel translations: ${maxParallelTranslations}\n`);

    const referenceFilePath = path.join(localesDir, `${referenceLanguage}.json`);
    if (!fs.existsSync(referenceFilePath)) {
        console.error(`Reference file not found: ${referenceFilePath}`);
        return;
    }

    const referenceData = loadJSON(referenceFilePath);

    // Create translation tasks
    const translationTasks = targetLanguages.map(lang =>
        () => processTranslation(referenceData, lang)
    );

    // Process all translations in batches
    const startTime = Date.now();
    const results = await processInBatches(translationTasks, maxParallelTranslations);
    const totalDuration = (Date.now() - startTime) / 1000;

    // Generate summary report
    const successful = results.filter(r => r.success).length;
    const unchanged = results.filter(r => r.success && r.status === 'unchanged').length;
    const updated = results.filter(r => r.success && !r.status).length;
    const failed = results.filter(r => !r.success).length;

    console.log('\nTranslation Summary:');
    console.log(`Total time: ${totalDuration}s`);
    console.log(`Successfully processed: ${successful}/${targetLanguages.length}`);
    console.log(`  - Unchanged: ${unchanged}`);
    console.log(`  - Updated/Created: ${updated}`);

    if (failed > 0) {
        console.log('\nFailed translations:');
        results.filter(r => !r.success).forEach(({ language, error }) => {
            console.log(`- ${language}: ${error}`);
        });
    }

    console.log('\nTranslation process completed!');
};
// Execute
buildLanguages()
    .catch(err => console.error('Fatal error:', err));
