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
import {useListing} from '@features/listings/useListing';
import {useHubStore} from '@features/auth/hubStore';
import {uploadMediaMany} from '@shared/lib/uploads';
import {MAX_LISTING_IMAGES} from '@shared/config/hubs';
import {
  isValidListingTitle,
  isValidListingDescription,
  isValidPrice,
} from '@shared/lib/validators';
import {listingImageUrls} from '@api/normalize';
import {Button} from '@shared/ui/Button';
import {LoadingSpinner} from '@shared/ui/LoadingSpinner';
import {colors} from '@shared/theme/colors';
import {typography} from '@shared/theme/typography';
import {spacing, borderRadius} from '@shared/theme/spacing';

type Props = RootStackScreenProps<'EditListing'>;

export const EditListingScreen: React.FC<Props> = ({route, navigation}) => {
  const {listingId} = route.params;
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const {currentListing, fetchListingById, updateListing, isLoading} = useListing();
  const categories = useHubStore(s => s.categories);
  const refreshHubs = useHubStore(s => s.refresh);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [askingPrice, setAskingPrice] = useState('');
  const [minBidPrice, setMinBidPrice] = useState('');
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [newImageUris, setNewImageUris] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchListingById(listingId);
  }, [listingId]);

  useEffect(() => {
    if (categories.length === 0) {
      void refreshHubs();
    }
  }, [categories.length, refreshHubs]);

  useEffect(() => {
    if (currentListing && currentListing.id === listingId && !loaded) {
      setTitle(currentListing.title);
      setDescription(currentListing.description);
      setCategory(currentListing.category);
      setAskingPrice(String(currentListing.askingPrice));
      setMinBidPrice(currentListing.minBidPrice ? String(currentListing.minBidPrice) : '');
      setExistingImageUrls(listingImageUrls(currentListing));
      setLoaded(true);
    }
  }, [currentListing, listingId, loaded]);

  const totalImages = existingImageUrls.length + newImageUris.length;

  const pickImages = async () => {
    if (totalImages >= MAX_LISTING_IMAGES) {
      Alert.alert('Limit reached', `Maximum ${MAX_LISTING_IMAGES} photos allowed.`);
      return;
    }
    const uris = await pickImagesFromLibrary({
      selectionLimit: MAX_LISTING_IMAGES - totalImages,
      quality: 0.8,
    });
    if (uris.length > 0) {
      setNewImageUris(prev => [...prev, ...uris].slice(0, MAX_LISTING_IMAGES - existingImageUrls.length));
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImageUris(prev => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const titleErr = isValidListingTitle(title);
    if (titleErr) newErrors.title = titleErr;
    const descErr = isValidListingDescription(description);
    if (descErr) newErrors.description = descErr;
    if (!category) newErrors.category = 'Select a category';
    const priceErr = isValidPrice(parseFloat(askingPrice));
    if (priceErr) newErrors.askingPrice = priceErr;
    if (totalImages === 0) newErrors.images = 'Add at least one photo';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      let uploadedUrls: string[] = [];
      if (newImageUris.length > 0) {
        uploadedUrls = await uploadMediaMany(newImageUris, 'LISTING');
      }
      const allImages = [...existingImageUrls, ...uploadedUrls];

      await updateListing(listingId, {
        title: title.trim(),
        description: description.trim(),
        askingPrice: parseFloat(askingPrice),
        minBidPrice: minBidPrice ? parseFloat(minBidPrice) : undefined,
        category: category!,
        images: allImages,
      });
      Alert.alert('Updated', 'Your listing has been updated.', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err.message;
      Alert.alert('Update failed', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!loaded && isLoading) {
    return <LoadingSpinner message="Loading listing..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          {paddingTop: insets.top + 12, paddingBottom: 48},
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Listing</Text>
          <View style={{width: 50}} />
        </View>

        <Text style={styles.label}>Photos ({totalImages}/{MAX_LISTING_IMAGES})</Text>
        <View style={styles.imageRow}>
          {existingImageUrls.map((url, index) => (
            <View key={`existing-${index}`} style={styles.imageThumb}>
              <Image source={{uri: url}} style={styles.thumbImage} />
              <TouchableOpacity
                style={styles.removeImage}
                onPress={() => removeExistingImage(index)}>
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {newImageUris.map((uri, index) => (
            <View key={`new-${index}`} style={styles.imageThumb}>
              <Image source={{uri}} style={styles.thumbImage} />
              <TouchableOpacity
                style={styles.removeImage}
                onPress={() => removeNewImage(index)}>
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {totalImages < MAX_LISTING_IMAGES && (
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
          placeholder="Describe your item..."
          placeholderTextColor={colors.text.light}
          multiline
          numberOfLines={4}
          maxLength={1000}
          textAlignVertical="top"
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

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
        {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

        <Text style={styles.label}>Asking Price</Text>
        <TextInput
          style={[styles.input, errors.askingPrice && styles.inputError]}
          value={askingPrice}
          onChangeText={setAskingPrice}
          placeholder="0"
          placeholderTextColor={colors.text.light}
          keyboardType="numeric"
        />
        {errors.askingPrice && <Text style={styles.errorText}>{errors.askingPrice}</Text>}

        <Text style={styles.label}>Minimum Bid (optional)</Text>
        <TextInput
          style={styles.input}
          value={minBidPrice}
          onChangeText={setMinBidPrice}
          placeholder="0"
          placeholderTextColor={colors.text.light}
          keyboardType="numeric"
        />

        <Button
          title={submitting ? 'Saving...' : 'Save Changes'}
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          fullWidth
          loading={submitting}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
