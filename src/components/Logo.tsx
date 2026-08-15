import React from 'react';
import {Image, ImageStyle, StyleProp} from 'react-native';

const LOGO = require('../assets/images/offerbid-logo-mark.png');

interface LogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export const Logo: React.FC<LogoProps> = ({size = 72, style}) => (
  <Image
    source={LOGO}
    style={[{width: size, height: size}, style]}
    resizeMode="contain"
    accessibilityLabel="OfferBid"
  />
);
