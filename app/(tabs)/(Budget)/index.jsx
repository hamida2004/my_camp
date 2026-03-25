import { View, Text, TextInput, TouchableOpacity, FlatList, Alert } from "react-native";
import { useState, useEffect } from "react";
import { db } from "../../../database/db";
import { translations } from "../../../translations";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

export default function Budget() {

  const [lang,setLang] = useState("en");
  const t = translations[lang];

  const [people,setPeople] = useState([]);
  const [desc,setDesc] = useState("");
  const [amounts,setAmounts] = useState({});

  const refreshPeople = () => {
    const result = db.getAllSync("SELECT * FROM people");
    setPeople(result);
  };

  useEffect(()=>{
    refreshPeople();
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

  const getTotalExpenses = (personId) =>
    db.getFirstSync(
      "SELECT SUM(amount) as total FROM expenses WHERE personId=?",
      [personId]
    )?.total || 0;

  const addExpense = (personId,initial) => {

    const expense = Number(amounts[personId] || 0);

    if(isNaN(expense) || expense <= 0){

      Alert.alert(
        t.invalidAmount,
        t.enterPositive
      );

      return;
    }

    const remaining = initial - getTotalExpenses(personId);

    if(expense > remaining){

      Alert.alert(
        t.insufficientBudget,
        `${t.maxAllowed}: ${remaining} DA`
      );

      return;
    }

    db.runSync(
      "INSERT INTO expenses (personId,description,amount) VALUES (?,?,?)",
      [personId,desc,expense]
    );

    setDesc("");
    setAmounts(prev=>({...prev,[personId]:""}));

    refreshPeople();
  };

  const getColor = (remaining,initial) => {

    const ratio = remaining / initial;

    if(ratio > 0.7) return "#2ecc71";
    if(ratio > 0.2) return "#e67e22";

    return "#e74c3c";
  };

  return (

<View style={{flex:1}}>

<TouchableOpacity
onPress={changeLanguage}
style={{position:"absolute",top:40,right:20,zIndex:10}}
>
<MaterialIcons name="language" size={28} color="#3498db"/>
</TouchableOpacity>

<FlatList
style={{flex:1,padding:20,backgroundColor:"#f9f9f9", paddingVertical:80}}
data={people}
keyExtractor={(p)=>p.id.toString()}
showsVerticalScrollIndicator={false}

renderItem={({item})=>{

const remaining = item.money - getTotalExpenses(item.id);

return(

<View
style={{
padding:20,
marginBottom:20,
backgroundColor:"#fff",
borderRadius:12,
shadowColor:"#000",
shadowOpacity:0.05,
shadowRadius:5,
elevation:2
}}
>

<Text style={{fontSize:18,fontWeight:"bold",marginBottom:5}}>
{item.name}
</Text>

<Text style={{marginBottom:10}}>
{t.initialBudget}: {item.money} DA —{" "}
<Text style={{color:getColor(remaining,item.money),fontWeight:"bold"}}>
{t.remaining}: {remaining} DA
</Text>
</Text>

<TextInput
placeholder={t.expenseDescription}
value={desc}
onChangeText={setDesc}
style={{
borderWidth:1,
borderColor:"#ccc",
padding:10,
borderRadius:8,
marginBottom:8
}}
/>

<TextInput
placeholder={t.amount}
keyboardType="numeric"
value={amounts[item.id] || ""}
onChangeText={(val)=>setAmounts(prev=>({...prev,[item.id]:val}))}
style={{
borderWidth:1,
borderColor:"#ccc",
padding:10,
borderRadius:8,
marginBottom:10
}}
/>

<TouchableOpacity
onPress={()=>addExpense(item.id,item.money)}
style={{
backgroundColor:"#3498db",
paddingVertical:12,
borderRadius:8,
alignItems:"center"
}}
>

<Text style={{color:"#fff",fontWeight:"bold"}}>
{t.addExpense}
</Text>

</TouchableOpacity>

</View>

);
}}

 />

</View>

  );
}