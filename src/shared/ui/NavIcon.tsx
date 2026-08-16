import React from 'react';
import Svg, {Circle, Path, Rect} from 'react-native-svg';

export type NavIconName = 'explore' | 'bids' | 'selling' | 'profile' | 'plus';

interface NavIconProps {
  name: NavIconName;
  color: string;
  size?: number;
  filled?: boolean;
}

export function NavIcon({name, color, size = 22, filled = false}: NavIconProps) {
  switch (name) {
    case 'explore':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle
            cx="12"
            cy="12"
            r="9"
            stroke={color}
            strokeWidth={1.8}
            fill={filled ? color : 'none'}
            fillOpacity={filled ? 0.15 : 0}
          />
          <Path
            d="M14.5 9.5 10 10l-.5 4.5 4.5-.5.5-4.5Z"
            stroke={color}
            strokeWidth={1.8}
            strokeLinejoin="round"
            fill={filled ? color : 'none'}
          />
        </Svg>
      );
    case 'bids':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3.8 13.2 10.8 20a1.5 1.5 0 0 0 2.1 0l7.3-7.3a1.5 1.5 0 0 0 .4-1.1V4.8A1.8 1.8 0 0 0 18.8 3h-6.8a1.5 1.5 0 0 0-1.1.4l-7.1 7.1a1.5 1.5 0 0 0 0 2.1Z"
            stroke={color}
            strokeWidth={1.8}
            strokeLinejoin="round"
            fill={filled ? color : 'none'}
            fillOpacity={filled ? 0.2 : 0}
          />
          <Circle cx="16.2" cy="7.8" r="1.2" fill={color} />
        </Svg>
      );
    case 'selling':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="4"
            y="4"
            width="7"
            height="7"
            rx="1.5"
            stroke={color}
            strokeWidth={1.8}
            fill={filled ? color : 'none'}
          />
          <Rect
            x="13"
            y="4"
            width="7"
            height="7"
            rx="1.5"
            stroke={color}
            strokeWidth={1.8}
            fill={filled ? color : 'none'}
          />
          <Rect
            x="4"
            y="13"
            width="7"
            height="7"
            rx="1.5"
            stroke={color}
            strokeWidth={1.8}
            fill={filled ? color : 'none'}
          />
          <Rect
            x="13"
            y="13"
            width="7"
            height="7"
            rx="1.5"
            stroke={color}
            strokeWidth={1.8}
            fill={filled ? color : 'none'}
          />
        </Svg>
      );
    case 'profile':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle
            cx="12"
            cy="8"
            r="3.5"
            stroke={color}
            strokeWidth={1.8}
            fill={filled ? color : 'none'}
          />
          <Path
            d="M5.5 19.5c.8-3.4 3.3-5 6.5-5s5.7 1.6 6.5 5"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill={filled ? color : 'none'}
          />
        </Svg>
      );
    case 'plus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 5v14M5 12h14"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </Svg>
      );
  }
}
