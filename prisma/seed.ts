import Prisma from "../src/db/db.js";
import Helper from "../src/utils/helper.js";

async function main() {
  // ===== 1. Create Super Admin Role =====
  const superAdminRole = await Prisma.role.upsert({
    where: { level: 0 }, // assume level 0 = SUPER_ADMIN
    update: {},
    create: {
      name: "SUPER ADMIN",
      level: 0,
      description: "Super Admin with all permissions",
    },
  });

  console.log("Super Admin Role created:", superAdminRole.id);

  // ===== 2. Create default Super Admin User =====
  const email = "superadmin@example.com";
  const password = "SuperAdmin@123"; // change before prod

  const hashedPassword = await Helper.hashPassword(password);
  const hashedPin = await Helper.hashPassword("1234");

  const superAdminUser = await Prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      username: "superadmin",
      firstName: "Super",
      lastName: "Admin",
      email,
      phoneNumber: "9999999999",
      password: hashedPassword,
      transactionPin: hashedPin,
      domainName: "superadmin.local",
      roleId: superAdminRole.id,
      isAuthorized: true,
      hierarchyLevel: 0,
      hierarchyPath: "0",
      status: "ACTIVE",
      isKycVerified: true,
      profileImage: "https://via.placeholder.com/150", // ✅ required
    },
  });

  console.log("Super Admin User created:", superAdminUser.id);

  // ===== 3. Assign all services to Super Admin Role =====
  const services = await Prisma.service.findMany();

  if (services.length > 0) {
    const rolePermissionsData = services.map((s) => ({
      roleId: superAdminRole.id,
      serviceId: s.id,
      canView: true,
      canEdit: true,
      canSetCommission: true,
    }));

    await Prisma.rolePermission.createMany({
      data: rolePermissionsData,
      skipDuplicates: true,
    });

    console.log("Assigned all services permissions to Super Admin role");
  }
}

main()
  .then(() => {
    console.log("Seeding completed ✅");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
