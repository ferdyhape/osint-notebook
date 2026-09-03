import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedRule = {
  entityType: string;
  title: string;
  description: string;
  actionType: "link" | "manual_step";
  urlTemplate?: string;
  category: string;
  sortOrder: number;
  combinable?: boolean;
  /** Title/description from the earlier Indonesian seed, so untouched rows can be translated in place. */
  legacy?: { title: string; description: string };
};

const rules: SeedRule[] = [
  // email
  {
    entityType: "email",
    title: "Search the web for this email",
    description: "Look for this address in forums, documents, and leaked data.",
    actionType: "link",
    urlTemplate: "https://www.google.com/search?q=%22{value}%22",
    category: "search_engine",
    sortOrder: 1,
    legacy: {
      title: "Google dork pencarian email",
      description: "Cari kemunculan email ini di web (forum, dokumen, kebocoran data, dll).",
    },
  },
  {
    entityType: "email",
    title: "Check breach databases",
    description: "See whether this address appears in public data breaches.",
    actionType: "link",
    urlTemplate: "https://haveibeenpwned.com/account/{value}",
    category: "breach_check",
    sortOrder: 2,
    legacy: {
      title: "Cek breach database gratis",
      description: "Cek apakah email ini pernah muncul di kebocoran data publik.",
    },
  },
  {
    entityType: "email",
    title: "Look for linked social accounts",
    description:
      "Use password-recovery or account-search screens on the major platforms to see whether this address reveals a name or handle.",
    actionType: "manual_step",
    category: "social_media",
    sortOrder: 3,
    legacy: {
      title: "Cari akun sosial media terkait",
      description:
        'Coba fitur "lupa password" atau pencarian akun di platform (Facebook, Instagram, dll) pakai email ini secara manual untuk melihat apakah muncul petunjuk nama/akun.',
    },
  },
  {
    entityType: "email",
    title: "Derive a username from the address",
    description:
      "The part before the @ is often reused as a handle elsewhere. Add it as a username entity and check the platforms.",
    actionType: "manual_step",
    category: "pattern_guess",
    sortOrder: 4,
    legacy: {
      title: "Tebak pola username dari email",
      description:
        "Bagian sebelum @ sering dipakai ulang sebagai username di platform lain — jadikan entity username baru dan cek di berbagai platform.",
    },
  },
  {
    entityType: "email",
    title: "Map the domain to an organisation",
    description:
      "Add the part after the @ as a domain entity, then pivot through WHOIS and DNS to find the organisation or host behind it.",
    actionType: "manual_step",
    category: "correlation",
    sortOrder: 5,
    legacy: {
      title: "Petakan domain email ke organisasi",
      description:
        "Ambil bagian setelah @ dan jadikan entity domain baru, lalu pivot lewat WHOIS/DNS untuk tahu organisasi atau penyedia hosting di baliknya.",
    },
  },

  // username
  {
    entityType: "username",
    title: "Search the web for this username",
    description: "Look for this handle across indexed pages.",
    actionType: "link",
    urlTemplate: "https://www.google.com/search?q=%22{value}%22",
    category: "search_engine",
    sortOrder: 1,
    legacy: {
      title: "Google dork pencarian username",
      description: "Cari kemunculan username ini di web.",
    },
  },
  {
    entityType: "username",
    title: "Check GitHub",
    description: "See whether this handle exists on GitHub.",
    actionType: "link",
    urlTemplate: "https://github.com/{value}",
    category: "social_media",
    sortOrder: 2,
    legacy: {
      title: "Cek di GitHub",
      description: "Lihat apakah username ini terdaftar di GitHub.",
    },
  },
  {
    entityType: "username",
    title: "Check Instagram",
    description: "See whether this handle exists on Instagram.",
    actionType: "link",
    urlTemplate: "https://www.instagram.com/{value}",
    category: "social_media",
    sortOrder: 3,
    legacy: {
      title: "Cek di Instagram",
      description: "Lihat apakah username ini terdaftar di Instagram.",
    },
  },
  {
    entityType: "username",
    title: "Check X (Twitter)",
    description: "See whether this handle exists on X.",
    actionType: "link",
    urlTemplate: "https://x.com/{value}",
    category: "social_media",
    sortOrder: 4,
    legacy: {
      title: "Cek di X (Twitter)",
      description: "Lihat apakah username ini terdaftar di X/Twitter.",
    },
  },
  {
    entityType: "username",
    title: "Try the same handle elsewhere",
    description:
      "The same URL pattern usually works on TikTok, Reddit, and Telegram (t.me/handle). People reuse handles across platforms.",
    actionType: "manual_step",
    category: "social_media",
    sortOrder: 5,
    legacy: {
      title: "Cek platform lain secara manual",
      description:
        "Coba pola URL serupa di TikTok, Reddit, Telegram (t.me/{value}), dll — banyak orang memakai username yang sama di banyak platform.",
    },
  },
  {
    entityType: "username",
    title: "Match the avatar and bio across platforms",
    description:
      "The same handle is not proof of the same person. Confirm with a matching profile photo, a similar bio or writing style, the same linked domain, or overlapping followers.",
    actionType: "manual_step",
    category: "correlation",
    sortOrder: 6,
    legacy: {
      title: "Cocokkan foto profil & bio lintas platform",
      description:
        "Username yang sama belum tentu orang yang sama. Perkuat dengan sinyal lain: foto profil identik, bio/gaya penulisan mirip, domain yang ditautkan sama, atau irisan daftar teman/follower.",
    },
  },

  // domain
  {
    entityType: "domain",
    title: "WHOIS lookup",
    description: "Check registration details: registrant, registration date, and name servers.",
    actionType: "link",
    urlTemplate: "https://who.is/whois/{value}",
    category: "dns_whois",
    sortOrder: 1,
    legacy: {
      title: "WHOIS lookup (who.is)",
      description: "Cek data registrasi domain (registrant, tanggal registrasi, name server).",
    },
  },
  {
    entityType: "domain",
    title: "Find subdomains via crt.sh",
    description: "Public SSL certificate logs reveal other subdomains. Free, no API key.",
    actionType: "link",
    urlTemplate: "https://crt.sh/?q={value}",
    category: "dns_whois",
    sortOrder: 2,
    legacy: {
      title: "Enumerasi subdomain lewat crt.sh",
      description: "Cari subdomain lain lewat log sertifikat SSL publik — gratis, tanpa API key.",
    },
  },
  {
    entityType: "domain",
    title: "View history on the Wayback Machine",
    description: "Read archived snapshots of this domain.",
    actionType: "link",
    urlTemplate: "https://web.archive.org/web/*/{value}",
    category: "dns_whois",
    sortOrder: 3,
    legacy: {
      title: "Riwayat lewat Wayback Machine",
      description: "Lihat snapshot historis dari domain ini.",
    },
  },
  {
    entityType: "domain",
    title: "Check DNS records",
    description: "MX, TXT, and NS records point to the hosting and email providers behind it.",
    actionType: "link",
    urlTemplate: "https://mxtoolbox.com/SuperTool.aspx?action=a%3a{value}",
    category: "dns_whois",
    sortOrder: 4,
    legacy: {
      title: "Cek DNS record",
      description: "Cek MX/TXT/NS record domain untuk petunjuk penyedia hosting/email.",
    },
  },

  // ip
  {
    entityType: "ip",
    title: "Look up geolocation",
    description: "Approximate location, ISP, and ASN for this address.",
    actionType: "link",
    urlTemplate: "https://ipinfo.io/{value}",
    category: "network",
    sortOrder: 1,
    legacy: {
      title: "Geolokasi IP gratis",
      description: "Cek perkiraan lokasi, ISP, dan ASN dari alamat IP ini.",
    },
  },
  {
    entityType: "ip",
    title: "Check Shodan",
    description: "Open ports and exposed services on this host.",
    actionType: "link",
    urlTemplate: "https://www.shodan.io/host/{value}",
    category: "network",
    sortOrder: 2,
    legacy: {
      title: "Cek di Shodan",
      description: "Lihat service/port yang terbuka pada IP ini (fitur pencarian dasar gratis).",
    },
  },
  {
    entityType: "ip",
    title: "Reverse DNS lookup",
    description: "Find the hostname that resolves to this address.",
    actionType: "manual_step",
    category: "network",
    sortOrder: 3,
    legacy: {
      title: "Reverse DNS lookup",
      description: "Cek hostname yang terhubung ke IP ini.",
    },
  },

  // phone
  {
    entityType: "phone",
    title: "Search the web for this number",
    description: "Look for this number in listings, forums, and directories.",
    actionType: "link",
    urlTemplate: "https://www.google.com/search?q=%22{value}%22",
    category: "search_engine",
    sortOrder: 1,
    legacy: {
      title: "Google dork pencarian nomor telepon",
      description: "Cari kemunculan nomor ini di web (marketplace, forum, dll).",
    },
  },
  {
    entityType: "phone",
    title: "Check WhatsApp",
    description:
      "Open wa.me with this number to see whether the account exists, and check the profile photo and name if they are public.",
    actionType: "link",
    urlTemplate: "https://wa.me/{value}",
    category: "messaging",
    sortOrder: 2,
    legacy: {
      title: "Cek apakah terdaftar di WhatsApp",
      description:
        "Buka wa.me dengan nomor ini untuk melihat apakah nomor aktif di WhatsApp dan cek foto profil/nama jika publik.",
    },
  },
  {
    entityType: "phone",
    title: "Check Telegram",
    description: "Add the number as a contact to see whether a Telegram account is attached to it.",
    actionType: "manual_step",
    category: "messaging",
    sortOrder: 3,
    legacy: {
      title: "Cek Telegram",
      description:
        'Cek secara manual apakah nomor ini terdaftar di Telegram lewat fitur "add contact".',
    },
  },

  // person
  {
    entityType: "person",
    title: "Search the full name",
    description: "Search in quotes so the words stay together.",
    actionType: "link",
    urlTemplate: "https://www.google.com/search?q=%22{value}%22",
    category: "search_engine",
    sortOrder: 1,
    legacy: {
      title: "Google dork nama lengkap",
      description: "Cari nama ini dalam tanda kutip untuk hasil yang lebih presisi.",
    },
  },
  {
    entityType: "person",
    title: "Search LinkedIn",
    description: "Look for a professional profile under this name.",
    actionType: "link",
    urlTemplate: "https://www.linkedin.com/search/results/people/?keywords={value}",
    category: "social_media",
    sortOrder: 2,
    legacy: {
      title: "Cari di LinkedIn",
      description: "Cek profil profesional dengan nama ini.",
    },
  },
  {
    entityType: "person",
    title: "Search Facebook",
    description: "Look for a profile under this name.",
    actionType: "link",
    urlTemplate: "https://www.facebook.com/search/people/?q={value}",
    category: "social_media",
    sortOrder: 3,
    legacy: {
      title: "Cari di Facebook",
      description: "Cek profil dengan nama ini.",
    },
  },

  // image
  {
    entityType: "image",
    title: "Reverse image search — Google Lens",
    description: "Upload the image or paste its URL at lens.google.com to find where else it appears.",
    actionType: "manual_step",
    category: "metadata",
    sortOrder: 1,
    legacy: {
      title: "Reverse image search — Google Images",
      description:
        "Upload atau tempel URL gambar secara manual di Google Images (lens.google.com) untuk cari kemunculan gambar ini di tempat lain.",
    },
  },
  {
    entityType: "image",
    title: "Reverse image search — Yandex",
    description: "Yandex often outperforms Google on faces. Upload at yandex.com/images.",
    actionType: "manual_step",
    category: "metadata",
    sortOrder: 2,
    legacy: {
      title: "Reverse image search — Yandex",
      description:
        "Yandex Images sering lebih baik untuk pencarian wajah dibanding Google — upload manual di yandex.com/images.",
    },
  },
  {
    entityType: "image",
    title: "Reverse image search — TinEye",
    description: "Find other versions and the earliest known appearance at tineye.com.",
    actionType: "manual_step",
    category: "metadata",
    sortOrder: 3,
    legacy: {
      title: "Reverse image search — TinEye",
      description: "Cek versi/lokasi lain dari gambar ini secara manual di tineye.com.",
    },
  },
  {
    entityType: "image",
    title: "Read the EXIF metadata",
    description:
      "If you have the original file, check EXIF for the device, timestamp, and GPS coordinates.",
    actionType: "manual_step",
    category: "metadata",
    sortOrder: 4,
    legacy: {
      title: "Cek metadata EXIF",
      description:
        "Jika file asli tersedia, cek metadata EXIF (device, GPS, timestamp) memakai tool EXIF viewer gratis.",
    },
  },
  {
    entityType: "image",
    title: "Read the visual clues",
    description:
      "Landmarks, signage, licence plates, uniforms, the language on any text, and the weather or shadows all narrow down place and time.",
    actionType: "manual_step",
    category: "metadata",
    sortOrder: 5,
    legacy: {
      title: "Analisis petunjuk visual",
      description:
        "Periksa landmark, signage, plat nomor, seragam, bahasa pada tulisan, dan cuaca/bayangan di gambar untuk memperkirakan lokasi dan waktu.",
    },
  },
  {
    entityType: "image",
    title: "Read the context around the image",
    description:
      "Note which site or account published it and what the surrounding text says. Context often tells you more than the image itself.",
    actionType: "manual_step",
    category: "metadata",
    sortOrder: 6,
    legacy: {
      title: "Analisis konteks kemunculan gambar",
      description:
        "Catat di situs/akun mana gambar ini muncul dan teks di sekitarnya — konteks sering lebih informatif daripada isi gambarnya sendiri.",
    },
  },

  // any — search targets that accept several entities at once
  {
    entityType: "any",
    title: "Google",
    description: "General web search. Works with several entities joined by AND/OR.",
    actionType: "link",
    urlTemplate: "https://www.google.com/search?q={value}",
    category: "dorking",
    sortOrder: 1,
    combinable: true,
    legacy: {
      title: "Google",
      description:
        "Pencarian umum di Google. Bisa menggabungkan beberapa entitas sekaligus dengan AND/OR.",
    },
  },
  {
    entityType: "any",
    title: "Bing",
    description: "A different index from Google — useful as a cross-check.",
    actionType: "link",
    urlTemplate: "https://www.bing.com/search?q={value}",
    category: "dorking",
    sortOrder: 2,
    combinable: true,
    legacy: {
      title: "Bing",
      description: "Indeks Bing sering berbeda dari Google — berguna sebagai pembanding.",
    },
  },
  {
    entityType: "any",
    title: "DuckDuckGo",
    description: "Unpersonalised results, unaffected by your search history.",
    actionType: "link",
    urlTemplate: "https://duckduckgo.com/?q={value}",
    category: "dorking",
    sortOrder: 3,
    combinable: true,
    legacy: {
      title: "DuckDuckGo",
      description: "Pencarian tanpa personalisasi, hasilnya tidak dipengaruhi profil pencarian kamu.",
    },
  },
  {
    entityType: "any",
    title: "Yandex",
    description: "Indexes content the other engines often miss.",
    actionType: "link",
    urlTemplate: "https://yandex.com/search/?text={value}",
    category: "dorking",
    sortOrder: 4,
    combinable: true,
    legacy: {
      title: "Yandex",
      description: "Indeks Yandex sering memuat konten yang tidak muncul di mesin pencari lain.",
    },
  },
  {
    entityType: "any",
    title: "Search LinkedIn only",
    description: "Restrict the search to LinkedIn profiles and pages.",
    actionType: "link",
    urlTemplate: "https://www.google.com/search?q=site:linkedin.com {value}",
    category: "dorking",
    sortOrder: 5,
    combinable: true,
    legacy: {
      title: "Dork: cari di LinkedIn",
      description: "Batasi pencarian ke profil dan halaman LinkedIn saja (site:linkedin.com).",
    },
  },
  {
    entityType: "any",
    title: "Search Pastebin only",
    description: "Public pastes often hold leaked or dumped data.",
    actionType: "link",
    urlTemplate: "https://www.google.com/search?q=site:pastebin.com {value}",
    category: "dorking",
    sortOrder: 6,
    combinable: true,
    legacy: {
      title: "Dork: cari di Pastebin",
      description: "Cari kemunculan di paste publik — sering memuat data yang bocor atau dibuang.",
    },
  },
  {
    entityType: "any",
    title: "Search documents only",
    description: "Limit results to PDFs and office files — reports, minutes, and attendee lists.",
    actionType: "link",
    urlTemplate:
      "https://www.google.com/search?q={value} (filetype:pdf OR filetype:doc OR filetype:docx OR filetype:xlsx)",
    category: "dorking",
    sortOrder: 7,
    combinable: true,
    legacy: {
      title: "Dork: cari dokumen (PDF/DOC/XLS)",
      description:
        "Batasi hasil ke berkas dokumen — berguna untuk laporan, notulen, atau daftar peserta yang terekspos.",
    },
  },

  // any — verification discipline
  {
    entityType: "any",
    title: "Confirm it in two independent sources",
    description:
      "A single match is weak evidence. Find a second source that did not copy the first before treating this as fact.",
    actionType: "manual_step",
    category: "verification",
    sortOrder: 20,
    legacy: {
      title: "Cross-reference ke minimal 2 sumber independen",
      description:
        "Satu kecocokan tunggal itu lemah. Cari konfirmasi dari sumber lain yang tidak saling menyalin sebelum memperlakukan temuan ini sebagai fakta.",
    },
  },
  {
    entityType: "any",
    title: "Record how confident you are",
    description:
      "Note this finding as low, medium, or high confidence and say why. It stops a guess from hardening into a fact later on.",
    actionType: "manual_step",
    category: "verification",
    sortOrder: 21,
    legacy: {
      title: "Beri confidence level sebelum dicatat",
      description:
        "Tandai temuan sebagai rendah/sedang/tinggi di catatan, beserta alasannya. Ini mencegah dugaan berubah jadi 'fakta' di tahap analisis.",
    },
  },
];

/** The account a fresh install can sign in with. Override any of these in .env. */
const DEFAULT_ACCOUNT = {
  email: "notebook@osint.com",
  name: "Osint Notebook User",
  password: "password!",
};

/** Creates the first sign-in account. Does nothing if that email already exists. */
async function seedAdminUser() {
  const email = (process.env.ADMIN_EMAIL || DEFAULT_ACCOUNT.email).trim().toLowerCase();
  const name = process.env.ADMIN_NAME || DEFAULT_ACCOUNT.name;
  const password = process.env.ADMIN_PASSWORD || DEFAULT_ACCOUNT.password;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Account: ${email} already exists, left as is.`);
    return;
  }

  await prisma.user.create({
    data: { email, name, passwordHash: await bcrypt.hash(password, 12) },
  });
  console.log(`Account: created ${email}.`);

  if (password === DEFAULT_ACCOUNT.password) {
    console.log("  ! This is the published default password. Change it before the app is reachable by anyone else.");
  }
}

async function main() {
  const existing = await prisma.pivotRule.findMany({
    select: { id: true, title: true, description: true },
  });
  const byTitle = new Map(existing.map((r) => [r.title, r]));

  let translated = 0;
  let created = 0;
  let skipped = 0;

  for (const rule of rules) {
    const { legacy, ...data } = rule;

    const sameTitleRow = byTitle.get(data.title);
    if (sameTitleRow) {
      // Title never changed, but the description may still be the legacy one.
      const stillLegacy = legacy && sameTitleRow.description === legacy.description;
      if (stillLegacy && sameTitleRow.description !== data.description) {
        await prisma.pivotRule.update({
          where: { id: sameTitleRow.id },
          data: { description: data.description, category: data.category },
        });
        translated += 1;
      }
      continue;
    }

    const legacyRow = legacy ? byTitle.get(legacy.title) : undefined;

    if (legacyRow) {
      if (legacyRow.description !== legacy!.description) {
        // Edited by hand since it was seeded — leave it alone.
        skipped += 1;
        continue;
      }
      await prisma.pivotRule.update({
        where: { id: legacyRow.id },
        data: { title: data.title, description: data.description, category: data.category },
      });
      translated += 1;
      continue;
    }

    await prisma.pivotRule.create({ data });
    created += 1;
  }

  console.log(
    `Pivot rules: ${translated} translated, ${created} created, ${skipped} left untouched (edited by hand).`
  );

  await seedAdminUser();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
