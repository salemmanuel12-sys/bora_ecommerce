import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
} from "firebase/auth";

function getFirebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

function assertFirebaseConfig(config) {
  const required = ["apiKey", "authDomain", "projectId", "appId"];
  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de Firebase: ${missing
        .map((item) => `VITE_FIREBASE_${item.replace(/([A-Z])/g, "_$1").toUpperCase()}`)
        .join(", ")}`
    );
  }
}

function getFirebaseAuth() {
  const config = getFirebaseConfig();
  assertFirebaseConfig(config);

  const app = getApps().length > 0 ? getApps()[0] : initializeApp(config);
  return getAuth(app);
}

export async function loginWithGoogle() {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function loginWithFacebook() {
  const auth = getFirebaseAuth();
  const provider = new FacebookAuthProvider();
  provider.setCustomParameters({ display: "popup" });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}
