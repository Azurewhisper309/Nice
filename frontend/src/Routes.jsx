/* Updated App.jsx */
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CRMProvider } from "./CrmContext";
import FormPage from "./UserFormPage";
import Dashboard from "./Dashboard";
import RecoveryPage from "./RecoveryPage";
import EditFormPage from "./EditForm";

function routes() {
  return (
    <CRMProvider>
      <Router>
        <Routes>
          <Route path="/" element={<FormPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/recovery" element={<RecoveryPage />} />
          <Route path="/edit/:id" element={<EditFormPage />} />
          </Routes>
      </Router>
    </CRMProvider>
  );
}

export default routes;