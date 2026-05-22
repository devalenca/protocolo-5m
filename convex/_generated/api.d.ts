/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as achievements from "../achievements.js";
import type * as auth from "../auth.js";
import type * as bodyMetrics from "../bodyMetrics.js";
import type * as checklist from "../checklist.js";
import type * as claims from "../claims.js";
import type * as foods from "../foods.js";
import type * as http from "../http.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_dates from "../lib/dates.js";
import type * as lib_foodSeed from "../lib/foodSeed.js";
import type * as lib_identity from "../lib/identity.js";
import type * as meals from "../meals.js";
import type * as migrations from "../migrations.js";
import type * as profiles from "../profiles.js";
import type * as workouts from "../workouts.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  achievements: typeof achievements;
  auth: typeof auth;
  bodyMetrics: typeof bodyMetrics;
  checklist: typeof checklist;
  claims: typeof claims;
  foods: typeof foods;
  http: typeof http;
  "lib/constants": typeof lib_constants;
  "lib/dates": typeof lib_dates;
  "lib/foodSeed": typeof lib_foodSeed;
  "lib/identity": typeof lib_identity;
  meals: typeof meals;
  migrations: typeof migrations;
  profiles: typeof profiles;
  workouts: typeof workouts;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
