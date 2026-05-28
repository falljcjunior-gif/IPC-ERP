/**
 * Type declarations for firestore.service.js
 * Enables TypeScript consumers to get full type-safety without rewriting the service.
 */

import type { FieldValue, Timestamp, Unsubscribe } from 'firebase/firestore';
import type { BaseDocument } from '../types/erp';

// ── Filter types ─────────────────────────────────────────────────────────────

export type WhereFilter =
  | [string, FirestoreOperator, unknown]
  | { field: string; operator: FirestoreOperator; value: unknown };

export type FirestoreOperator =
  | '=='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | 'in'
  | 'not-in'
  | 'array-contains'
  | 'array-contains-any';

export interface ListOptions {
  filters?:       WhereFilter[];
  orderByField?:  string;
  limitTo?:       number;
  descending?:    boolean;
  includeDeleted?: boolean;
  skipEntityFilter?: boolean;
}

export interface BatchOperation {
  collection: string;
  id:         string;
  op:         'set' | 'update' | 'delete' | 'permanentDelete';
  data?:      Record<string, unknown>;
}

// ── FirestoreServiceError ────────────────────────────────────────────────────

export class FirestoreServiceError extends Error {
  code: string;
  constructor(code: string, message: string);
}

// ── FirestoreService ─────────────────────────────────────────────────────────

export declare const FirestoreService: {
  getDocument<T extends BaseDocument = BaseDocument>(
    collectionName: string,
    documentId: string
  ): Promise<(T & { id: string }) | null>;

  listDocuments<T extends BaseDocument = BaseDocument>(
    collectionName: string,
    options?: ListOptions
  ): Promise<(T & { id: string })[]>;

  createDocument<T = Record<string, unknown>>(
    collectionName: string,
    data: T,
    schema?: object | null
  ): Promise<{ id: string }>;

  addDocument<T = Record<string, unknown>>(
    collectionName: string,
    data: T
  ): Promise<{ id: string }>;

  setDocument<T = Record<string, unknown>>(
    collectionName: string,
    documentId: string,
    data: T,
    merge?: boolean
  ): Promise<void>;

  updateDocument<T = Partial<Record<string, unknown>>>(
    collectionName: string,
    documentId: string,
    updates: T,
    schema?: object | null
  ): Promise<void>;

  deleteDocument(collectionName: string, documentId: string): Promise<void>;

  permanentDelete(collectionName: string, documentId: string): Promise<void>;

  subscribeToCollection<T extends BaseDocument = BaseDocument>(
    collectionName: string,
    options: ListOptions,
    onData: (docs: (T & { id: string })[]) => void,
    onError?: (err: FirestoreServiceError) => void
  ): Unsubscribe;

  subscribeToCollectionGroup<T extends BaseDocument = BaseDocument>(
    collectionGroupId: string,
    options: ListOptions,
    onData: (docs: (T & { id: string })[]) => void,
    onError?: (err: FirestoreServiceError) => void
  ): Unsubscribe;

  subscribeToDocument<T extends BaseDocument = BaseDocument>(
    collectionName: string,
    documentId: string,
    onData: (doc: (T & { id: string }) | null) => void,
    onError?: (err: FirestoreServiceError) => void
  ): Unsubscribe;

  batchWrite(operations: BatchOperation[]): Promise<void>;

  arrayUnion(...values: unknown[]): FieldValue;
  arrayRemove(...values: unknown[]): FieldValue;
  increment(n: number): FieldValue;
  serverTimestamp(): FieldValue;
};

export declare const serverTimestamp: () => FieldValue;

// ── StorageService ────────────────────────────────────────────────────────────

export declare const StorageService: {
  uploadFile(file: File, path: string): Promise<string>;
};
