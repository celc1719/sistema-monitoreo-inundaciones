// app/index.jsx
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import MapViewComponent from '../scripts/MapViewComponent.jsx';

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <MapViewComponent
  origin={{ latitude: 20.693824, longitude: -103.374752 }}
  destination={{ latitude: 20.569994, longitude: -103.454583 }}
/>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }
});
