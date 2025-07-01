import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

const CheckboxComponent = ({ value, label, onValueChange }) => {
  return (
    <View style={styles.checkboxContainer}>
      <Text style={styles.checkboxLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#767577', true: '#81b0ff' }}
        thumbColor={value ? '#f5dd4b' : '#f4f3f4'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    marginRight: 10,
    color: "#333",
  },
});

export default CheckboxComponent;