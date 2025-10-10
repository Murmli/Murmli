const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const os = require('os');

class AudioTranscriber {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async transcribeFromBuffer(file) {
    // Bestimme die Dateierweiterung und erstelle einen temporären Pfad
    const fileExtension = this.getFileExtension(file.originalname || file.mimetype);
    const tempFilePath = path.join(os.tmpdir(), `temp_audio_${Date.now()}.${fileExtension}`);

    try {
      // Kopieren des Inhalts in die neue Datei mit Erweiterung
      fs.copyFileSync(file.path, tempFilePath);

      // Transcribe with OpenAI
      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1',
      });

      console.log('Whisper:', transcription.text);
      return transcription.text;
    } catch (error) {
      console.error('Fehler beim Verarbeiten der Datei:', error);
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
      const supportedFormats = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm'];
      if (supportedFormats.includes(ext)) {
        return ext;
      }
    }

    // Standardmäßig mp3 verwenden, wenn keine gültige Erweiterung gefunden wurde
    return 'mp3';
  }
}

module.exports = AudioTranscriber;