module.exports = {
  name: "translate_json",
  strict: true,
  schema: {
    type: "object",
    properties: {
      translation: {
        type: "array",
        description: "Liste von Schlüssel-Wert-Paaren der Übersetzung.",
        items: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "Schlüssel des ursprünglichen JSON"
            },
            value: {
              type: "string",
              description: "Übersetzter Wert"
            }
          },
          required: ["key", "value"],
          additionalProperties: false
        }
      }
    },
    required: ["translation"],
    additionalProperties: false
  }
};
