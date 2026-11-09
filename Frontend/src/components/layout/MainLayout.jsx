import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const MainLayout = () => {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-crisis-900 text-slate-100">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative bg-crisis-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

