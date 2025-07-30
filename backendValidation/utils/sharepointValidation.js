// utils/sharepointValidation.js
import axios from "axios";
import  {getAzureToken}  from "./Token_Admins.js"; // Must return access token

export async function validateSharePointForm({ site, who_to_add, permission }) {
  const token = await getAzureToken();
  const headers = { Authorization: `Bearer ${token}` };

  // 1. Validate site
  const siteRes = await axios.get(
    `https://graph.microsoft.com/v1.0/sites/${site.id}`,
    { headers }
  );
  if (!siteRes.data || siteRes.data.id !== site.id) {
    throw new Error("Site not found or invalid");
  }

  // 2. Validate permission
  const roleDefs = await axios.get(
    `https://graph.microsoft.com/v1.0/sites/${site.id}/roleDefinitions`,
    { headers }
  );
  const role = roleDefs.data.value.find(r => r.displayName.toLowerCase() === permission.toLowerCase());
  if (!role) {
    throw new Error(`Permission '${permission}' not found on site`);
  }

  // 3. Validate who_to_add
  for (const entity of who_to_add) {
    if (!["user", "group"].includes(entity.type)) {
      throw new Error(`Invalid type '${entity.type}'`);
    }

    try {
      const entityRes = await axios.get(
        `https://graph.microsoft.com/v1.0/${entity.type}s/${entity.id}`,
        { headers }
      );
      if (!entityRes.data) throw new Error();
    } catch {
      throw new Error(`${entity.type} with ID ${entity.id} not found in Azure AD`);
    }
  }

  // Return cleaned values (optional)
  return {
    siteId: site.id,
    siteName: site.name,
    sitePath: site.path,
    who_to_add,
    permission: role.displayName,
  };
}
