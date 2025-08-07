export interface TripRecommendation {
  destination: string;
  duration: string;
  estimatedCost: number;
  highlights: string[];
  whyYoullLoveIt: string;
  confidence: number;
}

export const createTripPrompt = (recommendation: TripRecommendation): string => {
  const highlightsText = recommendation.highlights.map(h => `• ${h}`).join('\n');
  
  return `I want to plan a trip to ${recommendation.destination} for ${recommendation.duration}. 
  
Here are the details:
- Destination: ${recommendation.destination}
- Duration: ${recommendation.duration}
- Estimated Cost: $${recommendation.estimatedCost}
- Why I'll love it: ${recommendation.whyYoullLoveIt}
- Confidence: ${recommendation.confidence}%

Top activities I'm interested in:
${highlightsText}

Please create a detailed day-by-day itinerary for this trip, including specific venues, restaurants, and activities. Make it practical and bookable.`;
}; 