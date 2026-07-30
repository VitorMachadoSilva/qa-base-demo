import '../src/config/env.js';
import { derivePassword, passwordPolicy } from '../src/auth/passwords.js';
import { prisma } from '../src/db/client.js';

async function run() {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  const newPassword = process.env.QABASE_RESET_PASSWORD || '';

  if (!/^demo(?:0[1-9]|1[0-9]|20)@qabase\.com$/.test(email)) {
    throw new Error('Informe um login demo entre demo01 e demo20');
  }

  if (
    newPassword.length < passwordPolicy.minLength ||
    newPassword.length > passwordPolicy.maxLength
  ) {
    throw new Error(
      `QABASE_RESET_PASSWORD deve ter entre ${passwordPolicy.minLength} e ${passwordPolicy.maxLength} caracteres`
    );
  }

  const passwordHash = await derivePassword(newPassword);
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { email } });

    if (!user) {
      throw new Error('Conta fixa ainda nao foi inicializada');
    }

    await tx.session.deleteMany({ where: { userId: user.id } });
    return tx.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: true,
        passwordNoticeSeenAt: null
      }
    });
  });

  console.log(`Senha redefinida e sessoes revogadas para ${result.email}.`);
}

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
