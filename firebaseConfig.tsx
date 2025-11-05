// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

// Pour TypeScript, vous pouvez laisser la configuration comme un objet typé
const firebaseConfig = {
  apiKey: "AIzaSyDkbu7rfrrWNwxEgoXIVzshxwKLvMsrg_g",
  authDomain: "ansyd-lab.firebaseapp.com",
  projectId: "ansyd-lab",
  storageBucket: "ansyd-lab.firebasestorage.app",
  messagingSenderId: "531057961347",
  appId: "1:531057961347:web:056dcefa5b0ab85f1deeb6",
  measurementId: "G-WW9ZT4ZHFG",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
auth.useDeviceLanguage();

export { auth };
export const functions = getFunctions(app, "europe-west3");
export default app;
