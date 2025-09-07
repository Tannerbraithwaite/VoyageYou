// Add this logic after line 610 in suggestions.tsx
// Check if user has enough data for profile generation
const hasProfileData = profileData && (
  profileData.name || 
  profileData.travel_style || 
  profileData.budget_range || 
  profileData.additional_info
);

const hasTripsData = completedTrips && completedTrips.length > 0;
const hasInterestsData = interestsData && interestsData.length > 0;

if (!hasProfileData && !hasTripsData && !hasInterestsData) {
  Alert.alert(
    'Complete Your Profile First', 
    'To generate personalized travel insights, please complete your profile with travel preferences, interests, and take a few trips first.',
    [
      {
        text: 'Go to Profile',
        onPress: () => router.push('/(tabs)/profile')
      },
      {
        text: 'Cancel',
        style: 'cancel'
      }
    ]
  );
  return;
}
