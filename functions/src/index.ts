
//  Start writing Firebase Functions
//  https://firebase.google.com/docs/functions/typescript


import * as functions from "firebase-functions";
import {getHandler} from "./gethandler";
import {FunctionResponse} from "./entities";
import {postHandler} from "./posthandler";
import firestore= require("firebase-admin/firestore");
import admin = require("firebase-admin");


export const db = firestore.getFirestore(admin.initializeApp());

export const spend = functions
    .region("europe-west1")
    .https.onRequest(async (request, response) => {
      functions.logger.info("Function Triggered", {structuredData: true});

      if (request.method == "GET") {
        const responseMessage:FunctionResponse = getHandler(request);
        response.status(responseMessage.httpStatus).
            send(responseMessage.message);
      } else if (request.method == "POST") {
        const responseMessage:FunctionResponse = await postHandler(request);
        response.status(responseMessage.httpStatus).
            send(responseMessage.message);
      } else {
        throw new Error("Not Implemented/Not a valid call to this function.");
      }
    });


