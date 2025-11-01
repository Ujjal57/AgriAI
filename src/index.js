
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import './global-scrollbar-hide.css';
import App from './App';
import Farmer from './Farmer';
import Contact from './Contact';
import LoginProfile from './LoginProfile';
import ContactAdmin from './ContactAdmin';
import FarmerDashboard from './FarmerDashboard';
import BuyerDashboard from './farmer/BuyerDashboard';
import AdminDashboard from './AdminDashboard';
import ProfileUpdate from './ProfileUpdate';
import Market from './farmer/Market';
import History from './History';
import FarmerHistory from './farmer/FarmerHistory';
import MyCrops from './farmer/MyCrops';
import Cart from './Cart';
import FarmerCart from './farmer/FarmerCart';
import MyDeals from './MyDeals';
import reportWebVitals from './reportWebVitals';
import Footer from './Footer';
import Chatbot from './Chatbot';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
  <Route path="/" element={<App />} />
  <Route path="/farmer" element={<Farmer />} />
    <Route path="/dashboard/farmer" element={<FarmerDashboard />} />
    <Route path="/dashboard/buyer" element={<BuyerDashboard />} />
    <Route path="/dashboard/admin" element={<AdminDashboard />} />
  <Route path="/contact" element={<Contact />} />
  <Route path="/profile" element={<ProfileUpdate />} />
  <Route path="/login" element={<LoginProfile />} />
  <Route path="/history" element={<History />} />
  <Route path="/farmer/history" element={<FarmerHistory />} />
  <Route path="/market" element={<Market />} />
  <Route path="/my-deals" element={<MyDeals />} />
  <Route path="/my-crops" element={<MyCrops />} />
  <Route path="/cart" element={<Cart />} />
  <Route path="/farmer/cart" element={<FarmerCart />} />
  <Route path="/admin/contacts" element={<ContactAdmin />} />
      </Routes>
      <Footer />
      <Chatbot />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
