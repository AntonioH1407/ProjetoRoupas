import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // Você pode usar ícones do Expo ou outro pacote

const barraPesquisa = ({ placeholder, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    onSearch(searchQuery); // Chama a função de busca que será passada como prop
  };

  return (
    <View style={styles.searchBarContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder || "Pesquisar..."}
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={handleSearch} // Executa a pesquisa ao pressionar Enter/Return
      />
      <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
        <MaterialIcons name="search" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    paddingHorizontal: 10,
    margin: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingLeft: 10,
    fontSize: 16,
  },
  searchButton: {
    padding: 8,
    backgroundColor: '#0051ff',
    borderRadius: 8,
    marginLeft: 10,
  },
});

export default barraPesquisa;
