import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import {pickImagesFromLibrary} from '../../services/imagePicker';
import {RootStackScreenProps} from '../../types/navigation';
import {ListingCategory, CreateListingPayload} from '../../types/listing';
import {useListings} from '../../hooks/useListings';
import {useAuthStore} from '../../store/authStore';
import {uploadMediaMany} from '../../services/mediaUpload';
import {
  LISTING_CATEGORIES,
  MAX_LISTING_IMAGES,
  MAX_ACTIVE_LISTINGS_UNVERIFIED,
  MAX_ACTIVE_LISTINGS_VERIFIED,
} from '../../config/hubs';
import {
  isValidListingTitle,
  isValidListingDescription,
  isValidPrice,
  isValidMinBid,
} from '../../utils/validators';
import {Button} from '../../components/Button';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';

type Props = RootStackScreenProps<'CreateListing'>;

export const CreateListingScreen: React.FC<Props> = ({navigation}) => {
  const user = useAuthStore(s => s.user);
  const {createListing, myListings} = useListings();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ListingCategory | null>(null);
  const [startingPrice, setStartingPrice] = useState('');
  const [minBid, setMinBid] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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

    const priceNum = parseFloat(startingPrice);
    const priceErr = isValidPrice(priceNum);
    if (priceErr) newErrors.startingPrice = priceErr;

    const minBidNum = parseFloat(minBid);
    const minBidErr = isValidMinBid(minBidNum, priceNum);
    if (minBidErr) newErrors.minBid = minBidErr;

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

      const currency = user?.country === 'NIGERIA' ? 'NGN' : 'XAF';
      const payload: CreateListingPayload = {
        title: title.trim(),
        description: description.trim(),
        askingPrice: parseFloat(startingPrice),
        minBidPrice: parseFloat(minBid),
        currency,
        category: category!,
        location: user?.location || user?.city || 'Molyko',
        images: uploadedUrls,
      };

      await createListing(payload);
      Alert.alert('Success', 'Your listing has been posted!', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
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
        {LISTING_CATEGORIES.map(cat => (
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

      <View style={styles.priceRow}>
        <View style={styles.priceField}>
          <Text style={styles.label}>Starting Price</Text>
          <TextInput
            style={[styles.input, errors.startingPrice && styles.inputError]}
            value={startingPrice}
            onChangeText={setStartingPrice}
            placeholder="0"
            placeholderTextColor={colors.text.light}
            keyboardType="numeric"
          />
          {errors.startingPrice && (
            <Text style={styles.errorText}>{errors.startingPrice}</Text>
          )}
        </View>

        <View style={styles.priceField}>
          <Text style={styles.label}>Minimum Bid</Text>
          <TextInput
            style={[styles.input, errors.minBid && styles.inputError]}
            value={minBid}
            onChangeText={setMinBid}
            placeholder="0"
            placeholderTextColor={colors.text.light}
            keyboardType="numeric"
          />
          {errors.minBid && (
            <Text style={styles.errorText}>{errors.minBid}</Text>
          )}
        </View>
      </View>

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
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.white},
  contentContainer: {padding: spacing.md, paddingTop: spacing.xxl},
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
  categoryChipTextActive: {color: colors.black, fontWeight: '600'},
  priceRow: {flexDirection: 'row', gap: spacing.md},
  priceField: {flex: 1},
  submitButton: {marginTop: spacing.xl, marginBottom: spacing.xxl},
});
