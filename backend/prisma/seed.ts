/**
 * OPTIONAL demo data for development and screenshots.
 *
 *   npm run db:seed
 *
 * Creates (or resets) a single, clearly-labelled demo account and its tasks.
 * It never touches any other user's data, and the app works fine without it.
 *
 *   Email:    demo@taskflow.dev
 *   Password: Demo1234
 */
import { PrismaClient, type TaskPriority, type TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@taskflow.dev";
const DEMO_PASSWORD = "Demo1234";

// Relative to the local calendar date of the machine running the seed.
function daysFromToday(days: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + days));
}

const demoTasks: Array<{
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due?: number; // days from today
}> = [
  { title: "Complete internship project", description: "Finish the Task Management Application and deploy it.", status: "IN_PROGRESS", priority: "HIGH", due: 3 },
  { title: "Study Data Structures", description: "Revise trees, graphs and dynamic programming. Solve 5 problems.", status: "TODO", priority: "MEDIUM", due: 1 },
  { title: "Submit assignment", description: "Upload the database systems assignment to the portal.", status: "TODO", priority: "HIGH", due: -1 },
  { title: "Build portfolio", description: "Add TaskFlow and two other projects with screenshots and live links.", status: "TODO", priority: "MEDIUM", due: 10 },
  { title: "Prepare presentation", description: "Slides for the internship demo: architecture, features, lessons learned.", status: "IN_PROGRESS", priority: "MEDIUM", due: 0 },
  { title: "Project documentation", description: "Write the README with setup and deployment instructions.", status: "COMPLETED", priority: "LOW", due: -2 },
  { title: "Set up PostgreSQL database", description: "Create the Neon database and run migrations.", status: "COMPLETED", priority: "HIGH", due: -4 },
  { title: "Read 'Clean Code' chapter 3", status: "TODO", priority: "LOW" },
  { title: "Project deployment", description: "Deploy the API to Render and the frontend to Vercel.", status: "TODO", priority: "HIGH", due: 5 },
  { title: "Reply to mentor feedback", description: "Address code review comments on the auth module.", status: "COMPLETED", priority: "MEDIUM", due: -1 },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash, name: "Demo User" },
    create: { email: DEMO_EMAIL, name: "Demo User", passwordHash },
  });

  // Reset only the demo user's tasks.
  await prisma.task.deleteMany({ where: { userId: user.id } });

  const now = Date.now();
  for (const [index, task] of demoTasks.entries()) {
    // Stagger createdAt so "Newest"/"Oldest" sorting is meaningful.
    const createdAt = new Date(now - (demoTasks.length - index) * 3_600_000);
    await prisma.task.create({
      data: {
        userId: user.id,
        title: task.title,
        description: task.description ?? null,
        status: task.status,
        priority: task.priority,
        dueDate: task.due === undefined ? null : daysFromToday(task.due),
        completedAt: task.status === "COMPLETED" ? createdAt : null,
        createdAt,
      },
    });
  }

  console.log(`Seeded ${demoTasks.length} tasks for ${DEMO_EMAIL} (password: ${DEMO_PASSWORD})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
