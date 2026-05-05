import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

async function seed() {
  console.log('🌱 Seeding database...')

  // Hash passwords
  const adminPw = await hashPassword('admin123')
  const guruPw = await hashPassword('teacher123')
  const siswaPw = await hashPassword('student123')

  // ═══ Create Users ═══
  const admin = await db.user.upsert({
    where: { email: 'admin@smktth.sch.id' },
    update: { password: adminPw },
    create: { name: 'Administrator', email: 'admin@smktth.sch.id', password: adminPw, role: 'admin' },
  })

  const guru1 = await db.user.upsert({
    where: { email: 'guru1@smktth.sch.id' },
    update: { password: guruPw },
    create: { name: 'Budi Santoso, S.Pd.', email: 'guru1@smktth.sch.id', password: guruPw, role: 'guru' },
  })

  const guru2 = await db.user.upsert({
    where: { email: 'guru2@smktth.sch.id' },
    update: { password: guruPw },
    create: { name: 'Siti Aminah, M.Pd.', email: 'guru2@smktth.sch.id', password: guruPw, role: 'guru' },
  })

  const guru3 = await db.user.upsert({
    where: { email: 'guru3@smktth.sch.id' },
    update: { password: guruPw },
    create: { name: 'Agus Wijaya, S.Kom.', email: 'guru3@smktth.sch.id', password: guruPw, role: 'guru' },
  })

  const siswa1 = await db.user.upsert({
    where: { email: 'siswa1@smktth.sch.id' },
    update: { password: siswaPw },
    create: { name: 'Ahmad Rizki', email: 'siswa1@smktth.sch.id', password: siswaPw, role: 'siswa' },
  })

  const siswa2 = await db.user.upsert({
    where: { email: 'siswa2@smktth.sch.id' },
    update: { password: siswaPw },
    create: { name: 'Dewi Lestari', email: 'siswa2@smktth.sch.id', password: siswaPw, role: 'siswa' },
  })

  const siswa3 = await db.user.upsert({
    where: { email: 'siswa3@smktth.sch.id' },
    update: { password: siswaPw },
    create: { name: 'Rina Fitriani', email: 'siswa3@smktth.sch.id', password: siswaPw, role: 'siswa' },
  })

  const siswa4 = await db.user.upsert({
    where: { email: 'siswa4@smktth.sch.id' },
    update: { password: siswaPw },
    create: { name: 'Fajar Pratama', email: 'siswa4@smktth.sch.id', password: siswaPw, role: 'siswa' },
  })

  const siswa5 = await db.user.upsert({
    where: { email: 'siswa5@smktth.sch.id' },
    update: { password: siswaPw },
    create: { name: 'Maya Anggraeni', email: 'siswa5@smktth.sch.id', password: siswaPw, role: 'siswa' },
  })

  console.log('  ✅ Users created')

  // ═══ Create Subjects ═══
  const prog = await db.subject.upsert({ where: { name: 'Pemrograman' }, update: {}, create: { name: 'Pemrograman', code: 'PRG' } })
  const jaringan = await db.subject.upsert({ where: { name: 'Jaringan' }, update: {}, create: { name: 'Jaringan', code: 'JRK' } })
  const multimedia = await db.subject.upsert({ where: { name: 'Multimedia' }, update: {}, create: { name: 'Multimedia', code: 'MLT' } })
  const elektronika = await db.subject.upsert({ where: { name: 'Elektronika' }, update: {}, create: { name: 'Elektronika', code: 'ELK' } })

  console.log('  ✅ Subjects created')

  // ═══ Create Classes ═══
  const class1 = await db.class.upsert({
    where: { code: 'RPL12025' },
    update: {},
    create: {
      name: 'XII RPL 1',
      description: 'Kelas XII Rekayasa Perangkat Lunak 1 — Fokus pemrograman web dan mobile',
      code: 'RPL12025',
      subjectId: prog.id,
      createdBy: guru1.id,
    },
  })

  const class2 = await db.class.upsert({
    where: { code: 'TKJ12025' },
    update: {},
    create: {
      name: 'XII TKJ 1',
      description: 'Kelas XII Teknik Komputer dan Jaringan 1 — Fokus infrastruktur jaringan',
      code: 'TKJ12025',
      subjectId: jaringan.id,
      createdBy: guru2.id,
    },
  })

  const class3 = await db.class.upsert({
    where: { code: 'MM12025' },
    update: {},
    create: {
      name: 'XII MM 1',
      description: 'Kelas XII Multimedia 1 — Desain grafis, video, dan animasi',
      code: 'MM12025',
      subjectId: multimedia.id,
      createdBy: guru3.id,
    },
  })

  console.log('  ✅ Classes created')

  // ═══ Class Users ═══
  const classUsers = [
    { classId: class1.id, userId: guru1.id, role: 'guru' },
    { classId: class1.id, userId: siswa1.id, role: 'siswa' },
    { classId: class1.id, userId: siswa2.id, role: 'siswa' },
    { classId: class1.id, userId: siswa3.id, role: 'siswa' },
    { classId: class2.id, userId: guru2.id, role: 'guru' },
    { classId: class2.id, userId: siswa1.id, role: 'siswa' },
    { classId: class2.id, userId: siswa4.id, role: 'siswa' },
    { classId: class3.id, userId: guru3.id, role: 'guru' },
    { classId: class3.id, userId: siswa2.id, role: 'siswa' },
    { classId: class3.id, userId: siswa5.id, role: 'siswa' },
  ]
  for (const cu of classUsers) {
    await db.classUser.upsert({
      where: { classId_userId: { classId: cu.classId, userId: cu.userId } },
      update: {},
      create: cu,
    })
  }

  console.log('  ✅ Class enrollments created')

  // ═══ Assignments (future dates) ═══
  const now = new Date()
  const day = 24 * 60 * 60 * 1000

  const assignments = await Promise.all([
    db.assignment.create({ data: {
      title: 'Tugas Membuat Website Portfolio',
      description: 'Buatlah website portfolio personal menggunakan HTML, CSS, dan JavaScript. Website harus responsif dan memiliki minimal 3 halaman: Home, About, dan Contact.',
      classId: class1.id, subjectId: prog.id, dueDate: new Date(now.getTime() + 7 * day), points: 100, type: 'tugas', status: 'active', createdBy: guru1.id,
    }}),
    db.assignment.create({ data: {
      title: 'Ujian Tengah Semester — Pemrograman',
      description: 'Ujian tengah semester meliputi materi HTML, CSS, JavaScript, dan React dasar. Durasi 90 menit.',
      classId: class1.id, subjectId: prog.id, dueDate: new Date(now.getTime() + 14 * day), points: 100, type: 'ujian', status: 'active', createdBy: guru1.id,
    }}),
    db.assignment.create({ data: {
      title: 'Konfigurasi Router Cisco',
      description: 'Konfigurasikan router Cisco menggunakan Packet Tracer sesuai topologi yang diberikan.',
      classId: class2.id, subjectId: jaringan.id, dueDate: new Date(now.getTime() + 5 * day), points: 100, type: 'tugas', status: 'active', createdBy: guru2.id,
    }}),
    db.assignment.create({ data: {
      title: 'Kuis Subnetting',
      description: 'Kuis singkat tentang perhitungan subnetting CIDR dan VLSM.',
      classId: class2.id, subjectId: jaringan.id, dueDate: new Date(now.getTime() + 3 * day), points: 50, type: 'kuis', status: 'active', createdBy: guru2.id,
    }}),
    db.assignment.create({ data: {
      title: 'Desain Poster Digital',
      description: 'Buat desain poster digital bertema "Hari Pendidikan Nasional" menggunakan Adobe Illustrator atau Canva.',
      classId: class3.id, subjectId: multimedia.id, dueDate: new Date(now.getTime() + 10 * day), points: 100, type: 'tugas', status: 'active', createdBy: guru3.id,
    }}),
    db.assignment.create({ data: {
      title: 'Kuis Desain Warna & Tipografi',
      description: 'Kuis tentang teori warna, kombinasi warna, dan prinsip tipografi dalam desain grafis.',
      classId: class3.id, subjectId: multimedia.id, dueDate: new Date(now.getTime() + 4 * day), points: 50, type: 'kuis', status: 'active', createdBy: guru3.id,
    }}),
  ])

  console.log('  ✅ Assignments created')

  // ═══ Submissions ═══
  await db.submission.create({ data: {
    assignmentId: assignments[0].id, userId: siswa1.id, content: 'Sudah selesai membuat website portfolio', fileUrl: '/uploads/portfolio-ahmad.zip', status: 'submitted',
  }})
  await db.submission.create({ data: {
    assignmentId: assignments[4].id, userId: siswa2.id, content: 'Poster digital sudah selesai dibuat', fileUrl: '/uploads/poster-dewi.png', status: 'graded', grade: 88, feedback: 'Bagus! Komposisi warna sudah baik, tipografi perlu diperbaiki.', gradedAt: new Date(),
  }})
  await db.submission.create({ data: {
    assignmentId: assignments[3].id, userId: siswa4.id, content: 'Kuis sudah dikerjakan', status: 'graded', grade: 42, feedback: 'Perlu belajar lebih lanjut tentang VLSM.', gradedAt: new Date(),
  }})
  await db.submission.create({ data: {
    assignmentId: assignments[2].id, userId: siswa1.id, content: 'Konfigurasi router sudah selesai', fileUrl: '/uploads/router-config.pkt', status: 'submitted',
  }})

  console.log('  ✅ Submissions created')

  // ═══ Announcements ═══
  await db.announcement.createMany({ data: [
    { title: 'Selamat Datang di SMKTTH Classroom! 🎉', content: 'Platform pembelajaran digital SMKTTH sudah siap digunakan. Silakan jelajahi fitur-fitur yang tersedia dan mulai belajar!', classId: class1.id, priority: 'high', createdBy: admin.id },
    { title: 'Jadwal UTS Semester Genap', content: 'Ujian Tengah Semester Genap akan dilaksanakan pada minggu ke-3 bulan depan. Harap persiapkan diri dengan baik.', classId: class2.id, priority: 'high', createdBy: admin.id },
    { title: 'Update Materi Pemrograman Web', content: 'Materi baru tentang React Hooks sudah ditambahkan. Silakan pelajari sebelum pertemuan minggu depan.', classId: class1.id, priority: 'normal', createdBy: guru1.id },
    { title: 'Lab Jaringan Tambahan', content: 'Lab jaringan tambahan akan dibuka setiap Rabu siang untuk praktik mandiri. Hubungi guru jika ingin mengikuti.', classId: class2.id, priority: 'normal', createdBy: guru2.id },
    { title: 'Kompetisi Desain Poster 🏆', content: 'Akan diadakan kompetisi desain poster antar kelas. Pendaftaran dibuka sampai akhir bulan. Hadiah menarik menanti!', classId: class3.id, priority: 'high', createdBy: guru3.id },
  ]})

  console.log('  ✅ Announcements created')

  // ═══ Notifications ═══
  await db.notification.createMany({ data: [
    { userId: siswa1.id, title: 'Tugas Baru', message: 'Tugas "Membuat Website Portfolio" telah ditambahkan di XII RPL 1', type: 'info' },
    { userId: siswa1.id, title: 'Deadline Dekat!', message: 'Kuis Subnetting akan due dalam 3 hari', type: 'warning' },
    { userId: guru1.id, title: 'Submission Baru', message: 'Ahmad Rizki telah mengumpulkan tugas "Website Portfolio"', type: 'success' },
    { userId: guru2.id, title: 'Submission Baru', message: 'Ahmad Rizki telah mengumpulkan tugas "Konfigurasi Router"', type: 'success' },
    { userId: admin.id, title: 'Sistem Diperbarui', message: 'Platform SMKTTH Classroom telah diperbarui ke versi terbaru', type: 'info' },
  ]})

  console.log('  ✅ Notifications created')

  // ═══ Resources ═══
  await db.resource.createMany({ data: [
    { title: 'Modul React Dasar', fileUrl: '/uploads/modul-react.pdf', fileType: 'pdf', classId: class1.id, uploadedBy: guru1.id },
    { title: 'Slide Jaringan Komputer', fileUrl: '/uploads/slide-jaringan.pptx', fileType: 'pptx', classId: class2.id, uploadedBy: guru2.id },
    { title: 'Template Poster', fileUrl: '/uploads/template-poster.psd', fileType: 'psd', classId: class3.id, uploadedBy: guru3.id },
    { title: 'Tutorial Git & GitHub', fileUrl: '/uploads/git-tutorial.pdf', fileType: 'pdf', classId: class1.id, uploadedBy: guru1.id },
    { title: 'Cheat Sheet Subnetting', fileUrl: '/uploads/subnetting-cheatsheet.pdf', fileType: 'pdf', classId: class2.id, uploadedBy: guru2.id },
  ]})

  console.log('  ✅ Resources created')

  // ═══ Settings ═══
  await db.setting.upsert({ where: { key: 'site_name' }, update: { value: 'SMKTTH Classroom' }, create: { key: 'site_name', value: 'SMKTTH Classroom' } })
  await db.setting.upsert({ where: { key: 'site_description' }, update: { value: 'Sistem Manajemen Pembelajaran Digital SMK Telekomunikasi Tunas Harapan' }, create: { key: 'site_description', value: 'Sistem Manajemen Pembelajaran Digital SMK Telekomunikasi Tunas Harapan' } })
  await db.setting.upsert({ where: { key: 'logo_url' }, update: { value: '' }, create: { key: 'logo_url', value: '' } })
  await db.setting.upsert({ where: { key: 'primary_color' }, update: { value: '#7c3aed' }, create: { key: 'primary_color', value: '#7c3aed' } })
  await db.setting.upsert({ where: { key: 'accent_color' }, update: { value: '#06b6d4' }, create: { key: 'accent_color', value: '#06b6d4' } })
  await db.setting.upsert({ where: { key: 'allow_registration' }, update: { value: 'true' }, create: { key: 'allow_registration', value: 'true' } })
  await db.setting.upsert({ where: { key: 'maintenance_mode' }, update: { value: 'false' }, create: { key: 'maintenance_mode', value: 'false' } })
  await db.setting.upsert({ where: { key: 'max_file_upload_size' }, update: { value: '10' }, create: { key: 'max_file_upload_size', value: '10' } })

  console.log('  ✅ Settings created')

  // ═══ Attendance ═══
  await db.attendance.createMany({ data: [
    { classId: class1.id, userId: siswa1.id, date: new Date(now.getTime() - 1 * day), status: 'hadir' },
    { classId: class1.id, userId: siswa2.id, date: new Date(now.getTime() - 1 * day), status: 'hadir' },
    { classId: class1.id, userId: siswa3.id, date: new Date(now.getTime() - 1 * day), status: 'terlambat' },
    { classId: class2.id, userId: siswa1.id, date: new Date(now.getTime() - 2 * day), status: 'hadir' },
    { classId: class2.id, userId: siswa4.id, date: new Date(now.getTime() - 2 * day), status: 'tidak' },
    { classId: class3.id, userId: siswa2.id, date: new Date(now.getTime() - 2 * day), status: 'hadir' },
    { classId: class3.id, userId: siswa5.id, date: new Date(now.getTime() - 2 * day), status: 'terlambat' },
    { classId: class1.id, userId: siswa1.id, date: new Date(now.getTime() - 3 * day), status: 'hadir' },
    { classId: class1.id, userId: siswa2.id, date: new Date(now.getTime() - 3 * day), status: 'tidak' },
  ]})

  console.log('  ✅ Attendance records created')

  // ═══ Schedules ═══
  // dayOfWeek: 1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat, 6=Sabtu, 7=Minggu
  const scheduleData = [
    // Class 1 (XII RPL 1) — Pemrograman
    { classId: class1.id, subject: 'Pemrograman Web', dayOfWeek: 1, startTime: '07:00', endTime: '08:30', room: 'Lab RPL 1', createdBy: guru1.id },
    { classId: class1.id, subject: 'Basis Data', dayOfWeek: 1, startTime: '08:30', endTime: '10:00', room: 'Lab RPL 1', createdBy: guru1.id },
    { classId: class1.id, subject: 'Pemrograman Mobile', dayOfWeek: 2, startTime: '07:00', endTime: '08:30', room: 'Lab RPL 2', createdBy: guru1.id },
    { classId: class1.id, subject: 'Pemrograman Web', dayOfWeek: 3, startTime: '09:30', endTime: '11:00', room: 'Lab RPL 1', createdBy: guru1.id },
    { classId: class1.id, subject: 'Pemrograman Mobile', dayOfWeek: 4, startTime: '07:00', endTime: '08:30', room: 'Lab RPL 2', createdBy: guru1.id },
    { classId: class1.id, subject: 'Basis Data', dayOfWeek: 5, startTime: '08:30', endTime: '10:00', room: 'Lab RPL 1', createdBy: guru1.id },

    // Class 2 (XII TKJ 1) — Jaringan
    { classId: class2.id, subject: 'Konfigurasi Jaringan', dayOfWeek: 1, startTime: '09:30', endTime: '11:00', room: 'Lab Jaringan', createdBy: guru2.id },
    { classId: class2.id, subject: 'Sistem Komputer', dayOfWeek: 2, startTime: '09:30', endTime: '11:00', room: 'Ruang Teori 2', createdBy: guru2.id },
    { classId: class2.id, subject: 'Konfigurasi Jaringan', dayOfWeek: 3, startTime: '07:00', endTime: '08:30', room: 'Lab Jaringan', createdBy: guru2.id },
    { classId: class2.id, subject: 'Administrasi Jaringan', dayOfWeek: 4, startTime: '09:30', endTime: '11:00', room: 'Lab Jaringan', createdBy: guru2.id },
    { classId: class2.id, subject: 'Sistem Komputer', dayOfWeek: 5, startTime: '07:00', endTime: '08:30', room: 'Ruang Teori 2', createdBy: guru2.id },

    // Class 3 (XII MM 1) — Multimedia
    { classId: class3.id, subject: 'Desain Grafis', dayOfWeek: 1, startTime: '13:00', endTime: '14:30', room: 'Lab Multimedia', createdBy: guru3.id },
    { classId: class3.id, subject: 'Animasi 2D', dayOfWeek: 2, startTime: '13:00', endTime: '14:30', room: 'Lab Multimedia', createdBy: guru3.id },
    { classId: class3.id, subject: 'Desain Grafis', dayOfWeek: 3, startTime: '13:00', endTime: '14:30', room: 'Lab Multimedia', createdBy: guru3.id },
    { classId: class3.id, subject: 'Produksi Video', dayOfWeek: 4, startTime: '13:00', endTime: '14:30', room: 'Studio', createdBy: guru3.id },
    { classId: class3.id, subject: 'Animasi 2D', dayOfWeek: 5, startTime: '13:00', endTime: '14:30', room: 'Lab Multimedia', createdBy: guru3.id },
  ]

  for (const s of scheduleData) {
    await db.schedule.upsert({
      where: {
        classId_dayOfWeek_startTime: {
          classId: s.classId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
        },
      },
      update: {},
      create: s,
    })
  }

  console.log('  ✅ Schedules created')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Demo Accounts:')
  console.log('  Admin: admin@smktth.sch.id / admin123')
  console.log('  Guru:  guru1@smktth.sch.id / teacher123')
  console.log('  Siswa: siswa1@smktth.sch.id / student123')
}

seed()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1) })
  .finally(() => db.$disconnect())
