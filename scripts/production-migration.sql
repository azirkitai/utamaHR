-- PRODUCTION DATABASE MIGRATION SCRIPT
-- Copy all data from development to production
-- WARNING: This will DELETE ALL data in production!

-- Disable foreign key constraints
SET session_replication_role = replica;

-- Clear all tables (in reverse dependency order)
TRUNCATE TABLE contact CASCADE;
TRUNCATE TABLE employment CASCADE;
TRUNCATE TABLE employees CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE family_details CASCADE;
TRUNCATE TABLE work_experiences CASCADE;
TRUNCATE TABLE employee_documents CASCADE;
TRUNCATE TABLE office_locations CASCADE;
TRUNCATE TABLE qr_tokens CASCADE;
TRUNCATE TABLE clock_in_records CASCADE;
TRUNCATE TABLE attendance_records CASCADE;
TRUNCATE TABLE company_settings CASCADE;
TRUNCATE TABLE app_setting CASCADE;
TRUNCATE TABLE announcements CASCADE;
TRUNCATE TABLE announcement_reads CASCADE;
TRUNCATE TABLE user_announcements CASCADE;
TRUNCATE TABLE approval_settings CASCADE;
TRUNCATE TABLE group_policy_settings CASCADE;
TRUNCATE TABLE company_leave_types CASCADE;
TRUNCATE TABLE leave_policy CASCADE;
TRUNCATE TABLE leave_policy_settings CASCADE;
TRUNCATE TABLE leave_balance_carry_forward CASCADE;
TRUNCATE TABLE leave_applications CASCADE;
TRUNCATE TABLE financial_claim_policies CASCADE;
TRUNCATE TABLE claim_policy CASCADE;
TRUNCATE TABLE claim_applications CASCADE;
TRUNCATE TABLE overtime_approval_settings CASCADE;
TRUNCATE TABLE overtime_policies CASCADE;
TRUNCATE TABLE overtime_settings CASCADE;
TRUNCATE TABLE employee_salaries CASCADE;
TRUNCATE TABLE salary_basic_earnings CASCADE;
TRUNCATE TABLE salary_additional_items CASCADE;
TRUNCATE TABLE salary_deduction_items CASCADE;
TRUNCATE TABLE salary_company_contributions CASCADE;
TRUNCATE TABLE compensation CASCADE;
TRUNCATE TABLE payroll_documents CASCADE;
TRUNCATE TABLE payroll_items CASCADE;
TRUNCATE TABLE payment_vouchers CASCADE;
TRUNCATE TABLE disciplinary CASCADE;
TRUNCATE TABLE documents CASCADE;
TRUNCATE TABLE equipment CASCADE;
TRUNCATE TABLE company_access CASCADE;

-- Import Users data
INSERT INTO users (id, username, password, created_at, role, email, status, updated_at) VALUES
('169d7fcc-718a-4366-b42c-1b5f3d003508', 'Azirkitai', '121585823f824e4391150e993f69fcd64db5f4487ffd3287ba48a460904fa9b8bd5549d2113b84a9c9010b63e7af07a52f769bf0a06f097054e02a10d9a6a213.eb040a37b961e6705014a7e33554a2af', '2025-08-08T08:55:08.557324', 'Admin', 'azirkitai@utamahr.com', 'active', '2025-08-08T08:55:08.557324'),
('test-user-1', 'testemployee', '$scrypt$N$8$1$somehash', '2025-08-08T01:57:36.903236', 'Admin', 'test@utamahr.com', 'active', '2025-08-08T01:57:36.903236'),
('30b846a3-e53f-4eda-ad77-5e6ae5b69338', 'Syed2607', 'Can1hlp$', '2025-08-08T09:06:03.079133', 'Staff/Employee', null, 'active', '2025-08-08T09:06:03.079133'),
('d1cddd6a-ecd8-4a78-9438-39e9fd455ecc', 'maryam1234', 'maryam1234', '2025-08-08T02:40:41.5948', 'Admin', null, 'active', '2025-08-08T02:40:41.5948'),
('b3aebe07-893a-4e78-b052-8be4d8b5bf0b', 'kamal1234', 'kamal1234', '2025-08-08T02:42:42.585716', 'Staff/Employee', null, 'active', '2025-08-08T02:42:42.585716'),
('00f7c5ef-9cce-4809-ae33-0101f1287ab1', 'siti nadiah', 'nadiah1234', '2025-08-14T16:32:58.595136', 'Finance/Account', null, 'active', '2025-08-14T16:32:58.595136');

-- Import Employees data
INSERT INTO employees (id, user_id, full_name, first_name, last_name, nric, nric_old, date_of_birth, place_of_birth, gender, race, religion, blood_type, education_level, marital_status, nationality, bumi_status, family_members, driving_license_number, driving_class, driving_expiry_date, status, profile_image_url, created_at, updated_at, role, staff_id) VALUES
('e74d71b5-128e-442d-a0c4-c050479b1a50', 'b3aebe07-893a-4e78-b052-8be4d8b5bf0b', 'kamal ludin', 'kamal', 'ludin', null, null, null, null, null, null, null, null, null, null, null, null, 0, 'ADAFAD', 'B2', '2025-08-09T00:00:00', 'employed', '/objects/uploads/5f536ba7-4c67-48d3-84ef-5c1805209db8', '2025-08-08T02:42:42.944165', '2025-08-08T07:03:24.485', 'Staff/Employee', null),
('0e27650c-5127-45e8-93d8-0e2862b415d0', '30b846a3-e53f-4eda-ad77-5e6ae5b69338', 'SYED MUHYAZIR HASSIM', 'SYED MUHYAZIR', 'HASSIM', null, null, null, null, null, null, null, null, null, null, null, null, 0, null, null, null, 'employed', null, '2025-08-08T09:06:03.490871', '2025-08-08T09:06:03.490871', 'Staff/Employee', null),
('4b84780f-915d-44a9-8168-9dd518dab947', 'd1cddd6a-ecd8-4a78-9438-39e9fd455ecc', 'maryam  maisarah', 'MARYAM', 'maisarah', null, null, null, null, null, null, null, null, null, null, null, null, 0, null, null, null, 'employed', '/objects/uploads/b54e0418-dead-4785-9948-164f3f351a33', '2025-08-08T02:40:42.00519', '2025-08-09T09:19:49.875', 'Admin', null),
('azir-b02b94b5', '169d7fcc-718a-4366-b42c-1b5f3d003508', 'AZIRKITAI', null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, null, null, null, 'active', null, '2025-08-09T12:02:34.869979', '2025-08-09T12:02:34.869979', 'Admin', null),
('test-29d2b0f3', 'test-user-1', 'TEST EMPLOYEE', null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, null, null, null, 'active', null, '2025-08-09T12:02:39.487997', '2025-08-09T12:02:39.487997', 'Admin', null),
('416d1b6c-9226-4283-a818-e2a11f6f9e06', '00f7c5ef-9cce-4809-ae33-0101f1287ab1', 'SITI NADIAH SABRI', 'SITI NADIAH', 'SABRI', null, null, null, null, null, null, null, null, null, null, null, null, 0, null, null, null, 'employed', null, '2025-08-14T16:32:58.970041', '2025-08-14T16:32:58.970041', 'Staff/Employee', null);

-- Import Employment data
INSERT INTO employment (id, employee_id, employee_no, company, branch, branch_location, designation, department, date_joining, date_of_sign, employment_type, employment_status, oku_status, created_at, updated_at, leave_first_approval, leave_second_approval, claim_first_approval, claim_second_approval, overtime_first_approval, overtime_second_approval, timeoff_first_approval, timeoff_second_approval, ea_person_in_charge) VALUES
('37ee8347-14a7-4709-8377-6748bb7e51ef', 'e74d71b5-128e-442d-a0c4-c050479b1a50', null, 'TROPICANA', null, null, 'CA', 'it', null, null, null, 'Employed', 'No', '2025-08-08T02:42:43.240145', '2025-08-08T02:42:43.240145', null, null, null, null, null, null, null, null, null),
('50f9c9e2-d7a6-46d7-a007-25bc91cc363e', '4b84780f-915d-44a9-8168-9dd518dab947', 'ASasd', 'TROPICANA', null, null, 'CA', 'it', null, null, null, 'Employed', 'No', '2025-08-08T02:40:42.302162', '2025-08-08T04:38:04.357', 'Siti Nurhaliza', null, null, 'Siti Nurhaliza', null, null, null, null, null),
('bb073b72-2a37-4269-9321-e784ce9ff160', '0e27650c-5127-45e8-93d8-0e2862b415d0', null, 'UTAMA MEDGROUP', null, null, 'SENIOR MANAGER', 'it', null, null, null, 'Employed', 'No', '2025-08-08T09:06:03.78304', '2025-08-08T09:06:03.78304', null, null, null, null, null, null, null, null, null),
('df531faf-17d6-49fe-b754-f183078945e3', '416d1b6c-9226-4283-a818-e2a11f6f9e06', null, 'KLINIK UTAMA 24 JAM', null, null, 'DOCTOR', 'human-resource', null, null, null, 'Employed', 'No', '2025-08-14T16:32:59.292113', '2025-08-14T16:32:59.292113', null, null, null, null, null, null, null, null, null);

-- Import Contact data
INSERT INTO contact (id, employee_id, phone_number, mobile_number, email, personal_email, address, mailing_address, emergency_contact_name, emergency_contact_phone, created_at, updated_at) VALUES
('8799327d-1f13-49f5-a577-97d08d08aa3a', '4b84780f-915d-44a9-8168-9dd518dab947', '0123456789', null, 'maryam@123.com', null, null, null, null, null, '2025-08-08T02:40:42.601582', '2025-08-08T02:40:42.601582'),
('3073bb84-6649-4e81-a808-f14bbdb452aa', 'e74d71b5-128e-442d-a0c4-c050479b1a50', '1122334455', null, 'kamal@123.com', null, null, null, null, null, '2025-08-08T02:42:43.5404', '2025-08-08T02:42:43.5404'),
('9888e9c1-cb54-47b4-9839-627717fda81e', '0e27650c-5127-45e8-93d8-0e2862b415d0', '012-5942304', null, 'azirkitai@gmail.com', null, null, null, null, null, '2025-08-08T09:06:04.10247', '2025-08-08T09:06:04.10247'),
('850fe681-4a5d-4b63-8887-85c897a81ced', '416d1b6c-9226-4283-a818-e2a11f6f9e06', '0199076434', null, 'nadiahsabraz@gmail.com', null, null, null, null, null, '2025-08-14T16:32:59.595552', '2025-08-14T16:32:59.595552');

-- Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

-- Show summary
SELECT 'MIGRATION COMPLETED' as status;
SELECT 'Users imported: ' || COUNT(*) as summary FROM users;
SELECT 'Employees imported: ' || COUNT(*) as summary FROM employees;
SELECT 'Employment records imported: ' || COUNT(*) as summary FROM employment;
SELECT 'Contact records imported: ' || COUNT(*) as summary FROM contact;