import xss from "xss";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file
const role1 = process.env.APP_ROLES.split(',')[0].trim().toLowerCase();
const role2 = process.env.APP_ROLES.split(',')[1].trim().toLowerCase();
const allowedFields = {
  [role1]: ["status", "take_number"],
  [role2]: ["title", "description", "type_of", "room_number", "submitted_by"],
};

//check if there is title,if the type is string and then sanitize and check if the length of sanitized is more than 150 throw new error

function validateTitle(title) {
  if (!title || typeof title !== "string") {
    throw new Error("Invalid title!");
  }

  const sanitizedTitle = xss(title);
  if (sanitizedTitle.length > 150) {
    throw new Error("title is longer than expected");
  }
  return sanitizedTitle;
}

function validateDescription(description) {
  if (!description || typeof description !== "string") {
    throw new Error("Invalid description!");
  }

  const sanitizedDescription = xss(description);
  if (sanitizedDescription.length > 350) {
    throw new Error("description is longer than expected");
  }
  return sanitizedDescription;
}

function validateStatus(status) {
  const validStatuses = ["new", "in-treatment", "fixed", "pending"];
  if (!status || typeof status !== "string") {
    throw new Error("Invalid status!");
  }

  const sanitizedStatus = xss(status);
  if (!validStatuses.includes(sanitizedStatus)) {
    throw new Error("status is not valid");
  }
  return sanitizedStatus;
}
//check if there is take_number if not return null or undefined because this field is optional and check if the type is number parseInt(form.take_number, 10) and if the number
function validateTakeNumber(take_number) {
  if (!take_number || typeof take_number !== "number") {
    return null; // or throw an error if you prefer
  }
  const sanitizedTakeNumber = parseInt(take_number, 10);
  if (
    isNaN(sanitizedTakeNumber) ||
    sanitizedTakeNumber < 0 ||
    sanitizedTakeNumber.toString().length !== 7
  ) {
    throw new Error("invalid take_number");
  }
  return sanitizedTakeNumber;
}
function validateWhoToAdd(who_to_add) {
  if (!Array.isArray(who_to_add)) {
    throw new Error("Invalid who_to_add field");
  }

  return who_to_add.map(entity => {
    if (!entity || typeof entity !== "object") {
      throw new Error("Invalid entity in who_to_add");
    }
    if (!entity.id || typeof entity.id !== "string") {
      throw new Error("Invalid entity id in who_to_add");
    }
    if (!entity.type || typeof entity.type !== "string") {
      throw new Error("Invalid entity type in who_to_add");
    }
    return {
      type: (entity.type || "").toLowerCase().trim(), // 'user' or 'group'
      id: (entity.id || "").replace(/[^a-zA-Z0-9-]/g, '') // Keep UUID only
    };
  });
}
//check if there is take_number if not return null or undefined because this field is optional and check if the type is number parseInt(form.take_number, 10) and if the number
function validateRoomNumber(room_number) {
  if (!room_number || typeof room_number !== "number") {
    //sanitizedRoomNumber !== 7
    return null; // or throw an error if you prefer
  }
  
  const sanitizedRoomNumber = parseInt(room_number, 10);
  
  if (isNaN(sanitizedRoomNumber) || sanitizedRoomNumber < 0) {
    throw new Error("invalid room_number");
  }
  
  return sanitizedRoomNumber;
}

    

function validateTypeof(type_of) {
  const validTypes = [
    "m365",
    "sharepoint permissions",
    "azure permissions",
    "network",
    "connectivity",
    "open-tashtit",
    "images",
    "physical problems",
  ];
  if (!type_of || typeof type_of !== "string") {
    throw new Error("Invalid type_of field");
  }
  const sanitizedType = xss(type_of);
  if (!validTypes.includes(sanitizedType)) {
    throw new Error("Invalid type_of field");
  }
  return sanitizedType;
}

export default function sanitizeFormInput(form, role) {
  if (!form || typeof form !== "object") {
    throw new Error("Invalid form input.");
  }
  const permitted = allowedFields[role] || [];
  const sanitized = {};

  if (permitted.includes("title")) {
    sanitized.title = validateTitle(form.title);
  }
  if (permitted.includes("description")) {
    sanitized.description = validateDescription(form.description);
  }
  if (permitted.includes("status")) {
    sanitized.status = validateStatus(form.status);
  }
  if (permitted.includes("take_number")) {
    sanitized.take_number = validateTakeNumber(form.take_number);
  }
  if(permitted.includes("who_to_add")) {
    sanitized.who_to_add = validateWhoToAdd(form.who_to_add);
  }
  if (permitted.includes("type_of")) {
    sanitized.typeOf = validateTypeof(form.type_of);
  }
  if (permitted.includes("roomNumber")) {
    sanitized.roomNumber = validateRoomNumber(form.roomNumber);
  }
  if (permitted.includes("submitted_by")) {
    sanitized.submitted_by = form.submitted_by; // Assuming this is already validated elsewhere
  }
  return sanitized;
}

export function sanitizeUser(user) {
  const allowedRoles=process.env.APP_ROLES;
  const userRole = user.roles[0]?.toLowerCase(); // Default to 'user' if no role is provided
  const allowed=allowedRoles.split(',').map(role=>role.trim().toLowerCase()).filter(Boolean);

  if(!userRole||!allowed.includes(userRole)){
  throw new Error('there is not a valid role for this user');
  }
  if (!user || typeof user !== "object" || !user.id || !user.name || !user.email) {
    throw new Error("Invalid user object");
  }
  const sanitizedUser = {};
  sanitizedUser.id = user.id; // Assuming oid is the unique identifier
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (typeof sanitizedUser.id !== "string"||  !uuidRegex.test(sanitizedUser.id) ) {
    throw new Error("Invalid user id");
  }
  sanitizedUser.name = xss(user.name);
  if (sanitizedUser.name.length > 30) {
    throw new Error("Name is too long");
  }
  //email format is u+take_number+@bsmch.net
  sanitizedUser.email = xss(user.email);
  if (!sanitizedUser.email.match(/^u\d{1,7}@bsmch\.net$/)) {
    throw new Error("Invalid email format");
  }
  
  return sanitizedUser;
}
