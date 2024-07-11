import { db } from "./index";
import {
  DocumentData, DocumentReference,
  QueryDocumentSnapshot
} from "firebase-admin/firestore";
import { User } from "./entities";

/**
 *
 * @param {string} collectionName
 * presents name of the collection to add the document to
 *
 * @param {unknown} data presents data to be persisted;
 * @return {Promise<string>} Returns the ID of the doc
 */
export function writeToCollection(
  collectionName: string, data: unknown): Promise<string> {
  (data as any).writeTime = new Date();
  return db
    .collection(collectionName)
    .add(data as DocumentData)
    .then((reference) => reference.id);
}

/**
 *
 * @param {User} user: the user whose last message needs to be deleted
 * @return {Promise<QueryDocumentSnapshot>}
 */
export function getLastMessageFromUser(user: User): Promise<QueryDocumentSnapshot> {
  return db.collection("/the-spend")
    .where("spender.name", "==", user.name)
    .orderBy("date", "desc")
    .limit(1)
    .get()
    .then((querySnapshot) => querySnapshot.docs[0]);
}

/**
 *
 * @param {DocumentReference}documentRef
 */
export function deleteDocument(documentRef: DocumentReference) {
  documentRef.delete();
}
