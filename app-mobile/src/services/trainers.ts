import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export type Trainer = {
  id?: string;
  name: string;
  specialty: string;
  price: number;
  verified: boolean;
  clients: number;
};

const COLL_MAIN = "trainers";
const COLL_FALLBACK = "trainer";

// READ
export async function listTrainers(): Promise<Trainer[]> {
  try {
    let snap = await getDocs(collection(db, COLL_MAIN));
    if (snap.empty) {
      // try legacy singular collection
      snap = await getDocs(collection(db, COLL_FALLBACK));
    }
    return snap.docs.map((d) => {
      const raw = d.data() as any;
      return {
        id: d.id,
        name: raw.name ?? raw.Name ?? "",
        specialty: raw.specialty ?? raw.Type ?? "",
        price: Number(raw.price ?? raw.Price ?? 0),
        verified: Boolean(raw.verified ?? raw.Verified ?? false),
        clients: Number(raw.clients ?? raw.Clients ?? 0),
      };
    });
  } catch (e: any) {
    console.error("[Firestore:listTrainers] code:", e?.code, "message:", e?.message, e);
    throw e;
  }
}

// CREATE
export async function createTrainer(data: Omit<Trainer, "id">): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COLL_MAIN), data);
    return ref.id;
  } catch (e: any) {
    console.error("[Firestore:createTrainer] code:", e?.code, "message:", e?.message, e);
    throw e;
  }
}

// UPDATE
export async function updateTrainer(
  id: string,
  data: Partial<Omit<Trainer, "id">>
): Promise<void> {
  try {
    await updateDoc(doc(db, COLL_MAIN, id), data);
  } catch (e: any) {
    console.error("[Firestore:updateTrainer] code:", e?.code, "message:", e?.message, e);
    throw e;
  }
}

// DELETE
export async function deleteTrainer(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLL_MAIN, id));
  } catch (e: any) {
    console.error("[Firestore:deleteTrainer] code:", e?.code, "message:", e?.message, e);
    throw e;
  }
}

// Optional realtime
export function subscribeTrainers(
  onData: (rows: Trainer[]) => void,
  onError?: (e: any) => void
) {
  const q = query(collection(db, COLL_MAIN));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => {
        const raw = d.data() as any;
        return {
          id: d.id,
          name: raw.name ?? raw.Name ?? "",
          specialty: raw.specialty ?? raw.Type ?? "",
          price: Number(raw.price ?? raw.Price ?? 0),
          verified: Boolean(raw.verified ?? raw.Verified ?? false),
          clients: Number(raw.clients ?? raw.Clients ?? 0),
        };
      });
      onData(rows);
    },
    (e) => {
      console.error("[Firestore:subscribeTrainers] code:", e?.code, "message:", e?.message, e);
      onError?.(e);
    }
  );
}
