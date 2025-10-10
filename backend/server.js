require('dotenv').config();
const app = require("./app");

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || "localhost";

app.listen(PORT, () => {
  console.log(`Server running on http://${HOST}:${PORT}/api-docs/`);
});
