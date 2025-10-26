import React, { useState, useEffect } from 'react';
import './ImageSlideshow.css';

const images = [
  require('./assets/1.jpeg'),
  require('./assets/2.jpg'),
  require('./assets/3.png'),
];

const ImageSlideshow = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="slideshow-container">
      <img src={images[current]} alt="slide" className="slideshow-image" />
      <div className="slideshow-dots">
        {images.map((_, idx) => (
          <span
            key={idx}
            className={current === idx ? 'dot active' : 'dot'}
            onClick={() => setCurrent(idx)}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default ImageSlideshow;
