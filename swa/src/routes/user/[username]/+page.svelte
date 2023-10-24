<script lang="ts">
    import { page } from '$app/stores';  // Importa lo store di pagina per accedere ai parametri
    import { setDoc, getDoc, doc, deleteDoc, getDocs, query, where, writeBatch, type DocumentData, collection } from "firebase/firestore";
    import { db, auth } from '../../../firebaseConfig';
    import { onMount } from 'svelte';
    import { deleteUser } from "firebase/auth";
    import { goto } from '$app/navigation';

    interface UserProfile {
        username: string;
        email: string;
        bio?: string;
    }

    let userProfile: UserProfile | null = null;
    let editing = false;
    let editBio: string;

    onMount(async () => {
    // Recupera l'username dalla URL
    const { username } = $page.params;

    // Ottieni l'UID associato a quel nome utente dalla collezione "usernames"
    const usernameDoc = await getDoc(doc(db, "usernames", username));
    if (!usernameDoc.exists()) {
        console.error(`Username ${username} not found in "usernames" collection.`);
        return;
    }
    const uid = usernameDoc.data().uid;

    // Utilizza l'UID per recuperare i dati dell'utente dalla collezione "users"
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
        userProfile = userDoc.data() as UserProfile;
        editBio = userProfile.bio || "Bio non disponibile";
    } else {
        console.error(`User profile for UID ${uid} not found.`);
    }
});

async function saveChanges() {
    try {
        // Assicuriamoci di avere un utente corrente
        if (!userProfile) return;

        // Recupera l'UID associato all'username
        const usernameDoc = await getDoc(doc(db, "usernames", userProfile.username));
        if (!usernameDoc.exists()) {
            console.error(`Username ${userProfile.username} not found in "usernames" collection.`);
            return;
        }
        const uid = usernameDoc.data().uid;

        // Aggiorna il documento dell'utente con i nuovi valori usando l'UID
        await setDoc(doc(db, "users", uid), {
            bio: editBio,
            // Puoi aggiungere qui altri campi se necessario
        }, { merge: true }); // L'opzione merge assicura che solo i campi forniti vengano aggiornati

        // Aggiorna la variabile userProfile locale
        userProfile.bio = editBio;

        editing = false;
    } catch (error) {
        console.error("Errore durante il salvataggio delle modifiche:", error);
        // Potresti mostrare un messaggio all'utente o gestire l'errore in altro modo qui
    }
}

async function deleteUserAndData() {
    if (!auth.currentUser) {
        console.error("No user currently logged in.");
        return;
    }
    const uid = auth.currentUser.uid;

    // Utilizza un batch per cancellare tutti i dati associati all'utente
    const batch = writeBatch(db);

    try {
        // Cancellare i post dell'utente
        const postsQuery = query(collection(db, 'posts'), where('authorId', '==', uid));
        const postsSnapshot = await getDocs(postsQuery);
        postsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

        // Cancellare i commenti dell'utente
        const commentsQuery = query(collection(db, 'comments'), where('postAuthorId', '==', uid));
        const commentsSnapshot = await getDocs(commentsQuery);
        commentsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

        // Cancellare le notifiche dell'utente
        const notificationsQuery = query(collection(db, 'notifications'), where('userId', '==', uid));
        const notificationsSnapshot = await getDocs(notificationsQuery);
        notificationsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

        // Cancellare gli userUpvotes dell'utente da ogni post
        const userUpvotesSnapshot = await getDocs(collection(db, 'userUpvotes'));
        userUpvotesSnapshot.docs.forEach(doc => {
            if (doc.data().users && doc.data().users.includes(uid)) {
                // Rimuovere l'UID dell'utente dall'array degli upvotes
                const updatedUsers = doc.data().users.filter((userId: string) => userId !== uid);
                batch.update(doc.ref, { users: updatedUsers });
            }
        });

        // Cancellare il profilo utente
        batch.delete(doc(db, 'users', uid));

        // Trova l'username associato all'UID e cancellalo
        const usernamesQuery = query(collection(db, 'usernames'), where('uid', '==', uid));
        const usernamesSnapshot = await getDocs(usernamesQuery);
        if (!usernamesSnapshot.empty) {
            const usernameDoc = usernamesSnapshot.docs[0]; // Dovrebbe esserci solo un documento che corrisponde
            batch.delete(usernameDoc.ref);
        }

        // Esegui il batch
        await batch.commit();

        // Cancellare l'account utente da Firebase Authentication
        await deleteUser(auth.currentUser);

        console.log("User and associated data deleted successfully.");

        // Reindirizza l'utente alla homepage
        goto('/');

    } catch (error) {
        console.error("Error deleting user and data:", error);
    }
    
}



</script>

<div class="user-profile">
    {#if userProfile}
        <h4>{userProfile.username}</h4>
        <p>{userProfile.bio}</p>
        {#if editing}
            <textarea bind:value={editBio}></textarea>
            <button on:click={saveChanges}>Salva modifiche</button>
            <button on:click={() => editing = false}>Annulla</button>
        {:else}
            <button on:click={() => editing = true}>Modifica Profilo</button>
        {/if}
        <button on:click={deleteUserAndData} class="danger-button">Elimina Account</button>
    {:else}
        <p>Caricamento profilo...</p>
    {/if}
</div>
