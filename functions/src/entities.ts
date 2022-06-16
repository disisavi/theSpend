export const verifyToken = "ZZZ";
export const requestLogCollection = "/request-log";
export const requestMessageCollection =
  (documentId: string) =>
    `${requestLogCollection}/${documentId}/unparsed-message`;

export const messageRecord = (messageText: string): MessageRecord => {
  return {message: messageText};
};

interface MessageRecord {
  message: string,
}

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

export interface user {
  name: string,
  phone: string
}
export const usersPresent = [
  {
    phoneNumber: "ZZZ",
    name: "Abhijeet",
  },
  {
    name: "Sravya",
    phoneNumber: "ZZZ",
  },
];

export enum splitStratergy {
  Both,
  Single
}

export interface tempSpendObject {
  amount: number
  split: splitStratergy,
  description: string,
}


export interface theSpend {
  amount: number
  spender: user
  split: splitStratergy,
  description: string
  date: Date
  messageRef: string
}
