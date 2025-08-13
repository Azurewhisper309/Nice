// getAzureToken.js

import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function getAzureToken() {
  const params = new URLSearchParams();
  params.append("client_id", process.env.AZURE_CLIENT_ID); 
  params.append("client_secret", process.env.AZURE_CLIENT_SECRET);
  params.append("grant_type", "client_credentials");
  params.append("scope", "https://graph.microsoft.com/.default");
  try{
     const tokenResponse = await axios.post(
    `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
    params
  );
  
  if (tokenResponse.status !== 200) {
    throw new Error(`Failed to get Azure token: ${tokenResponse.statusText}`);
  }
  return tokenResponse.data.access_token;
  } catch (err) {
  console.error('Azure Token Error:', err.response?.data || err.message);
  throw err;
  } 
}

