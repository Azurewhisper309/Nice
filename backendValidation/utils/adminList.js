import axios from "axios";
import { getAzureToken } from "./getAzureToken.js";
import dotenv from "dotenv";


dotenv.config();

export default async function adminList() {
  const access_token = await getAzureToken();
  const headers = {
    Authorization: `Bearer ${access_token}`,
  };

  const sp_id = process.env.AZURE_SERVICE_PRINCIPAL_ID?.trim();
  const adminRoleId = process.env.AZURE_ADMIN_ROLE_ID?.trim();
  if (!sp_id || !adminRoleId) {
    throw new Error("Service Principal ID or Admin Role ID is not set in environment variables");
  }

  const base = `https://graph.microsoft.com/v1.0/servicePrincipals/${sp_id}/appRoleAssignedTo`;
  const url = `${base}?$filter=appRoleId eq ${JSON.stringify(adminRoleId)}`;
  const assignmentsRes = await graphPagedGet(url, headers);

  const userIds  = assignmentsRes.filter(a=>a.principalType==='User').map(a=>a.principalId);
  const groupIds = assignmentsRes.filter(a=>a.principalType==='Group').map(a=>a.principalId);

  // Resolve users
  const directUsers = await batchUsers(userIds); // implement batching

  // Expand group members (direct only to start)
  const groupMembers = [];
  for (const gid of groupIds) {
    const members = await graphPaged(`/groups/${gid}/members?$select=id,name,userPrincipalName,mail`, headers);
    groupMembers.push(...members);
  }

  // Merge + dedupe by id (OID)
  const map = new Map();
  [...directUsers, ...groupMembers].forEach(u=>{
    map.set(u.id, {
      id: u.id,
      name: u.name || u.userPrincipalName,
      email: u.mail || null,
      principalName: u.userPrincipalName || null
    });
  });
  return [...map.values()];
}
