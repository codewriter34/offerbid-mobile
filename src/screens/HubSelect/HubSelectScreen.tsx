import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  StatusBar,
  TextInput,
} from 'react-native';
import {RootStackScreenProps} from '../../types/navigation';
import {Hub} from '../../types/hub';
import {useAuthStore} from '../../store/authStore';
import apiClient from '../../services/apiClient';
import {ENDPOINTS} from '../../config/api';
import {OTHER_HUB_LABEL} from '../../config/hubs';
import {mapHubs, mapUser} from '../../utils/mappers';
import {LoadingSpinner} from '../../components/LoadingSpinner';
import {ErrorView} from '../../components/ErrorView';
import {Button} from '../../components/Button';
import {Logo} from '../../components/Logo';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';

type Props = RootStackScreenProps<'HubSelect'>;
type Step = 'country' | 'city' | 'neighborhood';

export const HubSelectScreen: React.FC<Props> = ({navigation}) => {
  const {setHub, updateUser, setUser} = useAuthStore();
  const [step, setStep] = useState<Step>('country');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [customCity, setCustomCity] = useState('');
  const [customNeighborhood, setCustomNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHubs();
  }, []);

  const fetchHubs = async () => {
    setLoading(true);
    setError(null);
    try {
      const {data} = await apiClient.get(ENDPOINTS.HUBS.LIST);
      setHubs(mapHubs(data).hubs);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const countries = [...new Set(hubs.map(h => h.country).filter(Boolean))];
  const cities = [
    ...new Set(
      hubs.filter(h => h.country === selectedCountry).map(h => h.city).filter(Boolean),
    ),
    OTHER_HUB_LABEL,
  ];
  const neighborhoods = [
    ...hubs.filter(
      h =>
        h.country === selectedCountry &&
        h.city === selectedCity &&
        h.neighborhood &&
        h.neighborhood !== OTHER_HUB_LABEL,
    ),
    {country: selectedCountry ?? '', city: selectedCity ?? '', neighborhood: OTHER_HUB_LABEL},
  ];

  const persistProfile = async (city: string, location: string) => {
    if (address.trim().length < 2) {
      Alert.alert('Address required', 'Add a meetup address or landmark.');
      return;
    }
    setSaving(true);
    try {
      const {data} = await apiClient.patch(ENDPOINTS.USERS.COMPLETE_PROFILE, {
        city,
        address: address.trim(),
        location,
      });
      const user = mapUser(data);
      if (user.id) {
        setUser(user);
      } else {
        updateUser({city, address: address.trim(), location, profileComplete: true});
      }
      setHub({country: selectedCountry ?? '', city, neighborhood: location});
      navigation.replace('MainTabs', {screen: 'Feed'});
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.message ?? 'Could not save your location. Try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const selectNeighborhood = (item: Hub) => {
    if (item.neighborhood === OTHER_HUB_LABEL) {
      if (customNeighborhood.trim().length < 2) {
        Alert.alert('Neighborhood required', 'Type the real neighborhood name. Do not save Other.');
        return;
      }
      persistProfile(selectedCity === OTHER_HUB_LABEL ? customCity.trim() : selectedCity!, customNeighborhood.trim());
      return;
    }
    persistProfile(selectedCity!, item.neighborhood);
  };

  if (loading) {
    return <LoadingSpinner message="Loading locations..." />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchHubs} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        <Logo size={48} style={styles.logo} />
        {step !== 'country' && (
          <TouchableOpacity
            onPress={() => {
              if (step === 'neighborhood') setStep('city');
              else setStep('country');
            }}
            style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>
          {step === 'country'
            ? 'Select your country'
            : step === 'city'
              ? 'Pick your city'
              : 'Neighborhood and address'}
        </Text>
        <Text style={styles.subtitle}>
          Needed before you can post a listing. If your place is missing, choose Other and type it.
        </Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Street / landmark (required)"
          placeholderTextColor={colors.text.light}
        />
      </View>

      {step === 'country' ? (
        <FlatList
          data={countries.length > 0 ? countries : ['Cameroon', 'Nigeria', 'CAMEROON', 'NIGERIA'].filter((v, i, a) => a.indexOf(v) === i)}
          keyExtractor={item => item}
          contentContainerStyle={styles.list}
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => {
                setSelectedCountry(item);
                setStep('city');
              }}>
              <Text style={styles.optionTitle}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      ) : step === 'city' ? (
        <FlatList
          data={cities}
          keyExtractor={item => item}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            selectedCity === OTHER_HUB_LABEL || cities.includes(OTHER_HUB_LABEL) ? (
              <TextInput
                style={styles.inputInList}
                value={customCity}
                onChangeText={setCustomCity}
                placeholder="Type city if you picked Other"
                placeholderTextColor={colors.text.light}
              />
            ) : null
          }
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => {
                setSelectedCity(item);
                if (item === OTHER_HUB_LABEL && customCity.trim().length < 2) {
                  Alert.alert('Type the city', 'Do not save the word Other.');
                  return;
                }
                setStep('neighborhood');
              }}>
              <Text style={styles.optionTitle}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={neighborhoods}
          keyExtractor={(item, index) => `${item.neighborhood}-${index}`}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <TextInput
              style={styles.inputInList}
              value={customNeighborhood}
              onChangeText={setCustomNeighborhood}
              placeholder="Type neighborhood if you pick Other"
              placeholderTextColor={colors.text.light}
            />
          }
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => selectNeighborhood(item)}
              disabled={saving}>
              <Text style={styles.optionTitle}>{item.neighborhood}</Text>
              <Text style={styles.optionSubtitle}>
                {selectedCity === OTHER_HUB_LABEL ? customCity : selectedCity}
              </Text>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <Button
              title={saving ? 'Saving...' : 'Save location'}
              loading={saving}
              onPress={() =>
                persistProfile(
                  selectedCity === OTHER_HUB_LABEL ? customCity.trim() : selectedCity!,
                  customNeighborhood.trim() || neighborhoods[0]?.neighborhood,
                )
              }
              fullWidth
              style={{marginTop: spacing.md}}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  header: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {marginBottom: spacing.md},
  backButton: {marginBottom: spacing.md},
  backText: {...typography.body, color: colors.gradientStart, fontWeight: '600'},
  title: {...typography.h1, color: colors.text.primary, marginBottom: spacing.xs},
  subtitle: {...typography.bodySmall, color: colors.text.secondary, marginBottom: spacing.md},
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.background,
  },
  inputInList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  list: {padding: spacing.md},
  optionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  optionTitle: {...typography.h3, color: colors.text.primary},
  optionSubtitle: {...typography.bodySmall, color: colors.text.secondary, marginTop: 2},
});
