
import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  glowing?: boolean;
}

const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationFrameId = useRef<number>(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas to full window size
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Re-initialize particles when window resizes
      initializeParticles();
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    // Initialize particles with better colors and distribution
    function initializeParticles() {
      const particleCount = Math.min(Math.floor(window.innerWidth * 0.08), 150); // More particles
      particles.current = [];
      
      // Enhanced color palette for particles
      const colors = [
        'rgba(59, 130, 246, opacity)', // Primary blue
        'rgba(96, 165, 250, opacity)', // Light blue
        'rgba(37, 99, 235, opacity)',  // Darker blue
        'rgba(147, 197, 253, opacity)', // Very light blue
        'rgba(29, 78, 216, opacity)'   // Royal blue
      ];
      
      for (let i = 0; i < particleCount; i++) {
        const colorIndex = Math.floor(Math.random() * colors.length);
        const baseOpacity = Math.random() * 0.5 + 0.1;
        const color = colors[colorIndex].replace('opacity', baseOpacity.toString());
        const isGlowing = Math.random() > 0.9; // 10% of particles will glow
        
        particles.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + (isGlowing ? 2 : 0.5), // Bigger for glowing particles
          speedX: (Math.random() - 0.5) * 0.4,
          speedY: (Math.random() - 0.5) * 0.4,
          opacity: baseOpacity,
          color: color,
          glowing: isGlowing
        });
      }
    }
    
    // Animation loop with improved effects
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.current.forEach((particle, index) => {
        // Update position with slight acceleration
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Add slight random movement for more natural flow
        particle.x += (Math.random() - 0.5) * 0.3;
        particle.y += (Math.random() - 0.5) * 0.3;
        
        // Wrap around screen edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        
        // Draw particle with optional glow effect
        ctx.beginPath();
        
        // Add glow effect for special particles
        if (particle.glowing) {
          const glow = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 2
          );
          
          // Fix: Extract color base and add opacity properly
          const rgbaMatch = particle.color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
          if (rgbaMatch) {
            const [_, r, g, b, a] = rgbaMatch;
            glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
            glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          } else {
            // Fallback
            glow.addColorStop(0, particle.color);
            glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          }
          
          ctx.fillStyle = glow;
          ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Draw the actual particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
        
        // Connect particles within a certain distance
        connectParticles(particle, index);
      });
      
      // Request next frame
      animationFrameId.current = requestAnimationFrame(animate);
    }
    
    // Draw lines between nearby particles with improved aesthetics
    function connectParticles(particle: Particle, index: number) {
      const connectionDistance = 200; // Increased max distance for connection
      
      for (let i = index + 1; i < particles.current.length; i++) {
        const other = particles.current[i];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < connectionDistance) {
          // Calculate opacity based on distance - smoother gradient
          const opacity = (1 - distance / connectionDistance) * 0.2;
          
          // Draw connecting line with gradient
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          
          // Use gradient for smoother connections
          const gradient = ctx.createLinearGradient(
            particle.x, particle.y, other.x, other.y
          );
          
          // Fix: Extract color components properly for both particles
          const colorRegex = /rgba\((\d+),\s*(\d+),\s*(\d+)/;
          
          const particleColorMatch = particle.color.match(colorRegex);
          const otherColorMatch = other.color.match(colorRegex);
          
          if (particleColorMatch && otherColorMatch) {
            gradient.addColorStop(0, `rgba(${particleColorMatch[1]}, ${particleColorMatch[2]}, ${particleColorMatch[3]}, ${opacity})`);
            gradient.addColorStop(1, `rgba(${otherColorMatch[1]}, ${otherColorMatch[2]}, ${otherColorMatch[3]}, ${opacity})`);
          } else {
            // Fallback to a safe default
            gradient.addColorStop(0, `rgba(96, 165, 250, ${opacity})`);
            gradient.addColorStop(1, `rgba(59, 130, 246, ${opacity})`);
          }
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
    
    // Start animation
    initializeParticles();
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" 
      style={{ opacity: 0.8 }}
    />
  );
};

export default ParticleBackground;
