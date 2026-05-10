import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthPage from "./components/AuthPage";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import Category from "./pages/Category";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/"                  element={<Home />} />
        <Route path="/login"             element={<Login />} />
        <Route path="/register"          element={<Register />} />
        <Route path="/auth"              element={<AuthPage />} />
        <Route path="/wishlist"          element={<Wishlist />} />
        <Route path="/cart"              element={<Cart />} />
        <Route path="/category/:slug"    element={<Category />} />
      </Routes>
    </Router>
  );
}

export default App;