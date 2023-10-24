import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from '../firebaseConfig';

export async function deletePostAndRelatedData(postId: string) {
    const batch = writeBatch(db);

    try {
        // Aggiungi l'operazione di eliminazione del post al batch
        const postRef = doc(db, 'posts', postId);
        batch.delete(postRef);

        // Ottieni tutti i commenti relativi al post e aggiungili al batch per la cancellazione
        const commentsQuery = query(collection(db, 'comments'), where('postId', '==', postId));
        const commentsSnapshot = await getDocs(commentsQuery);

        for (const commentDoc of commentsSnapshot.docs) {
            batch.delete(commentDoc.ref);
        }

        // Esegui tutte le operazioni nel batch
        await batch.commit();
        console.log("Post and related comments deleted successfully");
    } catch (error) {
        console.error("Error deleting post and related data:", error);
    }

    // Nota: Poiché gli upvotes sono un campo all'interno del documento post, non è necessario cancellarli separatamente.
    // Se gli upvotes fossero gestiti come un array di ID utente, potresti rimuovere un ID utente dall'array.
    // Se gli upvotes fossero gestiti come un semplice conteggio, potresti semplicemente diminuire il conteggio.
}
