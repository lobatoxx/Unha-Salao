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
    updateDoc,
    setDoc
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
 * Regista um novo usuário (profissional).
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<void>}
 */
export const registerUser = async (email, password) => {
    const q = query(collection(db, 'professionals'), where("email", "==", email));
    const professionalSnapshot = await getDocs(q);

    if (professionalSnapshot.empty) {
        throw new Error("E-mail não autorizado. Fale com o administrador do salão.");
    }

    const professionalDoc = professionalSnapshot.docs[0];
    if (professionalDoc.data().userId) {
        throw new Error("Este profissional já possui uma conta registada. Tente fazer login.");
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 1. Vincula o ID do Auth ao perfil do profissional
        const professionalRef = doc(db, 'professionals', professionalDoc.id);
        await updateDoc(professionalRef, {
            userId: user.uid
        });

        // 2. Cria o documento de "índice" na coleção 'users' para as regras de segurança
        const userIndexRef = doc(db, 'users', user.uid);
        await setDoc(userIndexRef, {
            salonId: professionalDoc.data().salonId,
            professionalId: professionalDoc.id, // ID do documento do profissional
            role: 'professional' // Define o papel do usuário
        });

    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            throw new Error("Este e-mail já está em uso. Tente fazer login.");
        }
        if (error.code === 'auth/weak-password') {
            throw new Error("A senha deve ter no mínimo 6 caracteres.");
        }
        throw new Error("Ocorreu um erro desconhecido ao registar.");
    }
};

