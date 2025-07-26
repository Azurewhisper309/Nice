// getCurrentAzureAdmins.js

import axios from "axios";
import dotenv from "dotenv";
dotenv.config();


//Function to check if the user is authenticated
 export function isAuthenticated(req,res,next){
  if(!req.user||!req.user.roles||!req.user.principalName){
        res.status(403).json({error:'no authorization for user'});
    }
        next();
    }

export default async function getAzureToken() {
  const params = new URLSearchParams();
  params.append("client_id", process.env.AZURE_CLIENT_ID);
  params.append("client_secret", process.env.AZURE_CLIENT_SECRET);
  params.append("grant_type", "client_credentials");
  params.append("scope", "https://graph.microsoft.com/.default");

  const tokenResponse = await axios.post(
    `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
    params
  );

  return tokenResponse.data.access_token;
}

export async function getCurrentAzureAdmins() {
  const access_token = await getAzureToken();
  const headers = {
    Authorization: `Bearer ${access_token}`,
  };

  const appId = process.env.AZURE_APP_ID;

  // Step 1: Get Service Principal ID
  const spRes = await axios.get(
    `https://graph.microsoft.com/v1.0/servicePrincipals?$filter=appId eq '${appId}'`,
    { headers }
  );
  const servicePrincipalId = spRes.data.value[0].id;

  // Step 2: Get Role ID for 'admin'
  const appRes = await axios.get(
    `https://graph.microsoft.com/v1.0/applications?$filter=appId eq '${appId}'`,
    { headers }
  );
  const appRoles = appRes.data.value[0].appRoles;
  const adminRole = appRoles.find((role) => role.value === "admin");
  const adminRoleId = adminRole.id;

  // Step 3: Get App Role Assignments
  const assignmentsRes = await axios.get(
    `https://graph.microsoft.com/v1.0/servicePrincipals/${servicePrincipalId}/appRoleAssignedTo`,
    { headers }
  );

  const filtered = assignmentsRes.data.value.filter(
    (assignment) =>
      assignment.appRoleId === adminRoleId &&
      (assignment.principalType === "User" || assignment.principalType === "Group")
  );

  // Step 4: Resolve Assigned Users
  const listOfAdmins = [];
  for (const assignment of filtered) {
    if (assignment.principalType === "User") {
      const userRes = await axios.get(
        `https://graph.microsoft.com/v1.0/users/${assignment.principalId}?$select=id,displayName,userPrincipalName`,
        { headers }
      );
      const { id, displayName, userPrincipalName } = userRes.data;
      listOfAdmins.push({ id, name: displayName, email: userPrincipalName });
    } else if (assignment.principalType === "Group") {
      const groupRes = await axios.get(
        `https://graph.microsoft.com/v1.0/groups/${assignment.principalId}/members?$select=id,displayName,userPrincipalName`,
        { headers }
      );
      for (const member of groupRes.data.value) {
        listOfAdmins.push({
          id: member.id,
          name: member.displayName,
          email: member.userPrincipalName,
        });
      }
    }
  }

  return listOfAdmins;
}