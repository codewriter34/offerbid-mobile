import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StatusBar,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {pickImagesFromLibrary} from '@shared/lib/imagePicker';
import {RootStackScreenProps} from '@app/navigation/types';
import {dismissScreen} from '@app/navigation/navigationRef';
import {CreateListingPayload} from '@shared/types/listing';
import {useListing} from '@features/listings/useListing';
import {useMyListings} from '@features/listings/useMyListings';
import {useAuthStore} from '@features/auth/authStore';
import {useHubStore} from '@features/auth/hubStore';
import {uploadMediaMany} from '@shared/lib/uploads';
import {showSuccessBurst} from '@shared/ui/successBurstStore';
import {SuccessBurstHost} from '@shared/ui/SuccessBurst';
import {
  MAX_LISTING_IMAGES,
  MAX_ACTIVE_LISTINGS_UNVERIFIED,
  MAX_ACTIVE_LISTINGS_VERIFIED,
} from '@shared/config/hubs';
import {
  isValidListingTitle,
  isValidListingDescription,
  isValidPrice,
} from '@shared/lib/validators';
import {Button} from '@shared/ui/Button';
import {colors} from '@shared/theme/colors';
import {typography} from '@shared/theme/typography';
import {spacing, borderRadius} from '@shared/theme/spacing';

type Props = RootStackScreenProps<'CreateListing'>;

export const CreateListingScreen: React.FC<Props> = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const priceFocused = useRef(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const user = useAuthStore(s => s.user);
  const selectedHub = useAuthStore(s => s.selectedHub);
  const {createListing} = useListing();
  const {myListings} = useMyListings();
  const categories = useHubStore(s => s.categories);
  const countries = useHubStore(s => s.countries);
  const refreshHubs = useHubStore(s => s.refresh);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [startingPrice, setStartingPrice] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, event => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (keyboardHeight > 0 && priceFocused.current) {
      const id = setTimeout(() => {
        scrollRef.current?.scrollToEnd({animated: true});
      }, 50);
      return () => clearTimeout(id);
    }
  }, [keyboardHeight]);

  useEffect(() => {
    if (categories.length === 0) {
      void refreshHubs();
    }
  }, [categories.length, refreshHubs]);

  const listingCap = user?.isVerified
    ? MAX_ACTIVE_LISTINGS_VERIFIED
    : MAX_ACTIVE_LISTINGS_UNVERIFIED;
  const activeCount = myListings.filter(l => String(l.status).toUpperCase() === 'ACTIVE').length;
  const atLimit = activeCount >= listingCap;

  const pickImages = async () => {
    if (imageUris.length >= MAX_LISTING_IMAGES) {
      Alert.alert('Limit reached', `Maximum ${MAX_LISTING_IMAGES} photos allowed.`);
      return;
    }

    const uris = await pickImagesFromLibrary({
      selectionLimit: MAX_LISTING_IMAGES - imageUris.length,
      quality: 0.8,
    });
    if (uris.length > 0) {
      setImageUris(prev => [...prev, ...uris].slice(0, MAX_LISTING_IMAGES));
    }
  };

  const removeImage = (index: number) => {
    setImageUris(prev => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const titleErr = isValidListingTitle(title);
    if (titleErr) newErrors.title = titleErr;

    const descErr = isValidListingDescription(description);
    if (descErr) newErrors.description = descErr;

    if (!category) newErrors.category = 'Select a category';

    const priceErr = isValidPrice(parseFloat(startingPrice));
    if (priceErr) newErrors.startingPrice = priceErr;

    if (imageUris.length === 0) newErrors.images = 'Add at least one photo';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (atLimit) {
      Alert.alert(
        'Listing Limit Reached',
        `You can have up to ${listingCap} active listings. Verify your identity to raise the cap to ${MAX_ACTIVE_LISTINGS_VERIFIED}.`,
      );
      return;
    }

    if (!validate()) return;

    setSubmitting(true);
    try {
      let uploadedUrls: string[] = [];
      if (imageUris.length > 0) {
        uploadedUrls = await uploadMediaMany(imageUris, 'LISTING');
      }

      const countryHub = countries.find(item => item.country === user?.country);
      const currency =
        countryHub?.currency === 'NGN' || countryHub?.currency === 'XAF'
          ? countryHub.currency
          : user?.country === 'NIGERIA'
            ? 'NGN'
            : 'XAF';
      const neighborhood =
        selectedHub?.neighborhood || user?.location || '';
      const city = selectedHub?.city || user?.city || '';
      const payload: CreateListingPayload = {
        title: title.trim(),
        description: description.trim(),
        askingPrice: parseFloat(startingPrice),
        currency,
        category: category!,
        location: [neighborhood, city].filter(Boolean).join(', ') || 'Molyko, Buea',
        images: uploadedUrls,
      };

      await createListing(payload);
      showSuccessBurst({
        kind: 'confetti',
        title: 'Listing is live',
        message: 'Buyers on Explore can see it now. We will notify you when an offer comes in.',
        actionLabel: 'Done',
        onAction: () => dismissScreen(navigation),
      });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: insets.top + 12,
            paddingBottom: 48 + (Platform.OS === 'ios' ? 0 : keyboardHeight),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => dismissScreen(navigation)}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Listing</Text>
        <View style={{width: 50}} />
      </View>

      {atLimit && (
        <View style={styles.limitBanner}>
          <Text style={styles.limitText}>
            You have reached the {listingCap}-listing limit. Verify your
            identity to post more.
          </Text>
        </View>
      )}

      <Text style={styles.label}>Photos ({imageUris.length}/{MAX_LISTING_IMAGES})</Text>
      <View style={styles.imageRow}>
        {imageUris.map((uri, index) => (
          <View key={index} style={styles.imageThumb}>
            <Image source={{uri}} style={styles.thumbImage} />
            <TouchableOpacity
              style={styles.removeImage}
              onPress={() => removeImage(index)}>
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {imageUris.length < MAX_LISTING_IMAGES && (
          <TouchableOpacity style={styles.addImage} onPress={pickImages}>
            <Text style={styles.addImageText}>+</Text>
          </TouchableOpacity>
        )}
      </View>
      {errors.images && <Text style={styles.errorText}>{errors.images}</Text>}

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={[styles.input, errors.title && styles.inputError]}
        value={title}
        onChangeText={setTitle}
        placeholder="What are you selling?"
        placeholderTextColor={colors.text.light}
        maxLength={100}
      />
      {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea, errors.description && styles.inputError]}
        value={description}
        onChangeText={setDescription}
        placeholder="Describe your item, condition, why you're selling..."
        placeholderTextColor={colors.text.light}
        multiline
        numberOfLines={4}
        maxLength={1000}
        textAlignVertical="top"
      />
      {errors.description && (
        <Text style={styles.errorText}>{errors.description}</Text>
      )}

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryGrid}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              category === cat && styles.categoryChipActive,
            ]}
            onPress={() => setCategory(cat)}>
            <Text
              style={[
                styles.categoryChipText,
                category === cat && styles.categoryChipTextActive,
              ]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.category && (
        <Text style={styles.errorText}>{errors.category}</Text>
      )}

      <Text style={styles.label}>Starting Price</Text>
      <TextInput
        style={[styles.input, errors.startingPrice && styles.inputError]}
        value={startingPrice}
        onChangeText={setStartingPrice}
        placeholder="0"
        placeholderTextColor={colors.text.light}
        keyboardType="numeric"
        onFocus={() => {
          priceFocused.current = true;
          setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 80);
        }}
        onBlur={() => {
          priceFocused.current = false;
        }}
      />
      {errors.startingPrice && (
        <Text style={styles.errorText}>{errors.startingPrice}</Text>
      )}

      <Button
        title={submitting ? 'Posting...' : 'Post Listing'}
        onPress={handleSubmit}
        variant="primary"
        size="lg"
        fullWidth
        loading={submitting}
        disabled={atLimit}
        style={styles.submitButton}
      />
      </ScrollView>
    </KeyboardAvoidingView>
    <SuccessBurstHost />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.white},
  contentContainer: {paddingHorizontal: spacing.md},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cancelText: {...typography.body, color: colors.error},
  headerTitle: {...typography.h2, color: colors.text.primary},
  limitBanner: {
    backgroundColor: '#FFF3E0',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  limitText: {...typography.bodySmall, color: colors.text.secondary},
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.background,
  },
  inputError: {borderColor: colors.error},
  textArea: {minHeight: 100},
  errorText: {...typography.caption, color: colors.error, marginTop: spacing.xs},
  imageRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  imageThumb: {width: 80, height: 80, borderRadius: borderRadius.md, overflow: 'hidden'},
  thumbImage: {width: '100%', height: '100%'},
  removeImage: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {color: colors.white, fontSize: 12, fontWeight: '700'},
  addImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {fontSize: 28, color: colors.text.light},
  categoryGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {...typography.bodySmall, color: colors.text.secondary},
  categoryChipTextActive: {color: colors.white, fontWeight: '600'},
  submitButton: {marginTop: spacing.xl, marginBottom: spacing.xxl},
});
