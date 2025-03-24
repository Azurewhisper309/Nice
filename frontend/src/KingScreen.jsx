import axios from "axios";
import { useEffect, useState } from "react"

function KingScreen() {
    const [king,setKing]= usetate({nameOf:"",takeNumber:""});
    const [loading, setLoading] = useState(true);
    const [error,setError]=useState(null);
    useEffect(()=>{
        const getAll=async()=>{
        try{
        const resi=await axios.get("https://localhost:3000/forms/king");
        setKing(old=>({...old,nameOf:resi.takeNumber,numberOf:resi.total,id:resi.id}));
        setLoading(false);
        }
        catch(error){
            console.log(error);
        }
        
    };
    getAll();
    },[]);
    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
  return (
    <div>
      <h1>טבלת המלך</h1>
      <ul>
      {king.map((theMember)=>(
        <li key={theMember.id}>

            <span>{theMember.nameOf}</span>
            <span>{theMember.numberOf}</span>
            <span>{theMember.id}</span>
        </li>

    ))}
    `</ul>
    </div>
  )
}

export default KingScreen
