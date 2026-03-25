import { View, Text, TouchableOpacity, FlatList, ScrollView, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { db } from "../../../database/db";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import { translations } from "../../../translations";
import { dbEvents } from "../../../events/events"; // import your event emitter

export default function PersonInventory() {

  const { id } = useLocalSearchParams();

  const [lang,setLang] = useState("en");
  const t = translations[lang];

  const [person, setPerson] = useState(null);
  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [expenses, setExpenses] = useState(0);

  const refreshData = () => {
    const p = db.getFirstSync("SELECT * FROM people WHERE id=?", [id]);
    setPerson(p || null);

    const allItems = db.getAllSync("SELECT * FROM items");
    setItems(allItems);

    const inv = db.getAllSync(
      "SELECT inventory.id as inventoryId, inventory.quantity, inventory.itemId, items.name FROM inventory JOIN items ON inventory.itemId = items.id WHERE personId=?",
      [id]
    );
    setInventory(inv);

    const totalExpenses = db.getFirstSync(
      "SELECT SUM(amount) as total FROM expenses WHERE personId=?",
      [id]
    )?.total || 0;
    setExpenses(totalExpenses);
  };

  // Refresh data initially and when the DB updates
  useEffect(() => {
    refreshData();
    const listener = () => refreshData();
    dbEvents.on("dbUpdated", listener);
    return () => dbEvents.off("dbUpdated", listener);
  }, []);

  if (!person)
    return <Text style={{ padding: 20 }}>Person not found</Text>;

  const remaining = person.money - expenses;

  const getColor = (remaining, initial) => {
    const ratio = remaining / initial;
    if (ratio > 0.7) return "#2ecc71";
    if (ratio > 0.2) return "#e67e22";
    return "#e74c3c";
  };

  const changeLanguage = () => {
    Alert.alert(
      "Language",
      "Choose language",
      [
        { text:"English", onPress:()=>setLang("en") },
        { text:"Français", onPress:()=>setLang("fr") },
        { text:"العربية", onPress:()=>setLang("ar") }
      ]
    );
  };

  const addItem = (itemId) => {
    const existing = db.getFirstSync(
      "SELECT * FROM inventory WHERE personId=? AND itemId=?",
      [id, itemId]
    );

    if (existing) {
      db.runSync(
        "UPDATE inventory SET quantity = quantity + 1 WHERE id=?",
        [existing.id]
      );
    } else {
      db.runSync(
        "INSERT INTO inventory (personId,itemId,quantity) VALUES (?,?,1)",
        [id, itemId]
      );
    }

    // Emit DB update so any screen listening can refresh
    dbEvents.emit("dbUpdated");
  };

  const removeOne = (inventoryId, quantity) => {
    if (quantity <= 1) {
      Alert.alert(
        t.delete,
        "Quantity is 1. Remove item?",
        [
          { text: t.cancel, style: "cancel" },
          {
            text: t.delete,
            style: "destructive",
            onPress: () => {
              db.runSync("DELETE FROM inventory WHERE id=?", [inventoryId]);
              dbEvents.emit("dbUpdated");
            },
          },
        ]
      );
    } else {
      db.runSync(
        "UPDATE inventory SET quantity = quantity - 1 WHERE id=?",
        [inventoryId]
      );
      dbEvents.emit("dbUpdated");
    }
  };

  const deleteItem = (inventoryId) => {
    Alert.alert(
      t.delete,
      "Remove item completely?",
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.delete,
          style: "destructive",
          onPress: () => {
            db.runSync("DELETE FROM inventory WHERE id=?", [inventoryId]);
            dbEvents.emit("dbUpdated");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:"#f9f9f9" }}>
      {/* LANGUAGE ICON */}
      <TouchableOpacity
        onPress={changeLanguage}
        style={{
          position:"absolute",
          top:40,
          right:40,
          zIndex:20
        }}
      >
        <MaterialIcons name="language" size={28} color="#3498db"/>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ padding:20 }}>
        {/* PERSON INFO */}
        <View
          style={{
            padding:20,
            backgroundColor:"#fff",
            borderRadius:12,
            marginBottom:20,
            shadowColor:"#000",
            shadowOpacity:0.05,
            shadowRadius:5,
            elevation:2
          }}
        >
          <Text style={{ fontSize:22, fontWeight:"bold", marginBottom:5 }}>
            {person.name}
          </Text>

          <Text style={{ color:"#555", marginBottom:5 }}>
            {t.birthDate}: {person.birthDate}
          </Text>

          <Text style={{ color:"#555", marginBottom:5 }}>
            {t.initialBudget}: {person.money} DA
          </Text>

          <Text style={{ color:getColor(remaining, person.money), fontWeight:"bold" }}>
            {t.remaining}: {remaining} DA
          </Text>
        </View>

        {/* INVENTORY */}
        <Text style={{ fontWeight:"bold", fontSize:16, marginBottom:10 }}>
          {t.inventory}
        </Text>

        {inventory.length === 0 ? (
          <Text style={{ marginBottom:10, color:"#888" }}>
            {t.noItems}
          </Text>
        ) : (
          <View style={{ marginBottom: 20 }}>
            {inventory.map((item) => (
              <View
                key={item.inventoryId}
                style={{
                  flexDirection:"row",
                  justifyContent:"space-between",
                  alignItems:"center",
                  padding:12,
                  marginBottom:8,
                  backgroundColor:"#fff",
                  borderRadius:10,
                  shadowColor:"#000",
                  shadowOpacity:0.03,
                  shadowRadius:4,
                  elevation:1
                }}
              >
                <Text style={{ flex:1 }}>
                  {item.name} — {t.quantity}: {item.quantity}
                </Text>

                <View style={{ flexDirection:"row" }}>
                  <TouchableOpacity
                    onPress={()=>removeOne(item.inventoryId,item.quantity)}
                    style={{ marginRight:10, padding:6, borderRadius:5 }}
                  >
                    <MaterialIcons name="remove" size={20} color="orange"/>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={()=>deleteItem(item.inventoryId)}
                    style={{ padding:6, borderRadius:5 }}
                  >
                    <MaterialIcons name="delete" size={20} color="red"/>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ADD ITEM */}
        <Text style={{ fontWeight:"bold", fontSize:16, marginBottom:10 }}>
          Add Item
        </Text>

        <FlatList
          data={items}
          horizontal
          keyExtractor={(i)=>i.id.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={()=>addItem(item.id)}
              style={{
                paddingVertical:12,
                paddingHorizontal:18,
                marginRight:10,
                backgroundColor:"#3498db",
                borderRadius:8,
                shadowColor:"#000",
                shadowOpacity:0.05,
                shadowRadius:4,
                elevation:2,
                maxHeight:48,
                justifyContent:"center",
                alignItems:"center"
              }}
            >
              <Text style={{ color:"#fff", fontWeight:"bold" }}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />

      </ScrollView>
    </SafeAreaView>
  );
}