import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  status: string;
  data?: Record<string, unknown>;
}

interface GroupedResults {
  project: SearchResult[];
  task: SearchResult[];
  client: SearchResult[];
  invoice: SearchResult[];
  document: SearchResult[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ results: {}, total: 0 });
    }

    const query = q.trim().toLowerCase();
    const grouped: GroupedResults = {
      project: [],
      task: [],
      client: [],
      invoice: [],
      document: [],
    };

    // ===== Search Projects (by name, nameEn, number, location) =====
    const projects = await db.project.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { nameEn: { contains: query } },
          { number: { contains: query } },
          { location: { contains: query } },
        ],
      },
      take: 10,
      select: {
        id: true,
        name: true,
        nameEn: true,
        number: true,
        status: true,
        location: true,
        clientId: true,
      },
    });

    for (const p of projects) {
      grouped.project.push({
        type: 'project',
        id: p.id,
        title: p.name || p.nameEn || p.number,
        subtitle: `${p.number} · ${p.location || '—'}`,
        status: p.status,
        data: { projectId: p.id },
      });
    }

    // ===== Search Tasks (by title, description) =====
    const tasks = await db.task.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
        ],
      },
      take: 10,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        projectId: true,
      },
    });

    for (const task of tasks) {
      grouped.task.push({
        type: 'task',
        id: task.id,
        title: task.title || '—',
        subtitle: `${task.priority} · ${task.projectId ? 'مشروع' : '—'}`,
        status: task.status,
        data: { projectId: task.projectId },
      });
    }

    // ===== Search Clients (by name, company, email, phone) =====
    const clients = await db.client.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { company: { contains: query } },
          { email: { contains: query } },
          { phone: { contains: query } },
        ],
      },
      take: 10,
      select: { id: true, name: true, company: true, email: true, phone: true },
    });

    for (const c of clients) {
      grouped.client.push({
        type: 'client',
        id: c.id,
        title: c.name || c.company,
        subtitle: c.company || c.email || c.phone,
        status: 'active',
      });
    }

    // ===== Search Invoices (by number, status) =====
    const invoices = await db.invoice.findMany({
      where: {
        OR: [
          { number: { contains: query } },
        ],
      },
      take: 10,
      select: {
        id: true,
        number: true,
        total: true,
        status: true,
        clientId: true,
      },
    });

    for (const inv of invoices) {
      grouped.invoice.push({
        type: 'invoice',
        id: inv.id,
        title: inv.number || '—',
        subtitle: `${inv.total.toLocaleString()} AED`,
        status: inv.status,
      });
    }

    // ===== Search Documents (by name, category) =====
    const documents = await db.document.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { category: { contains: query } },
        ],
      },
      take: 10,
      select: { id: true, name: true, fileType: true, category: true, projectId: true },
    });

    for (const doc of documents) {
      grouped.document.push({
        type: 'document',
        id: doc.id,
        title: doc.name || '—',
        subtitle: `${doc.fileType || 'file'} · ${doc.category}`,
        status: 'available',
        data: { projectId: doc.projectId },
      });
    }

    // Compute total
    const total = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);

    return NextResponse.json({ results: grouped, total });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
