<!-- Sidebar.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { getAuth } from "firebase/auth";
    import { getDoc, doc } from "firebase/firestore";
    import { initializeApp } from "firebase/app";
    import { firebaseConfig } from '../firebaseConfig';
    import { db } from '../firebaseConfig';
    import HomeActionHandler from './HomeActionHandler.svelte';
    import NewPost from "./newPost.svelte";
    import Notifications from './Notifications.svelte';
    import Favorites from './Favorites.svelte'

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    let username = '';

    onMount(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        username = userDoc.data().username || '';
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            }
        });
    });
</script>

<head>
    <link rel="stylesheet" href="/src/styles/home.css">
</head>

<div class="left-sidebar">
    <a href={`/user/${username}`}>{username}</a>
    <Notifications />
    <h3>Iscrizione alla Newsletter</h3>
    <HomeActionHandler />
</div>

<div class="right-sidebar">
    <h3>Preferiti</h3>
    <Favorites />
    <h3>Tags Popolari</h3>
    <NewPost />
</div>
