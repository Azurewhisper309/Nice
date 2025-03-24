// authMiddleware.js
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

// Replace these with your Azure AD details
const tenantId = "c98fb553-0659-4746-aefd-c234de2a5cfc";
const clientId = "167b6ac5-b782-46e0-a581-906959ffb355"; // App Registration (API)
const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

function verifyAzureToken(requiredScope) {
  return function (req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send("No token found");
    }

    const token = authHeader.replace("Bearer ", "");

    jwt.verify(
      token,
      getKey,
      {
        audience: clientId, // Your API’s App Registration ID
        issuer: issuer,
        algorithms: ["RS256"],
      },
      (err, decoded) => {
        if (err) return res.status(401).send("Token invalid");
        const scopes = decoded.scp?.split(" ") || [];
        if (!scopes.includes(requiredScope)) {
          return res.status(403).send("Missing required scope");
        }
        req.user = decoded;
        next();
      }
    );
  };
}

module.exports = verifyAzureToken;
