export async function httpClient(url: string, options?: RequestInit) {
  return fetch(url, options);
}
