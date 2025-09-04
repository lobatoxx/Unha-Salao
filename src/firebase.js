// src/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, query, addDoc, doc, deleteDoc, updateDoc, Timestamp, getDocs, where, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDUJBdk2K5n9645h7FlC8xVTWk1BHjY8Q0",
    authDomain: "mi-galvao.firebaseapp.com",
    projectId: "mi-galvao",
    storageBucket: "mi-galvao.firebasestorage.app",
    messagingSenderId: "791002859648",
    appId: "1:791002859648:web:5e9a2ba629efd2516efe65",
    measurementId: "G-ELHH1TQ32R"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// EXPORTE TUDO AQUI
export {
    auth,
    db,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
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
    getDoc,
    setDoc
};

