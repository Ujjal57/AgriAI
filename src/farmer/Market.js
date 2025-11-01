import React from 'react';
import Navbar from '../Navbar';

export default function Market(){
  return (
    <div>
      <Navbar />
      <main style={{padding: '6rem 1rem 2rem'}}>
        <div style={{maxWidth: 1100, margin:'0 auto', background:'#fff', padding:'1.25rem', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.06)'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap'}}>
            <h1 style={{color:'#236902', margin:0}}>Market</h1>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              <input placeholder="Search crop" style={{padding:8, border:'1px solid #e5e5e5', borderRadius:6}} />
              <select style={{padding:8, border:'1px solid #e5e5e5', borderRadius:6}}>
                <option>All Categories</option>
                <option>Food Crops</option>
                <option>Fruits and Vegetables</option>
                <option>Masalas</option>
              </select>
            </div>
          </div>
          <div style={{marginTop:12, display:'grid', gridTemplateColumns:'repeat(4, minmax(220px,1fr))', gap:12}}>
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} style={{border:'1px solid #eee', borderRadius:8, padding:12}}>
                <div style={{height:120, background:'#f4f4f4', borderRadius:6}} />
                <div style={{marginTop:8, fontWeight:800, color:'#236902'}}>Sample Crop {i}</div>
                <div style={{display:'flex', justifyContent:'space-between', marginTop:6}}>
                  <div>₹{(50+i).toLocaleString('en-IN')} / kg</div>
                  <div>{(1000-i*10).toLocaleString('en-IN')} kg</div>
                </div>
                <div style={{marginTop:8, display:'flex', justifyContent:'center'}}>
                  <button style={{background:'#236902', color:'#fff', border:'none', borderRadius:6, padding:'6px 10px'}}>View</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
