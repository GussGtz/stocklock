import { PrismaClient, Role, ProductUnit } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // ─────────────────────────────────────────────
  // ADMIN USER
  // ─────────────────────────────────────────────
  const hashedPassword = await bcryptjs.hash('Admin123456!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@stocklock.com' },
    update: {},
    create: {
      email: 'admin@stocklock.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'StockLock',
      role: Role.ADMIN,
      isActive: true,
      phone: '+52 555 000 0001',
    },
  });

  console.log(`Admin user created: ${admin.email}`);

  // ─────────────────────────────────────────────
  // DEFAULT WAREHOUSE
  // ─────────────────────────────────────────────
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-001' },
    update: {},
    create: {
      name: 'Almacén Principal',
      code: 'WH-001',
      address: 'Av. Industrial 123, Col. Parque Industrial, Ciudad de México',
      isDefault: true,
      isActive: true,
    },
  });

  console.log(`Warehouse created: ${warehouse.name}`);

  // ─────────────────────────────────────────────
  // CATEGORIES
  // ─────────────────────────────────────────────
  const categoryData = [
    {
      name: 'Láminas de Aluminio',
      description: 'Láminas planas de aluminio en diversas aleaciones y calibres',
      color: '#3B82F6',
    },
    {
      name: 'Perfiles Estructurales',
      description: 'Perfiles de aluminio para construcción y estructuras',
      color: '#10B981',
    },
    {
      name: 'Tubería y Redondo',
      description: 'Tubos, varillas y redondos de aluminio',
      color: '#F59E0B',
    },
    {
      name: 'Ángulos y Canales',
      description: 'Ángulos, canales y barras en T de aluminio',
      color: '#8B5CF6',
    },
    {
      name: 'Aleaciones Especiales',
      description: 'Aleaciones de alta resistencia y aplicaciones especiales',
      color: '#EF4444',
    },
  ];

  const categories: any[] = [];
  for (const cat of categoryData) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categories.push(category);
    console.log(`Category created: ${category.name}`);
  }

  // ─────────────────────────────────────────────
  // PRODUCTS
  // ─────────────────────────────────────────────
  const productData = [
    {
      code: 'LAM-1100-1.0',
      name: 'Lámina Aluminio 1100-H14 1.0mm',
      description: 'Lámina de aluminio puro 1100, temple H14, calibre 1.0mm',
      categoryId: categories[0].id,
      unit: ProductUnit.KG,
      thickness: 1.0,
      width: 1220,
      length: 2440,
      costPrice: 55.5,
      salePrice: 72.0,
      minStock: 500,
      maxStock: 5000,
      currentStock: 1200,
      alloyType: '1100',
      temper: 'H14',
      isAluminum: true,
    },
    {
      code: 'LAM-3003-1.5',
      name: 'Lámina Aluminio 3003-H14 1.5mm',
      description: 'Lámina de aluminio 3003, temple H14, calibre 1.5mm',
      categoryId: categories[0].id,
      unit: ProductUnit.KG,
      thickness: 1.5,
      width: 1220,
      length: 2440,
      costPrice: 58.0,
      salePrice: 75.5,
      minStock: 300,
      maxStock: 3000,
      currentStock: 850,
      alloyType: '3003',
      temper: 'H14',
      isAluminum: true,
    },
    {
      code: 'LAM-5052-2.0',
      name: 'Lámina Aluminio 5052-H32 2.0mm',
      description: 'Lámina aleación 5052 alta resistencia, temple H32',
      categoryId: categories[0].id,
      unit: ProductUnit.KG,
      thickness: 2.0,
      width: 1220,
      length: 2440,
      costPrice: 65.0,
      salePrice: 84.5,
      minStock: 200,
      maxStock: 2000,
      currentStock: 450,
      alloyType: '5052',
      temper: 'H32',
      isAluminum: true,
    },
    {
      code: 'PERF-6061-T6-2X2',
      name: 'Perfil Cuadrado 6061-T6 2"x2"',
      description: 'Perfil cuadrado de aluminio estructural 6061-T6',
      categoryId: categories[1].id,
      unit: ProductUnit.METER,
      width: 50.8,
      thickness: 3.175,
      costPrice: 145.0,
      salePrice: 188.5,
      minStock: 100,
      maxStock: 1000,
      currentStock: 320,
      alloyType: '6061',
      temper: 'T6',
      isAluminum: true,
    },
    {
      code: 'PERF-6063-T5-REC',
      name: 'Perfil Rectangular 6063-T5 2"x1"',
      description: 'Perfil rectangular extruido 6063-T5 para acabados arquitectónicos',
      categoryId: categories[1].id,
      unit: ProductUnit.METER,
      width: 50.8,
      length: 25.4,
      thickness: 2.5,
      costPrice: 98.0,
      salePrice: 127.4,
      minStock: 150,
      maxStock: 1500,
      currentStock: 280,
      alloyType: '6063',
      temper: 'T5',
      isAluminum: true,
    },
    {
      code: 'TUB-6061-T6-2',
      name: 'Tubo Redondo 6061-T6 2" Sch40',
      description: 'Tubo redondo de aluminio 6061-T6, 2 pulgadas cédula 40',
      categoryId: categories[2].id,
      unit: ProductUnit.METER,
      width: 60.3,
      thickness: 3.91,
      costPrice: 220.0,
      salePrice: 286.0,
      minStock: 50,
      maxStock: 500,
      currentStock: 180,
      alloyType: '6061',
      temper: 'T6',
      isAluminum: true,
    },
    {
      code: 'VAR-6061-T6-1',
      name: 'Varilla Redonda 6061-T6 1"',
      description: 'Varilla redonda sólida de aluminio 6061-T6, 1 pulgada',
      categoryId: categories[2].id,
      unit: ProductUnit.METER,
      width: 25.4,
      costPrice: 85.0,
      salePrice: 110.5,
      minStock: 100,
      maxStock: 800,
      currentStock: 95,
      alloyType: '6061',
      temper: 'T6',
      isAluminum: true,
    },
    {
      code: 'ANG-6063-T5-2X2',
      name: 'Ángulo Aluminio 6063-T5 2"x2"x1/8"',
      description: 'Ángulo de aluminio 6063-T5, lados iguales 2"x2"x1/8"',
      categoryId: categories[3].id,
      unit: ProductUnit.METER,
      width: 50.8,
      thickness: 3.175,
      costPrice: 112.0,
      salePrice: 145.6,
      minStock: 80,
      maxStock: 800,
      currentStock: 210,
      alloyType: '6063',
      temper: 'T5',
      isAluminum: true,
    },
    {
      code: 'LAM-7075-T6-3.0',
      name: 'Lámina Aluminio 7075-T6 3.0mm',
      description: 'Lámina de alta resistencia 7075-T6, aplicaciones aeroespaciales',
      categoryId: categories[4].id,
      unit: ProductUnit.KG,
      thickness: 3.0,
      width: 1220,
      length: 2440,
      costPrice: 145.0,
      salePrice: 188.5,
      minStock: 50,
      maxStock: 500,
      currentStock: 30,
      alloyType: '7075',
      temper: 'T6',
      isAluminum: true,
    },
    {
      code: 'LAM-2024-T4-2.0',
      name: 'Lámina Aluminio 2024-T4 2.0mm',
      description: 'Lámina 2024-T4 alta resistencia a la fatiga',
      categoryId: categories[4].id,
      unit: ProductUnit.KG,
      thickness: 2.0,
      width: 1000,
      length: 2000,
      costPrice: 135.0,
      salePrice: 175.5,
      minStock: 40,
      maxStock: 400,
      currentStock: 120,
      alloyType: '2024',
      temper: 'T4',
      isAluminum: true,
    },
  ];

  const products: any[] = [];
  for (const prod of productData) {
    const product = await prisma.product.upsert({
      where: { code: prod.code },
      update: {},
      create: prod,
    });
    products.push(product);
    console.log(`Product created: ${product.code} - ${product.name}`);

    // Create inventory item in default warehouse
    await prisma.inventoryItem.upsert({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: warehouse.id,
        },
      },
      update: {},
      create: {
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: prod.currentStock,
      },
    });
  }

  // ─────────────────────────────────────────────
  // SUPPLIERS
  // ─────────────────────────────────────────────
  const supplierData = [
    {
      code: 'PROV-001',
      name: 'Aluminios del Norte S.A. de C.V.',
      rfc: 'ANO901215ABC',
      email: 'ventas@aluminiosnorte.com.mx',
      phone: '+52 81 8123 4567',
      address: 'Blvd. Industrial Norte 500, Monterrey, N.L.',
      city: 'Monterrey',
      country: 'México',
      contactName: 'Ing. Carlos Mendoza',
      paymentTerms: 30,
      rating: 5,
      notes: 'Proveedor principal de láminas y perfiles. Entrega en 5-7 días.',
    },
    {
      code: 'PROV-002',
      name: 'Metalúrgica Guadalajara S.A.',
      rfc: 'MGA851030XYZ',
      email: 'compras@metalgdl.com',
      phone: '+52 33 3456 7890',
      address: 'Av. Vallarta 2000, Guadalajara, Jalisco',
      city: 'Guadalajara',
      country: 'México',
      contactName: 'Lic. Sofía Rodríguez',
      paymentTerms: 45,
      rating: 4,
      notes: 'Especialista en aleaciones especiales y perfiles extruidos.',
    },
    {
      code: 'PROV-003',
      name: 'Grupo Alumex Internacional',
      rfc: 'GAI960720DEF',
      email: 'info@alumexint.com',
      phone: '+52 55 5678 9012',
      address: 'Periférico Sur 3000, Ciudad de México',
      city: 'Ciudad de México',
      country: 'México',
      contactName: 'Sr. Roberto Castillo',
      paymentTerms: 15,
      rating: 4,
      notes: 'Distribuidor nacional con almacén en CDMX. Buena disponibilidad.',
    },
  ];

  for (const sup of supplierData) {
    const supplier = await prisma.supplier.upsert({
      where: { code: sup.code },
      update: {},
      create: sup,
    });
    console.log(`Supplier created: ${supplier.code} - ${supplier.name}`);
  }

  // ─────────────────────────────────────────────
  // CUSTOMERS
  // ─────────────────────────────────────────────
  const customerData = [
    {
      code: 'CLI-001',
      name: 'Constructora Moderna S.A. de C.V.',
      rfc: 'CMO780512GHI',
      email: 'compras@constructoramoderna.com',
      phone: '+52 55 1234 5678',
      address: 'Insurgentes Sur 1500, Col. Del Valle, Ciudad de México',
      city: 'Ciudad de México',
      country: 'México',
      contactName: 'Arq. María González',
      creditLimit: 500000,
      paymentTerms: 30,
      priceLevel: 2,
      notes: 'Cliente frecuente. Compras mensuales promedio de $150,000.',
    },
    {
      code: 'CLI-002',
      name: 'Industrias Metalpack del Bajío S.A.',
      rfc: 'IMB920318JKL',
      email: 'gerencia@metalpackbajio.com',
      phone: '+52 477 123 4567',
      address: 'Blvd. Torres Landa 800, León, Gto.',
      city: 'León',
      country: 'México',
      contactName: 'Ing. Javier Torres',
      creditLimit: 300000,
      paymentTerms: 15,
      priceLevel: 1,
      notes: 'Manufactura de autopartes. Requiere material certificado.',
    },
    {
      code: 'CLI-003',
      name: 'Estructuras y Talleres Regiomontanos',
      rfc: 'ETR011125MNO',
      email: 'ventas@estructurasy talleres.mx',
      phone: '+52 81 9876 5432',
      address: 'Av. Universidad 450, San Nicolás, N.L.',
      city: 'San Nicolás de los Garza',
      country: 'México',
      contactName: 'Sr. Luis Herrera',
      creditLimit: 200000,
      paymentTerms: 0,
      priceLevel: 1,
      notes: 'Pago de contado. Compras puntuales de perfiles estructurales.',
    },
  ];

  for (const cust of customerData) {
    const customer = await prisma.customer.upsert({
      where: { code: cust.code },
      update: {},
      create: cust,
    });
    console.log(`Customer created: ${customer.code} - ${customer.name}`);
  }

  // ─────────────────────────────────────────────
  // ALUMINUM SECTORS
  // ─────────────────────────────────────────────
  const sectorData = [
    {
      emoji: '🔩',
      name: 'Construcción y Arquitectura',
      types: ['Ventanas', 'Puertas', 'Canceles de baño', 'Fachadas modernas', 'Techos ligeros', 'Estructuras'],
    },
    {
      emoji: '🪑',
      name: 'Muebles Modernos',
      types: ['Mesas', 'Escritorios', 'Estanterías flotantes', 'Sillas industriales', 'Muebles tipo loft'],
    },
    {
      emoji: '⚙️',
      name: 'Industria y Maquinaria',
      types: ['Piezas mecánicas', 'Soportes estructurales', 'Perfiles para maquinaria', 'Disipadores de calor'],
    },
    {
      emoji: '🚗',
      name: 'Automotriz',
      types: ['Rines', 'Partes del motor', 'Carrocerías ligeras', 'Accesorios tuning'],
    },
    {
      emoji: '✈️',
      name: 'Aeronáutica',
      types: ['Partes de aviones', 'Estructuras ligeras'],
    },
    {
      emoji: '📦',
      name: 'Empaques y Uso Diario',
      types: ['Latas', 'Papel aluminio', 'Envases', 'Tapas'],
    },
    {
      emoji: '💡',
      name: 'Electrónica',
      types: ['Carcasas de laptops', 'Teléfonos', 'Disipadores de calor electrónico'],
    },
    {
      emoji: '🎨',
      name: 'Diseño y Decoración',
      types: ['Lámparas modernas', 'Cuadros decorativos', 'Letras 3D', 'Paneles decorativos', 'Marcos'],
    },
  ];

  for (let i = 0; i < sectorData.length; i++) {
    const { emoji, name, types } = sectorData[i];
    const sector = await prisma.aluminumSector.upsert({
      where: { name },
      update: {},
      create: { name, emoji, sortOrder: i },
    });
    console.log(`Sector created: ${emoji} ${sector.name}`);

    for (let j = 0; j < types.length; j++) {
      const typeName = types[j];
      await prisma.aluminumType.upsert({
        where: { name_sectorId: { name: typeName, sectorId: sector.id } },
        update: {},
        create: { name: typeName, sectorId: sector.id, sortOrder: j },
      });
      console.log(`  Type created: ${typeName}`);
    }
  }

  // ─────────────────────────────────────────────
  // ALUMINUM SERIES
  // ─────────────────────────────────────────────
  const seriesData = [
    {
      code: '1000',
      name: 'Serie 1000 — Aluminio Puro',
      principalAlloy: 'Aluminio puro (≥99%)',
      description: 'Contiene un 99% de aluminio o más. Excelente conductor eléctrico y térmico, muy resistente a la corrosión pero con baja resistencia mecánica.',
      applications: 'Cableado eléctrico, papel aluminio, condensadores, intercambiadores de calor.',
      sortOrder: 1,
    },
    {
      code: '2000',
      name: 'Serie 2000 — Aluminio-Cobre',
      principalAlloy: 'Cobre (Cu)',
      description: 'Ofrece alta dureza y resistencia similar al acero, pero con menor resistencia a la corrosión. Requiere tratamiento superficial.',
      applications: 'Industria aeroespacial, piezas estructurales de aviones, componentes que soportan grandes esfuerzos.',
      sortOrder: 2,
    },
    {
      code: '3000',
      name: 'Serie 3000 — Aluminio-Manganeso',
      principalAlloy: 'Manganeso (Mn)',
      description: 'Buena resistencia media y muy maleable. No es tratable térmicamente pero sí trabajable en frío.',
      applications: 'Utensilios de cocina, latas de refresco, conductos de aire acondicionado, techos y fachadas.',
      sortOrder: 3,
    },
    {
      code: '4000',
      name: 'Serie 4000 — Aluminio-Silicio',
      principalAlloy: 'Silicio (Si)',
      description: 'El silicio reduce el punto de fusión del aluminio. Buena fluidez en estado líquido y bajo coeficiente de expansión térmica.',
      applications: 'Hilos y varillas de soldadura, piezas de fundición, pistones de motores.',
      sortOrder: 4,
    },
    {
      code: '5000',
      name: 'Serie 5000 — Aluminio-Magnesio',
      principalAlloy: 'Magnesio (Mg)',
      description: 'Excepcional resistencia a la corrosión, especialmente en ambientes marinos y salinos. Buena soldabilidad.',
      applications: 'Industria naval (cascos de barcos, muelles), tanques de almacenamiento, vehículos de transporte.',
      sortOrder: 5,
    },
    {
      code: '6000',
      name: 'Serie 6000 — Aluminio-Magnesio-Silicio',
      principalAlloy: 'Magnesio (Mg) + Silicio (Si)',
      description: 'La más versátil y ampliamente utilizada. Excelente extruibilidad y soldabilidad. Tratamiento térmico T6 muy común.',
      applications: 'Perfiles de ventanas y puertas (6063), estructuras arquitectónicas, bicicletas, marcos y vigas.',
      sortOrder: 6,
    },
    {
      code: '7000',
      name: 'Serie 7000 — Aluminio-Zinc',
      principalAlloy: 'Zinc (Zn)',
      description: 'La serie más resistente disponible comercialmente. Alta relación resistencia/peso. Mayor susceptibilidad a la corrosión bajo tensión.',
      applications: 'Aviones militares, equipo de alta competición, herramientas deportivas de alto rendimiento, piezas aeroespaciales.',
      sortOrder: 7,
    },
  ];

  for (const s of seriesData) {
    const series = await prisma.aluminumSeries.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
    console.log(`Series created: ${series.code} - ${series.name}`);
  }

  console.log('\nSeed completed successfully!');
  console.log('─────────────────────────────────────');
  console.log('Login credentials:');
  console.log('  Email:    admin@stocklock.com');
  console.log('  Password: Admin123456!');
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
