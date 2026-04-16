/**
 * Demo seed — creates a test engineer with realistic data for customer demos.
 *
 * Run:  pnpm --filter @veritek/api db:seed
 *
 * Safe to run multiple times — uses upsert / skip on conflict.
 * The Supabase auth user password is:  Demo1234!
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const DEMO_EMAIL = 'demo.engineer@veritek.demo';
const DEMO_PASSWORD = 'Demo1234!';

async function main() {
  console.log('Seeding demo data…');

  // ── 1. Supabase auth user ────────────────────────────────────────────────────
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let supabaseUserId: string;

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users.find((u) => u.email === DEMO_EMAIL);

  if (existing) {
    console.log('  Auth user already exists — reusing');
    supabaseUserId = existing.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { firstName: 'Alex', lastName: 'Demo' },
    });
    if (error) throw new Error(`Supabase auth error: ${error.message}`);
    supabaseUserId = data.user.id;
    console.log(`  Created auth user: ${DEMO_EMAIL}`);
  }

  // ── 2. Warehouse ─────────────────────────────────────────────────────────────
  const warehouse = await prisma.warehouse.upsert({
    where: { id: 'seed-warehouse-1' },
    update: {},
    create: { id: 'seed-warehouse-1', name: 'Birmingham Central' },
  });

  // ── 3. User profile ──────────────────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      supabaseId: supabaseUserId,
      email: DEMO_EMAIL,
      firstName: 'Alex',
      lastName: 'Demo',
      role: 'engineer',
      warehouseId: warehouse.id,
    },
  });
  console.log(`  User: ${user.firstName} ${user.lastName} (${user.id})`);

  // ── 4. Products ──────────────────────────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'FILT-AIR-001' },
      update: {},
      create: { sku: 'FILT-AIR-001', name: 'Air Filter (Heavy Duty)', returnable: true },
    }),
    prisma.product.upsert({
      where: { sku: 'PUMP-HYD-200' },
      update: {},
      create: { sku: 'PUMP-HYD-200', name: 'Hydraulic Pump 200-bar', returnable: true },
    }),
    prisma.product.upsert({
      where: { sku: 'SEAL-KIT-KV3' },
      update: {},
      create: { sku: 'SEAL-KIT-KV3', name: 'Seal Kit KV3', returnable: false },
    }),
    prisma.product.upsert({
      where: { sku: 'BELT-DRIVE-V' },
      update: {},
      create: { sku: 'BELT-DRIVE-V', name: 'Drive Belt (V-type)', returnable: false },
    }),
    prisma.product.upsert({
      where: { sku: 'CTRL-BOARD-X2' },
      update: {},
      create: { sku: 'CTRL-BOARD-X2', name: 'Control Board X2', returnable: true },
    }),
  ]);
  console.log(`  Products: ${products.length}`);

  // ── 5. Van stock ─────────────────────────────────────────────────────────────
  const vanStockData = [
    { product: products[0], qty: 5 },
    { product: products[1], qty: 1 },
    { product: products[2], qty: 8 },
    { product: products[3], qty: 3 },
    { product: products[4], qty: 0 },
  ];

  for (const { product, qty } of vanStockData) {
    await prisma.stockItem.upsert({
      where: { id: `seed-stock-${product.sku}` },
      update: { qty },
      create: {
        id: `seed-stock-${product.sku}`,
        userId: user.id,
        warehouseId: warehouse.id,
        productId: product.id,
        qty,
      },
    });
  }
  console.log(`  Van stock: ${vanStockData.length} items`);

  // ── 6. Sites ─────────────────────────────────────────────────────────────────
  const sites = await Promise.all([
    prisma.site.upsert({
      where: { id: 'seed-site-1' },
      update: {},
      create: {
        id: 'seed-site-1',
        name: 'Tesco Coventry — Extra',
        address: '126 Warwick Road, Coventry',
        postcode: 'CV3 6AR',
      },
    }),
    prisma.site.upsert({
      where: { id: 'seed-site-2' },
      update: {},
      create: {
        id: 'seed-site-2',
        name: "Sainsbury's Solihull",
        address: '1 Drury Lane, Solihull',
        postcode: 'B91 3BG',
      },
    }),
    prisma.site.upsert({
      where: { id: 'seed-site-3' },
      update: {},
      create: {
        id: 'seed-site-3',
        name: 'Asda Birmingham — Great Barr',
        address: 'Queslett Road, Birmingham',
        postcode: 'B43 7DX',
      },
    }),
  ]);
  console.log(`  Sites: ${sites.length}`);

  // ── 7. Reference data ────────────────────────────────────────────────────────
  const stopCodes = [
    { code: 'COMP', description: 'Completed — all work done' },
    { code: 'PART', description: 'Partial — parts on order' },
    { code: 'NOAC', description: 'No access — site locked' },
    { code: 'ESCD', description: 'Escalated to senior engineer' },
    { code: 'WRTY', description: 'Under warranty — referred to OEM' },
  ];
  for (const sc of stopCodes) {
    await prisma.stopCode.upsert({ where: { code: sc.code }, update: {}, create: sc });
  }

  const deliveryTypes = ['Standard', 'Express', 'Overnight', 'Collect from depot'];
  for (const name of deliveryTypes) {
    await prisma.deliveryType.upsert({
      where: { id: `seed-dt-${name.toLowerCase().replace(/ /g, '-')}` },
      update: {},
      create: { id: `seed-dt-${name.toLowerCase().replace(/ /g, '-')}`, name },
    });
  }

  // ── 8. Service orders ────────────────────────────────────────────────────────
  // Order 1: received — just assigned, engineer hasn't touched it yet
  await prisma.serviceOrder.upsert({
    where: { id: 'seed-order-1' },
    update: {},
    create: {
      id: 'seed-order-1',
      assignedToId: user.id,
      siteId: sites[0].id,
      priority: 1,
      status: 'received',
      reference: 'SO-2026-0041',
      description:
        'Refrigeration unit RU-7 not cooling. Temperature alarm active. Product at risk — attend ASAP.',
    },
  });

  // Order 2: accepted — engineer has acknowledged it
  await prisma.serviceOrder.upsert({
    where: { id: 'seed-order-2' },
    update: {},
    create: {
      id: 'seed-order-2',
      assignedToId: user.id,
      siteId: sites[1].id,
      priority: 2,
      status: 'accepted',
      reference: 'SO-2026-0039',
      description:
        'Planned PM visit — quarterly service on conveyor belts B1 through B4. Checklist required.',
    },
  });

  // Order 3: in_progress — engineer is on site
  const order3 = await prisma.serviceOrder.upsert({
    where: { id: 'seed-order-3' },
    update: {},
    create: {
      id: 'seed-order-3',
      assignedToId: user.id,
      siteId: sites[2].id,
      priority: 3,
      status: 'in_progress',
      reference: 'SO-2026-0035',
      description:
        'Control board fault on pump station P3. Board displaying E04 error. Possible replacement needed.',
    },
  });

  // Activity for order 3 — engineer started work
  await prisma.activity.upsert({
    where: { id: 'seed-activity-1' },
    update: {},
    create: {
      id: 'seed-activity-1',
      serviceOrderId: order3.id,
      type: 'break_fix',
      status: 'work',
      startTravel: new Date(Date.now() - 90 * 60 * 1000),
      startWork: new Date(Date.now() - 45 * 60 * 1000),
    },
  });

  // Materials on order 3
  await prisma.material.upsert({
    where: { id: 'seed-material-1' },
    update: {},
    create: {
      id: 'seed-material-1',
      serviceOrderId: order3.id,
      productId: products[4].id, // Control Board X2
      qty: 1,
      status: 'allocated',
      disposition: 'open',
      returnable: true,
    },
  });

  // Order 4: completed
  const order4 = await prisma.serviceOrder.upsert({
    where: { id: 'seed-order-4' },
    update: {},
    create: {
      id: 'seed-order-4',
      assignedToId: user.id,
      siteId: sites[0].id,
      priority: 4,
      status: 'completed',
      reference: 'SO-2026-0030',
      description: 'Annual service — chiller unit CH-2. All checks completed.',
    },
  });

  await prisma.activity.upsert({
    where: { id: 'seed-activity-2' },
    update: {},
    create: {
      id: 'seed-activity-2',
      serviceOrderId: order4.id,
      type: 'preventive_maintenance',
      status: 'complete',
      startTravel: new Date(Date.now() - 5 * 60 * 60 * 1000),
      startWork: new Date(Date.now() - 4.5 * 60 * 60 * 1000),
      endWork: new Date(Date.now() - 2 * 60 * 60 * 1000),
      stopCode: 'COMP',
      comments: 'All four belt drives replaced. Unit running within spec.',
    },
  });

  console.log(`  Service orders: 4 (received, accepted, in_progress, completed)`);

  // ── 9. Private activities (My Time tab) ──────────────────────────────────────
  await prisma.privateActivity.upsert({
    where: { id: 'seed-pa-1' },
    update: {},
    create: {
      id: 'seed-pa-1',
      userId: user.id,
      type: 'travel',
      startTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
      done: true,
      notes: 'Drive to Birmingham depot to collect parts',
    },
  });

  await prisma.privateActivity.upsert({
    where: { id: 'seed-pa-2' },
    update: {},
    create: {
      id: 'seed-pa-2',
      userId: user.id,
      type: 'training',
      startTime: new Date(new Date().setHours(9, 0, 0, 0)),
      done: false,
      notes: 'Hydraulic systems refresher — remote session',
    },
  });

  console.log(`  Private activities: 2`);

  // ── 10. Shipment (Parts Returns tab) ─────────────────────────────────────────
  const shipment = await prisma.shipment.upsert({
    where: { id: 'seed-shipment-1' },
    update: {},
    create: {
      id: 'seed-shipment-1',
      userId: user.id,
      siteId: sites[2].id,
      destinationId: warehouse.id,
      type: 'return',
      status: 'pending',
    },
  });

  await prisma.shipLine.upsert({
    where: { id: 'seed-shipline-1' },
    update: {},
    create: {
      id: 'seed-shipline-1',
      shipmentId: shipment.id,
      productId: products[1].id, // Hydraulic Pump
      qty: 1,
      serialNumber: 'HP-200-77341',
    },
  });

  console.log(`  Shipments: 1 pending return`);

  // ── 11. Clock event ──────────────────────────────────────────────────────────
  await prisma.clockEvent.upsert({
    where: { id: 'seed-clock-1' },
    update: {},
    create: {
      id: 'seed-clock-1',
      userId: user.id,
      type: 'clock_in',
      timestamp: new Date(new Date().setHours(7, 45, 0, 0)),
    },
  });

  console.log(`\nDone! Log in with:\n  Email:    ${DEMO_EMAIL}\n  Password: ${DEMO_PASSWORD}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
