import {BrowserRouter, Route,Routes} from "react-router-dom";
import { UserProvider } from './Globaluser.jsx';
import AdminPro from './ProtectedAdmin.jsx';
import ProtectAll from './ProtectedRoutesAll.jsx';
import Asc from '../asc.jsx';
import Dse from '../Dse.jsx';
import Login from "./Login.jsx";

const App=()=> {
  return(
      
      <BrowserRouter>
      <UserProvider>
    <Routes>
      <Route path="/" element={
        <Login/>
      }/>
      <Route path="/login" element={
        <Login/>
      }/>

  <Route path="/user" element={
      <ProtectAll>
        <Asc/>
      </ProtectAll>
  }/>
  <Route path="/admin" element={
    <AdminPro>
    <Dse/>
    </AdminPro>
  }/>
  </Routes>
  </UserProvider>
  </BrowserRouter>
  
);
}
export default App;
