<script lang="ts">
    export let initialUpvotes = 0;
    export let postId: string;
    

    import { arrayRemove, arrayUnion, doc, getDoc, runTransaction, setDoc, updateDoc } from "firebase/firestore";
    import { auth, db } from '../firebaseConfig';
    import { writable } from 'svelte/store';
	import { onMount } from "svelte";
    import { createNotification } from './notificationHelpers';
    

    let upvotes = writable(initialUpvotes);
    let hasUpvoted = false;

    onMount(async () => {
        if(postId) {
        const upvotesDoc = await getDoc(doc(db, "userUpvotes", postId));
        if (upvotesDoc.exists()) {
            const data = upvotesDoc.data();
            hasUpvoted = data.users && data.users.includes(auth.currentUser?.uid || "");
        }

        const postDoc = await getDoc(doc(db, "posts", postId));
        if (postDoc.exists()) {
            const postData = postDoc.data();
            upvotes.set(postData.upvotes || 0);
        }
    }});

    async function handleUpvote() {
        const postRef = doc(db, 'posts', postId);
        const upvotesRef = doc(db, "userUpvotes", postId);
        const currentUid = auth.currentUser?.uid || "";

        if (!currentUid) {
            console.error("No user ID found");
            return;
        }

        await runTransaction(db, async (transaction) => {
            const postSnapshot = await transaction.get(postRef);
            if (!postSnapshot.exists()) {
                throw new Error("Post does not exist!");
            }

            const currentUpvotes = postSnapshot.data()?.upvotes || 0;
            const upvotesSnapshot = await transaction.get(upvotesRef);
            const usersArray = upvotesSnapshot.data()?.users || [];

            const newUpvotes = hasUpvoted ? currentUpvotes - 1 : currentUpvotes + 1;

            transaction.update(postRef, { upvotes: newUpvotes });

            if (hasUpvoted) {
                if (upvotesSnapshot.exists()) {
                    transaction.update(upvotesRef, { users: arrayRemove(currentUid) });
                }
            } else {
                if (!upvotesSnapshot.exists()) {
                    transaction.set(upvotesRef, { users: [currentUid] });
                } else if (!usersArray.includes(currentUid)) {
                    transaction.update(upvotesRef, { users: arrayUnion(currentUid) });
                }
            }
            if (!hasUpvoted) {
                const postDoc = await getDoc(doc(db, "posts", postId));
                if (postDoc.exists()) {
                    const postData = postDoc.data();
                    const postAuthorId = postData?.authorId;
                    const currentUser = auth.currentUser;
                    if (currentUser) {  // Ora non controlliamo se l'UID corrisponde all'autore del post
                        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                        const userData = userDoc.data();
                        const username = userData?.username || "a user";
                        const notificationMessage = `Your post has been upvoted by ${username}.`;
                        await createNotification(postAuthorId, notificationMessage, 'upvote', postId);
                        console.log("Notification sent successfully");
                    }
                }
            }


        });

        const updatedPostSnapshot = await getDoc(postRef);
        upvotes.set(updatedPostSnapshot.data()?.upvotes || 0);

        hasUpvoted = !hasUpvoted;
    }
</script>

<button class="upvote-button" on:click={handleUpvote}>
    {hasUpvoted ? '∇ Remove Upvote' : '∆ Upvote'} ({$upvotes})
</button>
