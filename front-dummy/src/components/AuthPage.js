import React, { useState } from "react";
import Login from "../pages/Login";
import Register from "../pages/Register";
import "../pages/Auth.css";

function AuthPage() {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="screen">
      <div className={`card ${isFlipped ? "flipped" : ""}`}>
        
        <div className="face front">
          <Login switchToRegister={() => setIsFlipped(true)} />
        </div>

        <div className="face back">
          <Register switchToLogin={() => setIsFlipped(false)} />
        </div>

      </div>
    </div>
  );
}

export default AuthPage;