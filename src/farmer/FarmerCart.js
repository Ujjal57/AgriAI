import React from 'react';
import Navbar from '../Navbar';

const Cart = () => {
  const [items, setItems] = React.useState([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('agriai_cart');
      const arr = raw ? JSON.parse(raw) : [];
      setItems(Array.isArray(arr) ? arr : []);
    } catch (e) {
      setItems([]);
    }
  }, []);

  const removeItem = (id) => {
    try {
      const raw = localStorage.getItem('agriai_cart');
      let arr = raw ? JSON.parse(raw) : [];
      arr = arr.filter(it => it && it.id !== id);
      localStorage.setItem('agriai_cart', JSON.stringify(arr));
      setItems(arr);
    } catch (e) {
      console.warn(e);
    }
  };

  const total = items.reduce((s, it) => s + (Number(it.price_per_kg || 0) * (Number(it.quantity_kg || 0) || 1)), 0);

  return (
    <div>
      <Navbar />
      <main style={{padding: '6rem 1rem 2rem'}}>
        <div style={{maxWidth:980,margin:'0 auto',background:'#fff',padding:'2rem',borderRadius:8,boxShadow:'0 8px 24px rgba(0,0,0,0.06)'}}>
          <h1 style={{color:'#236902'}}>Cart</h1>
          {items.length === 0 ? (
            <p>Your cart is empty. Add listings from the Farmers/Crops page.</p>
          ) : (
            <div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Cart;
