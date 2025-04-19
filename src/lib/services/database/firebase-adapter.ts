import { DatabaseEntity } from "./database-adapter"
import { DatabaseAdapter, QueryConstraint } from "./database-adapter"
import {
  CollectionReference,
  Firestore,
  Transaction,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  where,
  orderBy,
  limit,
  startAfter
} from "firebase/firestore"
import { Query } from "firebase/firestore"
import { db } from "../../firebase/config"

export class FirebaseAdapter<T extends DatabaseEntity> implements DatabaseAdapter<T> {
  protected collectionRef: CollectionReference
  protected db: Firestore

  constructor(collectionName: string) {
    this.db = db
    this.collectionRef = collection(db, collectionName)
  }

  async create(data: Omit<T, "id" | "createdAt" | "updatedAt">, transaction?: Transaction): Promise<T> {
    const now = new Date().getTime()

    const safeData = { ...data } as any; // Use type assertion 
    delete safeData.id;
    delete safeData.createdAt;
    delete safeData.updatedAt;

    const docData = {
      ...safeData,
      createdAt: now,
      updatedAt: now
    }

    if (transaction) {
      // If we have a transaction, use it
      const docRef = doc(collection(this.db, this.collectionRef.id))
      transaction.set(docRef, docData)
      return { id: docRef.id, ...docData } as T
    } else {
      // Otherwise use normal addDoc
      const docRef = await addDoc(this.collectionRef, docData)
      return { id: docRef.id, ...docData } as T
    }
  }

  async update(id: string, data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>, transaction?: Transaction): Promise<T> {
    const documentRef = doc(this.collectionRef, id);
    
    // Create a clean copy without reserved fields
    const safeData = { ...data } as any; // Use type assertion 
    delete safeData.id;
    delete safeData.createdAt;
    delete safeData.updatedAt;
    
    // Always update the updatedAt timestamp
    const updateData = {
      ...safeData,
      updatedAt: new Date().getTime()
    };
    
    if (transaction) {
      await transaction.update(documentRef, updateData);
      // Get the document after update
      const docSnap = await getDoc(documentRef)
      return { id: docSnap.id, ...docSnap.data(), ...updateData } as T

    } else {
      await updateDoc(documentRef, updateData);
      // Get the document after update
      const docSnap = await getDoc(documentRef);
      return { id, ...docSnap.data() } as T;
    }
  }

  async getById(id: string, transaction?: Transaction): Promise<T | null> {
    const docRef = doc(this.collectionRef, id)
    
    let docSnap;
    if (transaction) {
      docSnap = await transaction.get(docRef)
    } else {
      docSnap = await getDoc(docRef)
    }
    
    if (!docSnap.exists()) {
      return null
    }
    return { id: docSnap.id, ...docSnap.data() } as T
  }

  async query(constraints: QueryConstraint[]): Promise<T[]> {
    const firebaseConstraints = constraints.map(c => 
      where(c.field, c.operator as any, c.value)
    )
    
    const q = query(this.collectionRef, ...firebaseConstraints)
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[]
  }

  async runTransaction<R>(updateFunction: (transaction: Transaction) => Promise<R>): Promise<R> {
    return runTransaction(this.db, updateFunction)
  }

  /**
   * Create a query with constraints
   */
  createQueryWithConstraints(constraints: QueryConstraint[]): Query<T> {
    const ref = this.collectionRef as CollectionReference<T>
    
    // Apply all query constraints
    const queryConstraints = constraints.map(constraint => {
      const { field, operator, value } = constraint
      return where(field, operator, value)
    })
    
    return query(ref, ...queryConstraints)
  }

  /**
   * Add ordering to a query
   */
  addOrderBy(queryIn: Query<T>, field: string, direction: 'asc' | 'desc'): Query<T> {
    return query(queryIn, orderBy(field, direction))
  }

  /**
   * Add a limit to a query
   */
  addLimit(queryIn: Query<T>, limitIn: number): Query<T> {
    return query(queryIn, limit(limitIn))
  }

  /**
   * Add a startAfter cursor to a query
   */
  async addStartAfter(queryIn: Query<T>, startAfterIn: T): Promise<Query<T>> {
    // For Firestore, we need to get the DocumentSnapshot for the startAfter document
    const docSnap = await getDoc(doc(this.collectionRef, startAfterIn.id))
    
    return query(queryIn, startAfter(docSnap))
  }

  /**
   * Execute a query and return the results
   */
  async executeQuery(queryIn: Query<T>): Promise<T[]> {
    const snapshot = await getDocs(queryIn)
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
  }
}
