import React from 'react';

const Experience = () => {
  return (
    <section id="experience" className="p-4">
      <h1 className="text-lg block md:hidden font-extrabold text-slate-200">Experience</h1>
      <p class="text-justify">
      As a dedicated Computer Science student, I have honed my skills through various projects and coursework. 
      I possess a strong foundation in web development, including proficiency in HTML, CSS, and JavaScript, 
      alongside experience with frameworks like React and Tailwind CSS. 
      My passion for data analysis is reflected in my proficiency with tools such as Python and data visualization libraries. 
      Currently, I am working on an AI-driven mental health chatbot for my Final Year Project, where I am applying my technical skills to create impactful solutions.
    </p>
    <h3 class="text-xl font-semibold mt-6">Key Skills:</h3>
    <ul class="list-disc list-inside px-4">
      <li>Web Development (HTML, CSS, JavaScript, MERN)</li>
      <li>React and Tailwind CSS</li>
      <li>Data Analysis (Python, Data Visualization)</li>
      <li>Git and Version Control</li>
    </ul>
    </section>
  );
};

export default Experience;
