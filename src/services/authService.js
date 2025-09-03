// src/services/authService.js

import {
    auth,
    db,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    query,
    collection,
    where,
    getDocs,
    doc,
    updateDoc
} from '../firebase.js';

/**
 * Realiza o login do usuário.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<UserCredential>}
 */
export const loginUser = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

/**
 * Realiza o logout do usuário atual.
 * @returns {Promise<void>}
 */
export const logoutUser = () => {
    return signOut(auth);
};

/**
 * Registra um novo usuário (profissional).
 * A lógica verifica se o e-mail do profissional já existe e está autorizado.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<void>}
 */
export const registerUser = async (email, password) => {
    // 1. Verifica se o e-mail pertence a um profissional pré-cadastrado no sistema
    const q = query(collection(db, 'professionals'), where("email", "==", email));
    const professionalSnapshot = await getDocs(q);

    if (professionalSnapshot.empty) {
        throw new Error("E-mail não autorizado. Fale com o administrador do salão.");
    }

    // 2. Garante que este profissional ainda não tenha uma conta vinculada
    const professionalDoc = professionalSnapshot.docs[0];
    if (professionalDoc.data().userId) {
        throw new Error("Este profissional já possui uma conta registrada. Tente fazer login.");
    }

    // 3. Cria o usuário no Firebase Auth
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 4. Vincula o ID do usuário recém-criado ao seu perfil de profissional no Firestore
        const professionalRef = doc(db, 'professionals', professionalDoc.id);
        await updateDoc(professionalRef, {
            userId: user.uid
        });

    } catch (error) {
        // Personaliza a mensagem de erro para o usuário final
        if (error.code === 'auth/email-already-in-use') {
            throw new Error("Este e-mail já está em uso. Tente fazer login.");
        }
        if (error.code === 'auth/weak-password') {
            throw new Error("A senha deve ter no mínimo 6 caracteres.");
        }
        throw new Error("Ocorreu um erro desconhecido ao registrar.");
    }
};