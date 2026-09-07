import { PrismaClient, type EventType, type EventStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function daysAhead(n: number): Date {
  return daysAgo(-n);
}

async function main() {
  const email = (process.env.ADMIN_EMAIL || "parent@example.com")
    .trim()
    .toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeThisPassword123!";
  const passwordHash = await hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: "家長", role: "ADMIN" },
  });
  console.log(`✓ admin user: ${admin.email}`);

  // Single child (idempotent by name)
  let child = await prisma.child.findFirst({ where: { name: "陳小明" } });
  if (!child) {
    child = await prisma.child.create({
      data: {
        name: "陳小明",
        birthDate: new Date("2017-05-04"),
        school: "陽光小學",
        notes: "活潑好動，鍾意畫畫同踢波。",
      },
    });
  }
  console.log(`✓ child: ${child.name}`);

  const tagNames = [
    "學術",
    "運動",
    "藝術",
    "領導",
    "家庭",
    "音樂",
    "STEM",
  ];
  const tags: Record<string, string> = {};
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    tags[name] = tag.id;
  }
  console.log(`✓ tags: ${tagNames.length}`);

  const samples: Array<{
    eventType: EventType;
    title: string;
    description: string;
    date: Date;
    category: string;
    location?: string;
    achievementRank?: string;
    status: EventStatus;
    tags: string[];
  }> = [
    {
      eventType: "MILESTONE",
      title: "第一日返幼稚園",
      description: "背住新書包，勇敢咁同爸爸媽媽講拜拜，冇喊！",
      date: daysAgo(760),
      category: "family",
      status: "COMPLETED",
      tags: ["家庭"],
    },
    {
      eventType: "PRIZE",
      title: "全港兒童繪畫比賽 — 冠軍",
      description: "以《我嘅未來城市》奪得低年級組冠軍，評判讚色彩大膽。",
      date: daysAgo(420),
      category: "arts",
      location: "香港文化中心",
      achievementRank: "冠軍",
      status: "COMPLETED",
      tags: ["藝術"],
    },
    {
      eventType: "COMPETITION",
      title: "校際游泳比賽 50 米自由泳",
      description: "第一次代表學校出賽，游出個人最佳時間。",
      date: daysAgo(300),
      category: "sports",
      location: "維多利亞公園游泳池",
      achievementRank: "第三名",
      status: "COMPLETED",
      tags: ["運動"],
    },
    {
      eventType: "PHOTO",
      title: "農曆新年家庭大合照",
      description: "一家人著住紅色新衫，逗利是逗到笑騎騎。",
      date: daysAgo(210),
      category: "family",
      status: "COMPLETED",
      tags: ["家庭"],
    },
    {
      eventType: "PRIZE",
      title: "數學思維挑戰賽 — 優異獎",
      description: "喺速算同邏輯題都攞高分，老師話進步好大。",
      date: daysAgo(150),
      category: "academic",
      achievementRank: "優異獎",
      status: "COMPLETED",
      tags: ["學術", "STEM"],
    },
    {
      eventType: "MILESTONE",
      title: "第一次彈完整首鋼琴曲",
      description: "練咗成兩個月，終於完整彈出《小星星變奏曲》。",
      date: daysAgo(80),
      category: "arts",
      status: "COMPLETED",
      tags: ["藝術", "音樂"],
    },
    {
      eventType: "SCHEDULE",
      title: "班長選舉演講",
      description: "準備緊競選演講稿，練習點樣自信咁面對全班同學。",
      date: daysAhead(12),
      category: "leadership",
      location: "課室 3B",
      status: "PLANNED",
      tags: ["領導"],
    },
    {
      eventType: "COMPETITION",
      title: "小學生機械人編程比賽",
      description: "同隊友一齊砌機械人，準備出戰初賽。",
      date: daysAhead(30),
      category: "academic",
      location: "科學園",
      status: "PLANNED",
      tags: ["STEM", "學術"],
    },
  ];

  // Idempotent: clear existing sample events for this child then recreate.
  await prisma.event.deleteMany({ where: { childId: child.id } });

  for (const s of samples) {
    const event = await prisma.event.create({
      data: {
        childId: child.id,
        eventType: s.eventType,
        title: s.title,
        description: s.description,
        eventDate: s.date,
        category: s.category,
        location: s.location ?? null,
        achievementRank: s.achievementRank ?? null,
        status: s.status,
      },
    });
    for (const tagName of s.tags) {
      await prisma.eventTag.create({
        data: { eventId: event.id, tagId: tags[tagName] },
      });
    }
  }
  console.log(`✓ events: ${samples.length}`);
  console.log("Seed complete ✦");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
