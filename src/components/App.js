import React from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import '../style/App.css';

function App() {
  
  return (
        <div className="bg-slate-900 leading-relaxed text-slate-400 antialiased selection:bg-teal-300 selection:text-teal-900 min-h-screen flex items-start">
          <div className="flex flex-col md:flex-row w-full max-w-screen-xl mx-auto mt-12 ">
            {/* Sidebar */}
            <div className="w-full md:w-1/2 p-4 ">
              <Sidebar />
            </div>
            {/* Main Content */}
            <div className="w-full md:w-1/2 p-4">
              <MainContent />
            </div>
          </div>
    </div>

  );
}

export default App;
