<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { getAuth} from "firebase/auth";
  import { initializeApp } from "firebase/app";
  import { firebaseConfig } from '../firebaseConfig';

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  /**
	 * @type {import("@firebase/auth").User | null}
	 */
  let user = null;

  onMount(() => {
      auth.onAuthStateChanged((firebaseUser) => {
          user = firebaseUser;
      });
  });

    function logout() {
        auth.signOut().then(() => {
            console.log("Logged out successfully");
        }).catch(error => {
            console.error("Error logging out:", error);
        });
    }

    function gotoLogin() {
        goto('/auth');
    }

    function gotoRegister() {
        goto('/auth');
    }
</script>

{#if user}
    <!-- Se l'utente è autenticato -->
    <button on:click={logout}>Logout</button>
{:else}
    <!-- Se l'utente non è autenticato -->
    <button on:click={gotoLogin}>Login</button>
    <button on:click={gotoRegister}>Register</button>
{/if}
