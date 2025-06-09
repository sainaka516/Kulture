import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator from './src/navigation/TabNavigator';
import { AuthProvider } from './src/lib/auth';

// Customize the theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6366f1', // Indigo color from the web version
    secondary: '#8b5cf6', // Purple color from the web version
  },
};

export default function App() {
  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <NavigationContainer>
            <TabNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </PaperProvider>
    </AuthProvider>
  );
} 