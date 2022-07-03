import {
  FunctionResponse, PostRequest, requestLogCollection,
  requestMessageCollection, messageRecord, SplitStratergy,
  User, ParsedMessage, TheSpend, UserStore, Action, ActionItem,
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
  const user: User = validateAndReturnUser(FbWebhookMessage);
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
  const requestLogId = await requestRef;
  const messageRef = db
      .writeToCollection(
          requestMessageCollection(requestLogId), messageRecord(message));

  const parsedMessage = parseMessage(message, user);

  const actionItem: ActionItem ={
    message: parsedMessage,
    messageObject: FbWebhookMessage
        .entry[0]
        .changes[0]
        .value
        .messages[0],
    messageRef: await messageRef,
    action: parsedMessage.action,
  };
  functions.logger.debug("parsed message ", parsedMessage);
  messageActionHandler(actionItem);

  return {
    message: "Mission Successfull",
    httpStatus: 201,
  };
}


/**
 *
 * @param {string} message: Message as recieved from webhook
 * @param {User} user:the user
 * @return {theSpend}: The spend object
 */
function parseMessage(message: string, user: User): ParsedMessage {
  const sanatizedMessage = message.trim();
  const splitMessage = sanatizedMessage.split(" ");

  let split: SplitStratergy = SplitStratergy.Single;
  let description = "";
  let amount: number = Number.MAX_SAFE_INTEGER;
  let action = Action.SPEND;

  functions.logger.debug("Parsing tokens");
  for (let token of splitMessage) {
    token = token.trim();

    if (token.toUpperCase() == "BOTH") {
      split = SplitStratergy.Both;
    } else if (+token) {
      amount = +token;
    } else if (token.toUpperCase() == "CANCEL") {
      action = Action.DELETE;
    } else {
      description = `${description} ${token}`;
    }
  }

  if (action == Action.DELETE) {
    return {
      action: action,
      user: user,
    };
  }

  if (amount == Number.MAX_SAFE_INTEGER) {
    throw new Error("Could not extract amount");
  }

  return {
    action: action,
    amount: amount,
    split: split,
    description: description,
    user: user,
  };
}

/**
 *
 * @param {PostRequest} fbRequest: The message request we got
 * @return {users} the user the message was for
 * It should throw an exception if the user is not one of me or sravya
 */
function validateAndReturnUser(fbRequest: PostRequest): User {
  const number = fbRequest
      .entry[0]
      .changes[0]
      .value
      .messages[0]
      .from;

  const user = UserStore.find((us) => us.phoneNumber == number);

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


/**
 *
 * @param {ActionItem} actionItem:parsed message with message action;
 */
function messageActionHandler(actionItem: ActionItem) {
  if (actionItem.action == Action.DELETE) {
    findAndDeleteMessage(actionItem);
  } else if (actionItem.action == Action.SPEND) {
    persistMessage(actionItem);
  }
}


/**
 *
 * @param {ActionItem}actionItem
 */
async function findAndDeleteMessage(actionItem: ActionItem) {
  const user = actionItem.message.user;
  const lastMessageRef = db.getLastMessageFromUser(user);
  const data = (await lastMessageRef).data() as TheSpend;

  functions.logger.info(`The Message from ${data.spender.name} 
  pertaining to amount ${data.amount} is being deleted`);
  db.deleteDocument((await lastMessageRef).ref );
}

/**
 *
 * @param {ActionItem} actionItem
 */
function persistMessage(actionItem:ActionItem) {
  const parsedMessage = actionItem.message;

  if (parsedMessage.amount == undefined || parsedMessage.split == undefined ||
    parsedMessage.user == undefined) {
    throw new Error("Mandatory feilds not defined for persisting the message");
  }

  const time = getDateFromEpoch(+actionItem.messageObject.timestamp);
  const theSpend: TheSpend = {
    amount: parsedMessage.amount,
    description: parsedMessage.description,
    spender: parsedMessage.user,
    split: parsedMessage.split,
    date: time,
    messageRef: actionItem.messageRef,
  };

  db.writeToCollection("/the-spend", theSpend);
}
