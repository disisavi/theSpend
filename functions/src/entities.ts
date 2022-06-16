export const verifyToken = "XX";
export const requestLogCollection = "/request-log";
export const requestMessageCollection =
  (documentId: string) =>
    `${requestLogCollection}/${documentId}/unparsed-message`;

export const messageRecord = (messageText: string) => {
  return {message: messageText};
};

export interface FunctionResponse {
  message: string,
  httpStatus: number;
}

export interface PostRequest {
  entry: Array<ChangeRequestObject>,
  object: string

}

export interface ChangeRequestObject {
  changes: ChangeRequest[]
}

export interface ChangeRequest {

  field: string,
  value: MessageValue;

}

export interface MessageValue {

  messaging_product: string,
  metadata: MessageMetada,
  contacts: Contact[],
  messages: MessageObject[];
}

export interface MessageMetada {
  display_phone_number: string,
  phone_number_id: string;
}

export interface MessageObject {
  from: string,
  id: string,
  timestamp: string,
  type: string,
  text: Text;
}
export interface Text {
  body: string;
}
export interface Contact {
  profile: {
    name: string
  },
  wa_id: string;
}

export interface User {
  name: string,
  phone: string
}
export const UserStore = [
  {
    phoneNumber: "XX",
    name: "Abhijeet",
  },
  {
    name: "Sravya",
    phoneNumber: "XX",
  },
];

export enum SplitStratergy {
  Both,
  Single
}

export interface ParsedMessage {
  amount: number
  split: SplitStratergy,
  description: string,
}


export interface TheSpend {
  amount: number
  spender: User
  split: SplitStratergy,
  description: string
  date: Date
  messageRef: string
}
