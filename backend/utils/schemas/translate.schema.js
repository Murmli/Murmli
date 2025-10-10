module.exports = {
  name: "translate_text",
  strict: true,
  schema: {
    type: "object",
    properties: {
      translation: {
        type: "string",
        description: "Übersetzter Text."
      }
    },
    required: ["translation"],
    additionalProperties: false
  }
};
