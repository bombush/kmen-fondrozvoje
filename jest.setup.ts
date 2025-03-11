// Optional: configure or set up a testing framework before each test
// For example, if you're using Enzyme:
// import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  runTransaction: jest.fn(async (db, callback) => callback()),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

// Mock date for consistent testing
const mockDate = new Date('2023-01-01T00:00:00Z');
global.Date = class extends Date {
  constructor(date) {
    if (date) {
      return super(date);
    }
    return mockDate;
  }
}; 