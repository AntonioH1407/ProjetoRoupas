import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

const InternetStatus = () => {
    const [isConnected, setIsConnected] = useState(null);

    useEffect(() => {
        // Verifica o estado inicial da conexão e monitora alterações
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsConnected(state.isConnected);
        });

        // Clean-up para evitar vazamentos de memória
        return () => {
            unsubscribe();
        };
    }, []);

    return isConnected;
};

export default InternetStatus;