<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { getAuth } from "firebase/auth";
    import { initializeApp } from "firebase/app";
    import { firebaseConfig } from '../firebaseConfig';
    import { db } from '../firebaseConfig';
    import { collection, addDoc, getDoc, doc } from "firebase/firestore";
    import Modal from './Modal.svelte';
  
    let showModal = false;
    let postTag = 'all';
  
    function openPopUp() {
      showModal = true;
    }
  
    function closeModal() {
      showModal = false;
    }
  
    let postContent = '';
    let postTitle = ''; // Nuova variabile per il titolo
    let currentDate = new Date().toLocaleDateString(); // Data attuale
  
    async function createPost() {
    if (auth.currentUser) {
        try {
            // Recupera l'username dell'utente autenticato dal Firestore
            const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
            const userData = userDoc.data();

            if (!userData || !userData.username) {
                console.error("Failed to fetch username for the current user.");
                return;
            }

            const username = userData.username;

            // Crea un nuovo post usando l'username recuperato
            const docRef = await addDoc(collection(db, "posts"), {
                title: postTitle,
                content: postContent,
                author: username,  // Usa l'username scelto dall'utente
                authorId: auth.currentUser.uid,
                date: currentDate,
                upvotes: 0,
                tag: postTag
            });
            console.log("Document written with ID: ", docRef.id);
            postContent = ''; // Resetta il contenuto
            postTitle = ''; // Resetta il titolo
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    } else {
        goto('/auth'); // Reindirizza all'auth se l'utente non è autenticato
    }
    closeModal();
    window.location.reload();
}

  
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    let user: import("@firebase/auth").User | null = null;
  
    onMount(() => {
      auth.onAuthStateChanged((firebaseUser) => {
        user = firebaseUser;
      });
    });
  
    function gotoLogin() {
      goto('/auth');
    }
  
  </script>
  
  {#if user}
      <!-- Se l'utente è autenticato -->
      <div class="new-post-button">
          <button on:click={openPopUp}>New+</button>
      </div>
  
      <Modal show={showModal} close={closeModal}>
          <input type="text" bind:value={postTitle} placeholder="Title" /> <!-- Campo per il titolo -->
          <textarea bind:value={postContent} placeholder="What's on your mind?"></textarea>
          <button on:click={createPost}>Post</button>
          <select bind:value={postTag}>
            <option value="all">Tutti i tags</option>
            <option value="tag1">Tag 1</option>
            <option value="tag2">Tag 2</option>
            <!-- Aggiungi altre opzioni qui -->
        </select>
      </Modal>
  {:else}
      <!-- Se l'utente non è autenticato -->
      <div class="new-post-button">
          <button on:click={gotoLogin}>New+</button>
      </div>
  {/if}
  