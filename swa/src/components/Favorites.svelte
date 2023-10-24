<script lang="ts">
    import { onMount } from 'svelte';
    import { doc, collection, getDocs, getDoc, limit, query } from "firebase/firestore";
    import { db } from '../firebaseConfig';
    import { getAuth, onAuthStateChanged } from "firebase/auth";

    let favorites: any[] = [];
    let hasMore = false;

    onMount(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userId = user.uid;

            try {
                const userDoc = await getDoc(doc(db, "users", userId));

                if (userDoc.exists() && userDoc.data()?.favoritePosts) {
                    const favoritePostsIds = userDoc.data().favoritePosts;

                    // Limita alla prima mezza dozzina di post preferiti
                    const limitedFavoritePostsIds = favoritePostsIds.slice(0, 6);

                    const postDetailsPromises = limitedFavoritePostsIds.map((postId: string) => {
                        return getDoc(doc(db, "posts", postId));
                    });

                    const postDetailsSnapshots = await Promise.all(postDetailsPromises);

                    favorites = postDetailsSnapshots.map(snapshot => { return {...snapshot.data(),postId: snapshot.id};});
                    if (favoritePostsIds.length > 5) {
                        hasMore = true;
                    }
                }
            } catch (error) {
                console.error("Error fetching favorite posts:", error);
            }
        } else {
            console.error("User not authenticated");
        }
    });

    return () => unsubscribe();
});

</script>

<div class="favorites-list">
    {#each favorites as post}
        <div class="favorite-item">
            <a href="/post/{post.postId}">{post.title}</a>
        </div>
    {/each}
    {#if hasMore}
        <div class="more-link">more...</div>
    {/if}
</div>
