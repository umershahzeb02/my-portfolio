import React from 'react';
import Socials from './socials';
import '../style/sidebar.css';

function Sidebar() {
  return (
    <div className=" justify-center sidebar p-4">
    <div className="main-content max-w-1xl mx-auto">
    <div className="content p-4 text-justify">
      <h1 className="text-4xl font-bold tracking-tight text-slate-200 sm:text-5xl">Shahzeb Umer</h1>
      <h2>Computer Science Student</h2>
      <br></br>

      <p>
          I am a passionate Computer Science student with a keen interest in web development and data analysis. I enjoy leveraging technology to create innovative solutions that enhance user experiences. 
          <br></br>
          Currently, I’m working on an AI-driven mental health chatbot as part of my Final Year Project, aiming to make a positive impact on mental well-being.
      </p>
      <br></br>

      <ul className="menu list-none m-0 p-0 hidden sm:block">
        <li className="mb-1.5"><a href="#about">About</a></li>
        <li className="mb-1.5"><a href="#experience">Experience</a></li> 
        <li className="mb-1.5"><a href="#project">Project</a></li> 
        <li className="mb-1.5"><a href="#blog">My Blog</a></li> 

      </ul>

      <br></br>
      <br></br>
      <br></br>

      <div><Socials /></div>
      </div>
      </div>
    </div>
  );
}

export default Sidebar;
