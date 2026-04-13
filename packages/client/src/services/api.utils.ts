import axios from 'axios';

export function getApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (typeof msg === 'string' && msg) return msg;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Une erreur est survenue.';
}
