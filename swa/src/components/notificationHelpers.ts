import { addDoc, collection } from "firebase/firestore";
import { db } from '../firebaseConfig';

export async function createNotification(userId: string, message: string, type: string, postId: string) {
    try {
        await addDoc(collection(db, "notifications"), {
            userId,
            message,
            date: new Date().toLocaleDateString(),
            type,
            postId,
            isRead: false
        });
    } catch (e) {
        console.error("Error creating notification: ", e);
    }
}
