module.exports = {
  name: "alternative_items",
  strict: true,
  schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        description: "Ersatzprodukte, die anstelle des gesuchten Artikels gekauft werden können.",
        items: { type: "string" }
      },
      categories: {
        type: "array",
        description: "Mögliche Supermarktkategorien, in denen die Alternativen zu finden sind.",
        items: { type: "string" }
      },
      text: {
        type: "string",
        description: "Kurzformulierter Antworttext." 
      }
    },
    required: ["items", "categories", "text"],
    additionalProperties: false
  }
};
