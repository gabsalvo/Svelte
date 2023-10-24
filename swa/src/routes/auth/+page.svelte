<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
  import { initializeApp } from "firebase/app";
  import { db, firebaseConfig } from '../../firebaseConfig';
  import { getDoc, setDoc, doc, runTransaction } from "firebase/firestore";


  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  let user: any = null;
  let username = "";
  let usernameGoogle = "";
  let registerEmail = "";
  let registerPassword = "";
  let loginEmail = "";
  let loginPassword = "";


  onMount(() => {
      auth.onAuthStateChanged((firebaseUser) => {
          user = firebaseUser;
      });
  });

  async function isUsernameTaken(username: string) {
    const usernameDoc = await getDoc(doc(db, "usernames", username));
    console.log("Username Document Data:", usernameDoc.data());
    return usernameDoc.exists(); // Modifica qui: usa exists() come funzione
  }

  const registerWithEmail = async () => {
    try {
        // Verifica se il nome utente è già preso
        if (await isUsernameTaken(username)) {
            console.error("Username is already taken (before transaction)");
            return;
        }

        // Qui creiamo un nuovo utente con email e password
        const userCredential = await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
        const user = userCredential.user;

        // Usa una transazione per garantire che il nome utente sia ancora univoco
        await runTransaction(db, async (transaction) => {
            const usernameDoc = doc(db, "usernames", username);
            const snapshot = await transaction.get(usernameDoc);

            // Se il nome utente è già preso durante la transazione, lancia un errore
            if (snapshot.exists()) {
                throw new Error("Username is already taken (during transaction)");
            }

            // Altrimenti, aggiungi il nome utente alla collection dei nomi utenti
            transaction.set(usernameDoc, { uid: user.uid });
        });

        // Salva ulteriori informazioni sull'utente, se necessario
        await setDoc(doc(db, "users", user.uid), {
            username: username,
            email: registerEmail,
            bio: "",  // campo bio vuoto
            profile_image: ""
        });

        gotoHome();
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error registering:", error.message);
        }
    }
};



  function gotoHome() {
        goto('/');
    }

    const registerWithGoogle = async () => {
    try {
        // Autenticazione con Google
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;

        // Verifica se il nome utente è già preso
        if (await isUsernameTaken(usernameGoogle)) {
            console.error("Username is already taken");
            return;
        }

        // Usa una transazione per garantire che il nome utente sia ancora univoco
        await runTransaction(db, async (transaction) => {
            const usernameDoc = doc(db, "usernames", usernameGoogle);
            const snapshot = await transaction.get(usernameDoc);

            // Se il nome utente è già preso durante la transazione, lancia un errore
            if (snapshot.exists()) {
                throw new Error("Username is already taken (during transaction)");
            }

            // Altrimenti, aggiungi il nome utente alla collection dei nomi utenti
            transaction.set(usernameDoc, { uid: user.uid });
        });

        // Salva ulteriori informazioni sull'utente, se necessario
        await setDoc(doc(db, "users", user.uid), {
            username: usernameGoogle,
            email: user.email,
            bio: "",  // campo bio vuoto
            profile_image: ""
        });

        gotoHome();
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error logging in with Google:", error.message);
        }
    }
};

const loginWithGoogle = async () => {
    try {
        // Autenticazione con Google
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;

        // Verifica se il nome utente è già preso
        gotoHome();
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error logging in with Google:", error.message);
        }
    }
};


  const loginWithEmail = async () => {
      try {
          await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
          gotoHome();
      } catch (error) {
          if (error instanceof Error) {
              console.error("Error logging in:", error.message);
          }
      }
  };

</script>

<!-- Form di registrazione -->
<h2>Registrazione Email</h2>
<input bind:value={username} placeholder="Username" />
<input bind:value={registerEmail} placeholder="Email" />
<input type="password" bind:value={registerPassword} placeholder="Password" />
<button on:click={registerWithEmail}>Registrati</button>

<!-- Form di accesso -->
<h2>Login Email</h2>
<input bind:value={loginEmail} placeholder="Email" />
<input type="password" bind:value={loginPassword} placeholder="Password" />
<button on:click={loginWithEmail}>Login</button>

<h2>Register Google</h2>
<input bind:value={usernameGoogle} placeholder="Username" />
<button on:click={registerWithGoogle}>Login with Google</button>

<h2>Login Google</h2>
<button on:click={loginWithGoogle}>Login with Google</button>

