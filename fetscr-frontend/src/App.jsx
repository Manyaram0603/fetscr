import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/Signup";
import Home from "./components/Home";
import Results from "./components/Results";
import SubscriptionPlans from "./components/SubscriptionPlans";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/results" element={<Results />} />
        <Route path="/pricing" element={<SubscriptionPlans />} />
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/signup" element={<SignUpPage/>} />
      </Routes>
    </Router>
  );
}

export default App;
