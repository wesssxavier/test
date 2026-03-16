import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 12);
  const editorPassword = await bcrypt.hash('editor123', 12);
  const viewerPassword = await bcrypt.hash('viewer123', 12);
  const checkinPassword = await bcrypt.hash('checkin123', 12);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      displayName: 'System Administrator',
      email: 'admin@guestflow.local',
      role: 'ADMIN',
    },
  });

  const editor = await prisma.user.upsert({
    where: { username: 'editor' },
    update: {},
    create: {
      username: 'editor',
      password: editorPassword,
      displayName: 'Event Editor',
      email: 'editor@guestflow.local',
      role: 'EDITOR',
    },
  });

  const viewer = await prisma.user.upsert({
    where: { username: 'viewer' },
    update: {},
    create: {
      username: 'viewer',
      password: viewerPassword,
      displayName: 'View Only User',
      email: 'viewer@guestflow.local',
      role: 'VIEW_ONLY',
    },
  });

  const checkinUser = await prisma.user.upsert({
    where: { username: 'checkin' },
    update: {},
    create: {
      username: 'checkin',
      password: checkinPassword,
      displayName: 'Check-In Operator',
      email: 'checkin@guestflow.local',
      role: 'CHECK_IN_ONLY',
    },
  });

  console.log('Users created');

  // Create event
  const event = await prisma.event.create({
    data: {
      eventName: 'Annual Corporate Gala 2026',
      eventDate: new Date('2026-06-15T19:00:00'),
      eventLocation: 'Grand Ballroom, Downtown Convention Center',
      roomName: 'Grand Ballroom A',
      notes: 'Annual celebration dinner with awards ceremony. Black-tie optional. Cocktail hour 7-8pm, dinner 8-10pm, dancing until midnight.',
      roomWidth: 1400,
      roomHeight: 1000,
      defaultTableShape: 'ROUND',
      defaultTableCapacity: 10,
      createdBy: admin.id,
    },
  });

  console.log('Event created');

  // Create tables
  const tableData = [
    { tableName: 'VIP Table 1', shape: 'ROUND' as const, capacity: 10, xPosition: 200, yPosition: 200, width: 140, height: 140 },
    { tableName: 'VIP Table 2', shape: 'ROUND' as const, capacity: 10, xPosition: 450, yPosition: 200, width: 140, height: 140 },
    { tableName: 'Table 3', shape: 'ROUND' as const, capacity: 10, xPosition: 700, yPosition: 200, width: 140, height: 140 },
    { tableName: 'Table 4', shape: 'ROUND' as const, capacity: 8, xPosition: 200, yPosition: 450, width: 120, height: 120 },
    { tableName: 'Table 5', shape: 'ROUND' as const, capacity: 8, xPosition: 450, yPosition: 450, width: 120, height: 120 },
    { tableName: 'Head Table', shape: 'RECTANGLE' as const, capacity: 12, xPosition: 500, yPosition: 700, width: 300, height: 80 },
  ];

  const tables = [];
  for (const t of tableData) {
    const table = await prisma.roomTable.create({
      data: { eventId: event.id, ...t },
    });
    tables.push(table);
  }

  console.log('Tables created');

  // Create room elements
  await prisma.roomElement.createMany({
    data: [
      { eventId: event.id, elementType: 'STAGE', label: 'Main Stage', xPosition: 500, yPosition: 50, width: 400, height: 100 },
      { eventId: event.id, elementType: 'DANCE_FLOOR', label: 'Dance Floor', xPosition: 900, yPosition: 400, width: 200, height: 200 },
      { eventId: event.id, elementType: 'BAR', label: 'Bar', xPosition: 1100, yPosition: 100, width: 100, height: 200 },
      { eventId: event.id, elementType: 'ENTRANCE', label: 'Main Entrance', xPosition: 50, yPosition: 500, width: 60, height: 100 },
    ],
  });

  // Create guests
  const guestData = [
    { convidado: 'Carlos Eduardo Silva', empresa: 'TechCorp Brasil', telephone: '+55 11 99999-0001', email: 'carlos.silva@techcorp.com', guestType: 'Guest' as const, status: 'Confirmed' as const, rsvpStatus: 'Confirmed' as const, vipLevel: 'VVIP' as const, notes: 'CEO. Prefers red wine.', linkedGroupName: 'Silva Family' },
    { convidado: 'Ana Beatriz Silva', empresa: 'TechCorp Brasil', telephone: '+55 11 99999-0002', email: 'ana.silva@email.com', guestType: 'Spouse' as const, status: 'Confirmed' as const, rsvpStatus: 'Confirmed' as const, vipLevel: 'VIP' as const, linkedGroupName: 'Silva Family', dietaryRestrictions: 'Vegetarian' },
    { convidado: 'Roberto Mendes', empresa: 'TechCorp Brasil', telephone: '+55 11 99999-0003', email: 'roberto.mendes@techcorp.com', guestType: 'Officer' as const, status: 'Confirmed' as const, rsvpStatus: 'Confirmed' as const, vipLevel: 'None' as const, notes: 'Executive Assistant to CEO' },
    { convidado: 'Maria Fernanda Costa', empresa: 'Banco Nacional', telephone: '+55 21 98888-0001', email: 'mfcosta@banconacional.com', guestType: 'Guest' as const, status: 'Confirmed' as const, rsvpStatus: 'Confirmed' as const, vipLevel: 'VIP' as const, notes: 'Board member. Allergic to shellfish.', dietaryRestrictions: 'No shellfish' },
    { convidado: 'João Paulo Costa', empresa: null, telephone: '+55 21 98888-0002', email: 'jpcosta@email.com', guestType: 'Spouse' as const, status: 'Confirmed' as const, rsvpStatus: 'Confirmed' as const, vipLevel: 'None' as const, linkedGroupName: 'Costa Family' },
    { convidado: 'Luciana Oliveira', empresa: 'Oliveira & Associates', telephone: '+55 11 97777-0001', email: 'luciana@oliveira.adv.br', guestType: 'Guest' as const, status: 'Confirmed' as const, rsvpStatus: 'Confirmed' as const, vipLevel: 'VIP' as const },
    { convidado: 'Fernando Almeida', empresa: 'Global Investments', telephone: '+55 11 96666-0001', email: 'falmeida@globalinvest.com', guestType: 'Guest' as const, status: 'Confirmed' as const, rsvpStatus: 'Confirmed' as const, vipLevel: 'VVIP' as const, notes: 'Major investor. Prefers corner seating.' },
    { convidado: 'Patricia Almeida', empresa: null, telephone: '+55 11 96666-0002', email: 'patricia.almeida@email.com', guestType: 'Spouse' as const, status: 'Confirmed' as const, rsvpStatus: 'Confirmed' as const, vipLevel: 'VIP' as const, linkedGroupName: 'Almeida Family' },
    { convidado: 'Ricardo Santos', empresa: 'Santos Engineering', telephone: '+55 31 95555-0001', email: 'ricardo@santoseng.com', guestType: 'Guest' as const, status: 'Invited' as const, rsvpStatus: 'Pending' as const, vipLevel: 'None' as const },
    { convidado: 'Camila Rodrigues', empresa: 'Media Group', telephone: '+55 11 94444-0001', email: 'camila.r@mediagroup.com', guestType: 'Guest' as const, status: 'Declined' as const, rsvpStatus: 'Declined' as const, vipLevel: 'None' as const, notes: 'Cannot attend - travel conflict' },
    { convidado: 'André Pereira', empresa: 'Pereira Holdings', telephone: '+55 41 93333-0001', email: 'andre@pereirahld.com', guestType: 'Guest' as const, status: 'Confirmed' as const, rsvpStatus: 'Confirmed' as const, vipLevel: 'VIP' as const },
    { convidado: 'Juliana Pereira', empresa: null, telephone: '+55 41 93333-0002', email: 'juliana.p@email.com', guestType: 'Spouse' as const, status: 'Confirmed' as const, rsvpStatus: 'Confirmed' as const, vipLevel: 'None' as const, linkedGroupName: 'Pereira Family' },
    { convidado: 'Marcos Vieira', empresa: 'Tech Innovations', telephone: '+55 11 92222-0001', email: 'marcos.v@techinno.com', guestType: 'Guest' as const, status: 'Confirmed' as const, rsvpStatus: 'Confirmed' as const, vipLevel: 'None' as const },
    { convidado: 'Isabela Nascimento', empresa: 'Design Studio', telephone: '+55 11 91111-0001', email: 'isabela@designstudio.com', guestType: 'Guest' as const, status: 'Invited' as const, rsvpStatus: 'Pending' as const, vipLevel: 'None' as const },
    { convidado: 'Gabriel Martins', empresa: 'Martins Consulting', telephone: '+55 11 90000-0001', email: 'gabriel@martinsconsulting.com', guestType: 'Guest' as const, status: 'Confirmed' as const, rsvpStatus: 'Confirmed' as const, vipLevel: 'None' as const },
    { convidado: 'Beatriz Souza', empresa: 'Souza Foundation', telephone: '+55 21 99999-1001', email: 'beatriz@souzafound.org', guestType: 'Guest' as const, status: 'Waitlist' as const, rsvpStatus: 'Pending' as const, vipLevel: 'VIP' as const, notes: 'On waitlist - confirm by May 30' },
    { convidado: 'Thiago Lima', empresa: 'Lima Tech', telephone: '+55 11 98888-1001', email: 'thiago@limatech.com', guestType: 'Guest' as const, status: 'Confirmed' as const, rsvpStatus: 'Confirmed' as const, vipLevel: 'None' as const },
    { convidado: 'Daniela Ferreira', empresa: 'Ferreira Industries', telephone: '+55 11 97777-1001', email: 'daniela@ferreiraindustries.com', guestType: 'Guest' as const, status: 'Confirmed' as const, rsvpStatus: 'Confirmed' as const, vipLevel: 'None' as const, dietaryRestrictions: 'Gluten-free' },
    { convidado: 'Paulo Henrique Barros', empresa: 'Barros Capital', telephone: '+55 11 96666-1001', email: 'ph.barros@barroscapital.com', guestType: 'Guest' as const, status: 'Invited' as const, rsvpStatus: 'Pending' as const, vipLevel: 'VVIP' as const, notes: 'Potential major sponsor' },
    { convidado: 'Renata Campos', empresa: 'Campos Media', telephone: '+55 11 95555-1001', email: 'renata@camposmedia.com', guestType: 'Guest' as const, status: 'Declined' as const, rsvpStatus: 'Declined' as const, vipLevel: 'None' as const },
    { convidado: 'Eduardo Nascimento', empresa: 'Nascimento Group', telephone: '+55 11 94444-1001', email: 'eduardo@nascimentogroup.com', guestType: 'Guest' as const, status: 'Confirmed' as const, rsvpStatus: 'Confirmed' as const, vipLevel: 'VIP' as const },
    { convidado: 'Sofia Ribeiro', empresa: null, telephone: '+55 11 93333-1001', email: 'sofia.ribeiro@email.com', guestType: 'Spouse' as const, status: 'Confirmed' as const, rsvpStatus: 'Confirmed' as const, vipLevel: 'None' as const, linkedGroupName: 'Nascimento Family' },
    { convidado: 'Miguel Carvalho', empresa: 'Carvalho Architecture', telephone: '+55 11 92222-1001', email: 'miguel@carvalhoarch.com', guestType: 'Guest' as const, status: 'Confirmed' as const, rsvpStatus: 'Confirmed' as const, vipLevel: 'None' as const },
    { convidado: 'Larissa Gomes', empresa: 'Gomes Pharmaceuticals', telephone: '+55 11 91111-1001', email: 'larissa@gomespharma.com', guestType: 'Guest' as const, status: 'Invited' as const, rsvpStatus: 'Pending' as const, vipLevel: 'None' as const },
    { convidado: 'Rafael Teixeira', empresa: 'Teixeira Motors', telephone: '+55 11 90000-1001', email: 'rafael@teixeiramotors.com', guestType: 'Guest' as const, status: 'Confirmed' as const, rsvpStatus: 'Confirmed' as const, vipLevel: 'VIP' as const, notes: 'Arriving with personal driver' },
  ];

  const guests = [];
  for (const g of guestData) {
    const guest = await prisma.guest.create({
      data: { eventId: event.id, ...g },
    });
    guests.push(guest);
  }

  console.log('Guests created');

  // Set linked primary guest references
  // Ana Silva -> Carlos Silva
  await prisma.guest.update({
    where: { id: guests[1].id },
    data: { linkedPrimaryGuestId: guests[0].id },
  });
  // João Costa -> Maria Costa
  await prisma.guest.update({
    where: { id: guests[4].id },
    data: { linkedPrimaryGuestId: guests[3].id, linkedGroupName: 'Costa Family' },
  });
  // Patricia Almeida -> Fernando Almeida
  await prisma.guest.update({
    where: { id: guests[7].id },
    data: { linkedPrimaryGuestId: guests[6].id },
  });
  // Juliana Pereira -> André Pereira
  await prisma.guest.update({
    where: { id: guests[11].id },
    data: { linkedPrimaryGuestId: guests[10].id },
  });
  // Sofia Ribeiro -> Eduardo Nascimento
  await prisma.guest.update({
    where: { id: guests[21].id },
    data: { linkedPrimaryGuestId: guests[20].id },
  });

  // Create relationships
  const relationships = [
    { guestId: guests[0].id, relatedGuestId: guests[1].id, relationshipType: 'Spouse' as const, notes: 'Married couple' },
    { guestId: guests[0].id, relatedGuestId: guests[2].id, relationshipType: 'Officer' as const, notes: 'EA to CEO' },
    { guestId: guests[3].id, relatedGuestId: guests[4].id, relationshipType: 'Spouse' as const },
    { guestId: guests[6].id, relatedGuestId: guests[7].id, relationshipType: 'Spouse' as const },
    { guestId: guests[10].id, relatedGuestId: guests[11].id, relationshipType: 'Spouse' as const },
    { guestId: guests[20].id, relatedGuestId: guests[21].id, relationshipType: 'Spouse' as const },
    { guestId: guests[0].id, relatedGuestId: guests[6].id, relationshipType: 'KeepClose' as const, notes: 'Business partners - seat nearby' },
    { guestId: guests[3].id, relatedGuestId: guests[5].id, relationshipType: 'SameTable' as const, notes: 'Close friends' },
  ];

  for (const r of relationships) {
    await prisma.guestRelationship.create({
      data: { eventId: event.id, ...r },
    });
  }

  console.log('Relationships created');

  // Create seating assignments (some guests assigned)
  const seatingAssignments = [
    { guestId: guests[0].id, tableId: tables[0].id, seatNumber: 1 }, // Carlos -> VIP Table 1
    { guestId: guests[1].id, tableId: tables[0].id, seatNumber: 2 }, // Ana -> VIP Table 1
    { guestId: guests[2].id, tableId: tables[0].id, seatNumber: 3 }, // Roberto -> VIP Table 1
    { guestId: guests[6].id, tableId: tables[0].id, seatNumber: 4 }, // Fernando -> VIP Table 1
    { guestId: guests[7].id, tableId: tables[0].id, seatNumber: 5 }, // Patricia -> VIP Table 1
    { guestId: guests[3].id, tableId: tables[1].id, seatNumber: 1 }, // Maria -> VIP Table 2
    { guestId: guests[4].id, tableId: tables[1].id, seatNumber: 2 }, // João -> VIP Table 2
    { guestId: guests[5].id, tableId: tables[1].id, seatNumber: 3 }, // Luciana -> VIP Table 2
    { guestId: guests[10].id, tableId: tables[2].id, seatNumber: 1 }, // André -> Table 3
    { guestId: guests[11].id, tableId: tables[2].id, seatNumber: 2 }, // Juliana -> Table 3
    { guestId: guests[12].id, tableId: tables[2].id, seatNumber: 3 }, // Marcos -> Table 3
  ];

  for (const sa of seatingAssignments) {
    await prisma.seatingAssignment.create({
      data: { eventId: event.id, ...sa },
    });
  }

  console.log('Seating assignments created');

  // Create custom fields
  const customFields = [
    { fieldName: 'Parking Required', fieldType: 'CHECKBOX' as const, isFilterable: true, showInGrid: true, sortOrder: 1 },
    { fieldName: 'Arrival Method', fieldType: 'SELECT' as const, options: ['Car', 'Taxi', 'Driver', 'Public Transport'], isFilterable: true, showInGrid: false, sortOrder: 2 },
    { fieldName: 'Special Accommodation', fieldType: 'TEXTAREA' as const, isFilterable: false, showInGrid: false, sortOrder: 3 },
    { fieldName: 'Gift Preference', fieldType: 'SELECT' as const, options: ['Wine', 'Book', 'Art Piece', 'Donation in Name'], isFilterable: true, showInGrid: false, sortOrder: 4 },
  ];

  for (const cf of customFields) {
    await prisma.customField.create({
      data: { eventId: event.id, ...cf },
    });
  }

  console.log('Custom fields created');

  // Create saved views
  const defaultViews = [
    {
      viewName: 'All Guests',
      isDefault: true,
      config: {
        visibleColumns: ['convidado', 'empresa', 'telephone', 'email', 'guestType', 'status', 'rsvpStatus', 'vipLevel', 'table', 'seat', 'linkedGroupName', 'checkedIn'],
        columnOrder: ['convidado', 'empresa', 'telephone', 'email', 'guestType', 'status', 'rsvpStatus', 'vipLevel', 'table', 'seat', 'linkedGroupName', 'checkedIn'],
        columnWidths: {},
        frozenColumns: ['convidado'],
        filters: [],
        sorting: [{ field: 'convidado', direction: 'asc' }],
      },
    },
    {
      viewName: 'Confirmed',
      config: {
        visibleColumns: ['convidado', 'empresa', 'email', 'vipLevel', 'table', 'seat', 'dietaryRestrictions'],
        columnOrder: ['convidado', 'empresa', 'email', 'vipLevel', 'table', 'seat', 'dietaryRestrictions'],
        columnWidths: {},
        frozenColumns: ['convidado'],
        filters: [{ field: 'rsvpStatus', operator: 'eq', value: 'Confirmed' }],
        sorting: [{ field: 'convidado', direction: 'asc' }],
      },
    },
    {
      viewName: 'Declined',
      config: {
        visibleColumns: ['convidado', 'empresa', 'email', 'notes'],
        columnOrder: ['convidado', 'empresa', 'email', 'notes'],
        columnWidths: {},
        frozenColumns: [],
        filters: [{ field: 'rsvpStatus', operator: 'eq', value: 'Declined' }],
        sorting: [{ field: 'convidado', direction: 'asc' }],
      },
    },
    {
      viewName: 'Pending RSVP',
      config: {
        visibleColumns: ['convidado', 'empresa', 'email', 'telephone', 'status', 'notes'],
        columnOrder: ['convidado', 'empresa', 'email', 'telephone', 'status', 'notes'],
        columnWidths: {},
        frozenColumns: [],
        filters: [{ field: 'rsvpStatus', operator: 'eq', value: 'Pending' }],
        sorting: [{ field: 'convidado', direction: 'asc' }],
      },
    },
    {
      viewName: 'Unassigned Tables',
      config: {
        visibleColumns: ['convidado', 'empresa', 'status', 'rsvpStatus', 'vipLevel', 'linkedGroupName'],
        columnOrder: ['convidado', 'empresa', 'status', 'rsvpStatus', 'vipLevel', 'linkedGroupName'],
        columnWidths: {},
        frozenColumns: [],
        filters: [{ field: 'hasTable', operator: 'eq', value: 'false' }],
        sorting: [{ field: 'vipLevel', direction: 'desc' }],
      },
    },
    {
      viewName: 'VIP',
      config: {
        visibleColumns: ['convidado', 'empresa', 'email', 'vipLevel', 'status', 'rsvpStatus', 'table', 'seat', 'notes'],
        columnOrder: ['convidado', 'empresa', 'email', 'vipLevel', 'status', 'rsvpStatus', 'table', 'seat', 'notes'],
        columnWidths: {},
        frozenColumns: ['convidado'],
        filters: [{ field: 'vipLevel', operator: 'in', value: ['VIP', 'VVIP'] }],
        sorting: [{ field: 'vipLevel', direction: 'desc' }],
      },
    },
    {
      viewName: 'Checked-In',
      config: {
        visibleColumns: ['convidado', 'empresa', 'checkedIn', 'checkedInAt', 'table', 'seat'],
        columnOrder: ['convidado', 'empresa', 'checkedIn', 'checkedInAt', 'table', 'seat'],
        columnWidths: {},
        frozenColumns: [],
        filters: [{ field: 'checkedIn', operator: 'eq', value: 'true' }],
        sorting: [{ field: 'checkedInAt', direction: 'desc' }],
      },
    },
  ];

  for (const v of defaultViews) {
    await prisma.savedView.create({
      data: {
        eventId: event.id,
        viewName: v.viewName,
        isDefault: v.isDefault || false,
        config: v.config,
        createdBy: admin.id,
      },
    });
  }

  console.log('Saved views created');

  // Create sample import job record
  await prisma.importJob.create({
    data: {
      eventId: event.id,
      fileName: 'initial_guest_list_2026.xlsx',
      fileSize: 45678,
      totalRows: 15,
      importedRows: 14,
      skippedRows: 1,
      errorRows: 0,
      status: 'COMPLETED',
      columnMapping: {
        'Nome': 'convidado',
        'Empresa': 'empresa',
        'Telefone': 'telephone',
        'E-mail': 'email',
        'Tipo': 'guestType',
      },
      importedBy: admin.id,
      completedAt: new Date('2026-03-01T10:30:00'),
    },
  });

  console.log('Import job record created');

  // Create sample audit logs
  const auditEntries = [
    { entityType: 'Event', entityId: event.id, action: 'EVENT_CREATED', summary: 'Created event: Annual Corporate Gala 2026' },
    { entityType: 'Guest', entityId: guests[0].id, action: 'GUEST_CREATED', summary: 'Created guest: Carlos Eduardo Silva' },
    { entityType: 'Guest', entityId: guests[0].id, action: 'RSVP_CHANGED', summary: 'RSVP: Pending -> Confirmed', details: { before: 'Pending', after: 'Confirmed' } },
    { entityType: 'SeatingAssignment', entityId: guests[0].id, action: 'SEAT_CHANGED', summary: 'Assigned Carlos Eduardo Silva to VIP Table 1, Seat 1' },
    { entityType: 'Import', entityId: event.id, action: 'IMPORT_PERFORMED', summary: 'Imported 14 guests from initial_guest_list_2026.xlsx' },
    { entityType: 'GuestRelationship', entityId: guests[0].id, action: 'RELATIONSHIP_CREATED', summary: 'Linked Carlos Eduardo Silva and Ana Beatriz Silva as Spouse' },
  ];

  for (const a of auditEntries) {
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        eventId: event.id,
        ...a,
        details: (a as any).details || null,
      },
    });
  }

  console.log('Audit logs created');

  // Check in a couple of guests
  await prisma.guest.update({
    where: { id: guests[12].id },
    data: { checkedIn: true, checkedInAt: new Date('2026-03-15T19:15:00'), status: 'Checked_In' },
  });

  await prisma.checkInLog.create({
    data: {
      eventId: event.id,
      guestId: guests[12].id,
      action: 'CHECK_IN',
      notes: 'Arrived on time',
      performedBy: checkinUser.id,
    },
  });

  console.log('Sample check-in created');
  console.log('');
  console.log('=== Seed Complete ===');
  console.log('');
  console.log('Default credentials:');
  console.log('  Admin:    admin / admin123');
  console.log('  Editor:   editor / editor123');
  console.log('  Viewer:   viewer / viewer123');
  console.log('  Check-In: checkin / checkin123');
  console.log('');
  console.log(`Event: "${event.eventName}" (${event.id})`);
  console.log(`Guests: ${guests.length}`);
  console.log(`Tables: ${tables.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
