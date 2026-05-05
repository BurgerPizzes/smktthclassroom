-- ═══════════════════════════════════════════════════════════════════════
-- SMKTTH CLASSROOM — MySQL Database Schema & Seed Data
-- SMK Telekomunikasi Tunas Harapan
-- ═══════════════════════════════════════════════════════════════════════
-- Compatible with: MySQL 8.0+ / MariaDB 10.5+
-- Import via: phpMyAdmin → Import → Select this file
-- ═══════════════════════════════════════════════════════════════════════

-- Create database
CREATE DATABASE IF NOT EXISTS `smktth_classroom`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `smktth_classroom`;

-- ═══ Drop existing tables (for clean re-import) ═══
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `_prisma_migrations`;
DROP TABLE IF EXISTS `Attendance`;
DROP TABLE IF EXISTS `Resource`;
DROP TABLE IF EXISTS `Setting`;
DROP TABLE IF EXISTS `Notification`;
DROP TABLE IF EXISTS `Comment`;
DROP TABLE IF EXISTS `Announcement`;
DROP TABLE IF EXISTS `Submission`;
DROP TABLE IF EXISTS `Assignment`;
DROP TABLE IF EXISTS `Subject`;
DROP TABLE IF EXISTS `ClassUser`;
DROP TABLE IF EXISTS `Class`;
DROP TABLE IF EXISTS `User`;
SET FOREIGN_KEY_CHECKS = 1;

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: User
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE `User` (
  `id`        VARCHAR(36)  NOT NULL,
  `email`     VARCHAR(255) NOT NULL,
  `name`      VARCHAR(255) NOT NULL,
  `password`  VARCHAR(255) NOT NULL,
  `role`      VARCHAR(50)  NOT NULL DEFAULT 'siswa',
  `avatar`    VARCHAR(500) NULL,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: Subject
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE `Subject` (
  `id`        VARCHAR(36)  NOT NULL,
  `name`      VARCHAR(255) NOT NULL,
  `code`      VARCHAR(50)  NULL,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Subject_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: Class
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE `Class` (
  `id`          VARCHAR(36)  NOT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `description` TEXT         NULL,
  `code`        VARCHAR(50)  NOT NULL,
  `subjectId`   VARCHAR(36)  NULL,
  `createdBy`   VARCHAR(36)  NOT NULL,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Class_code_key` (`code`),
  INDEX `Class_subjectId_idx` (`subjectId`),
  INDEX `Class_createdBy_idx` (`createdBy`),
  CONSTRAINT `Class_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE SET NULL,
  CONSTRAINT `Class_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: ClassUser (Enrollment)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE `ClassUser` (
  `id`       VARCHAR(36)  NOT NULL,
  `classId`  VARCHAR(36)  NOT NULL,
  `userId`   VARCHAR(36)  NOT NULL,
  `role`     VARCHAR(50)  NOT NULL DEFAULT 'siswa',
  `joinedAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ClassUser_classId_userId_key` (`classId`, `userId`),
  INDEX `ClassUser_classId_idx` (`classId`),
  INDEX `ClassUser_userId_idx` (`userId`),
  CONSTRAINT `ClassUser_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE CASCADE,
  CONSTRAINT `ClassUser_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: Assignment
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE `Assignment` (
  `id`          VARCHAR(36)  NOT NULL,
  `title`       VARCHAR(255) NOT NULL,
  `description` TEXT         NULL,
  `classId`     VARCHAR(36)  NOT NULL,
  `subjectId`   VARCHAR(36)  NULL,
  `dueDate`     DATETIME(3)  NOT NULL,
  `points`      INT          NOT NULL DEFAULT 100,
  `type`        VARCHAR(50)  NOT NULL DEFAULT 'tugas',
  `status`      VARCHAR(50)  NOT NULL DEFAULT 'active',
  `attachments` TEXT         NULL,
  `createdBy`   VARCHAR(36)  NOT NULL,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `Assignment_classId_idx` (`classId`),
  INDEX `Assignment_subjectId_idx` (`subjectId`),
  INDEX `Assignment_createdBy_idx` (`createdBy`),
  CONSTRAINT `Assignment_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE CASCADE,
  CONSTRAINT `Assignment_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE SET NULL,
  CONSTRAINT `Assignment_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: Submission
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE `Submission` (
  `id`           VARCHAR(36)  NOT NULL,
  `assignmentId` VARCHAR(36)  NOT NULL,
  `userId`       VARCHAR(36)  NOT NULL,
  `content`      TEXT         NULL,
  `fileUrl`      VARCHAR(500) NULL,
  `status`       VARCHAR(50)  NOT NULL DEFAULT 'submitted',
  `grade`        DOUBLE       NULL,
  `feedback`     TEXT         NULL,
  `submittedAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `gradedAt`     DATETIME(3)  NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Submission_assignmentId_userId_key` (`assignmentId`, `userId`),
  INDEX `Submission_assignmentId_idx` (`assignmentId`),
  INDEX `Submission_userId_idx` (`userId`),
  CONSTRAINT `Submission_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `Assignment`(`id`) ON DELETE CASCADE,
  CONSTRAINT `Submission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: Announcement
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE `Announcement` (
  `id`        VARCHAR(36)  NOT NULL,
  `title`     VARCHAR(255) NOT NULL,
  `content`   TEXT         NOT NULL,
  `classId`   VARCHAR(36)  NOT NULL,
  `priority`  VARCHAR(50)  NOT NULL DEFAULT 'normal',
  `createdBy` VARCHAR(36)  NOT NULL,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `Announcement_classId_idx` (`classId`),
  INDEX `Announcement_createdBy_idx` (`createdBy`),
  CONSTRAINT `Announcement_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE CASCADE,
  CONSTRAINT `Announcement_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: Comment
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE `Comment` (
  `id`             VARCHAR(36) NOT NULL,
  `content`        TEXT        NOT NULL,
  `userId`         VARCHAR(36) NOT NULL,
  `announcementId` VARCHAR(36) NULL,
  `assignmentId`   VARCHAR(36) NULL,
  `createdAt`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `Comment_userId_idx` (`userId`),
  INDEX `Comment_announcementId_idx` (`announcementId`),
  INDEX `Comment_assignmentId_idx` (`assignmentId`),
  CONSTRAINT `Comment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE,
  CONSTRAINT `Comment_announcementId_fkey` FOREIGN KEY (`announcementId`) REFERENCES `Announcement`(`id`) ON DELETE CASCADE,
  CONSTRAINT `Comment_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `Assignment`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: Notification
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE `Notification` (
  `id`        VARCHAR(36) NOT NULL,
  `userId`    VARCHAR(36) NOT NULL,
  `title`     VARCHAR(255) NOT NULL,
  `message`   TEXT        NOT NULL,
  `type`      VARCHAR(50) NOT NULL DEFAULT 'info',
  `read`      BOOLEAN     NOT NULL DEFAULT FALSE,
  `link`      VARCHAR(500) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `Notification_userId_idx` (`userId`),
  CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: Resource
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE `Resource` (
  `id`         VARCHAR(36)  NOT NULL,
  `title`      VARCHAR(255) NOT NULL,
  `fileUrl`    VARCHAR(500) NOT NULL,
  `fileType`   VARCHAR(50)  NOT NULL DEFAULT 'pdf',
  `classId`    VARCHAR(36)  NOT NULL,
  `uploadedBy` VARCHAR(36)  NOT NULL,
  `createdAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `Resource_classId_idx` (`classId`),
  INDEX `Resource_uploadedBy_idx` (`uploadedBy`),
  CONSTRAINT `Resource_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE CASCADE,
  CONSTRAINT `Resource_uploadedBy_fkey` FOREIGN KEY (`uploadedBy`) REFERENCES `User`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: Setting
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE `Setting` (
  `id`    VARCHAR(36)  NOT NULL,
  `key`   VARCHAR(255) NOT NULL,
  `value` TEXT         NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Setting_key_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: Attendance
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE `Attendance` (
  `id`        VARCHAR(36) NOT NULL,
  `classId`   VARCHAR(36) NOT NULL,
  `userId`    VARCHAR(36) NOT NULL,
  `date`      DATETIME(3) NOT NULL,
  `status`    VARCHAR(50) NOT NULL DEFAULT 'hadir',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Attendance_classId_userId_date_key` (`classId`, `userId`, `date`),
  INDEX `Attendance_classId_idx` (`classId`),
  INDEX `Attendance_userId_idx` (`userId`),
  CONSTRAINT `Attendance_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE CASCADE,
  CONSTRAINT `Attendance_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ═══════════════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════════════
-- Note: Passwords are hashed with bcryptjs (10 salt rounds)
-- admin123  → $2a$10$... (run the app's seed script to get actual hashes)
-- teacher123 → $2a$10$...
-- student123 → $2a$10$...
-- For MySQL import, use these pre-hashed values:
-- ═══════════════════════════════════════════════════════════════════════

-- ═══ Users ═══
INSERT INTO `User` (`id`, `email`, `name`, `password`, `role`, `createdAt`, `updatedAt`) VALUES
('usr_admin_001', 'admin@smktth.sch.id', 'Administrator', '$2a$10$admin123_placeholder_hash_change_me', 'admin', NOW(3), NOW(3)),
('usr_guru_001', 'guru1@smktth.sch.id', 'Budi Santoso, S.Pd.', '$2a$10$teacher123_placeholder_hash_change_me', 'guru', NOW(3), NOW(3)),
('usr_guru_002', 'guru2@smktth.sch.id', 'Siti Aminah, M.Pd.', '$2a$10$teacher123_placeholder_hash_change_me', 'guru', NOW(3), NOW(3)),
('usr_guru_003', 'guru3@smktth.sch.id', 'Agus Wijaya, S.Kom.', '$2a$10$teacher123_placeholder_hash_change_me', 'guru', NOW(3), NOW(3)),
('usr_siswa_001', 'siswa1@smktth.sch.id', 'Ahmad Rizki', '$2a$10$student123_placeholder_hash_change_me', 'siswa', NOW(3), NOW(3)),
('usr_siswa_002', 'siswa2@smktth.sch.id', 'Dewi Lestari', '$2a$10$student123_placeholder_hash_change_me', 'siswa', NOW(3), NOW(3)),
('usr_siswa_003', 'siswa3@smktth.sch.id', 'Rina Fitriani', '$2a$10$student123_placeholder_hash_change_me', 'siswa', NOW(3), NOW(3)),
('usr_siswa_004', 'siswa4@smktth.sch.id', 'Fajar Pratama', '$2a$10$student123_placeholder_hash_change_me', 'siswa', NOW(3), NOW(3)),
('usr_siswa_005', 'siswa5@smktth.sch.id', 'Maya Anggraeni', '$2a$10$student123_placeholder_hash_change_me', 'siswa', NOW(3), NOW(3));

-- ═══ Subjects ═══
INSERT INTO `Subject` (`id`, `name`, `code`, `createdAt`) VALUES
('subj_prg', 'Pemrograman', 'PRG', NOW(3)),
('subj_jrk', 'Jaringan', 'JRK', NOW(3)),
('subj_mlt', 'Multimedia', 'MLT', NOW(3)),
('subj_elk', 'Elektronika', 'ELK', NOW(3));

-- ═══ Classes ═══
INSERT INTO `Class` (`id`, `name`, `description`, `code`, `subjectId`, `createdBy`, `createdAt`, `updatedAt`) VALUES
('cls_rpl1', 'XII RPL 1', 'Kelas XII Rekayasa Perangkat Lunak 1 — Fokus pemrograman web dan mobile', 'RPL12025', 'subj_prg', 'usr_guru_001', NOW(3), NOW(3)),
('cls_tkj1', 'XII TKJ 1', 'Kelas XII Teknik Komputer dan Jaringan 1 — Fokus infrastruktur jaringan', 'TKJ12025', 'subj_jrk', 'usr_guru_002', NOW(3), NOW(3)),
('cls_mm1', 'XII MM 1', 'Kelas XII Multimedia 1 — Desain grafis, video, dan animasi', 'MM12025', 'subj_mlt', 'usr_guru_003', NOW(3), NOW(3));

-- ═══ Class Users (Enrollments) ═══
INSERT INTO `ClassUser` (`id`, `classId`, `userId`, `role`, `joinedAt`) VALUES
('cu_01', 'cls_rpl1', 'usr_guru_001', 'guru', NOW(3)),
('cu_02', 'cls_rpl1', 'usr_siswa_001', 'siswa', NOW(3)),
('cu_03', 'cls_rpl1', 'usr_siswa_002', 'siswa', NOW(3)),
('cu_04', 'cls_rpl1', 'usr_siswa_003', 'siswa', NOW(3)),
('cu_05', 'cls_tkj1', 'usr_guru_002', 'guru', NOW(3)),
('cu_06', 'cls_tkj1', 'usr_siswa_001', 'siswa', NOW(3)),
('cu_07', 'cls_tkj1', 'usr_siswa_004', 'siswa', NOW(3)),
('cu_08', 'cls_mm1', 'usr_guru_003', 'guru', NOW(3)),
('cu_09', 'cls_mm1', 'usr_siswa_002', 'siswa', NOW(3)),
('cu_10', 'cls_mm1', 'usr_siswa_005', 'siswa', NOW(3));

-- ═══ Assignments ═══
INSERT INTO `Assignment` (`id`, `title`, `description`, `classId`, `subjectId`, `dueDate`, `points`, `type`, `status`, `createdBy`, `createdAt`, `updatedAt`) VALUES
('asg_01', 'Tugas Membuat Website Portfolio', 'Buatlah website portfolio personal menggunakan HTML, CSS, dan JavaScript. Website harus responsif dan memiliki minimal 3 halaman: Home, About, dan Contact.', 'cls_rpl1', 'subj_prg', DATE_ADD(NOW(), INTERVAL 7 DAY), 100, 'tugas', 'active', 'usr_guru_001', NOW(3), NOW(3)),
('asg_02', 'Ujian Tengah Semester — Pemrograman', 'Ujian tengah semester meliputi materi HTML, CSS, JavaScript, dan React dasar. Durasi 90 menit.', 'cls_rpl1', 'subj_prg', DATE_ADD(NOW(), INTERVAL 14 DAY), 100, 'ujian', 'active', 'usr_guru_001', NOW(3), NOW(3)),
('asg_03', 'Konfigurasi Router Cisco', 'Konfigurasikan router Cisco menggunakan Packet Tracer sesuai topologi yang diberikan.', 'cls_tkj1', 'subj_jrk', DATE_ADD(NOW(), INTERVAL 5 DAY), 100, 'tugas', 'active', 'usr_guru_002', NOW(3), NOW(3)),
('asg_04', 'Kuis Subnetting', 'Kuis singkat tentang perhitungan subnetting CIDR dan VLSM.', 'cls_tkj1', 'subj_jrk', DATE_ADD(NOW(), INTERVAL 3 DAY), 50, 'kuis', 'active', 'usr_guru_002', NOW(3), NOW(3)),
('asg_05', 'Desain Poster Digital', 'Buat desain poster digital bertema "Hari Pendidikan Nasional" menggunakan Adobe Illustrator atau Canva.', 'cls_mm1', 'subj_mlt', DATE_ADD(NOW(), INTERVAL 10 DAY), 100, 'tugas', 'active', 'usr_guru_003', NOW(3), NOW(3)),
('asg_06', 'Kuis Desain Warna & Tipografi', 'Kuis tentang teori warna, kombinasi warna, dan prinsip tipografi dalam desain grafis.', 'cls_mm1', 'subj_mlt', DATE_ADD(NOW(), INTERVAL 4 DAY), 50, 'kuis', 'active', 'usr_guru_003', NOW(3), NOW(3));

-- ═══ Submissions ═══
INSERT INTO `Submission` (`id`, `assignmentId`, `userId`, `content`, `fileUrl`, `status`, `grade`, `feedback`, `submittedAt`, `gradedAt`) VALUES
('sub_01', 'asg_01', 'usr_siswa_001', 'Sudah selesai membuat website portfolio', '/uploads/portfolio-ahmad.zip', 'submitted', NULL, NULL, NOW(3), NULL),
('sub_02', 'asg_05', 'usr_siswa_002', 'Poster digital sudah selesai dibuat', '/uploads/poster-dewi.png', 'graded', 88, 'Bagus! Komposisi warna sudah baik, tipografi perlu diperbaiki.', NOW(3), NOW(3)),
('sub_03', 'asg_04', 'usr_siswa_004', 'Kuis sudah dikerjakan', NULL, 'graded', 42, 'Perlu belajar lebih lanjut tentang VLSM.', NOW(3), NOW(3)),
('sub_04', 'asg_03', 'usr_siswa_001', 'Konfigurasi router sudah selesai', '/uploads/router-config.pkt', 'submitted', NULL, NULL, NOW(3), NULL);

-- ═══ Announcements ═══
INSERT INTO `Announcement` (`id`, `title`, `content`, `classId`, `priority`, `createdBy`, `createdAt`, `updatedAt`) VALUES
('ann_01', 'Selamat Datang di SMKTTH Classroom! 🎉', 'Platform pembelajaran digital SMKTTH sudah siap digunakan. Silakan jelajahi fitur-fitur yang tersedia dan mulai belajar!', 'cls_rpl1', 'high', 'usr_admin_001', NOW(3), NOW(3)),
('ann_02', 'Jadwal UTS Semester Genap', 'Ujian Tengah Semester Genap akan dilaksanakan pada minggu ke-3 bulan depan. Harap persiapkan diri dengan baik.', 'cls_tkj1', 'high', 'usr_admin_001', NOW(3), NOW(3)),
('ann_03', 'Update Materi Pemrograman Web', 'Materi baru tentang React Hooks sudah ditambahkan. Silakan pelajari sebelum pertemuan minggu depan.', 'cls_rpl1', 'normal', 'usr_guru_001', NOW(3), NOW(3)),
('ann_04', 'Lab Jaringan Tambahan', 'Lab jaringan tambahan akan dibuka setiap Rabu siang untuk praktik mandiri. Hubungi guru jika ingin mengikuti.', 'cls_tkj1', 'normal', 'usr_guru_002', NOW(3), NOW(3)),
('ann_05', 'Kompetisi Desain Poster 🏆', 'Akan diadakan kompetisi desain poster antar kelas. Pendaftaran dibuka sampai akhir bulan. Hadiah menarik menanti!', 'cls_mm1', 'high', 'usr_guru_003', NOW(3), NOW(3));

-- ═══ Notifications ═══
INSERT INTO `Notification` (`id`, `userId`, `title`, `message`, `type`, `read`, `createdAt`) VALUES
('ntf_01', 'usr_siswa_001', 'Tugas Baru', 'Tugas "Membuat Website Portfolio" telah ditambahkan di XII RPL 1', 'info', FALSE, NOW(3)),
('ntf_02', 'usr_siswa_001', 'Deadline Dekat!', 'Kuis Subnetting akan due dalam 3 hari', 'warning', FALSE, NOW(3)),
('ntf_03', 'usr_guru_001', 'Submission Baru', 'Ahmad Rizki telah mengumpulkan tugas "Website Portfolio"', 'success', FALSE, NOW(3)),
('ntf_04', 'usr_guru_002', 'Submission Baru', 'Ahmad Rizki telah mengumpulkan tugas "Konfigurasi Router"', 'success', FALSE, NOW(3)),
('ntf_05', 'usr_admin_001', 'Sistem Diperbarui', 'Platform SMKTTH Classroom telah diperbarui ke versi terbaru', 'info', FALSE, NOW(3));

-- ═══ Resources ═══
INSERT INTO `Resource` (`id`, `title`, `fileUrl`, `fileType`, `classId`, `uploadedBy`, `createdAt`) VALUES
('res_01', 'Modul React Dasar', '/uploads/modul-react.pdf', 'pdf', 'cls_rpl1', 'usr_guru_001', NOW(3)),
('res_02', 'Slide Jaringan Komputer', '/uploads/slide-jaringan.pptx', 'pptx', 'cls_tkj1', 'usr_guru_002', NOW(3)),
('res_03', 'Template Poster', '/uploads/template-poster.psd', 'psd', 'cls_mm1', 'usr_guru_003', NOW(3)),
('res_04', 'Tutorial Git & GitHub', '/uploads/git-tutorial.pdf', 'pdf', 'cls_rpl1', 'usr_guru_001', NOW(3)),
('res_05', 'Cheat Sheet Subnetting', '/uploads/subnetting-cheatsheet.pdf', 'pdf', 'cls_tkj1', 'usr_guru_002', NOW(3));

-- ═══ Settings ═══
INSERT INTO `Setting` (`id`, `key`, `value`) VALUES
('set_01', 'site_name', 'SMKTTH Classroom'),
('set_02', 'site_description', 'Sistem Manajemen Pembelajaran Digital SMK Telekomunikasi Tunas Harapan'),
('set_03', 'logo_url', ''),
('set_04', 'primary_color', '#7c3aed'),
('set_05', 'accent_color', '#06b6d4'),
('set_06', 'allow_registration', 'true'),
('set_07', 'maintenance_mode', 'false'),
('set_08', 'max_file_upload_size', '10');

-- ═══ Attendance ═══
INSERT INTO `Attendance` (`id`, `classId`, `userId`, `date`, `status`, `createdAt`) VALUES
('att_01', 'cls_rpl1', 'usr_siswa_001', DATE_SUB(NOW(), INTERVAL 1 DAY), 'hadir', NOW(3)),
('att_02', 'cls_rpl1', 'usr_siswa_002', DATE_SUB(NOW(), INTERVAL 1 DAY), 'hadir', NOW(3)),
('att_03', 'cls_rpl1', 'usr_siswa_003', DATE_SUB(NOW(), INTERVAL 1 DAY), 'terlambat', NOW(3)),
('att_04', 'cls_tkj1', 'usr_siswa_001', DATE_SUB(NOW(), INTERVAL 2 DAY), 'hadir', NOW(3)),
('att_05', 'cls_tkj1', 'usr_siswa_004', DATE_SUB(NOW(), INTERVAL 2 DAY), 'tidak', NOW(3)),
('att_06', 'cls_mm1', 'usr_siswa_002', DATE_SUB(NOW(), INTERVAL 2 DAY), 'hadir', NOW(3)),
('att_07', 'cls_mm1', 'usr_siswa_005', DATE_SUB(NOW(), INTERVAL 2 DAY), 'terlambat', NOW(3)),
('att_08', 'cls_rpl1', 'usr_siswa_001', DATE_SUB(NOW(), INTERVAL 3 DAY), 'hadir', NOW(3)),
('att_09', 'cls_rpl1', 'usr_siswa_002', DATE_SUB(NOW(), INTERVAL 3 DAY), 'tidak', NOW(3));

-- ═══════════════════════════════════════════════════════════════════════
-- DONE! Database seeded successfully.
--
-- Demo Accounts:
--   Admin: admin@smktth.sch.id / admin123
--   Guru:  guru1@smktth.sch.id / teacher123
--   Siswa: siswa1@smktth.sch.id / student123
--
-- ⚠️ IMPORTANT: Password hashes are placeholders.
--    To get real bcrypt hashes, run the app's seed script:
--    bun tsx prisma/seed.ts
-- ═══════════════════════════════════════════════════════════════════════
