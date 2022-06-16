import {
  FunctionResponse, PostRequest, requestLogCollection,
  requestMessageCollection, messageRecord, splitStratergy,
  user, tempSpendObject, theSpend, usersPresent,
}
  from "./entities";
import {Request} from "firebase-functions/v1";
import * as functions from "firebase-functions";
import * as db from "./databaseAccess";

const getDateFromEpoch = (time: number) => {
  const date: Date = new Date(0);
  date.setUTCSeconds(time);
  return date;
};

/**
 *
 * @param {Request} postRequest: This is the
 * request we will get from Webhook
 * @return {FunctionResponse}: Response to this request
 */
export async function
postHandler(postRequest: Request): Promise<FunctionResponse> {
  const FbWebhookMessage: PostRequest = postRequest.body as PostRequest;
  const user: user = validateAndReturnUser(FbWebhookMessage);

  // functions.logger.info(postRequest.body ?? "asd");
  const requestRef: Promise<string> = db.writeToCollection(
      requestLogCollection, FbWebhookMessage);

  let message: string;
  try {
    message = FbWebhookMessage
        .entry[0]
        .changes[0]
        .value
        .messages[0]
        .text
        .body;
  } catch (exception) {
    functions.logger.error("Unstructred message.", exception);
    message = "N/A";
  }
  functions.logger.info(`Message is == ${message}`);
  const requestId = await requestRef;
  const messageRef: string = await db
      .writeToCollection(
          requestMessageCollection(requestId), messageRecord(message));


  const messageTime: number = +FbWebhookMessage
      .entry[0]
      .changes[0]
      .value
      .messages[0]
      .timestamp;
  const parsedMessage = parseMessage(message);
  functions.logger.debug("parsed message ", parsedMessage);
  const finalMessage: theSpend = {
    amount: parsedMessage.amount,
    spender: user,
    split: parsedMessage.split,
    description: parsedMessage.description,
    date: getDateFromEpoch(messageTime),
    messageRef: messageRef,
  };

  db.writeToCollection("/the-spend", finalMessage);
  return {
    message: "Mission Successfull",
    httpStatus: 201,
  };
}


/**
 *
 * @param {string} message: Message as recieved from webhook
 * @return {theSpend}: The spend object
 */
function parseMessage(message: string): tempSpendObject {
  const sanatizedMessage = message.trim();
  let split: splitStratergy = splitStratergy.Single;
  const splitMessage = sanatizedMessage.split(" ");
  let description = "";
  let amount: number = Number.MAX_SAFE_INTEGER;
  functions.logger.debug("Parsing tokens");
  for (const token of splitMessage) {
    functions.logger.debug(token);
    if (token.toUpperCase() == "BOTH") {
      split = splitStratergy.Both;
    } else if (+token) {
      amount = +token;
    } else {
      description = `${description} ${token}`;
    }
  }
  if (amount == Number.MAX_SAFE_INTEGER) {
    throw new Error("Could not extract amount");
  }

  return {
    amount: amount,
    split: split,
    description: description,
  };
}

/**
 *
 * @param {PostRequest} fbRequest: The message request we got
 * @return {users} the user the message was for
 * It should throw an exception if the user is not one of me or sravya
 */
function validateAndReturnUser(fbRequest: PostRequest): user {
  const number = fbRequest
      .entry[0]
      .changes[0]
      .value
      .messages[0]
      .from;

  const user = usersPresent.find((us) => us.phoneNumber == number);

  if (!user) {
    const errorMessage = `Not a valid user.
     Couldnt find a user with phone number ${number}`;
    functions.logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  return {
    name: user.name,
    phone: user.phoneNumber,
  };
}
