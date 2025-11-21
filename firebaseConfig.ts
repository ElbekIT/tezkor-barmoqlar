
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Siz taqdim etgan konfiguratsiya
const firebaseConfig = {
  apiKey: "AIzaSyDhduFMuWaND-XMkQiPGBCeaCgDgGSX-OQ",
  authDomain: "byby-sakra.firebaseapp.com",
  databaseURL: "https://byby-sakra-default-rtdb.firebaseio.com",
  projectId: "byby-sakra",
  storageBucket: "byby-sakra.firebasestorage.app",
  messagingSenderId: "329736043051",
  appId: "1:329736043051:web:ea3a4aa283744775a1086e",
  measurementId: "G-YB2TK0JEMS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth (Ro'yxatdan o'tish) ni sozlash
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Analytics
export const analytics = getAnalytics(app);

// Realtime Database
export const db = getDatabase(app);
