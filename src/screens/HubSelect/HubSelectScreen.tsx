import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import {RootStackScreenProps} from '../../types/navigation';
import {Hub} from '../../types/hub';
import {useAuthStore} from '../../store/authStore';
import apiClient from '../../services/apiClient';
import {ENDPOINTS} from '../../config/api';
import {HUB_CONFIG} from '../../config/hubs';
import {LoadingSpinner} from '../../components/LoadingSpinner';
import {ErrorView} from '../../components/ErrorView';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';

type Props = RootStackScreenProps<'HubSelect'>;

type Step = 'country' | 'neighborhood';

export const HubSelectScreen: React.FC<Props> = ({navigation}) => {
  const {setHub, updateUser} = useAuthStore();
  const [step, setStep] = useState<Step>('country');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
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
      const {data} = await apiClient.get<Hub[]>(ENDPOINTS.HUBS.LIST);
      setHubs(data);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const countries = [...new Set(hubs.map(h => h.country))];

  const neighborhoods = hubs.filter(
    h => h.country === selectedCountry && h.is_active,
  );

  const selectCountry = (country: string) => {
    setSelectedCountry(country);
    setStep('neighborhood');
  };

  const selectHub = async (hub: Hub) => {
    setSaving(true);
    try {
      await apiClient.patch(ENDPOINTS.HUBS.SELECT, {hub_id: hub.id});
      setHub(hub);
      updateUser({hub_id: hub.id});
      navigation.replace('MainTabs');
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.message ?? 'Could not save your location. Try again.',
      );
    } finally {
      setSaving(false);
    }
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
        {step === 'neighborhood' && (
          <TouchableOpacity
            onPress={() => {
              setStep('country');
              setSelectedCountry(null);
            }}
            style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>
          {step === 'country' ? 'Select your country' : 'Pick your neighborhood'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'country'
            ? 'You will see listings near you'
            : `${selectedCountry} — ${HUB_CONFIG[selectedCountry!]?.city ?? ''}`}
        </Text>
      </View>

      {step === 'country' ? (
        <FlatList
          data={countries}
          keyExtractor={item => item}
          contentContainerStyle={styles.list}
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => selectCountry(item)}
              activeOpacity={0.7}>
              <Text style={styles.optionFlag}>
                {item === 'Cameroon' ? '🇨🇲' : '🇳🇬'}
              </Text>
              <View>
                <Text style={styles.optionTitle}>{item}</Text>
                <Text style={styles.optionSubtitle}>
                  {HUB_CONFIG[item]?.city ?? ''} —{' '}
                  {HUB_CONFIG[item]?.neighborhoods.length ?? 0} areas
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={neighborhoods}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => selectHub(item)}
              disabled={saving}
              activeOpacity={0.7}>
              <Text style={styles.optionFlag}>📍</Text>
              <View>
                <Text style={styles.optionTitle}>{item.neighborhood}</Text>
                <Text style={styles.optionSubtitle}>
                  {item.city}, {item.country}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backText: {
    ...typography.body,
    color: colors.gradientStart,
    fontWeight: '600',
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  list: {
    padding: spacing.md,
  },
  optionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  optionFlag: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  optionTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  optionSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
