<script lang="ts">
    import { onMount } from 'svelte';
    import Post from './Post.svelte';
    import { getDocs, collection, query, where, orderBy, limit, startAfter } from 'firebase/firestore';
    import { db } from '../firebaseConfig';
    import { writable } from 'svelte/store';
    import { selectedTag, searchTerm } from './selectedTagStore';
    
    const POSTS_PER_PAGE = 10;
    let lastVisiblePost: unknown; 
    
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
    
    const posts = writable<PostType[]>([]);
    const totalPosts = writable<number>(0);
    
    async function getTotalPostCount() {
        const allPostsSnapshot = await getDocs(collection(db, 'posts'));
        totalPosts.set(allPostsSnapshot.size);
    }
    
    async function loadPosts(loadMore = false) {
        let baseQuery;
        if ($selectedTag !== 'all' && $searchTerm) {
            baseQuery = query(collection(db, "posts"), 
                where("tag", "==", $selectedTag),
                where("title", ">=", $searchTerm),
                where("title", "<=", $searchTerm + "\uf8ff")
            );
        } else if ($selectedTag !== 'all') {
            baseQuery = query(collection(db, "posts"), where("tag", "==", $selectedTag));
        } else if ($searchTerm) {
            baseQuery = query(collection(db, "posts"), 
                where("title", ">=", $searchTerm),
                where("title", "<=", $searchTerm + "\uf8ff")
            );
        } else {
            baseQuery = collection(db, "posts");
        }
    
        let postQuery = query(baseQuery, orderBy("date", "desc"), limit(POSTS_PER_PAGE));
    
        if (loadMore && lastVisiblePost) {
            postQuery = query(baseQuery, orderBy("date", "desc"), startAfter(lastVisiblePost), limit(POSTS_PER_PAGE));
        }
    
        const querySnapshot = await getDocs(postQuery);
        const newPosts = querySnapshot.docs.map(doc => ({
            ...doc.data(),
            postId: doc.id
        })) as PostType[];
    
        lastVisiblePost = querySnapshot.docs[querySnapshot.docs.length - 1];
    
        if (loadMore) {
            posts.update(oldPosts => [...oldPosts, ...newPosts]);
        } else if(!loadMore && !$posts.length) { 
            posts.set(newPosts);
        }
    }
    
    onMount(() => {
        getTotalPostCount();
        loadPosts();
    
        const unsubscribeTag = selectedTag.subscribe(() => {
            loadPosts();
        });
    
        const unsubscribeSearchTerm = searchTerm.subscribe(() => {
            loadPosts();
        });
    
        return () => {
            unsubscribeTag();
            unsubscribeSearchTerm();
        };
    });
    </script>
    
    <div class="feed">
    <h2>Global Feed</h2>
    {#each $posts as post}
    <Post 
    title={post.title}
    content={post.content.slice(0, 100)}{post.content.length > 100 ? '...' : ''}
    author={post.author} 
    date={post.date} 
    initialUpvotes={post.upvotes} 
    postId={post.postId}
    authorId={post.authorId}
    tag={post.tag}
    on:delete={() => loadPosts()}
    />
    {/each}
    {#if $posts.length < $totalPosts}
    <button on:click={() => loadPosts(true)}>Carica più post</button>
    {/if}
    </div>
    