import React, { useEffect, useState } from "react";
// Firebase removed
import Navbar from "./Navbar";
import "./App.css";

function ContactAdmin() {
  // Firebase removed: contacts and loading state removed

  // Firebase removed: no fetching contacts

  return (
    <div className="contact-admin-page" style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: "2rem auto", background: "#fff", borderRadius: "1.5rem", boxShadow: "0 2px 16px #e6e6e6", padding: "2rem" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1.5rem" }}>Contact Messages</h2>
        <div>Firebase has been removed. No messages to display.</div>
      </div>
    </div>
  );
}

export default ContactAdmin;
