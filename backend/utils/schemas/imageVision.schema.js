module.exports = {
  name: "image_vision",
  strict: true,
  schema: {
    type: "object",
    properties: {
      vision: {
        type: "string",
        description: "Kurzbeschreibung dessen, was auf dem Bild zu sehen ist."
      }
    },
    required: ["vision"],
    additionalProperties: false
  }
};
