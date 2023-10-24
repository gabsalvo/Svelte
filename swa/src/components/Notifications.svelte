<script lang="ts">
    import { onMount } from 'svelte';
    import { getAuth } from "firebase/auth";
    import { doc, getDocs, collection, query, where, writeBatch, updateDoc, deleteDoc } from "firebase/firestore";
    import { auth, db } from '../firebaseConfig';
    import { goto } from '$app/navigation';

    let notifications: any[] = [];
    let showNotifications = false;

    onMount(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                fetchNotifications();
            }
        });
        return () => unsubscribe();
    });

    async function fetchNotifications() {
        if (auth.currentUser) {
            const userId = auth.currentUser.uid;
            try {
                const querySnapshot = await getDocs(query(collection(db, "notifications"), where("userId", "==", userId), where("isRead", "==", false)));
                notifications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error("Error fetching notifications:", error);
            }
        }
    }

    function toggleNotifications() {
        fetchNotifications();
        showNotifications = !showNotifications;
    }

   
    async function markNotificationAsRead(notificationId: string) {
    const notifRef = doc(db, 'notifications', notificationId);
    try {
        // Prima contrassegna la notifica come letta
        await updateDoc(notifRef, { isRead: true });
        
        // Poi, elimina la notifica dal database
        await deleteDoc(notifRef);
        
        fetchNotifications();  // Refresh the notifications after deletion
    } catch (error) {
        console.error("Error processing notification:", error);
    }
}
async function handleNotificationClick(notificationId: string, postId: string) {
        await markNotificationAsRead(notificationId);
        goto(`/post/${postId}`);  // Reindirizza l'utente alla pagina del post
    }
    async function clearAllNotifications() {
        if (auth.currentUser) {
            const userId = auth.currentUser.uid;
            const batch = writeBatch(db);
            try {
                const querySnapshot = await getDocs(query(collection(db, "notifications"), where("userId", "==", userId), where("isRead", "==", false)));
                querySnapshot.docs.forEach(doc => {
                    // Set each notification as read
                    batch.update(doc.ref, { isRead: true });
                    // Then delete the notification
                    batch.delete(doc.ref);
                });
                await batch.commit();
                fetchNotifications();  // Refresh the notifications after the changes
            } catch (error) {
                console.error("Error processing all notifications:", error);
            }
        }
    }
</script>

<div class="notifications-section">
    <button on:mousedown|stopPropagation={toggleNotifications}>🔔 {notifications.length}</button>
    {#if showNotifications}
        <div class="notification-list">
            {#each notifications as notification (notification.id)}
                <div 
                    class="notification-item" 
                    on:mousedown={() => handleNotificationClick(notification.id, notification.postId)} 
                    role="button" 
                    tabindex="0" 
                >
                    {notification.message}
                </div>
            {/each}
            {#if notifications.length}
            <div class="clear-all-section">
                <button on:mousedown|stopPropagation={clearAllNotifications} tabindex="0">Clear All</button>
            </div>
        {/if}
        </div>
    {/if}
</div>
