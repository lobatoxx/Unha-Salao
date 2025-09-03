// src/firebase.js

// Importações do Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, query, addDoc, doc, deleteDoc, updateDoc, Timestamp, getDocs, where, arrayUnion, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Sua configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDUJBdk2K5n9645h7FlC8xVTWk1BHjY8Q0",
    authDomain: "mi-galvao.firebaseapp.com",
    projectId: "mi-galvao",
    storageBucket: "mi-galvao.firebasestorage.app",
    messagingSenderId: "791002859648",
    appId: "1:791002859648:web:5e9a2ba629efd2516efe65",
    measurementId: "G-ELHH1TQ32R"
};

// Inicialização
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ EXPORTE TUDO AQUI (com setDoc adicionado)
export {
    auth,
    db,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    deleteUser,
    collection,
    onSnapshot,
    query,
    addDoc,
    doc,
    deleteDoc,
    updateDoc,
    Timestamp,
    getDocs,
    where,
    arrayUnion,
    getDoc,
    setDoc // <-- Adicionado
};
