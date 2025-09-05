// src/firebase.js

import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from "firebase/firestore";

// ✅ Configuração do Firebase (substitua pelos seus dados reais do Firebase console)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// ✅ Inicializar app e serviços
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Provider para login com Google
const googleProvider = new GoogleAuthProvider();

// ====== Funções de Autenticação ======
export function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export function logout() {
  return signOut(auth);
}

export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// ====== Funções Firestore Genéricas ======

// Obter referência de coleção
export function getCollectionRef(path) {
  return collection(db, path);
}

// Obter documento por ID
export async function getDocument(path, id) {
  const ref = doc(db, path, id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Obter todos documentos de uma coleção
export async function getAllDocuments(path) {
  const colRef = collection(db, path);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Criar documento (com ID automático)
export async function createDocument(path, data) {
  const colRef = collection(db, path);
  return await addDoc(colRef, { ...data, createdAt: serverTimestamp() });
}

// Criar/Atualizar documento (com ID fixo)
export async function setDocument(path, id, data) {
  const ref = doc(db, path, id);
  return await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// Atualizar documento existente
export async function updateDocument(path, id, data) {
  const ref = doc(db, path, id);
  return await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

// Deletar documento
export async function deleteDocument(path, id) {
  const ref = doc(db, path, id);
  return await deleteDoc(ref);
}

// Fazer consulta com filtros
export async function queryDocuments(path, conditions = [], orderByField = null, limitCount = null) {
  let q = collection(db, path);

  if (conditions.length) {
    q = query(q, ...conditions.map(c => where(c.field, c.op, c.value)));
  }

  if (orderByField) {
    q = query(q, orderBy(orderByField, "desc"));
  }

  if (limitCount) {
    q = query(q, limit(limitCount));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ✅ Exportações principais
export { auth, db };
