import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AuthStackParamList} from '@app/navigation/types';
import {LoginScreen} from './LoginScreen';
import {SignupScreen} from './SignupScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthScreen: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false, animation: 'slide_from_right'}}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
};
