const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const os = require('os');

class AudioTranscriber {
  constructor() {
    this.openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }

  async transcribeFromBuffer(file) {
    // Bestimme die Dateierweiterung und erstelle einen temporären Pfad
    const fileExtension = this.getFileExtension(file.originalname || file.mimetype);
    const tempFilePath = path.join(os.tmpdir(), `temp_audio_${Date.now()}.${fileExtension}`);

    try {
      // Kopieren des Inhalts in die neue Datei mit Erweiterung
      fs.copyFileSync(file.path, tempFilePath);

      // Read file to base64
      const fileBuffer = fs.readFileSync(tempFilePath);
      const base64Audio = fileBuffer.toString('base64');

      // Transcribe with OpenRouter/Gemini Multimodal
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENROUTER_LOW_MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Transcribe the audio explicitly and verbatim."
              },
              {
                type: "input_audio",
                input_audio: {
                  data: base64Audio,
                  format: fileExtension
                }
              }
            ]
          }
        ]
      });

      const transcription = response.choices[0].message.content;

      return transcription;
    } catch (error) {
      console.error('Fehler beim Verarbeiten der Datei:', error);
      // Fallback or detailed error logging
      if (error.response) {
        console.error(error.response.data);
      }
      return false;
    } finally {
      // Clean up temp files
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      // Delay deletion to ensure file stream is fully read
      setTimeout(() => {
        if (fs.existsSync(tempFilePath)) {
          fs.unlink(tempFilePath, (err) => {
            if (err) console.error('Fehler beim Löschen der temporären Datei:', err);
          });
        }
      }, 500);

    }
  }

  // Hilfsfunktion zum Extrahieren der Dateierweiterung
  getFileExtension(filename) {
    // Versuche, die Erweiterung aus dem Dateinamen zu extrahieren
    if (filename) {
      const ext = path.extname(filename).toLowerCase().substring(1);
      // Überprüfe, ob die Erweiterung unterstützt wird
      // Erweitert für Audioformate, die Gemini verstehen könnte
      const supportedFormats = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm', 'aac'];
      if (supportedFormats.includes(ext)) {
        return ext;
      }
    }

    // Standardmäßig mp3 verwenden, wenn keine gültige Erweiterung gefunden wurde
    return 'mp3';
  }
}

module.exports = AudioTranscriber;