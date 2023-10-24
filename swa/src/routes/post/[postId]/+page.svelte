<script lang="ts">
    import { onMount } from 'svelte';
    import { getDoc, doc } from "firebase/firestore";
    import { db, auth } from '../../../firebaseConfig';
    import { page } from '$app/stores';
    import Post from '../../../components/CurrentPost.svelte';


    interface PostType {
        authorId: string;
        title: string;
        content: string;
        author: string;
        date: string;
        upvotes: number;
        postId: string;
        tag: string;
    }

    let post: PostType | null = null;
    let user: any = null;

    onMount(() => {
    const unsubscribe = auth.onAuthStateChanged(firebaseUser => {
        user = firebaseUser;
    });

    const loadPost = async () => {
        const currentPostId = $page.params.postId;
        console.log("Post ID:", currentPostId);
        const postDoc = await getDoc(doc(db, "posts", currentPostId));
        
        if (postDoc.exists()) {
            post = postDoc.data() as PostType;
        } else {
            console.error(`Post with ID ${currentPostId} not found.`);
        }
    }

    // Carica il post subito dopo aver montato il componente
    loadPost();

    // Restituisci la funzione di pulizia
    return () => {
        unsubscribe();
    };
});

</script>

{#if post}
<Post 
    title={post.title}
    content={post.content}
    author={post.author}
    date={post.date}
    initialUpvotes={post.upvotes}
    currentpostId={$page.params.postId}
    authorId={post.authorId}
    tag={post.tag}
/>
<!-- Mostra ulteriori dettagli del post qui se necessario -->
{:else}
    <p>Caricamento post...</p>
{/if}
