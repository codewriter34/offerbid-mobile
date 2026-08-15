import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import {pickOneImage} from '../../services/imagePicker';
import {RootStackScreenProps} from '../../types/navigation';
import {useIdentity} from '../../hooks/useIdentity';
import {uploadMedia} from '../../services/mediaUpload';
import {IdKind} from '../../types';
import {Button} from '../../components/Button';
import {LoadingSpinner} from '../../components/LoadingSpinner';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';

type Props = RootStackScreenProps<'Identity'>;

const ID_KINDS: Array<{value: IdKind; label: string}> = [
  {value: 'NATIONAL_ID', label: 'National ID'},
  {value: 'PASSPORT', label: 'Passport'},
  {value: 'DRIVERS_LICENSE', label: "Driver's license"},
  {value: 'VOTERS_CARD', label: "Voter's card"},
];

export const IdentityScreen: React.FC<Props> = ({navigation}) => {
  const {identity, isLoading, fetchIdentity, submitIdentity} = useIdentity();
  const [idKind, setIdKind] = useState<IdKind>('NATIONAL_ID');
  const [fullNameOnId, setFullNameOnId] = useState('');
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchIdentity();
  }, []);

  const pick = async (setter: (uri: string) => void) => {
    const uri = await pickOneImage(0.8);
    if (uri) setter(uri);
  };

  const handleSubmit = async () => {
    if (!frontUri || !selfieUri) {
      Alert.alert('Photos required', 'ID front and a selfie are required.');
      return;
    }
    setSubmitting(true);
    try {
      const [idFrontUrl, selfieUrl, idBackUrl] = await Promise.all([
        uploadMedia(frontUri, 'IDENTITY'),
        uploadMedia(selfieUri, 'IDENTITY'),
        backUri ? uploadMedia(backUri, 'IDENTITY') : Promise.resolve(undefined),
      ]);
      await submitIdentity({
        idKind,
        idFrontUrl,
        selfieUrl,
        idBackUrl,
        fullNameOnId: fullNameOnId.trim() || undefined,
      });
      Alert.alert('Submitted', 'Your ID is pending review. Approval raises your listing cap to 10.', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (err: any) {
      Alert.alert('Submit failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading && !identity) {
    return <LoadingSpinner message="Loading KYC status..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.back}>Cancel</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Verify identity</Text>
      <Text style={styles.subtitle}>
        Optional. Approval raises your active listing cap from 3 to 10. It does not block bidding.
      </Text>

      {identity && (
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Status: {identity.status}</Text>
          {identity.rejectionReason ? (
            <Text style={styles.reason}>{identity.rejectionReason}</Text>
          ) : null}
          <Text style={styles.cap}>Listing cap: {identity.listingCap}</Text>
        </View>
      )}

      {identity?.status !== 'PENDING' && identity?.status !== 'APPROVED' && (
        <>
          <Text style={styles.label}>ID type</Text>
          <View style={styles.row}>
            {ID_KINDS.map(kind => (
              <TouchableOpacity
                key={kind.value}
                style={[styles.chip, idKind === kind.value && styles.chipActive]}
                onPress={() => setIdKind(kind.value)}>
                <Text style={styles.chipText}>{kind.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            value={fullNameOnId}
            onChangeText={setFullNameOnId}
            placeholder="Name on ID (optional)"
            placeholderTextColor={colors.text.light}
          />

          <Text style={styles.label}>ID front</Text>
          <PhotoSlot uri={frontUri} onPress={() => pick(setFrontUri)} />
          <Text style={styles.label}>ID back (optional)</Text>
          <PhotoSlot uri={backUri} onPress={() => pick(setBackUri)} />
          <Text style={styles.label}>Selfie</Text>
          <PhotoSlot uri={selfieUri} onPress={() => pick(setSelfieUri)} />

          <Button
            title={submitting ? 'Submitting...' : 'Submit for review'}
            onPress={handleSubmit}
            loading={submitting}
            fullWidth
            size="lg"
            style={{marginTop: spacing.xl}}
          />
        </>
      )}
    </ScrollView>
  );
};

function PhotoSlot({uri, onPress}: {uri: string | null; onPress: () => void}) {
  return (
    <TouchableOpacity style={styles.photo} onPress={onPress}>
      {uri ? <Image source={{uri}} style={styles.photoImg} /> : <Text style={styles.photoText}>+</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.white},
  content: {padding: spacing.md, paddingTop: spacing.xxl, paddingBottom: spacing.xxl},
  back: {...typography.body, color: colors.error, marginBottom: spacing.md},
  title: {...typography.h1, color: colors.text.primary},
  subtitle: {...typography.bodySmall, color: colors.text.secondary, marginTop: spacing.sm},
  statusCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  statusLabel: {...typography.body, fontWeight: '700', color: colors.text.primary},
  reason: {...typography.bodySmall, color: colors.error, marginTop: spacing.xs},
  cap: {...typography.caption, color: colors.text.secondary, marginTop: spacing.xs},
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    color: colors.text.primary,
  },
  row: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {backgroundColor: colors.primary, borderColor: colors.primary},
  chipText: {...typography.caption, color: colors.text.primary},
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.background,
    marginTop: spacing.md,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoImg: {width: '100%', height: '100%'},
  photoText: {fontSize: 28, color: colors.text.light},
});
