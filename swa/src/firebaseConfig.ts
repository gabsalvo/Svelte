import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";


export const firebaseConfig = {
  apiKey: "AIzaSyB4kHzKHCgkGVFTlmw_u27j9qTmI580au4",
  authDomain: "swaw-ddf67.firebaseapp.com",
  projectId: "swaw-ddf67",
  storageBucket: "swaw-ddf67.appspot.com",
  messagingSenderId: "690581674482",
  appId: "1:690581674482:web:17c9a63b041a9a5eaaf36b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
