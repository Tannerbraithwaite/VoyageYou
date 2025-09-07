// Add this after line 259 in profile.tsx (after console.log('Profile response data:', profileData);)

if (!profileResponse.ok) {
  console.error('Profile update failed:', profileResponse.status, profileData);
  if (profileResponse.status === 401) {
    Alert.alert('Authentication Error', 'Please log in again to save your profile.', [
      { text: 'Login', onPress: () => router.push('/auth/login') }
    ]);
    return;
  } else if (profileResponse.status === 403) {
    Alert.alert('Permission Error', 'You don\'t have permission to update this profile.');
    return;
  } else {
    Alert.alert('Error', `Profile update failed: ${profileData.detail || 'Unknown error'}`);
    return;
  }
}
