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

  async create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    const now = new Date().toISOString()
    const docData = {
      ...data,
      createdAt: now,
      updatedAt: now
    }

    const docRef = await addDoc(this.collectionRef, docData)
    return { id: docRef.id, ...docData } as T
  }

  async update(id: string, data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>): Promise<T> {
    const docRef = doc(this.collectionRef, id)
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    }

    await updateDoc(docRef, updateData)
    const docSnap = await getDoc(docRef)
    return { id: docSnap.id, ...docSnap.data() } as T
  }

  async getById(id: string): Promise<T | null> {
    const docRef = doc(this.collectionRef, id)
    const docSnap = await getDoc(docRef)
    
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
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }
}
