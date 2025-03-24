const express = require("express");
const verifyAzureToken = require("./authMiddleware");

const app = express();

app.get("/api/forms", verifyAzureToken("access_issues"), (req, res) => {
  res.send(`Hello ${req.user.name}, you can view issues.`);
});

app.listen(3001, () => console.log("API running on port 3001"));
