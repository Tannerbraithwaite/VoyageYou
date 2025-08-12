export interface TripRecommendation {
  destination: string;
  reason: string;
  duration: string;
  estimatedCost: number;
  highlights: string[];
  whyYoullLoveIt: string;
  confidence: number;
}

export const createTripPrompt = (recommendation: TripRecommendation): string => {
  const highlightsText = recommendation.highlights.map(h => `• ${h}`).join('\n');
  
  return `I want to plan a detailed trip to ${recommendation.destination} for ${recommendation.duration}. 

Here's what I'm looking for:
- Destination: ${recommendation.destination}
- Duration: ${recommendation.duration}
- Budget: Around $${recommendation.estimatedCost}
- Why this appeals to me: ${recommendation.whyYoullLoveIt}
- AI confidence: ${recommendation.confidence}%

The reason this destination was recommended: ${recommendation.reason}

Top activities I'm most interested in:
${highlightsText}

Please create a comprehensive day-by-day itinerary that includes:
1. Specific flight options with airlines, times, and prices
2. Hotel recommendations with names, addresses, and pricing
3. Detailed daily schedule with specific times, venues, and activities
4. Restaurant recommendations for meals
5. Alternative activity options for each planned activity
6. Realistic pricing for all bookable and estimated costs
7. Practical logistics and transportation between activities

Make this itinerary practical, bookable, and tailored to my interests. Focus on the activities I highlighted as most appealing.`;
}; 