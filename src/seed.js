import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (existingAdmin) {
    console.log('✅ Usuário admin já existe. Nenhuma ação necessária.');
    return;
  }

  const passwordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.create({
    data: {
      nome: 'Administrador',
      username: 'admin',
      passwordHash,
      role: 'admin',
    },
  });

  console.log('✅ Usuário master criado com sucesso!');
  console.log('   Username: admin');
  console.log('   Senha:    admin123');
  console.log('   ⚠️  Altere a senha após o primeiro acesso!');
  console.log(`   ID: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
