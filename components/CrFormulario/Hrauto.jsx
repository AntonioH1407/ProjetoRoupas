import React, { useEffect } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';

const getCurrentLocalDateTime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localTime = new Date(now.getTime() - offset);
  return localTime.toISOString().slice(0, 19);
};

const formatDisplayTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const Hrauto = ({ value, label, onUpdate }) => {
  const autoTime = value || getCurrentLocalDateTime();
  const displayedTime = formatDisplayTime(autoTime);

  useEffect(() => {
    if (!value) {
      onUpdate(autoTime);
    }
  }, [value]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={displayedTime}
        editable={false}
        placeholder={label}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // ...existing styling...
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "#333",
    fontWeight: "600",
  },
  input: {
    width: "100%",
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#f0f0f0"
  },
});

export default Hrauto;