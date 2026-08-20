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
import {RootStackScreenProps} from '@app/navigation/types';
import {useAuthStore} from '@features/auth/authStore';
import {useHubStore} from '@features/auth/hubStore';
import {completeProfile} from '@features/auth/hubService';
import {LoadingSpinner} from '@shared/ui/LoadingSpinner';
import {ErrorView} from '@shared/ui/ErrorView';
import {Button} from '@shared/ui/Button';
import {Logo} from '@shared/ui/Logo';
import {colors} from '@shared/theme/colors';
import {typography} from '@shared/theme/typography';
import {spacing, borderRadius} from '@shared/theme/spacing';

type Props = RootStackScreenProps<'HubSelect'>;
type Step = 'country' | 'city' | 'neighborhood';

export const HubSelectScreen: React.FC<Props> = ({navigation}) => {
  const {setHub, updateUser, setUser} = useAuthStore();
  const {
    countries: countryHubs,
    allowOther,
    otherLabel,
    isLoading,
    error,
    refresh,
  } = useHubStore();
  const [step, setStep] = useState<Step>('country');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [customCity, setCustomCity] = useState('');
  const [customNeighborhood, setCustomNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (countryHubs.length === 0) {
      void refresh();
    }
  }, [countryHubs.length, refresh]);

  const selectedCountryHub = countryHubs.find(item => item.country === selectedCountry);
  const countries = countryHubs.map(item => item.country);
  const cityNames = selectedCountryHub ? Object.keys(selectedCountryHub.cities) : [];
  const cities = allowOther ? [...cityNames, otherLabel] : cityNames;
  const neighborhoodNames =
    selectedCity && selectedCity !== otherLabel
      ? selectedCountryHub?.cities[selectedCity] ?? []
      : [];
  const neighborhoods = allowOther
    ? [...neighborhoodNames, otherLabel]
    : neighborhoodNames;

  const persistProfile = async (city: string, location: string) => {
    if (!city || city === otherLabel || !location || location === otherLabel) {
      Alert.alert(
        'Real place required',
        `Type the actual city and neighborhood. Do not save ${otherLabel}.`,
      );
      return;
    }
    if (address.trim().length < 2) {
      Alert.alert('Address required', 'Add a meetup address or landmark.');
      return;
    }
    setSaving(true);
    try {
      const user = await completeProfile({
        city,
        address: address.trim(),
        location,
      });
      if (user.id) {
        setUser(user);
      } else {
        updateUser({city, address: address.trim(), location, profileComplete: true});
      }
      setHub({country: selectedCountry ?? '', city, neighborhood: location});
      if (user.primaryIntent === 'SELL') {
        navigation.replace('MainTabs', {screen: 'Selling'});
      } else {
        navigation.replace('MainTabs', {screen: 'Explore'});
      }
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.message ?? 'Could not save your location. Try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const resolvedCity = () =>
    selectedCity === otherLabel ? customCity.trim() : selectedCity ?? '';

  const selectNeighborhood = (name: string) => {
    if (name === otherLabel) {
      if (customNeighborhood.trim().length < 2) {
        Alert.alert('Neighborhood required', 'Type the real neighborhood name. Do not save Other.');
        return;
      }
      const city = resolvedCity();
      if (city.length < 2) {
        Alert.alert('Type the city', 'Do not save the word Other.');
        return;
      }
      persistProfile(city, customNeighborhood.trim());
      return;
    }
    persistProfile(resolvedCity(), name);
  };

  if (isLoading && countryHubs.length === 0) {
    return <LoadingSpinner message="Loading locations..." />;
  }

  if (error && countryHubs.length === 0) {
    return <ErrorView message={error} onRetry={refresh} />;
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
          Needed before you can post a listing. If your place is missing, choose {otherLabel} and type the real name.
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
          data={countries}
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
            selectedCity === otherLabel || (allowOther && cities.includes(otherLabel)) ? (
              <TextInput
                style={styles.inputInList}
                value={customCity}
                onChangeText={setCustomCity}
                placeholder={`Type city if you picked ${otherLabel}`}
                placeholderTextColor={colors.text.light}
              />
            ) : null
          }
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => {
                setSelectedCity(item);
                if (item === otherLabel && customCity.trim().length < 2) {
                  Alert.alert('Type the city', `Do not save the word ${otherLabel}.`);
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
          keyExtractor={(item, index) => `${item}-${index}`}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            allowOther ? (
              <TextInput
                style={styles.inputInList}
                value={customNeighborhood}
                onChangeText={setCustomNeighborhood}
                placeholder={`Type neighborhood if you pick ${otherLabel}`}
                placeholderTextColor={colors.text.light}
              />
            ) : null
          }
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => selectNeighborhood(item)}
              disabled={saving}>
              <Text style={styles.optionTitle}>{item}</Text>
              <Text style={styles.optionSubtitle}>
                {selectedCity === otherLabel ? customCity : selectedCity}
              </Text>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <Button
              title={saving ? 'Saving...' : 'Save location'}
              loading={saving}
              onPress={() =>
                persistProfile(
                  resolvedCity(),
                  customNeighborhood.trim() ||
                    neighborhoodNames[0] ||
                    '',
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
