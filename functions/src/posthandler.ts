import {
  FunctionResponse, PostRequest, requestLogCollection,
  requestMessageCollection, messageRecord, SplitStratergy,
  User, ParsedMessage, TheSpend, UserStore, Action, ActionItem, MessageObject, ReplyMessage,
}
  from "./entities";
import {Request} from "firebase-functions/v1";
import * as functions from "firebase-functions";
import * as db from "./databaseAccess";
import {FBService} from "./fbService";

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

  try {
    const user: User = validateAndReturnUser(FbWebhookMessage);
    const requestRef: Promise<string> = db.writeToCollection(requestLogCollection, FbWebhookMessage);

    const messageObject = FbWebhookMessage
        .entry[0]
        .changes[0]
        .value
        .messages[0];

    const message: string = extractMessageString(messageObject);

    functions.logger.info(`Message is == ${message}`);

    const messageRef = db
        .writeToCollection( requestMessageCollection(await requestRef), messageRecord(message));

    const actionItem = parseMessage(messageObject, user, await messageRef);

    functions.logger.debug("parsed action ", actionItem);
    messageActionHandler(actionItem);

    return {
      message: "Mission Successfull",
      httpStatus: 201,
    };
  } catch (exception) {
    const fbService = new FBService();
    fbService.sendMessage({
      phoneNumber: FbWebhookMessage
          .entry[0]
          .changes[0]
          .value
          .metadata
          .display_phone_number,
      message: ReplyMessage.FAILED_READ,
      messageId: FbWebhookMessage
          .entry[0]
          .changes[0]
          .value
          .messages[0]
          .id,
    });

    return {
      message: "Mission Not Successfull",
      httpStatus: 400,
    };
  }
}

/**
 *
 * @param {MessageObject} messageObject
 * @return {string}
 */
function extractMessageString(messageObject: MessageObject) {
  let message: string;
  try {
    message = messageObject
        .text
        .body;
  } catch (exception) {
    functions.logger.error("Unstructred message.", exception);
    message = "N/A";
  }
  return message;
}

/**
 *
 * @param {MessageObject} messageObject: Message as recieved from webhook
 * @param {User} user:the user
 * @param {string} messageRef: messageRef
 * @return {ActionItem}: The spend object
 */
function parseMessage(messageObject: MessageObject, user: User, messageRef: string): ActionItem {
  const message = extractMessageString(messageObject);
  const sanatizedMessage = message.trim();
  const splitMessage = sanatizedMessage.split(" ");

  let split: SplitStratergy = SplitStratergy.Single;
  let description = "";
  let amount: number = Number.MAX_SAFE_INTEGER;
  let action = Action.SPEND;
  let parsedMessage: ParsedMessage;

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
    parsedMessage = {
      user: user,
    };
  } else {
    parsedMessage = {
      amount: amount,
      split: split,
      description: description,
      user: user,
    };
  }

  if (amount == Number.MAX_SAFE_INTEGER) {
    throw new Error("Could not extract amount");
  }

  return {
    message: parsedMessage,
    action: action,
    messageObject: messageObject,
    messageRef: messageRef,
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
