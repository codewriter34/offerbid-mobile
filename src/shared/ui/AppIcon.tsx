import React from 'react';
import Svg, {Circle, Path, Rect} from 'react-native-svg';

export type AppIconName =
  | 'camera'
  | 'pin'
  | 'calendar'
  | 'check'
  | 'shield'
  | 'bag'
  | 'tag'
  | 'bids'
  | 'chevron'
  | 'logout'
  | 'close'
  | 'star'
  | 'clock'
  | 'refresh'
  | 'chat'
  | 'bell'
  | 'store'
  | 'back'
  | 'share'
  | 'whatsapp'
  | 'image';

export function AppIcon({
  name,
  color,
  size = 20,
}: {
  name: AppIconName;
  color: string;
  size?: number;
}) {
  const stroke = 1.8;
  switch (name) {
    case 'camera':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4.5 8.5h2.2l1.2-2h8.2l1.2 2H19.5A1.5 1.5 0 0 1 21 10v8.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5V10a1.5 1.5 0 0 1 1.5-1.5Z"
            stroke={color}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
          <Circle cx="12" cy="14" r="3.2" stroke={color} strokeWidth={stroke} />
        </Svg>
      );
    case 'pin':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z"
            stroke={color}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
          <Circle cx="12" cy="10" r="2.2" stroke={color} strokeWidth={stroke} />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="4" y="5" width="16" height="15" rx="2" stroke={color} strokeWidth={stroke} />
          <Path d="M4 9.5h16M8 3.5v3M16 3.5v3" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
        </Svg>
      );
    case 'check':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={stroke} />
          <Path d="m8.5 12.2 2.4 2.4 4.6-5.2" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'shield':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 3.5 19 6.2v6.1c0 4.2-2.8 7.2-7 8.2-4.2-1-7-4-7-8.2V6.2L12 3.5Z"
            stroke={color}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
          <Path d="m9 12 2.1 2.1L15.5 9.5" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'bag':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6.2 8.5h11.6l.8 11H5.4l.8-11Z"
            stroke={color}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
          <Path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
        </Svg>
      );
    case 'tag':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3.8 13.2 10.8 20a1.5 1.5 0 0 0 2.1 0l7.3-7.3a1.5 1.5 0 0 0 .4-1.1V4.8A1.8 1.8 0 0 0 18.8 3h-6.8a1.5 1.5 0 0 0-1.1.4l-7.1 7.1a1.5 1.5 0 0 0 0 2.1Z"
            stroke={color}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
          <Circle cx="16.2" cy="7.8" r="1.2" fill={color} />
        </Svg>
      );
    case 'bids':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M8 14.5 4.5 18 7 20.5 10.5 17" stroke={color} strokeWidth={stroke} strokeLinejoin="round" />
          <Path d="m10.2 15.2 7.4-7.4a1.6 1.6 0 0 0 0-2.3L16.5 4.4a1.6 1.6 0 0 0-2.3 0l-7.4 7.4" stroke={color} strokeWidth={stroke} strokeLinejoin="round" />
        </Svg>
      );
    case 'chevron':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="m9 6 6 6-6 6" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'logout':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M10 7V5.5A1.5 1.5 0 0 1 11.5 4h7A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 10 18.5V17" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
          <Path d="M4 12h10M11 8.5 14.5 12 11 15.5" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'close':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="m7 7 10 10M17 7 7 17" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
        </Svg>
      );
    case 'star':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="m12 3.8 2.2 5.3 5.7.5-4.3 3.7 1.3 5.6L12 16.2 6.9 18.9l1.3-5.6-4.3-3.7 5.7-.5L12 3.8Z"
            stroke={color}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'clock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="8.2" stroke={color} strokeWidth={stroke} />
          <Path d="M12 8v4.4l2.8 1.8" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
        </Svg>
      );
    case 'refresh':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M20 12a8 8 0 1 1-2.2-5.5" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
          <Path d="M20 5v5h-5" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'chat':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 16.5 3.8 20 8 18.2A8.2 8.2 0 1 0 5 16.5Z"
            stroke={color}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'bell':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6 9.2C6 6 8.7 3.5 12 3.5S18 6 18 9.2c0 4.2 1.6 5.6 2.2 6.1.3.2.4.6.2.9-.2.3-.5.5-.9.5H4.5c-.4 0-.7-.2-.9-.5-.2-.3-.1-.7.2-.9.6-.5 2.2-1.9 2.2-6.1Z"
            stroke={color}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
          <Path d="M10 19.2a2.2 2.2 0 0 0 4 0" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
        </Svg>
      );
    case 'store':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4.5 10.5 6 6.5h12l1.5 4H4.5Z"
            stroke={color}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
          <Path
            d="M5 10.5V19h14v-8.5M9.5 19v-5h5v5"
            stroke={color}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'back':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="m15 6-6 6 6 6"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'share':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 4v10"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <Path
            d="m8 7.5 4-3.5 4 3.5"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M6 13v5.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V13"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'whatsapp':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5.2 16.8 4 20.2 7.6 19A8.2 8.2 0 1 0 5.2 16.8Z"
            stroke={color}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
          <Path
            d="M9.2 9.6c.2-.5.4-.5.7-.5h.6c.2 0 .4.1.5.4l.8 1.8c.1.2 0 .5-.2.6l-.5.4c-.2.2-.2.4 0 .6.4.5 1 .9 1.6 1.2.3.1.5.1.6-.1l.5-.6c.2-.2.5-.2.7-.1l1.7.8c.3.1.4.3.4.6v.5c0 .3-.1.5-.5.7-1 .5-2.4.4-4.1-.8-1.5-1.1-2.4-2.6-2.6-4.1-.1-.5 0-1 .2-1.4Z"
            stroke={color}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'image':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="3.5"
            y="5.5"
            width="17"
            height="13"
            rx="2"
            stroke={color}
            strokeWidth={stroke}
          />
          <Circle cx="9" cy="10.5" r="1.6" stroke={color} strokeWidth={stroke} />
          <Path
            d="m6.5 16.5 3.4-3.6 2.4 2.4 2.7-3.2 2.5 4.4"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
  }
}
