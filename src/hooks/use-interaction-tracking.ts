import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface InteractionData {
  path: string;
  component: string;
  action: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class InteractionTracker {
  private static instance: InteractionTracker;
  private interactions: InteractionData[] = [];
  private maxInteractions: number = 1000;
  private isProcessing: boolean = false;

  private constructor() {
    // Load saved interactions from localStorage
    try {
      const saved = localStorage.getItem('interaction_data');
      if (saved) {
        this.interactions = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load interaction data:', error);
    }

    // Set up periodic processing
    if (typeof window !== 'undefined') {
      setInterval(() => this.processInteractions(), 60000); // Process every minute
    }
  }

  static getInstance(): InteractionTracker {
    if (!InteractionTracker.instance) {
      InteractionTracker.instance = new InteractionTracker();
    }
    return InteractionTracker.instance;
  }

  trackInteraction(data: Omit<InteractionData, 'timestamp'>) {
    const interaction: InteractionData = {
      ...data,
      timestamp: Date.now()
    };

    this.interactions.push(interaction);

    // Keep only the last maxInteractions
    if (this.interactions.length > this.maxInteractions) {
      this.interactions = this.interactions.slice(-this.maxInteractions);
    }

    // Save to localStorage
    try {
      localStorage.setItem('interaction_data', JSON.stringify(this.interactions));
    } catch (error) {
      console.error('Failed to save interaction data:', error);
    }
  }

  private processInteractions() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Analyze patterns
      const patterns = this.analyzePatterns();
      
      // Store optimization suggestions
      localStorage.setItem('optimization_suggestions', JSON.stringify(patterns));

      // Clean up old data
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      this.interactions = this.interactions.filter(i => i.timestamp > thirtyDaysAgo);
      
      localStorage.setItem('interaction_data', JSON.stringify(this.interactions));
    } catch (error) {
      console.error('Failed to process interactions:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private analyzePatterns() {
    const patterns: Record<string, { count: number; avgDuration?: number }> = {};

    // Group by path and action
    this.interactions.forEach(interaction => {
      const key = `${interaction.path}:${interaction.action}`;
      if (!patterns[key]) {
        patterns[key] = { count: 0 };
      }
      patterns[key].count++;

      if (interaction.duration) {
        patterns[key].avgDuration = (patterns[key].avgDuration || 0) * (patterns[key].count - 1) / patterns[key].count + 
          interaction.duration / patterns[key].count;
      }
    });

    return Object.entries(patterns)
      .map(([key, value]) => ({
        key,
        ...value,
        frequency: value.count / this.interactions.length
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  getOptimizationSuggestions() {
    try {
      const suggestions = localStorage.getItem('optimization_suggestions');
      return suggestions ? JSON.parse(suggestions) : [];
    } catch {
      return [];
    }
  }
}

export function useInteractionTracking(componentName: string) {
  const location = useLocation();
  const startTimeRef = useRef<number>();
  const tracker = InteractionTracker.getInstance();

  useEffect(() => {
    return () => {
      if (startTimeRef.current) {
        const duration = Date.now() - startTimeRef.current;
        tracker.trackInteraction({
          path: location.pathname,
          component: componentName,
          action: 'view',
          duration
        });
      }
    };
  }, [location.pathname, componentName]);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  return {
    trackAction: (action: string, metadata?: Record<string, any>) => {
      tracker.trackInteraction({
        path: location.pathname,
        component: componentName,
        action,
        metadata
      });
    },
    getOptimizationSuggestions: () => tracker.getOptimizationSuggestions()
  };
}