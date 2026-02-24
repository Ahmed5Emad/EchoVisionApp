import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path, Rect } from "react-native-svg";

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function MicIcon({ width = 12, height = 16, color = "#424242", style }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 16 22" fill="none" style={style}>
      <Path d="M8 18V21M8 18C9.85652 18 11.637 17.2625 12.9497 15.9497C14.2625 14.637 15 12.8565 15 11V9M8 18C6.14348 18 4.36301 17.2625 3.05025 15.9497C1.7375 14.637 1 12.8565 1 11V9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M11 4C11 2.34315 9.65685 1 8 1C6.34315 1 5 2.34315 5 4V11C5 12.6569 6.34315 14 8 14C9.65685 14 11 12.6569 11 11V4Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export function WaveformIcon({ color = "#2E66F5", style }: { color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 110 34" fill="none" style={style}>
      <Rect x="6" y="10" width="2" height="14" rx="1" fill={color}/><Rect x="15" y="4" width="2" height="24" rx="1" fill={color}/><Rect x="25" y="12" width="2" height="10" rx="1" fill={color}/><Rect x="35" y="0" width="2" height="34" rx="1" fill={color}/><Rect x="45" y="6" width="2" height="22" rx="1" fill={color}/><Rect x="55" y="11" width="2" height="12" rx="1" fill={color}/><Rect x="65" y="5" width="2" height="24" rx="1" fill={color}/><Rect x="75" y="12" width="2" height="10" rx="1" fill={color}/><Rect x="85" y="8" width="2" height="18" rx="1" fill={color}/><Rect x="95" y="13" width="2" height="8" rx="1" fill={color}/>
    </Svg>
  );
}

export function StopIcon({ width = 24, height = 24, color = "#FF4B4B", style }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" style={style}>
      <Rect x="4" y="4" width="16" height="16" rx="4" fill={color} />
    </Svg>
  );
}

export function MicStartIcon({ width = 24, height = 24, color = "#2E66F5", style }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill={color} />
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 19v4M8 23h8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function KeyboardIcon({ width = 24, height = 24, color = "#424242", style }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" style={style}>
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="2"/>
      <Path d="M6 9H8M11 9H13M16 9H18M6 13H8M11 13H13M16 13H18M7 16H17" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  );
}

export function BackIcon({ width = 24, height = 24, color = "#424242", style }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export function DownloadIcon({ width = 24, height = 24, color = "#424242", style }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export function CheckIcon({ width = 24, height = 24, color = "#2E66F5", style }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M20 6L9 17L4 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export function SettingsIcon({ width = 24, height = 24, color = "#424242", style }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export function UserGuideIcon({ width = 36, height = 36, color = "#424242", style }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 36 36" fill="none" style={style}>
      <Path d="M4 36C2.9 36 1.95867 35.6087 1.176 34.826C0.393333 34.0433 0.00133333 33.1013 0 32V4C0 2.9 0.392 1.95867 1.176 1.176C1.96 0.393333 2.90133 0.00133333 4 0H32C33.1 0 34.042 0.392 34.826 1.176C35.61 1.96 36.0013 2.90133 36 4V32C36 33.1 35.6087 34.042 34.826 34.826C34.0433 35.61 33.1013 36.0013 32 36H4ZM4 4V32H32V4H28V18L23 15L18 18V4H4Z" fill={color} />
    </Svg>
  );
}

export function BrightnessIcon({ width = 24, height = 24, color = "#424242", style }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1V3M12 21V23M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export function FontIcon({ width = 24, height = 24, color = "#424242", style }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M4 7V4h16v3M9 20h6M12 4v16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export function TrashIcon({ width = 24, height = 24, color = "#FF4B4B", style }: IconProps) {

  return (

    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" style={style}>

      <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>

    </Svg>

  );

}



export function PauseIcon({ width = 24, height = 24, color = "#2E66F5", style }: IconProps) {

  return (

    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" style={style}>

      <Rect x="6" y="4" width="4" height="16" rx="1" fill={color} />

      <Rect x="14" y="4" width="4" height="16" rx="1" fill={color} />

    </Svg>

  );

}



export function PlayIcon({ width = 24, height = 24, color = "#2E66F5", style }: IconProps) {

  return (

    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" style={style}>

      <Path d="M5 3l14 9-14 9V3z" fill={color} />

    </Svg>

  );

}



export function CloseIcon({ width = 24, height = 24, color = "#FF4B4B", style }: IconProps) {

  return (

    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" style={style}>

      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>

    </Svg>

  );

}

export function ServerIcon({ width = 24, height = 24, color = "#424242", style }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" style={style}>
      <Rect x="2" y="2" width="20" height="8" rx="2" stroke={color} strokeWidth="2" />
      <Rect x="2" y="14" width="20" height="8" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M6 6h.01M6 18h.01M10 6h.01M10 18h.01" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
}

export function LockIcon({ width = 24, height = 24, color = "#424242", style }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" style={style}>
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}