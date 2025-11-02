'use client';

import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { useRouter } from 'next/navigation';
import { FileText, VolumeX, Eye, BookOpen, MessageSquare, Brain, Target } from 'lucide-react';

interface TrainingCardProps {
  id: string;
  title: string;
  description: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  trainingType: 'textual' | 'vocal' | 'visual' | 'ai-calling' | 'social' | 'vc-person';
}

interface TrainingBentoProps {
  trainingType: 'textual' | 'vocal' | 'visual' | 'ai-calling' | 'social' | 'vc-person';
  cards: TrainingCardProps[];
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case 'beginner': return 'rgb(34, 197, 94)'; // green
    case 'intermediate': return 'rgb(234, 179, 8)'; // yellow
    case 'advanced': return 'rgb(239, 68, 68)'; // red
    default: return 'rgb(132, 0, 255)'; // violet
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'textual': return 'rgb(59, 130, 246)'; // blue
    case 'vocal': return 'rgb(168, 85, 247)'; // purple  
    case 'visual': return 'rgb(34, 197, 94)'; // green
    case 'ai-calling': return 'rgb(239, 68, 68)'; // red
    case 'social': return 'rgb(34, 197, 94)'; // green
    default: return 'rgb(132, 0, 255)'; // violet
  }
};

export const TrainingBento: React.FC<TrainingBentoProps> = ({ trainingType, cards }) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll('.training-card');
    if (!cards) return;

    cards.forEach((card: Element) => {
      const cardElement = card as HTMLElement;
      
      // Set initial styles
      cardElement.style.transform = 'perspective(1000px)';
      cardElement.style.transition = 'all 0.3s ease';
      
      const handleMouseMove = (e: MouseEvent) => {
        const rect = cardElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        cardElement.style.transform = 
          `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        
        // Update glow position
        const relativeX = (x / rect.width) * 100;
        const relativeY = (y / rect.height) * 100;
        
        cardElement.style.setProperty('--glow-x', `${relativeX}%`);
        cardElement.style.setProperty('--glow-y', `${relativeY}%`);
        cardElement.style.setProperty('--glow-opacity', '1');
      };
      
      const handleMouseLeave = () => {
        cardElement.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        cardElement.style.setProperty('--glow-opacity', '0');
      };
      
      const handleClick = (e: MouseEvent) => {
        const rect = cardElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Create ripple effect
        const ripple = document.createElement('div');
        ripple.style.cssText = `
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(132, 0, 255, 0.4) 0%, rgba(132, 0, 255, 0.2) 30%, transparent 70%);
          left: ${x - 100}px;
          top: ${y - 100}px;
          pointer-events: none;
          z-index: 1000;
          transform: scale(0);
        `;
        
        cardElement.appendChild(ripple);
        
        gsap.to(ripple, {
          scale: 1,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
          onComplete: () => ripple.remove()
        });
      };
      
      cardElement.addEventListener('mousemove', handleMouseMove);
      cardElement.addEventListener('mouseleave', handleMouseLeave);
      cardElement.addEventListener('click', handleClick);
      
      return () => {
        cardElement.removeEventListener('mousemove', handleMouseMove);
        cardElement.removeEventListener('mouseleave', handleMouseLeave);
        cardElement.removeEventListener('click', handleClick);
      };
    });
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <style jsx>{`
        .training-card {
          background: linear-gradient(135deg, rgba(17, 17, 27, 0.8) 0%, rgba(17, 17, 27, 0.9) 100%);
          position: relative;
          overflow: hidden;
          cursor: pointer;
          backdrop-filter: blur(10px);
        }
        
        .training-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(
            600px circle at var(--glow-x, 50%) var(--glow-y, 50%),
            rgba(132, 0, 255, 0.15) 0%,
            rgba(132, 0, 255, 0.05) 40%,
            transparent 70%
          );
          opacity: var(--glow-opacity, 0);
          transition: opacity 0.3s ease;
        }
        
        .training-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 50%,
            transparent 100%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .training-card:hover::after {
          opacity: 1;
        }
      `}</style>
      
      <div 
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {cards.map((card, index) => {
          const Icon = card.icon;
          const typeColor = getTypeColor(trainingType);
          const difficultyColor = getDifficultyColor(card.difficulty);
          
          return (
            <div
              key={card.id}
              className="training-card border border-border p-8 rounded-3xl"
              onClick={() => router.push(card.href)}
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${typeColor}20`, border: `1px solid ${typeColor}40` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: typeColor }} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {card.label}
                      </span>
                      <div 
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${difficultyColor}20`, 
                          color: difficultyColor,
                          border: `1px solid ${difficultyColor}40`
                        }}
                      >
                        {card.difficulty}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      ⏱️ {card.estimatedTime}
                    </span>
                    <span className="text-xs font-medium" style={{ color: typeColor }}>
                      Start Training →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};