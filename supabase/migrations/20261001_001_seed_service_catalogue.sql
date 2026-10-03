-- ============================================================================
-- MIGRATION: Seed Indian Home Services Catalogue
-- File: 20261001_001_seed_service_catalogue.sql
-- Created: 2026-10-01
--
-- Inserts realistic Indian home-services data:
--   • 6 categories
--   • 29 services (fixed / inspection / quote_after_inspection pricing)
--   • 42 service options with values and price modifiers
--   • 18 brands (Indian market: Havells, Asian Paints, Jaquar, etc.)
--   • 30 materials
--   • service_materials mapping
--
-- Idempotent: uses ON CONFLICT DO NOTHING on slug/name UNIQUE columns
-- ============================================================================

-- ============================================================================
-- 1. SERVICE CATEGORIES
-- ============================================================================

INSERT INTO public.service_categories
  (id, name, slug, description, icon_key, is_active, sort_order)
VALUES
  (
    'cat_elec_0001-0000-0000-000000000001',
    'Electrical',
    'electrical',
    'Wiring faults, sockets, switches, MCBs, fans, lights, and general electrical repairs for homes and apartments.',
    'lightbulb',
    true, 10
  ),
  (
    'cat_plmb_0001-0000-0000-000000000002',
    'Plumbing',
    'plumbing',
    'Leaks, blockages, tap repairs, pipe replacements, drainage issues, and water-pressure problems.',
    'wrench',
    true, 20
  ),
  (
    'cat_ac00_0001-0000-0000-000000000003',
    'AC & Cooling',
    'ac-cooling',
    'Air-conditioner servicing, gas refilling, installation, and cooling system repairs.',
    'wind',
    true, 30
  ),
  (
    'cat_appl_0001-0000-0000-000000000004',
    'Appliance Repair',
    'appliance-repair',
    'Washing machines, refrigerators, microwaves, geysers, and other household appliance repairs.',
    'cpu',
    true, 40
  ),
  (
    'cat_pnt_00001-0000-0000-000000000005',
    'Painting',
    'painting',
    'Interior and exterior wall painting, waterproofing, texture finishes, and wood polish.',
    'paintbrush',
    true, 50
  ),
  (
    'cat_carp_0001-0000-0000-000000000006',
    'Carpentry & Furniture',
    'carpentry',
    'Door and window repairs, furniture assembly, cabinet installation, and wood polishing.',
    'hammer',
    true, 60
  )
ON CONFLICT (slug) DO NOTHING;


-- ============================================================================
-- 2. SERVICES
-- ============================================================================

-- ── ELECTRICAL ──────────────────────────────────────────────────────────────

INSERT INTO public.services
  (id, category_id, name, slug, description, pricing_model, base_price,
   inspection_fee, estimated_duration_minutes, requires_inspection, is_active)
VALUES
  (
    'svc_elec_001-0000-0000-000000000001',
    'cat_elec_0001-0000-0000-000000000001',
    'Socket & Switch Repair',
    'socket-switch-repair',
    'Replacement or repair of faulty wall sockets, modular switches, or USB outlets.',
    'fixed', 349.00, NULL, 45, false, true
  ),
  (
    'svc_elec_002-0000-0000-000000000002',
    'cat_elec_0001-0000-0000-000000000001',
    'Fan Installation & Repair',
    'fan-installation-repair',
    'Ceiling fan installation, speed-regulator replacement, blade balancing, or motor repair.',
    'fixed', 499.00, NULL, 60, false, true
  ),
  (
    'svc_elec_003-0000-0000-000000000003',
    'cat_elec_0001-0000-0000-000000000001',
    'MCB / DB Box Fault',
    'mcb-db-box-fault',
    'Tripping MCBs, fuse replacement, earthing issues, or full DB box inspection and repair.',
    'inspection', NULL, 399.00, 60, true, true
  ),
  (
    'svc_elec_004-0000-0000-000000000004',
    'cat_elec_0001-0000-0000-000000000001',
    'Light Fixture Installation',
    'light-fixture-installation',
    'Installing pendant lights, LED panels, batten lights, or spotlights.',
    'fixed', 449.00, NULL, 45, false, true
  ),
  (
    'svc_elec_005-0000-0000-000000000005',
    'cat_elec_0001-0000-0000-000000000001',
    'New Wiring / Re-wiring',
    'wiring-rewiring',
    'Complete room re-wiring, new circuit addition, or conduit wiring for new construction.',
    'quote_after_inspection', NULL, 599.00, 120, true, true
  ),

-- ── PLUMBING ─────────────────────────────────────────────────────────────────

  (
    'svc_plmb_001-0000-0000-000000000006',
    'cat_plmb_0001-0000-0000-000000000002',
    'Tap / Faucet Repair',
    'tap-faucet-repair',
    'Dripping taps, broken handles, washer or cartridge replacement for kitchen and bathroom faucets.',
    'fixed', 299.00, NULL, 30, false, true
  ),
  (
    'svc_plmb_002-0000-0000-000000000007',
    'cat_plmb_0001-0000-0000-000000000002',
    'Drain & Pipe Blockage',
    'drain-pipe-blockage',
    'Kitchen sink, bathroom drain, floor trap, or toilet blockage cleared using jetting or rodding.',
    'fixed', 499.00, NULL, 60, false, true
  ),
  (
    'svc_plmb_003-0000-0000-000000000008',
    'cat_plmb_0001-0000-0000-000000000002',
    'Flush Tank Repair',
    'flush-tank-repair',
    'Continuous running flush, broken flush valve, float ball, or overflow pipe replacement.',
    'fixed', 399.00, NULL, 45, false, true
  ),
  (
    'svc_plmb_004-0000-0000-000000000009',
    'cat_plmb_0001-0000-0000-000000000002',
    'Water Pipe Leak Repair',
    'water-pipe-leak',
    'Visible or concealed pipe leaks, joint failures, and water hammer diagnosis.',
    'inspection', NULL, 349.00, 60, true, true
  ),
  (
    'svc_plmb_005-0000-0000-000000000010',
    'cat_plmb_0001-0000-0000-000000000002',
    'Bathroom Fitting Installation',
    'bathroom-fitting-installation',
    'New tap, shower head, health faucet, towel rod, or soap dispenser installation.',
    'fixed', 599.00, NULL, 90, false, true
  ),

-- ── AC & COOLING ──────────────────────────────────────────────────────────────

  (
    'svc_ac00_001-0000-0000-000000000011',
    'cat_ac00_0001-0000-0000-000000000003',
    'AC Regular Servicing',
    'ac-regular-service',
    'Filter cleaning, coil wash, drain flush, and performance check for split or window ACs.',
    'fixed', 699.00, NULL, 75, false, true
  ),
  (
    'svc_ac00_002-0000-0000-000000000012',
    'cat_ac00_0001-0000-0000-000000000003',
    'AC Gas Refilling (R32 / R410A)',
    'ac-gas-refilling',
    'Refrigerant top-up or full recharge for split ACs not cooling adequately.',
    'fixed', 1499.00, NULL, 60, false, true
  ),
  (
    'svc_ac00_003-0000-0000-000000000013',
    'cat_ac00_0001-0000-0000-000000000003',
    'AC Installation (Split)',
    'ac-installation-split',
    'New split AC indoor + outdoor unit installation including piping, drilling, and electrical connections.',
    'fixed', 1999.00, NULL, 180, false, true
  ),
  (
    'svc_ac00_004-0000-0000-000000000014',
    'cat_ac00_0001-0000-0000-000000000003',
    'AC Not Cooling — Diagnosis',
    'ac-not-cooling-diagnosis',
    'Full inspection for ACs that are running but not cooling. Gas leak, compressor, or PCB check.',
    'inspection', NULL, 499.00, 60, true, true
  ),
  (
    'svc_ac00_005-0000-0000-000000000015',
    'cat_ac00_0001-0000-0000-000000000003',
    'AC Deep Cleaning (Jet Wash)',
    'ac-deep-cleaning',
    'High-pressure jet wash of indoor and outdoor units to remove dirt, mold, and bacteria.',
    'fixed', 999.00, NULL, 90, false, true
  ),

-- ── APPLIANCE REPAIR ─────────────────────────────────────────────────────────

  (
    'svc_appl_001-0000-0000-000000000016',
    'cat_appl_0001-0000-0000-000000000004',
    'Washing Machine Repair',
    'washing-machine-repair',
    'Front-load or top-load washing machine — drum, motor, PCB, drain pump, or door seal issues.',
    'inspection', NULL, 399.00, 60, true, true
  ),
  (
    'svc_appl_002-0000-0000-000000000017',
    'cat_appl_0001-0000-0000-000000000004',
    'Refrigerator Repair',
    'refrigerator-repair',
    'Cooling issues, compressor, thermostat, ice-maker, or frost-free heater faults.',
    'inspection', NULL, 399.00, 60, true, true
  ),
  (
    'svc_appl_003-0000-0000-000000000018',
    'cat_appl_0001-0000-0000-000000000004',
    'Geyser / Water Heater Repair',
    'geyser-water-heater-repair',
    'Electric or instant geyser — heating element, thermostat, pressure valve, or tank leak.',
    'fixed', 549.00, NULL, 60, false, true
  ),
  (
    'svc_appl_004-0000-0000-000000000019',
    'cat_appl_0001-0000-0000-000000000004',
    'Microwave Repair',
    'microwave-repair',
    'Microwave oven not heating, turntable, door switch, or magnetron issues.',
    'inspection', NULL, 349.00, 45, true, true
  ),
  (
    'svc_appl_005-0000-0000-000000000020',
    'cat_appl_0001-0000-0000-000000000004',
    'Chimney / Exhaust Hood Servicing',
    'chimney-exhaust-servicing',
    'Deep cleaning of kitchen chimney filters, motor, and suction duct.',
    'fixed', 799.00, NULL, 90, false, true
  ),

-- ── PAINTING ──────────────────────────────────────────────────────────────────

  (
    'svc_pnt_0001-0000-0000-000000000021',
    'cat_pnt_00001-0000-0000-000000000005',
    'Interior Wall Painting (Per Room)',
    'interior-wall-painting-room',
    'Full interior wall painting including putty, primer, and two coats of emulsion — quoted per room.',
    'quote_after_inspection', NULL, 699.00, 480, true, true
  ),
  (
    'svc_pnt_0002-0000-0000-000000000022',
    'cat_pnt_00001-0000-0000-000000000005',
    'Exterior / Terrace Waterproofing',
    'exterior-waterproofing',
    'Terrace, parapet, or exterior wall waterproofing using Dr. Fixit or SikaFlex solutions.',
    'quote_after_inspection', NULL, 799.00, 240, true, true
  ),
  (
    'svc_pnt_0003-0000-0000-000000000023',
    'cat_pnt_00001-0000-0000-000000000005',
    'Wood / Door Polish & Paint',
    'wood-door-polish',
    'Sanding, wood primer, PU polish, or enamel paint for doors, windows, or furniture.',
    'fixed', 1299.00, NULL, 180, false, true
  ),
  (
    'svc_pnt_0004-0000-0000-000000000024',
    'cat_pnt_00001-0000-0000-000000000005',
    'Texture Finish (Feature Wall)',
    'texture-finish-feature-wall',
    'Sand, Venetian, or rustic texture finish on a feature wall up to 100 sq ft.',
    'fixed', 2499.00, NULL, 360, false, true
  ),

-- ── CARPENTRY & FURNITURE ────────────────────────────────────────────────────

  (
    'svc_carp_001-0000-0000-000000000025',
    'cat_carp_0001-0000-0000-000000000006',
    'Door Repair & Alignment',
    'door-repair-alignment',
    'Stiff, sagging, or squeaking doors — hinge replacement, frame adjustment, or lock repair.',
    'fixed', 449.00, NULL, 60, false, true
  ),
  (
    'svc_carp_002-0000-0000-000000000026',
    'cat_carp_0001-0000-0000-000000000006',
    'Furniture Assembly',
    'furniture-assembly',
    'IKEA, Nilkamal, or flat-pack furniture assembly for beds, wardrobes, or shelves.',
    'fixed', 599.00, NULL, 90, false, true
  ),
  (
    'svc_carp_003-0000-0000-000000000027',
    'cat_carp_0001-0000-0000-000000000006',
    'Cabinet / Wardrobe Repair',
    'cabinet-wardrobe-repair',
    'Broken hinges, loose drawer runners, handle replacement, or lock repair.',
    'fixed', 499.00, NULL, 60, false, true
  ),
  (
    'svc_carp_004-0000-0000-000000000028',
    'cat_carp_0001-0000-0000-000000000006',
    'Window Grill / Mesh Replacement',
    'window-grill-mesh',
    'Rusted window grill repair, mosquito mesh replacement, or sliding window track service.',
    'fixed', 699.00, NULL, 90, false, true
  ),
  (
    'svc_carp_005-0000-0000-000000000029',
    'cat_carp_0001-0000-0000-000000000006',
    'Custom Woodwork (Quote)',
    'custom-woodwork-quote',
    'Loft bed, TV unit, study table, or small storage unit — site inspection + custom quote.',
    'quote_after_inspection', NULL, 799.00, 120, true, true
  )
ON CONFLICT (slug) DO NOTHING;


-- ============================================================================
-- 3. SERVICE OPTIONS & VALUES
-- ============================================================================

-- ── Socket & Switch Repair options ──────────────────────────────────────────

INSERT INTO public.service_options (id, service_id, name, option_type, is_required, sort_order)
VALUES
  ('sopt_001-0000-0000-000000000001', 'svc_elec_001-0000-0000-000000000001',
   'Type of fitting',     'choice', true,  1),
  ('sopt_002-0000-0000-000000000002', 'svc_elec_001-0000-0000-000000000001',
   'Number of points',    'choice', true,  2)
ON CONFLICT DO NOTHING;

INSERT INTO public.service_option_values (service_option_id, label, value, price_modifier, is_active, sort_order)
VALUES
  ('sopt_001-0000-0000-000000000001', 'Standard socket (2-pin / 3-pin)', 'socket_standard', 0,      true, 1),
  ('sopt_001-0000-0000-000000000001', 'USB charging socket',             'socket_usb',      50.00,  true, 2),
  ('sopt_001-0000-0000-000000000001', '5-amp modular switch',            'switch_5a',       0,      true, 3),
  ('sopt_001-0000-0000-000000000001', '15-amp heavy duty socket',        'socket_15a',      80.00,  true, 4),
  ('sopt_002-0000-0000-000000000002', '1 point',                         '1',               0,      true, 1),
  ('sopt_002-0000-0000-000000000002', '2 points',                        '2',               200.00, true, 2),
  ('sopt_002-0000-0000-000000000002', '3 points',                        '3',               400.00, true, 3)
ON CONFLICT DO NOTHING;

-- ── Fan Installation options ─────────────────────────────────────────────────

INSERT INTO public.service_options (id, service_id, name, option_type, is_required, sort_order)
VALUES
  ('sopt_003-0000-0000-000000000003', 'svc_elec_002-0000-0000-000000000002',
   'Service type', 'choice', true, 1),
  ('sopt_004-0000-0000-000000000004', 'svc_elec_002-0000-0000-000000000002',
   'Fan type',     'choice', true, 2)
ON CONFLICT DO NOTHING;

INSERT INTO public.service_option_values (service_option_id, label, value, price_modifier, is_active, sort_order)
VALUES
  ('sopt_003-0000-0000-000000000003', 'New installation',          'install',       0,      true, 1),
  ('sopt_003-0000-0000-000000000003', 'Repair / speed issue',      'repair',        -100.00,true, 2),
  ('sopt_003-0000-0000-000000000003', 'Replace old fan',           'replace',       0,      true, 3),
  ('sopt_004-0000-0000-000000000004', 'Standard ceiling fan',      'ceiling_std',   0,      true, 1),
  ('sopt_004-0000-0000-000000000004', 'BLDC energy-saving fan',    'ceiling_bldc',  150.00, true, 2),
  ('sopt_004-0000-0000-000000000004', 'Exhaust fan',               'exhaust',       -100.00,true, 3),
  ('sopt_004-0000-0000-000000000004', 'Pedestal / table fan',      'pedestal',      -150.00,true, 4)
ON CONFLICT DO NOTHING;

-- ── AC Regular Servicing options ──────────────────────────────────────────────

INSERT INTO public.service_options (id, service_id, name, option_type, is_required, sort_order)
VALUES
  ('sopt_005-0000-0000-000000000005', 'svc_ac00_001-0000-0000-000000000011',
   'AC type',      'choice', true, 1),
  ('sopt_006-0000-0000-000000000006', 'svc_ac00_001-0000-0000-000000000011',
   'AC capacity',  'choice', true, 2),
  ('sopt_007-0000-0000-000000000007', 'svc_ac00_001-0000-0000-000000000011',
   'Number of units', 'choice', true, 3)
ON CONFLICT DO NOTHING;

INSERT INTO public.service_option_values (service_option_id, label, value, price_modifier, is_active, sort_order)
VALUES
  ('sopt_005-0000-0000-000000000005', 'Split AC',                     'split',    0,       true, 1),
  ('sopt_005-0000-0000-000000000005', 'Window AC',                    'window',   -100.00, true, 2),
  ('sopt_005-0000-0000-000000000005', 'Cassette / Ducted AC',         'cassette', 300.00,  true, 3),
  ('sopt_006-0000-0000-000000000006', '1.0 Ton',                      '1_ton',    0,       true, 1),
  ('sopt_006-0000-0000-000000000006', '1.5 Ton',                      '1_5_ton',  0,       true, 2),
  ('sopt_006-0000-0000-000000000006', '2.0 Ton',                      '2_ton',    200.00,  true, 3),
  ('sopt_007-0000-0000-000000000007', '1 unit',                       '1',        0,       true, 1),
  ('sopt_007-0000-0000-000000000007', '2 units',                      '2',        599.00,  true, 2),
  ('sopt_007-0000-0000-000000000007', '3 units',                      '3',        1198.00, true, 3)
ON CONFLICT DO NOTHING;

-- ── AC Gas Refilling options ──────────────────────────────────────────────────

INSERT INTO public.service_options (id, service_id, name, option_type, is_required, sort_order)
VALUES
  ('sopt_008-0000-0000-000000000008', 'svc_ac00_002-0000-0000-000000000012',
   'Gas type',    'choice', true, 1),
  ('sopt_009-0000-0000-000000000009', 'svc_ac00_002-0000-0000-000000000012',
   'AC capacity', 'choice', true, 2)
ON CONFLICT DO NOTHING;

INSERT INTO public.service_option_values (service_option_id, label, value, price_modifier, is_active, sort_order)
VALUES
  ('sopt_008-0000-0000-000000000008', 'R32 (new inverter ACs)',        'r32',      0,      true, 1),
  ('sopt_008-0000-0000-000000000008', 'R410A (older inverter ACs)',    'r410a',    0,      true, 2),
  ('sopt_008-0000-0000-000000000008', 'R22 (non-inverter / legacy)',   'r22',      -200.00,true, 3),
  ('sopt_009-0000-0000-000000000009', '1.0 Ton',                      '1_ton',    0,      true, 1),
  ('sopt_009-0000-0000-000000000009', '1.5 Ton',                      '1_5_ton',  200.00, true, 2),
  ('sopt_009-0000-0000-000000000009', '2.0 Ton',                      '2_ton',    400.00, true, 3)
ON CONFLICT DO NOTHING;

-- ── Washing Machine Repair options ───────────────────────────────────────────

INSERT INTO public.service_options (id, service_id, name, option_type, is_required, sort_order)
VALUES
  ('sopt_010-0000-0000-000000000010', 'svc_appl_001-0000-0000-000000000016',
   'Machine type',  'choice', true, 1),
  ('sopt_011-0000-0000-000000000011', 'svc_appl_001-0000-0000-000000000016',
   'Reported fault','choice', true, 2)
ON CONFLICT DO NOTHING;

INSERT INTO public.service_option_values (service_option_id, label, value, price_modifier, is_active, sort_order)
VALUES
  ('sopt_010-0000-0000-000000000010', 'Top-load',                    'top_load',   0,     true, 1),
  ('sopt_010-0000-0000-000000000010', 'Front-load',                  'front_load', 0,     true, 2),
  ('sopt_011-0000-0000-000000000011', 'Not draining',                'no_drain',   0,     true, 1),
  ('sopt_011-0000-0000-000000000011', 'Not spinning',                'no_spin',    0,     true, 2),
  ('sopt_011-0000-0000-000000000011', 'Not switching on',            'no_power',   0,     true, 3),
  ('sopt_011-0000-0000-000000000011', 'Excessive vibration / noise', 'vibration',  0,     true, 4),
  ('sopt_011-0000-0000-000000000011', 'Water leaking',               'leaking',    0,     true, 5)
ON CONFLICT DO NOTHING;

-- ── Interior Painting options ──────────────────────────────────────────────────

INSERT INTO public.service_options (id, service_id, name, option_type, is_required, sort_order)
VALUES
  ('sopt_012-0000-0000-000000000012', 'svc_pnt_0001-0000-0000-000000000021',
   'Paint brand',    'choice', true, 1),
  ('sopt_013-0000-0000-000000000013', 'svc_pnt_0001-0000-0000-000000000021',
   'Finish type',    'choice', true, 2),
  ('sopt_014-0000-0000-000000000014', 'svc_pnt_0001-0000-0000-000000000021',
   'Number of rooms','choice', true, 3)
ON CONFLICT DO NOTHING;

INSERT INTO public.service_option_values (service_option_id, label, value, price_modifier, is_active, sort_order)
VALUES
  ('sopt_012-0000-0000-000000000012', 'Asian Paints Tractor Emulsion',  'asian_tractor',    0,       true, 1),
  ('sopt_012-0000-0000-000000000012', 'Asian Paints Royale',            'asian_royale',     800.00,  true, 2),
  ('sopt_012-0000-0000-000000000012', 'Nerolac Excel',                  'nerolac_excel',    200.00,  true, 3),
  ('sopt_012-0000-0000-000000000012', 'Berger Silk',                    'berger_silk',      500.00,  true, 4),
  ('sopt_013-0000-0000-000000000013', 'Matt finish',                    'matt',             0,       true, 1),
  ('sopt_013-0000-0000-000000000013', 'Sheen / silk finish',            'sheen',            300.00,  true, 2),
  ('sopt_013-0000-0000-000000000013', 'Gloss finish',                   'gloss',            400.00,  true, 3),
  ('sopt_014-0000-0000-000000000014', '1 room',                         '1',                0,       true, 1),
  ('sopt_014-0000-0000-000000000014', '2 rooms',                        '2',                5500.00, true, 2),
  ('sopt_014-0000-0000-000000000014', '3 rooms',                        '3',                10500.00,true, 3),
  ('sopt_014-0000-0000-000000000014', 'Full 2BHK',                      '2bhk',             14000.00,true, 4),
  ('sopt_014-0000-0000-000000000014', 'Full 3BHK',                      '3bhk',             21000.00,true, 5)
ON CONFLICT DO NOTHING;

-- ── Tap / Faucet Repair options ───────────────────────────────────────────────

INSERT INTO public.service_options (id, service_id, name, option_type, is_required, sort_order)
VALUES
  ('sopt_015-0000-0000-000000000015', 'svc_plmb_001-0000-0000-000000000006',
   'Fault type', 'choice', true, 1)
ON CONFLICT DO NOTHING;

INSERT INTO public.service_option_values (service_option_id, label, value, price_modifier, is_active, sort_order)
VALUES
  ('sopt_015-0000-0000-000000000015', 'Dripping / leaking tap',   'drip',     0,    true, 1),
  ('sopt_015-0000-0000-000000000015', 'Broken handle or spout',   'broken',   0,    true, 2),
  ('sopt_015-0000-0000-000000000015', 'Low water pressure',       'pressure', 0,    true, 3),
  ('sopt_015-0000-0000-000000000015', 'Full tap replacement',     'replace',  150.00,true,4)
ON CONFLICT DO NOTHING;

-- ── Door Repair options ────────────────────────────────────────────────────────

INSERT INTO public.service_options (id, service_id, name, option_type, is_required, sort_order)
VALUES
  ('sopt_016-0000-0000-000000000016', 'svc_carp_001-0000-0000-000000000025',
   'Door material', 'choice', true, 1),
  ('sopt_017-0000-0000-000000000017', 'svc_carp_001-0000-0000-000000000025',
   'Issue',         'choice', true, 2)
ON CONFLICT DO NOTHING;

INSERT INTO public.service_option_values (service_option_id, label, value, price_modifier, is_active, sort_order)
VALUES
  ('sopt_016-0000-0000-000000000016', 'Wooden door',         'wood',      0,      true, 1),
  ('sopt_016-0000-0000-000000000016', 'Flush door (PVC)',    'flush_pvc', -50.00, true, 2),
  ('sopt_016-0000-0000-000000000016', 'Steel / metal door',  'steel',     100.00, true, 3),
  ('sopt_017-0000-0000-000000000017', 'Stiff / hard to open','stiff',     0,      true, 1),
  ('sopt_017-0000-0000-000000000017', 'Squeaking hinge',     'squeak',    0,      true, 2),
  ('sopt_017-0000-0000-000000000017', 'Lock / latch broken', 'lock',      150.00, true, 3),
  ('sopt_017-0000-0000-000000000017', 'Door not closing flush','frame',   200.00, true, 4)
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 4. BRANDS (Indian market)
-- ============================================================================

INSERT INTO public.brands (id, name, is_active)
VALUES
  ('brd_havells_000000000000000001', 'Havells',          true),
  ('brd_legrand_000000000000000002', 'Legrand',          true),
  ('brd_anchor_0000000000000000003', 'Anchor by Panasonic', true),
  ('brd_finolex_000000000000000004', 'Finolex',          true),
  ('brd_polycab_000000000000000005', 'Polycab',          true),
  ('brd_jaquar_0000000000000000006', 'Jaquar',           true),
  ('brd_hindwar_000000000000000007', 'Hindware',         true),
  ('brd_parrywa_000000000000000008', 'Parryware',        true),
  ('brd_cera_000000000000000000009', 'Cera',             true),
  ('brd_astral_0000000000000000010', 'Astral',           true),
  ('brd_ashirvad_00000000000000011', 'Ashirvad (Aliaxis)',true),
  ('brd_honeywell_0000000000000012', 'Honeywell',        true),
  ('brd_asian_000000000000000000013','Asian Paints',     true),
  ('brd_nerolac_0000000000000000014','Nerolac',          true),
  ('brd_berger_0000000000000000015', 'Berger Paints',    true),
  ('brd_drfixit_0000000000000000016','Dr. Fixit',        true),
  ('brd_sika_000000000000000000017', 'Sika',             true),
  ('brd_nilkama_0000000000000000018','Nilkamal',         true)
ON CONFLICT (name) DO NOTHING;


-- ============================================================================
-- 5. MATERIALS
-- ============================================================================

INSERT INTO public.materials (id, name, brand_id, specification, unit, is_active)
VALUES
  -- Electrical
  ('mat_mcb1p_00000000000000000001', 'MCB 6A Single Pole',
    'brd_havells_000000000000000001', 'Havells 6A SP MCB, 10kA breaking capacity', 'piece', true),
  ('mat_mcb2p_00000000000000000002', 'MCB 32A Double Pole',
    'brd_havells_000000000000000001', 'Havells 32A DP MCB', 'piece', true),
  ('mat_cableym00000000000000000003', '1.5 sq mm FR Wire (per metre)',
    'brd_polycab_000000000000000005', 'Polycab 1.5 sq mm FR-LSH PVC wire', 'metre', true),
  ('mat_cable40000000000000000000004', '4 sq mm FR Wire (per metre)',
    'brd_finolex_000000000000000004', 'Finolex 4 sq mm PVC insulated wire', 'metre', true),
  ('mat_socket_00000000000000000005', 'Modular Socket 6A (3-pin)',
    'brd_anchor_0000000000000000003', 'Anchor Roma 6A 3-pin socket', 'piece', true),
  ('mat_switch_00000000000000000006', 'Modular Switch 6A',
    'brd_legrand_000000000000000002', 'Legrand Arteor 6A switch', 'piece', true),

  -- Plumbing
  ('mat_cpvcpp_0000000000000000007', 'CPVC Pipe 20mm (per metre)',
    'brd_ashirvad_00000000000000011', 'Ashirvad CPVC Flowguard Plus 20mm', 'metre', true),
  ('mat_pprc_ppp00000000000000000008','PPRC Pipe 25mm (per metre)',
    'brd_astral_0000000000000000010', 'Astral PPRC pipe 25mm PN10', 'metre', true),
  ('mat_tapwas_00000000000000000009', 'Tap Washer Set',
    NULL, 'Standard rubber washer set for pillar taps', 'set', true),
  ('mat_ballflt_0000000000000000010', 'Ball Float Valve 1/2"',
    'brd_astral_0000000000000000010', 'Astral CPVC float valve 1/2"', 'piece', true),
  ('mat_flushvl_0000000000000000011', 'Flush Valve (Dual Flush)',
    'brd_jaquar_0000000000000000006', 'Jaquar dual-flush flush valve', 'piece', true),
  ('mat_healfct_0000000000000000012', 'Health Faucet with Hose',
    'brd_hindwar_000000000000000007', 'Hindware health faucet with 1.2m SS hose', 'piece', true),

  -- AC
  ('mat_r32gas_000000000000000000013','R32 Refrigerant (per kg)',
    'brd_honeywell_0000000000000012', 'Honeywell Solstice R32 refrigerant', 'kg', true),
  ('mat_r410gas_0000000000000000014', 'R410A Refrigerant (per kg)',
    'brd_honeywell_0000000000000012', 'Honeywell R410A refrigerant', 'kg', true),
  ('mat_copppe_0000000000000000015',  'Copper Pipe 1/4" (per metre)',
    NULL, '1/4 inch ACR copper pipe for AC piping', 'metre', true),

  -- Painting
  ('mat_emulsion0000000000000000016', 'Interior Emulsion Paint (per litre)',
    'brd_asian_000000000000000000013','Asian Paints Tractor Shyne emulsion', 'litre', true),
  ('mat_primer_00000000000000000017', 'Exterior Wall Primer (per litre)',
    'brd_asian_000000000000000000013','Asian Paints Damp Proof primer', 'litre', true),
  ('mat_putty_000000000000000000018', 'Wall Putty (per kg)',
    'brd_asian_000000000000000000013','Asian Paints WallPutty acrylic', 'kg', true),
  ('mat_waterpr_0000000000000000019', 'Waterproofing Compound (per kg)',
    'brd_drfixit_0000000000000000016','Dr. Fixit Pidicrete URP slurry', 'kg', true),
  ('mat_woodpr_00000000000000000020', 'Wood Primer (per litre)',
    'brd_asian_000000000000000000013','Asian Paints wood primer', 'litre', true),
  ('mat_enamel_00000000000000000021', 'Enamel Paint (per litre)',
    'brd_nerolac_0000000000000000014','Nerolac Enamel Xpert gloss', 'litre', true),

  -- Carpentry
  ('mat_hinge_000000000000000000022', 'SS Butt Hinge (pair)',
    NULL, '3x3 inch stainless steel butt hinge, heavy duty', 'pair', true),
  ('mat_mortise_0000000000000000023', 'Mortise Door Lock',
    NULL, '3-lever mortise lock with handle set', 'piece', true),
  ('mat_drawer_00000000000000000024', 'Soft-Close Drawer Channel (pair)',
    NULL, '45cm push-to-open soft-close runners', 'pair', true),
  ('mat_msqnet_00000000000000000025', 'Mosquito Mesh (per sq ft)',
    NULL, 'Fiberglass 18x16 mesh, 0.9mm wire', 'sq_ft', true)
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 6. SERVICE MATERIALS MAPPING
-- ============================================================================

INSERT INTO public.service_materials
  (service_id, material_id, is_customer_selectable, is_professional_selectable)
VALUES
  -- Electrical: MCB / DB Box Fault
  ('svc_elec_003-0000-0000-000000000003', 'mat_mcb1p_00000000000000000001', false, true),
  ('svc_elec_003-0000-0000-000000000003', 'mat_mcb2p_00000000000000000002', false, true),
  -- Electrical: New Wiring
  ('svc_elec_005-0000-0000-000000000005', 'mat_cableym00000000000000000003', false, true),
  ('svc_elec_005-0000-0000-000000000005', 'mat_cable40000000000000000000004', false, true),
  -- Electrical: Socket & Switch Repair
  ('svc_elec_001-0000-0000-000000000001', 'mat_socket_00000000000000000005', true, true),
  ('svc_elec_001-0000-0000-000000000001', 'mat_switch_00000000000000000006', true, true),

  -- Plumbing: Pipe Leak
  ('svc_plmb_004-0000-0000-000000000009', 'mat_cpvcpp_0000000000000000007', false, true),
  ('svc_plmb_004-0000-0000-000000000009', 'mat_pprc_ppp00000000000000000008', false, true),
  -- Plumbing: Tap repair
  ('svc_plmb_001-0000-0000-000000000006', 'mat_tapwas_00000000000000000009', false, true),
  -- Plumbing: Flush tank repair
  ('svc_plmb_003-0000-0000-000000000008', 'mat_ballflt_0000000000000000010', true,  true),
  ('svc_plmb_003-0000-0000-000000000008', 'mat_flushvl_0000000000000000011', true,  true),
  -- Plumbing: Bathroom fitting
  ('svc_plmb_005-0000-0000-000000000010', 'mat_healfct_0000000000000000012', true,  true),

  -- AC: Gas Refilling
  ('svc_ac00_002-0000-0000-000000000012', 'mat_r32gas_000000000000000000013', false, true),
  ('svc_ac00_002-0000-0000-000000000012', 'mat_r410gas_0000000000000000014', false, true),
  -- AC: Installation
  ('svc_ac00_003-0000-0000-000000000013', 'mat_copppe_0000000000000000015', false, true),

  -- Painting: Interior walls
  ('svc_pnt_0001-0000-0000-000000000021', 'mat_emulsion0000000000000000016', true,  true),
  ('svc_pnt_0001-0000-0000-000000000021', 'mat_putty_000000000000000000018', false, true),
  ('svc_pnt_0001-0000-0000-000000000021', 'mat_primer_00000000000000000017', false, true),
  -- Painting: Waterproofing
  ('svc_pnt_0002-0000-0000-000000000022', 'mat_waterpr_0000000000000000019', false, true),
  -- Painting: Wood polish
  ('svc_pnt_0003-0000-0000-000000000023', 'mat_woodpr_00000000000000000020', false, true),
  ('svc_pnt_0003-0000-0000-000000000023', 'mat_enamel_00000000000000000021', true,  true),

  -- Carpentry: Door repair
  ('svc_carp_001-0000-0000-000000000025', 'mat_hinge_000000000000000000022', false, true),
  ('svc_carp_001-0000-0000-000000000025', 'mat_mortise_0000000000000000023', false, true),
  -- Carpentry: Cabinet/Wardrobe repair
  ('svc_carp_003-0000-0000-000000000027', 'mat_drawer_00000000000000000024', false, true),
  -- Carpentry: Window mesh
  ('svc_carp_004-0000-0000-000000000028', 'mat_msqnet_00000000000000000025', true,  true)
ON CONFLICT DO NOTHING;
