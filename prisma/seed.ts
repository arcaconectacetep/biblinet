import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { config as loadEnv } from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client";

loadEnv({ path: ".env.local", quiet: true });

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Set DATABASE_URL (and ideally DIRECT_URL) in .env.local.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const SALT_ROUNDS = 12;

/** Readable random password, used when no seed password is provided. */
function randomPassword() {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));

  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function firstAccessPassword(birthDate: Date) {
  const day = `${birthDate.getUTCDate()}`.padStart(2, "0");
  const month = `${birthDate.getUTCMonth() + 1}`.padStart(2, "0");

  return `${day}${month}${birthDate.getUTCFullYear()}`;
}

function utcDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

/**
 * Creates the account only when it is missing: re-running the seed never
 * overwrites a password that someone already changed.
 */
async function ensureUser(
  username: string,
  password: string,
  data: Omit<
    Parameters<typeof prisma.user.create>[0]["data"],
    "username" | "passwordHash"
  >,
) {
  const existing = await prisma.user.findUnique({ where: { username } });

  if (existing) return { user: existing, created: false };

  const user = await prisma.user.create({
    data: {
      ...data,
      username,
      passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
    },
  });

  return { user, created: true };
}

const STUDENTS = [
  {
    name: "Ana Clara Ribeiro",
    username: "ana.ribeiro",
    registrationNumber: "2026001",
    birthDate: "2009-03-14",
    course: "Informática",
    gradeYear: "1º Ano",
    className: "A",
  },
  {
    name: "Bruno Almeida",
    username: "bruno.almeida",
    registrationNumber: "2026002",
    birthDate: "2008-07-02",
    course: "Agro",
    gradeYear: "2º Ano",
    className: "B",
  },
  {
    name: "Carla Nogueira",
    username: "carla.nogueira",
    registrationNumber: "2026003",
    birthDate: "2007-11-25",
    course: "Administração",
    gradeYear: "3º Ano",
    className: "A",
  },
  {
    name: "Diego Martins",
    username: "diego.martins",
    registrationNumber: "2026004",
    birthDate: "2008-01-09",
    course: "Logística",
    gradeYear: "2º Ano",
    className: "A",
  },
] as const;

const BOOKS = [
  {
    title: "Dom Casmurro",
    author: "Machado de Assis",
    genre: "Romance",
    shelf: "Estante A-1",
  },
  {
    title: "Memórias Póstumas de Brás Cubas",
    author: "Machado de Assis",
    genre: "Romance",
    shelf: "Estante A-1",
  },
  {
    title: "Vidas Secas",
    author: "Graciliano Ramos",
    genre: "Drama",
    shelf: "Estante A-2",
  },
  {
    title: "Capitães da Areia",
    author: "Jorge Amado",
    genre: "Romance",
    shelf: "Estante A-2",
  },
  {
    title: "O Cortiço",
    author: "Aluísio Azevedo",
    genre: "Romance",
    shelf: "Estante A-3",
  },
  {
    title: "A Hora da Estrela",
    author: "Clarice Lispector",
    genre: "Conto / Crônica",
    shelf: "Estante B-1",
  },
  {
    title: "Fahrenheit 451",
    author: "Ray Bradbury",
    genre: "Ficção Científica",
    shelf: "Estante B-2",
  },
  {
    title: "O Hobbit",
    author: "J. R. R. Tolkien",
    genre: "Fantasia",
    shelf: "Estante B-3",
  },
  {
    title: "Quarto de Despejo",
    author: "Carolina Maria de Jesus",
    genre: "Biografia / Autobiografia",
    shelf: "Estante C-1",
  },
  {
    title: "O Pequeno Príncipe",
    author: "Antoine de Saint-Exupéry",
    genre: "Aventura",
    shelf: "Estante C-2",
  },
  {
    title: "Introdução à Lógica de Programação",
    author: "Equipe de Informática",
    genre: "Tecnologia / Informática",
    shelf: "Estante D-1",
  },
] as const;

async function main() {
  const devPassword = process.env.SEED_DEV_PASSWORD ?? randomPassword();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? randomPassword();

  const dev = await ensureUser(
    process.env.SEED_DEV_USERNAME ?? "dev",
    devPassword,
    {
      name: "Equipe de Desenvolvimento",
      email: "dev@biblinet.local",
      role: "DEV",
      // Set by whoever runs the seed, so no forced change on first login.
      mustChangePassword: false,
    },
  );

  const admin = await ensureUser(
    process.env.SEED_ADMIN_USERNAME ?? "biblioteca",
    adminPassword,
    {
      name: "Biblioteca da Escola",
      email: "biblioteca@biblinet.local",
      role: "ADMIN",
      mustChangePassword: false,
    },
  );

  const createdStudents: { name: string; username: string; password: string }[] =
    [];

  for (const student of STUDENTS) {
    const birthDate = utcDate(student.birthDate);
    const password = firstAccessPassword(birthDate);

    const { created } = await ensureUser(student.username, password, {
      name: student.name,
      email: `${student.username}@biblinet.local`,
      role: "STUDENT",
      registrationNumber: student.registrationNumber,
      birthDate,
      course: student.course,
      gradeYear: student.gradeYear,
      className: student.className,
      mustChangePassword: true,
    });

    if (created) {
      createdStudents.push({
        name: student.name,
        username: student.username,
        password,
      });
    }
  }

  for (const book of BOOKS) {
    const exists = await prisma.book.findFirst({
      where: { title: book.title, author: book.author },
      select: { id: true },
    });

    if (exists) continue;

    await prisma.book.create({ data: { ...book, format: "PHYSICAL" } });
  }

  const sampleDigitalTitle = "Guia de uso da biblioteca (exemplo digital)";
  const digitalExists = await prisma.book.findFirst({
    where: { title: sampleDigitalTitle },
    select: { id: true },
  });

  if (!digitalExists) {
    await prisma.book.create({
      data: {
        title: sampleDigitalTitle,
        author: "Equipe Biblinet",
        genre: "Didático / Acadêmico",
        format: "DIGITAL",
        // Placeholder PDF: replace it with the school's own material.
        fileUrl:
          "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      },
    });
  }

  console.log("\n✅ Banco populado com sucesso.\n");

  if (dev.created) {
    console.log(`   Dev    → usuário: ${dev.user.username} | senha: ${devPassword}`);
  } else {
    console.log(`   Dev    → ${dev.user.username} (já existia, senha mantida)`);
  }

  if (admin.created) {
    console.log(
      `   Admin  → usuário: ${admin.user.username} | senha: ${adminPassword}`,
    );
  } else {
    console.log(`   Admin  → ${admin.user.username} (já existia, senha mantida)`);
  }

  if (createdStudents.length > 0) {
    console.log("\n   Alunos de exemplo (senha = data de nascimento DDMMAAAA):");
    for (const student of createdStudents) {
      console.log(
        `   • ${student.name} → usuário: ${student.username} | senha: ${student.password}`,
      );
    }
  }

  console.log(
    "\n   Anote estas credenciais agora: as senhas são gravadas com hash e não podem ser recuperadas.\n",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
