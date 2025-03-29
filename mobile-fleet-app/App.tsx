
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/contexts/AuthContext';
import { ProfileProvider } from './src/contexts/ProfileContext';
import LoginScreen from './src/screens/auth/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import VehiclesScreen from './src/screens/vehicles/VehiclesScreen';
import VehicleDetailScreen from './src/screens/vehicles/VehicleDetailScreen';
import AgreementsScreen from './src/screens/agreements/AgreementsScreen';
import AgreementDetailScreen from './src/screens/agreements/AgreementDetailScreen';
import MaintenanceScreen from './src/screens/maintenance/MaintenanceScreen';
import CustomersScreen from './src/screens/customers/CustomersScreen';

const Stack = createNativeStackNavigator();
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProfileProvider>
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="Vehicles" component={VehiclesScreen} />
              <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
              <Stack.Screen name="Agreements" component={AgreementsScreen} />
              <Stack.Screen name="AgreementDetail" component={AgreementDetailScreen} />
              <Stack.Screen name="Maintenance" component={MaintenanceScreen} />
              <Stack.Screen name="Customers" component={CustomersScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </ProfileProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
