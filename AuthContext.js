import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userGroup, setUserGroup] = useState("");

    return (
        <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, userGroup, setUserGroup }}>
            {children}
        </AuthContext.Provider>
    );
};
