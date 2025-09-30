import Prisma from "../src/db/db.js";
import Helper from "../src/utils/helper.js";

async function main() {
  const superAdminEmail = "superadmin@gmail.com";
  const superAdminPhone = "1234567895";

  const existingAdmin = await Prisma.user.findFirst({
    where: { email: superAdminEmail },
  });

  if (existingAdmin) {
    console.log("✅ Super Admin already exists:", existingAdmin.email);
    return;
  }

  // Password hash karo
  const hashedPassword = await Helper.hashPassword("superadmin");

  // Super Admin create karo
  const superAdmin = await Prisma.user.create({
    data: {
      name: "Super Admin",
      email: superAdminEmail,
      phone: superAdminPhone,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      isAuthorized: true,
      isKyc: true,
    },
  });

  console.log("🚀 Super Admin created:", superAdmin.email);
}

main()
  .then(() => Prisma.$disconnect())
  .catch((e) => {
    console.error("❌ Error seeding Super Admin:", e);
    Prisma.$disconnect();
    process.exit(1);
  });
