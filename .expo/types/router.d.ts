/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(tabs)` | `/(tabs)/` | `/(tabs)/activities` | `/(tabs)/assistant` | `/(tabs)/interactive` | `/(tabs)/progress` | `/_sitemap` | `/activities` | `/assistant` | `/family-setup` | `/interactive` | `/login` | `/progress`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
