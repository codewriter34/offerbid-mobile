import {ViewStyle} from 'react-native';
import {colors} from './colors';

export const shadows = {
  card: {
    shadowColor: colors.brand.black,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  } satisfies ViewStyle,
  nav: {
    shadowColor: colors.brand.black,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: -2},
    elevation: 8,
  } satisfies ViewStyle,
  dropdown: {
    shadowColor: colors.brand.black,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 8},
    elevation: 16,
  } satisfies ViewStyle,
  fab: {
    shadowColor: colors.brand.blue,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 8,
  } satisfies ViewStyle,
} as const;
