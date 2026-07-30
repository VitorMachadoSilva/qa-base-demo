export const DEMO_ACCOUNT_COUNT = 20;
export const LOGIN_TIMING_HASH =
  'scrypt-v1$32768$8$3$vRmwxiiSGZbNpilKczm1Jw$8k39k63D2QdQPttJ-zDa8ZZl4_nB0cAj5Vav2aLbSgsg3vXoolG_flIRLAH5RU4wZHr3qo97zGK_DS2ysZYBeg';

export async function bootstrapFixedAccounts(prisma) {
  return prisma.user.count();
}

export function safeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    mustChangePassword: user.mustChangePassword,
    expiresAt: user.expiresAt,
    passwordNoticeSeen: Boolean(user.passwordNoticeSeenAt)
  };
}
