export const SESSION_COOKIE = "budget_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function checkCredentials(username: string, password: string): boolean {
  const validUser = process.env.AUTH_USERNAME ?? "";
  const validPass = process.env.AUTH_PASSWORD ?? "";
  return (
    validUser.length > 0 &&
    validPass.length > 0 &&
    username === validUser &&
    password === validPass
  );
}

export function getSessionSecret(): string {
  return process.env.AUTH_SECRET ?? "";
}
