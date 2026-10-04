declare module '@site/profile' {
  const profile: typeof import('./config/site.json');
  export default profile;
}

declare module 'virtual:site-themes' {
  const catalog: {
    sources: Record<string, unknown>; overrides: Record<string, unknown>; mobiles: Record<string, unknown>;
    settings: import('./lib/theme/catalog').ThemeCatalogSettings;
    warnings: Record<string, string[]>;
  };
  export default catalog;
}
