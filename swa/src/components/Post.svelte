<script lang="ts">
    import Comments from './Comments.svelte';
    import Upvote from './Upvote.svelte';
    import { auth, db } from '../firebaseConfig';  // Assicurati di importare queste variabili
    import { doc, deleteDoc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore"; 
    import { createEventDispatcher } from 'svelte';
    import { deletePostAndRelatedData } from './firebaseHelper';
    const dispatch = createEventDispatcher();


    export let title = '';
    export let content = '';
    export let author = '';
    export let date = '';
    export let initialUpvotes = 0;
    export let postId: string;
    export let authorId = '';
    export let tag = '';

    // Funzione per eliminare il post
    async function deletePost() {
    try {
        // Prima elimina tutti i dati correlati al post (commenti, upvotes, ecc.)
        await deletePostAndRelatedData(postId);
        
        // Poi, elimina il post stesso
        const postRef = doc(db, 'posts', postId);
        await deleteDoc(postRef);

        console.log("Post and related data deleted successfully");
        dispatch('delete');  // Emetti un evento "delete"
    } catch (error) {
        console.error("Error deleting post and related data: ", error);
    }
}


    import { onMount } from 'svelte';

let isFavorited = false;

async function toggleFavorite() {
    if (!auth.currentUser) {
        console.log("Utente non loggato.");
        return;
    }
    
    const userDocRef = doc(db, "users", auth.currentUser.uid);
    
    if (isFavorited) {
        // Rimuovi dai preferiti
        await updateDoc(userDocRef, {
            favoritePosts: arrayRemove(postId)
        });
    } else {
        // Aggiungi ai preferiti
        await updateDoc(userDocRef, {
            favoritePosts: arrayUnion(postId)
        });
    }
    isFavorited = !isFavorited;
}

onMount(async () => {

    // Controlla se il post è nei preferiti dell'utente
    if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const userData = userDoc.data();
        if (userData && userData.favoritePosts && userData.favoritePosts.includes(postId)) {
            isFavorited = true;
        }
    }
});

</script>

<head>
    <link rel="stylesheet" href="/src/styles/post.css">
</head>
<div class="post-container">
    <h2 class="post-title"><a href={`/post/${postId}`} class="post-link">{title}</a></h2>
    <p>{content}</p>
    <div class="post-meta">
        <span>Written by {author} on {date}</span>
        <span class="post-tag">Tag: {tag}</span>
    </div>
    <button class="favorite-button" on:click={toggleFavorite}>
        {#if isFavorited}
            🌟  Rimuovi dai Preferiti
        {:else}
            ⭐ Aggiungi ai Preferiti
        {/if}
    </button>
    <div class="actions-container">
        <div class="comments-container">
            <Comments postId={postId} />
            <!-- Assumi che il menu a discesa dei commenti si trovi all'interno del componente Comments -->
            <!-- <div class="comments-dropdown">Contenuto del menu a discesa</div> -->
        </div>
        <Upvote initialUpvotes={initialUpvotes} postId={postId} />
    </div>
    {#if auth.currentUser && auth.currentUser.uid === authorId}
        <button class="delete-button"on:click={deletePost}>🗑 Elimina</button>
    {/if}
</div>


