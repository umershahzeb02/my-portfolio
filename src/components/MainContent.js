import React from 'react';
import About from './about';
import Project from './project';
import Experience from './experience';
import Blog from './blog';

function MainContent() {
  return (
    <div className="main-content">
      <div className="content text-justify">
		<About />
		<Experience />
		<Project />
		<Blog/>

		<p className='p-4'>
			Made by yours truly. Inspired by made from scratch.<br></br>
			The website was inspired by another great UX designer. I used REACT, Tailwind, and PostCSS to make this magic happen.
			-- still some work to be done.
		</p>
	  </div>

	</div>
  );
}

export default MainContent;
