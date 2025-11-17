import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC<{ isAdmin: boolean; onLogout: () => void }>
  = ({ isAdmin, onLogout }) => {
  return (
    <nav className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center">
      <div className="font-bold text-lg">CRM Dashboard</div>
      <div className="flex gap-4 items-center">
        <Link to="/" className="hover:underline">Home</Link>
        {isAdmin && (
          <Link to="/admin" className="hover:underline">Admin Panel</Link>
        )}
        <button onClick={onLogout} className="bg-red-500 px-3 py-1 rounded hover:bg-red-600">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
