import * as WebBrowser from 'expo-web-browser';
import {Alert} from 'react-native';

export async function openOfferBidLegal(path: 'terms' | 'privacy') {
  const url = `https://offerbid.co/${path}`;
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    Alert.alert('Unable to open', url);
  }
}
