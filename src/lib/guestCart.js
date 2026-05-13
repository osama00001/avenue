import { cookies } from "next/headers";

const CART_COOKIE = "guest_cart";

export async function getGuestCart() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(CART_COOKIE);

  if (!cookie) return { items: [] };

  try {
    return JSON.parse(cookie.value);
  } catch {
    return { items: [] };
  }
}

export async function setGuestCart(cart) {
  const cookieStore = await cookies();

  cookieStore.set(CART_COOKIE, JSON.stringify(cart), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearGuestCart() {
  const cookieStore = await cookies();
  cookieStore.delete(CART_COOKIE);
}
