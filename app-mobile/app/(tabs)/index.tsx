// app/(tabs)/index.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Modal,
  TextInput,
  Button,
  TouchableOpacity,
} from "react-native";
import {
  Trainer,
  listTrainers,
  createTrainer,   // ✅ correct names
  updateTrainer,
  deleteTrainer,
  // subscribeTrainers, // optional
} from "../../src/services/trainers";

type Form = Omit<Trainer, "id">;

const emptyForm: Form = {
  name: "",
  specialty: "",
  price: 30,
  verified: false,
  clients: 0,
};

export default function Index() {
  const [rows, setRows] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);

  // --- Fetch trainers on mount ---
  useEffect(() => {
    (async () => {
      try {
        const data = await listTrainers();
        setRows(data);
      } catch (e) {
        console.error(e);
        setError("Could not load trainers.");
      } finally {
        setLoading(false);
      }
    })();

    // Optional realtime
    // const unsub = subscribeTrainers(
    //   (data) => { setRows(data); setLoading(false); },
    //   (err) => { console.error(err); setError("Realtime error."); }
    // );
    // return () => unsub();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (t: Trainer) => {
    setEditingId(t.id!);
    setForm({
      name: t.name,
      specialty: t.specialty,
      price: t.price,
      verified: t.verified,
      clients: t.clients,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    try {
      const clean: Form = {
        ...form,
        price: Number(form.price),
        clients: Number(form.clients),
        verified: !!form.verified,
      };

      if (editingId) {
        await updateTrainer(editingId, clean);
        setRows((prev) =>
          prev.map((r) => (r.id === editingId ? { id: editingId, ...clean } : r))
        );
      } else {
        await createTrainer(clean);
        const refreshed = await listTrainers();
        setRows(refreshed);
      }
      setModalOpen(false);
    } catch (e) {
      console.error("Save failed:", e);
      alert("Save failed, see console for details.");
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteTrainer(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Available Trainers</Text>
        <Button title="Add" onPress={openCreate} />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {rows.length === 0 ? (
        <Text>No trainers found. Add one to begin.</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => i.id!}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text>Specialty: {item.specialty}</Text>
                <Text>Price: €{item.price}/hr</Text>
                <Text>{item.verified ? "✅ Verified" : "❌ Not Verified"}</Text>
                <Text>Clients: {item.clients}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => remove(item.id!)} style={styles.actionBtnDel}>
                  <Text style={styles.actionText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      {/* Modal: Create/Edit */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingId ? "Edit Trainer" : "Add Trainer"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Name"
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Specialty"
              value={form.specialty}
              onChangeText={(t) => setForm({ ...form, specialty: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Price (€/hr)"
              keyboardType="numeric"
              value={String(form.price)}
              onChangeText={(t) => setForm({ ...form, price: Number(t || 0) })}
            />
            <TextInput
              style={styles.input}
              placeholder="Clients"
              keyboardType="numeric"
              value={String(form.clients)}
              onChangeText={(t) => setForm({ ...form, clients: Number(t || 0) })}
            />

            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => setForm({ ...form, verified: !form.verified })}
                style={[styles.checkbox, form.verified && styles.checkboxOn]}
              />
              <Text style={{ marginLeft: 8 }}>Verified</Text>
            </View>

            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setModalOpen(false)} />
              <Button title={editingId ? "Update" : "Create"} onPress={submit} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f7f7f7" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 24, fontWeight: "700" },
  error: { color: "#b91c1c", marginTop: 6 },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    flexDirection: "row",
  },
  name: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  actions: { justifyContent: "space-around", marginLeft: 12 },
  actionBtn: { backgroundColor: "#3b82f6", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  actionBtnDel: { backgroundColor: "#ef4444", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  actionText: { color: "#fff", fontWeight: "600" },
  modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)", justifyContent: "center", padding: 16 },
  modalCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginTop: 8 },
  checkbox: { width: 22, height: 22, borderWidth: 1, borderColor: "#aaa", borderRadius: 4 },
  checkboxOn: { backgroundColor: "#10b981" },
  modalActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
});
