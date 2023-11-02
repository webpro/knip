import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

interface ErrorWithCause extends Error {
  cause: Error;
}

export class ConfigurationError extends Error {}

export class LoaderError extends Error {}

export const isKnownError = (error: Error) =>
  error instanceof ConfigurationError || error instanceof LoaderError || error instanceof ZodError;

export const hasCause = (error: Error): error is ErrorWithCause => error.cause instanceof Error;

export const isConfigurationError = (error: Error) => error instanceof ConfigurationError;

export const getKnownError = (error: Error) => {
  if (error instanceof ZodError) return fromZodError(error);
  return error;
};
