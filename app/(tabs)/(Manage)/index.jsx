import { View, Text, TextInput, TouchableOpacity, FlatList, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { db } from "../../../database/db";
import { translations } from "../../../translations";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

export default function PersonInventory() {

  const { id } = useLocalSearchParams();

  const [lang,setLang] = useState("en");
  const t = translations[lang];

  const [items,setItems] = useState([]);
  const [newItemName,setNewItemName] = useState("");

  const loadItems = () => {
    const result = db.getAllSync("SELECT * FROM items");
    setItems(result);
  };

  useEffect(()=>{
    loadItems();
  },[]);

  const changeLanguage = () => {
    Alert.alert(
      "Language",
      "Choose language",
      [
        {text:"English",onPress:()=>setLang("en")},
        {text:"Français",onPress:()=>setLang("fr")},
        {text:"العربية",onPress:()=>setLang("ar")}
      ]
    );
  };

  const addItemToDB = () => {

    if(!newItemName.trim()){
      Alert.alert(t.emptyName,t.enterItemName);
      return;
    }

    try{

      db.runSync(
        "INSERT INTO items (name) VALUES (?)",
        [newItemName.trim()]
      );

      setNewItemName("");
      loadItems();

    }catch(err){

      Alert.alert(
        t.duplicateItem,
        `${newItemName} ${t.alreadyExists}`
      );

    }

  };

  const addItemToPerson = (itemId) => {

    const existing = db.getFirstSync(
      "SELECT * FROM inventory WHERE personId=? AND itemId=?",
      [id,itemId]
    );

    if(existing){

      db.runSync(
        "UPDATE inventory SET quantity = quantity + 1 WHERE id=?",
        [existing.id]
      );

    }else{

      db.runSync(
        "INSERT INTO inventory (personId,itemId,quantity) VALUES (?,?,1)",
        [id,itemId]
      );

    }

  };

  return (

<View style={{flex:1,padding:20,backgroundColor:"#f9f9f9",paddingVertical:80}}>

<TouchableOpacity
onPress={changeLanguage}
style={{position:"absolute",top:40,right:20,zIndex:10}}
>
<MaterialIcons name="language" size={28} color="#3498db"/>
</TouchableOpacity>

<View style={{
marginBottom:20,
backgroundColor:"#fff",
padding:15,
borderRadius:10,
elevation:2
}}>

<Text style={{fontWeight:"bold",marginBottom:10}}>
{t.addNewItem}
</Text>

<TextInput
placeholder={t.itemName}
value={newItemName}
onChangeText={setNewItemName}
style={{
borderWidth:1,
borderColor:"#ccc",
borderRadius:8,
padding:10,
marginBottom:10
}}
/>

<TouchableOpacity
onPress={addItemToDB}
style={{
backgroundColor:"#3498db",
paddingVertical:12,
borderRadius:8,
alignItems:"center"
}}
>

<Text style={{color:"#fff",fontWeight:"bold"}}>
{t.addItem}
</Text>

</TouchableOpacity>

</View>

<Text style={{fontWeight:"bold",fontSize:16,marginBottom:10}}>
{t.availableItems}
</Text>

<FlatList
data={items}
numColumns={3}
keyExtractor={(i)=>i.id.toString()}
renderItem={({item})=>(

<TouchableOpacity
onPress={()=>addItemToPerson(item.id)}
style={{
flex:1,
margin:5,
backgroundColor:"#fff",
borderRadius:8,
padding:15,
alignItems:"center",
justifyContent:"center",
elevation:2
}}
>

<Text style={{textAlign:"center",fontWeight:"500"}}>
{item.name}
</Text>

</TouchableOpacity>

)}
/>

</View>

  );
}