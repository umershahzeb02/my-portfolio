import React from 'react';

const Project = () => {
  const projectData = [
    {
      title: 'Portfolio Website',
      description: 'Developed a personal portfolio website to showcase my skills, experiences, and projects. The website is built using HTML, CSS, and JavaScript, and features a responsive design to ensure a great user experience across devices.',
      technologies: 'HTML, CSS, JavaScript, MERN Stack',
    },
    {
      title: 'Job Fair Management System',
      description: 'Created a Job Fair Management System for a Software Engineering course utilizing .NET and C#. This system streamlines the process of organizing job fairs, enabling efficient registration and management of participants and employers.',
      technologies: '.NET, C#',
    },
    {
      title: 'Café Cashier Management',
      description: 'Designed a Café Cashier Management system for a Database Management Systems (DBMS) course using SQL. This project aimed to simplify the cash management process in cafés, including order tracking and financial reporting.',
      technologies: 'SQL',
    },
    {
      title: 'Final Year Project (FYP): AI-Driven Mental Health Chatbot',
      description: 'Currently developing an AI-driven mental health chatbot as my Final Year Project. The chatbot aims to provide empathetic support and resources for individuals seeking mental health assistance. It leverages natural language processing and machine learning techniques to enhance user interaction and deliver personalized responses.',
      technologies: 'Flutter, Python, Firebase, MongoDB, Docker, Llama AI, ',
    },
  ];

  return (
    <section id="project" className="p-4">
      <h1 className="text-lg block md:hidden font-extrabold text-slate-200">Projects</h1>

      
      <p class="text-justify px-4 mb-4">
      Throughout my academic journey, I have had the opportunity to work on various projects that have enhanced my technical skills and fostered my creativity. Here are some notable projects I have undertaken:
    </p>
    
    <div className="space-y-6">
        {projectData.map((project, index) => (
          <div key={index} className="p-6 border border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-semibold">{project.title}</h3>
            <p className="mt-2">{project.description}</p>
            <p className="mt-2 font-medium">Technologies: {project.technologies}</p>
          </div>
        ))}
      </div>
      
    </section>
  );
};

export default Project;
