
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(home)">
        <Label>Create</Label>
        <Icon sf={{ default: 'pencil', selected: 'pencil.circle.fill' }} drawable="edit" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>History</Label>
        <Icon sf={{ default: 'clock', selected: 'clock.fill' }} drawable="history" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
