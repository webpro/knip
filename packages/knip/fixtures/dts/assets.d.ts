declare module '*.svg';

declare module '*.html?raw' {
  const value: string;
  export default value;
}
