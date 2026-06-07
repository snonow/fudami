/**
 * Result<T, E> — errors as values, not exceptions.
 *
 * Every function that can fail returns Result<T> instead of throwing.
 * Callers check result.ok before using result.data, so a failure in any
 * layer surfaces as a typed value — not an unhandled exception that can
 * crash the app.
 */

export type Ok<T> = { readonly ok: true; readonly data: T };
export type Err<E = string> = { readonly ok: false; readonly error: E };
export type Result<T, E = string> = Ok<T> | Err<E>;

export const ok = <T>(data: T): Ok<T> => ({ ok: true, data });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

/** Transform the data inside a successful result, pass errors through. */
export const mapOk = <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U,
): Result<U, E> => (result.ok ? ok(fn(result.data)) : result);

/** Chain results: only calls fn when the previous result was Ok. */
export const flatMap = <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>,
): Result<U, E> => (result.ok ? fn(result.data) : result);

/** Unwrap with a fallback value when the result is Err. */
export const unwrapOr = <T, E>(result: Result<T, E>, fallback: T): T =>
  result.ok ? result.data : fallback;
