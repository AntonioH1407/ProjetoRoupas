
import React, { useState } from 'react';
import { NavigationContainer, useNavigation} from '@react-navigation/native';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useSync from "./components/Sync"; 
import HomeScreen from './Index';


import HomeTransito from './apps/Transito/HomeTransito';
import VisitacaoCadastro from './apps/Transito/visitacaoCadastro';
import VisitacaoLista from './apps/Transito/visitacaoLista';
import HomeBiblioteca from './apps/Biblioteca/HomeBiblioteca';
import LivroCadastro from './apps/Biblioteca/LivroCadastro';
import LivroLista from './apps/Biblioteca/LivroLista';
import ListaEmprestimo from './apps/Biblioteca/ListaEmprestimo';
import EmprestimoCadastro from './apps/Biblioteca/EmprestimoCadastro';

import HomeRoupas from './apps/Roupas/HomeRoupas';
import ClienteLista from './apps/Roupas/ClienteLista';
import ClienteCadastro from './apps/Roupas/ClienteCadastro';
import PedidoLista from './apps/Roupas/PedidoLista';
import PedidoCadastro from './apps/Roupas/PedidoCadastro';
import ProdutoLista from './apps/Roupas/ProdutoLista';
import ProdutoCadastro from './apps/Roupas/ProdutoCadastro';


const Stack = createStackNavigator();



function BottomBarButton({ title, screen, iconName, activeScreen, setActiveScreen }) {
  const navigation = useNavigation();
  const isActive = activeScreen === screen; 

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => {
        setActiveScreen(screen);
        navigation.navigate(screen);
      }}
    >
      <MaterialCommunityIcons
        name={iconName}
        size={24}
        color={isActive ? '#8B0000' : '#808080'} // Vermelho vinho se ativo, cinza caso contrário
      />
      <Text style={[styles.buttonText, isActive && styles.activeText]}>{title}</Text>
    </TouchableOpacity>
  );
}


export default function App() {
  const [activeScreen, setActiveScreen] = useState('Home'); // Rastreia a tela ativa

  useSync(); // Chama o hook de sincronização

  return (
    <NavigationContainer
      onStateChange={(state) => {
      const currentRoute = state?.routes[state.index].name;
      setActiveScreen(currentRoute);
    }}>
      <View style={{ flex: 1 }}>
        
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        
    
       
        <Stack.Screen name="HomeTransito" component={HomeTransito} />
        <Stack.Screen name="visitacaoCadastro" component={VisitacaoCadastro} />
        <Stack.Screen name="visitacaoLista" component={VisitacaoLista} />
        
        <Stack.Screen name="HomeBiblioteca" component={HomeBiblioteca}/>
        <Stack.Screen name="LivroCadastro" component={LivroCadastro}/>
        <Stack.Screen name="LivroLista" component={LivroLista} />
        <Stack.Screen name="ListaEmprestimo" component={ListaEmprestimo} />
        <Stack.Screen name="EmprestimoCadastro" component={EmprestimoCadastro} />

        <Stack.Screen name="HomeRoupas" component={HomeRoupas} />
        <Stack.Screen name="ClienteCadastro" component={ClienteCadastro} />
        <Stack.Screen name="ClienteLista" component={ClienteLista} />
        <Stack.Screen name="PedidoLista" component={PedidoLista} />
        <Stack.Screen name="PedidoCadastro" component={PedidoCadastro} />
        <Stack.Screen name="ProdutoLista" component={ProdutoLista} />
        <Stack.Screen name="ProdutoCadastro" component={ProdutoCadastro} />


        
      </Stack.Navigator>
      {/* Troque a condição aqui */}
      {activeScreen !== 'Home' && (
        <View style={styles.bottomBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BottomBarButton
            title="Home"
            screen="Home"
            iconName="home"
            activeScreen={activeScreen}
            setActiveScreen={setActiveScreen}
          />
         
          <BottomBarButton
            title="Trânsito"
            screen="HomeTransito"
            iconName="car"
            activeScreen={activeScreen}
            setActiveScreen={setActiveScreen}
          />

          <BottomBarButton
            title="Biblioteca"
            screen="HomeBiblioteca"
            iconName="book"
            activeScreen={activeScreen}
            setActiveScreen={setActiveScreen}
          />

          <BottomBarButton
            title="Roupa"
            screen="HomeRoupas"
            activeScreen={activeScreen}
            setActiveScreen={setActiveScreen}
            iconName="tshirt-crew"
          />


        
          </ScrollView>
        </View>
      )}
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    height: 70,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f8f8f8',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  buttonText: {
    fontSize: 12,
    color: '#808080', 
  },
  activeText: {
    color: '#8B0000', 
  },
});