<script lang="ts">
      import { goto } from '$app/navigation';
    import { collection, addDoc, query, where, getDocs, getDoc, doc } from "firebase/firestore";
    import { auth, db } from '../firebaseConfig';
    import { onMount } from 'svelte';
    import { createNotification } from './notificationHelpers';

    export let postId: string;
    let postAuthorId: string | null = null; // 1. Dichiarazione e inizializzazione di postAuthorId
    let showComments = false;
    let commentText = '';
    let replyText = '';
    let comments: any[] = [];
    let replyToCommentId: string | null = null;
    let showModal = false;
    let showModalReply = false

    onMount(async () => {
        console.log("Comments Component - postId:", postId);
        const postDoc = await getDoc(doc(db, "posts", postId));
        const postData = postDoc.data();
        if (postData) {
            postAuthorId = postData.authorId;
        }
        loadComments(); // Carica i commenti dopo aver ottenuto postAuthorId
    });

    async function loadComments() {
        const q = query(collection(db, "comments"), where("postId", "==", postId));
        const querySnapshot = await getDocs(q);
        comments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    function toggleComments() {
        showComments = !showComments;
        if (showComments) {
            loadComments();
        }
    }

    async function addComment(parentId: string | null = null, text: string) {
        console.log("Inizio Add Comment");
        if (auth.currentUser && postAuthorId) {
            try {
                const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
                const userData = userDoc.data();

                if (!userData || !userData.username) {
                    console.error("Failed to fetch username for the current user.");
                    return;
                }

                const username = userData.username;
                await addDoc(collection(db, "comments"), {
                    text: text,
                    author: username,
                    postId: postId,
                    postAuthorId: postAuthorId, // 3. Utilizzo di postAuthorId
                    parentCommentId: parentId
                });
                console.log("Commento aggiunto con successo");
                commentText = '';
                replyText = '';
                loadComments();

                const notificationMessage = `${username} ha commentato il tuo post.`;
                await createNotification(postAuthorId, notificationMessage, 'comment', postId);
                console.log("Notifica creata con successo");
            } catch (e) {
                console.error("Error adding comment: ", e);
            }
        }
    }

    function gotoLogin() {
        goto('/auth');
    }
</script>

<!-- Sezione Commenti -->
<div class="comments-section">
    <button on:click={toggleComments}>Comments</button>

    {#if showComments}
        {#each comments as comment (comment.id)}
            {#if !comment.parentCommentId}
                <div class="comment">
                    <span>{comment.author}: </span>
                    {comment.text}
                    <button on:click={() => {
                        replyToCommentId = comment.id;
                        showModalReply = true;
                    }}>Rispondi</button>

                    <!-- Visualizza risposte -->
                    {#each comments as reply (reply.id)}
                        {#if reply.parentCommentId === comment.id}
                            <div class="reply">
                                <span>{reply.author}: </span>
                                {reply.text}
                            </div>
                        {/if}
                    {/each}
                </div>
            {/if}
        {/each}

        {#if showModalReply}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="modal-background" on:click={() => showModalReply = false}>
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div class="modal-content" on:click={e => e.stopPropagation()}>
                    <textarea class="reply-textarea" bind:value={replyText} placeholder="Add a reply..."></textarea>
                    <button on:click={() => {
                        addComment(replyToCommentId, replyText);
                        showModalReply = false;
                        replyText = '';
                    }}>Rispondi</button>
                </div>
            </div>
        {/if}

        {#if auth.currentUser}
        <button on:click={() => showModal = true}>Add Comment</button>

        {#if showModal} 
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="modal-background" on:click={() => showModal = false}>
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div class="modal-content" on:click={e => e.stopPropagation()}>
                    <textarea class="comment-textarea" bind:value={commentText} placeholder="Add a comment..."></textarea>
                    <button on:click={() => {
                        addComment(null, commentText);
                        showModal = false;
                    }}>Post</button>
                </div>
            </div>
        {/if}
    {:else}
        <button on:click={gotoLogin}>Login to comment</button>
    {/if}
{/if}
</div>
